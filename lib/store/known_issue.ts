import crypto from 'crypto';

import { getKnex } from '@knex';
import { getObjectHash } from '@lib/server_utils';
import { KnownIssueData, KnownIssue } from '@types';

export async function getKnownIssueByCycleID(cycleID: string) {
    try {
        const knex = await getKnex();
        const knownIssue = (await knex('known_issues')
            .where('cycle_id', cycleID)
            .orderBy('create_at', 'desc')
            .first()) as KnownIssue;

        return { error: null, knownIssue };
    } catch (error) {
        const message = `Known issue not found with cycle_id: "${cycleID}"`;
        console.log(message, error);
        return { error: message, knownIssue: null };
    }
}

export async function saveKnownIssue(cycleID: string, data: KnownIssueData[], trx?: any) {
    try {
        const hash = getObjectHash(data);

        const knex = await getKnex();
        const queryBuilder = knex('known_issues');

        if (trx) {
            queryBuilder.transacting(trx);
        }

        const savedKnownIssue = (await queryBuilder
            .insert({
                hash,
                data: JSON.stringify(data),
                cycle_id: cycleID,
            })
            .onConflict(['hash', 'cycle_id'])
            .ignore()
            .returning('*')) as KnownIssue;

        return { error: null, knownIssue: savedKnownIssue };
    } catch (error) {
        const message = 'Failed to save known issue.';
        console.log(message, error);
        return { error: message, knownIssue: null };
    }
}
