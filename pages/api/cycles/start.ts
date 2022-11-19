import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getKnex } from '@knex';
import cycleSchema from '@lib/schema/cycle';
import SpecExecutionSchema from '@lib/schema/spec_execution';
import { saveKnownIssue } from '@lib/store/known_issue';
import auth from '@middleware/auth';
import type { Cycle, KnownIssue } from '@types';
import { defaultBuildSuffix, parseBuild } from '@lib/server_utils';

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
    sortWeight: number;
};

async function startCycle(req: NextApiRequest, res: NextApiResponse<Partial<CyclesResponse>>) {
    try {
        const {
            body: { branch, build, repo, files = [] },
        } = req;

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
        const started = await knex.transaction(async (trx: any) => {
            const cycle = await knex('cycles')
                .transacting(trx)
                .insert({
                    branch: value.branch,
                    build: value.build,
                    repo: value.repo,
                    specs_registered: value.specs_registered,
                })
                .returning('*');

            let executions;
            if (files.length > 0) {
                const chunkSize = 30;
                const newExecutions = files
                    .map((f: FileWithWeight) => {
                        return {
                            file: f.file,
                            sort_weight: f.sortWeight,
                            cycle_id: cycle[0].id,
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
            const buildSuffix = parseBuild(build.toString()).buildSuffix || defaultBuildSuffix;
            let knownIssues: KnownIssue[] = [];
            try {
                knownIssues = require(`../../../data/known_issue/${buildSuffix}.json`);
            } catch (error) {
                // ignore error and use default empty array
            }

            // save known issue to DB
            if (knownIssues?.length) {
                await saveKnownIssue(cycle[0].id, knownIssues, trx);
            }

            return { cycle, executions };
        });

        return res.status(201).json(started);
    } catch (e) {
        return res.status(501).json({ error: true });
    }
}

const handler = nextConnect();
handler.use(auth).post(startCycle);

export default handler;
