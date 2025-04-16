import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import { getKnex } from '@knex';
import auth from '@middleware/auth';
import { SpecExecution } from '@types';
import cycleSchema from '@lib/schema/cycle';
import SpecExecutionSchema from '@lib/schema/spec_execution';
import { saveKnownIssue } from '@lib/store/known_issue';
import { parseBuild } from '@lib/common_utils';
import { onpremEnt } from '@lib/server_utils';
import type { KnownIssueData } from '@types';

async function getSpecToTest(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Support both GET and POST requests
        const data = req.method === 'GET' ? req.query : req.body;
        const { repo, branch, build, server, files, cycle_id } = data;

        // If cycle_id is provided, return all specs for that cycle
        if (cycle_id) {
            console.log(`Getting specs for cycle ID: ${cycle_id}`);
            const knex = await getKnex();
            
            // First check if the cycle exists
            const cycle = await knex('cycles').where('id', cycle_id).first();
            if (!cycle) {
                return res.status(404).json({
                    error: true,
                    message: `No cycle found with ID: ${cycle_id}`,
                });
            }
            
            // Get all specs for this cycle
            const specs = await knex('spec_executions')
                .where('cycle_id', cycle_id)
                .select('id', 'file', 'state', 'runner', 'sort_weight', 'server', 'start_at', 'end_at')
                .orderBy('sort_weight', 'asc')
                .orderBy('file', 'asc');
            
            // Get counts of specs in different states
            const specCounts = await knex('spec_executions')
                .where('cycle_id', cycle_id)
                .select('state')
                .count('* as count')
                .groupBy('state');
            
            const stateMap = specCounts.reduce((acc, item) => {
                acc[item.state || 'null'] = parseInt(item.count);
                return acc;
            }, {});
            
            return res.status(200).json({
                cycle,
                specs,
                spec_counts: stateMap,
                total: specs.length
            });
        }

        // If accessed directly in browser without parameters, show a simple form
        if (req.method === 'GET' && (!repo && !branch && !build)) {
            return res.status(200).send(`
                <html>
                <head>
                    <title>Spec Test API</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #333; }
                        form { margin: 20px 0; }
                        label { display: block; margin: 10px 0 5px; }
                        input { padding: 8px; width: 300px; }
                        button { margin-top: 15px; padding: 8px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
                        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
                        .tab { display: none; }
                        .tab-button { 
                            background: #f1f1f1; 
                            border: none; 
                            padding: 10px 20px; 
                            cursor: pointer; 
                            margin-right: 5px;
                        }
                        .tab-button.active { 
                            background: #ddd; 
                        }
                    </style>
                </head>
                <body>
                    <h1>Spec Test API</h1>
                    
                    <div>
                        <button class="tab-button active" onclick="openTab(event, 'nextSpec')">Get Next Spec</button>
                        <button class="tab-button" onclick="openTab(event, 'cycleSpecs')">Get Cycle Specs</button>
                    </div>
                    
                    <div id="nextSpec" class="tab" style="display: block;">
                        <p>This form is used to get the next spec to test.</p>
                        <form action="/api/specs/to-test" method="get">
                            <label for="repo">Repository:</label>
                            <input type="text" id="repo" name="repo" placeholder="e.g., mattermost-server" required>
                            
                            <label for="branch">Branch:</label>
                            <input type="text" id="branch" name="branch" placeholder="e.g., master" required>
                            
                            <label for="build">Build:</label>
                            <input type="text" id="build" name="build" placeholder="e.g., 1121" required>
                            
                            <label for="server">Server (optional):</label>
                            <input type="text" id="server" name="server" placeholder="e.g., localhost:8065">
                            
                            <button type="submit">Get Next Spec</button>
                        </form>
                    </div>
                    
                    <div id="cycleSpecs" class="tab">
                        <p>This form is used to get all specs for a specific test cycle.</p>
                        <form action="/api/specs/to-test" method="get">
                            <label for="cycle_id">Cycle ID:</label>
                            <input type="text" id="cycle_id" name="cycle_id" placeholder="e.g., 6ac421bc-6c21-4663-8e45-490f73c32a32" required>
                            
                            <button type="submit">Get Cycle Specs</button>
                        </form>
                    </div>
                    
                    <h2>API Documentation</h2>
                    <p>POST to this endpoint with the following JSON body:</p>
                    <pre>
{
  "repo": "mattermost-server",
  "branch": "master",
  "build": "1121",
  "server": "optional-server-url"
}
                    </pre>
                    
                    <p>Or to get all specs for a cycle:</p>
                    <pre>
{
  "cycle_id": "6ac421bc-6c21-4663-8e45-490f73c32a32"
}
                    </pre>
                    
                    <script>
                    function openTab(evt, tabName) {
                        // Hide all tabs
                        var tabs = document.getElementsByClassName("tab");
                        for (var i = 0; i < tabs.length; i++) {
                            tabs[i].style.display = "none";
                        }
                        
                        // Remove active class from all tab buttons
                        var tabButtons = document.getElementsByClassName("tab-button");
                        for (var i = 0; i < tabButtons.length; i++) {
                            tabButtons[i].className = tabButtons[i].className.replace(" active", "");
                        }
                        
                        // Show the current tab and add active class to the button
                        document.getElementById(tabName).style.display = "block";
                        evt.currentTarget.className += " active";
                    }
                    </script>
                </body>
                </html>
            `);
        }
        
        if (!repo || !branch || !build) {
            return res.status(400).json({
                error: true,
                message: 'Invalid request: Requires repo, branch, and build.',
            });
        }

        console.log(`Getting spec to test for repo: ${repo}, branch: ${branch}, build: ${build}`);
        const knex = await getKnex();

        // Find a cycle that matches the repo, branch, and build
        let cycle = await knex('cycles')
            .where({
                repo,
                branch,
                build,
            })
            .orderBy('create_at', 'desc')
            .first();

        // If no cycle exists and we have files, create one
        if (!cycle && Array.isArray(files) && files.length > 0) {
            console.log(`No cycle found, creating new cycle with ${files.length} files`);
            
            // Create a new cycle
            const { value, error } = cycleSchema.validate({
                branch,
                build,
                repo,
                specs_registered: files.length,
                runner: 'playwright', // Set runner to playwright for new cycles
            });
            
            if (error) {
                return res.status(400).json({
                    error: true,
                    message: `Invalid cycle data: ${error}`,
                });
            }

            // Check if a cycle with the same repo, branch, and build already exists
            // This is a double-check in case a race condition occurred
            const existingCycle = await knex('cycles')
                .where({
                    repo: value.repo,
                    branch: value.branch,
                    build: value.build
                })
                .first();
                
            if (existingCycle) {
                console.log(`Cycle already exists for ${value.repo}/${value.branch}/${value.build}, using existing cycle`);
                cycle = existingCycle;
            } else {
                // Create cycle and spec executions in a transaction
                const started = await knex.transaction(async (trx: any) => {
                    const newCycle = await knex('cycles')
                        .transacting(trx)
                        .insert({
                            branch: value.branch,
                            build: value.build,
                            repo: value.repo,
                            specs_registered: value.specs_registered,
                            runner: 'playwright',
                        })
                        .returning('*');

                const chunkSize = 30;
                const newExecutions = files
                    .map((f: any) => {
                        return {
                            file: f.file,
                            sort_weight: f.sortWeight || f.weight || 1,
                            cycle_id: newCycle[0].id,
                            runner: 'playwright',
                            state: 'registered',
                        };
                    })
                    .map((ne: any) => {
                        const { value } = SpecExecutionSchema.validate(ne);
                        return value;
                    });

                const executions = await knex
                    .batchInsert('spec_executions', newExecutions, chunkSize)
                    .transacting(trx)
                    .returning('*');

                // get known issue by build_suffix
                const buildSuffix = parseBuild(build.toString()).buildSuffix || onpremEnt;
                let knownIssueData: KnownIssueData[] = [];
                try {
                    knownIssueData = require(`../../../data/known_issue/${buildSuffix}.json`);
                } catch (error) {
                    // ignore error and use default empty array
                    console.log(`No known issues found for build suffix: ${buildSuffix}`);
                }

                // save known issue to DB
                if (knownIssueData?.length) {
                    await saveKnownIssue(newCycle[0].id, knownIssueData, trx);
                }

                    return { cycle: newCycle[0], executions };
                });
                
                cycle = started.cycle;
                console.log(`Created new cycle with ID: ${cycle.id}`);
            }
        }

        if (!cycle) {
            return res.status(404).json({
                error: true,
                message: `No test cycle found for repo: ${repo}, branch: ${branch}, build: ${build}. Please include 'files' array to create a new cycle.`,
            });
        }

        // Find a spec that hasn't been started yet
        // Look for specs with state 'registered' or null (default state)
        const spec = await knex('spec_executions')
            .where('cycle_id', cycle.id)
            .where(function() {
                this.where('state', 'registered')
                    .orWhereNull('state')
                    .orWhere('state', '');
            })
            .orderBy('sort_weight', 'asc')
            .orderBy('file', 'asc')
            .first();

        if (!spec) {
            // Get counts of specs in different states for better error reporting
            const specCounts = await knex('spec_executions')
                .where('cycle_id', cycle.id)
                .select('state')
                .count('* as count')
                .groupBy('state');
            
            const stateMap = specCounts.reduce((acc, item) => {
                acc[item.state] = parseInt(item.count);
                return acc;
            }, {});
            
            return res.status(404).json({
                error: true,
                message: 'No specs available to test',
                cycle_id: cycle.id,
                spec_counts: stateMap,
            });
        }

        // Mark the spec as started
        await knex('spec_executions')
            .where('id', spec.id)
            .update({
                state: 'started',
                start_at: knex.fn.now(),
                update_at: knex.fn.now(),
                server: server || '',
                runner: 'playwright', // Set the runner to playwright
            });

        return res.status(200).json({
            spec: {
                ...spec,
                state: 'started',
                server: server || '',
                runner: 'playwright',
            },
            cycle,
        });
    } catch (e) {
        console.error('Error in getSpecToTest:', e);
        return res.status(500).json({
            error: true,
            message: `Server error: ${e.message}`,
            stack: process.env.NODE_ENV !== 'production' ? e.stack : undefined,
        });
    }
}

const handler = nextConnect();
handler.use(auth).get(getSpecToTest).post(getSpecToTest);

export default handler;
