import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getKnex } from '@knex';
import cycleSchema from '@lib/schema/cycle';
import SpecExecutionSchema from '@lib/schema/spec_execution';
import { saveKnownIssue } from '@lib/store/known_issue';
import auth from '@middleware/auth';
import type { Cycle, KnownIssueData } from '@types';
import { parseBuild } from '@lib/common_utils';
import { onpremEnt } from '@lib/server_utils';

type CyclesResponse = {
    cycles: Cycle[];
    total: number;
    limit: number;
    offset: number;
    page: number;
    per_page: number;
    error: boolean;
    message: string;
};

type FileWithWeight = {
    file: string;
    sortWeight?: number;
    weight?: number;
    shouldSkip?: boolean;
};

async function startCycle(req: NextApiRequest, res: NextApiResponse<Partial<CyclesResponse>>) {
    try {
        const { body } = req;
        const { branch, build, repo } = body;
        const files = Array.isArray(body.files) ? body.files : [];
        
        console.log('startCycle received:', { branch, build, repo, filesCount: files.length });

        const { value, error } = cycleSchema.validate({
            branch,
            build,
            repo,
            specs_registered: files.length,
        });
        if (error) {
            return res.status(400).json({
                error: true,
                message: `Invalid cycle patch: ${error}`,
            });
        }

        const knex = await getKnex();
        
        // Check if a cycle with the same repo, branch, and build already exists
        const existingCycle = await knex('cycles')
            .where({
                repo: value.repo,
                branch: value.branch,
                build: value.build
            })
            .first();
            
        if (existingCycle) {
            console.log(`Cycle already exists for ${value.repo}/${value.branch}/${value.build}, returning existing cycle`);
            
            // If files are provided, we can optionally update the existing cycle or add more specs
            // For now, just return the existing cycle
            return res.status(200).json({
                cycle: existingCycle,
                message: 'Cycle already exists'
            });
        }
        
        const started = await knex.transaction(async (trx: any) => {
            const cycle = await knex('cycles')
                .transacting(trx)
                .insert({
                    branch: value.branch,
                    build: value.build,
                    repo: value.repo,
                    specs_registered: value.specs_registered,
                    runner: body.runner || 'cypress', // Add runner field
                })
                .returning('*');

            let executions;
            if (files.length > 0) {
                const chunkSize = 30;
                const newExecutions = files
                    .map((f: FileWithWeight) => {
                        return {
                            file: f.file,
                            sort_weight: f.sortWeight || f.weight || 1,
                            cycle_id: cycle[0].id,
                            state: 'registered',
                            runner: f.runner || 'cypress',
                        };
                    })
                    .map((ne: any) => {
                        const { value } = SpecExecutionSchema.validate(ne);
                        return value;
                    });

                executions = await knex
                    .batchInsert('spec_executions', newExecutions, chunkSize)
                    .transacting(trx)
                    .returning('*');
            }

            // get known issue by build_suffix
            const buildSuffix = parseBuild(build.toString()).buildSuffix || onpremEnt;
            let knownIssueData: KnownIssueData[] = [];
            try {
                knownIssueData = require(`../../../data/known_issue/${buildSuffix}.json`);
            } catch (error) {
                // ignore error and use default empty array
            }

            // save known issue to DB
            if (knownIssueData?.length) {
                await saveKnownIssue(cycle[0].id, knownIssueData, trx);
            }

            return { cycle, executions };
        });

        return res.status(201).json(started);
    } catch (e) {
        console.error('Error in startCycle:', e);
        return res.status(501).json({ 
            error: true,
            message: `Server error: ${e.message || 'Unknown error'}` 
        });
    }
}

const handler = nextConnect();
handler.use(auth).post(startCycle);

export default handler;
