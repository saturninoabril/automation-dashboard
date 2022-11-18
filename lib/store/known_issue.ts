import crypto from 'crypto';

import { getKnex } from '@knex';
import { KnownIssue, KnownIssueSchema } from '@types';

export async function getKnownIssueByCycleID(cycleID: string) {
    try {
        const knex = await getKnex();
        const knownIssue = (await knex('known_issues')
            .where('cycle_id', cycleID)
            .orderBy('create_at', 'desc')
            .first()) as KnownIssueSchema;

        return { error: null, knownIssue };
    } catch (error) {
        const message = `Known issue not found with cycle_id: "${cycleID}"`;
        console.log(message, error);
        return { error: message, knownIssue: null };
    }
}

export async function saveKnownIssue(cycleID: string, data: KnownIssue[]) {
    try {
        const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

        const knex = await getKnex();
        const savedKnownIssue = (await knex('known_issues')
            .insert({
                hash,
                data: JSON.stringify(data),
                cycle_id: cycleID,
            })
            .onConflict(['hash', 'cycle_id'])
            .ignore()
            .returning('*')) as KnownIssueSchema;

        return { error: null, knownIssue: savedKnownIssue };
    } catch (error) {
        const message = 'Failed to save known issue.';
        console.log(message, error);
        return { error: message, knownIssue: null };
    }
}
