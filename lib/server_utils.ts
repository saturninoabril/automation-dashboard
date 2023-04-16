import crypto from 'crypto';

import { Cycle, KnownIssueData, LastCaseExecution, SpecExecution } from '@types';
import { stateDone } from './constant';

export const onpremEnt = 'onprem-ent';
export const cloudEnt = 'cloud-ent';
export const defaultKnownIssueType = 'require_verification';

export function getObjectHash(data: object) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export function getCaseTitle(title: string[] = []) {
    return title ? title.join(' > ') : '';
}

export function recomputeCycleTestValues(cycle: Cycle, specs: SpecExecution[]): Partial<Cycle> {
    let specsDone = 0;
    let duration = 0;
    let pass = 0;
    let fail = 0;
    let bug = 0;
    let known = 0;
    let flaky = 0;
    let pending = 0;
    let skipped = 0;

    for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        duration += spec.duration;

        if (!spec.cases.length) {
            continue;
        }

        specsDone += 1;

        for (let j = 0; j < spec.cases.length; j++) {
            const caseExecution = spec.cases[j];

            if (!caseExecution.id) {
                continue;
            }

            switch (caseExecution.state) {
                case 'passed':
                    pass += 1;
                    break;
                case 'failed':
                    fail += 1;
                    break;
                case 'bug':
                    bug += 1;
                    break;
                case 'known':
                    known += 1;
                    break;
                case 'flaky':
                    flaky += 1;
                    break;
                case 'skipped':
                    skipped += 1;
                    break;
                case 'pending':
                    pending += 1;
                    break;
                default:
                    console.log(
                        'recomputeCycleTestValues: caseExecution state not counted',
                        caseExecution.state
                    );
            }
        }
    }

    const recomputedCycle: Partial<Cycle> = {
        specs_done: specsDone,
        duration,
        pass,
        fail,
        bug,
        known,
        flaky,
        pending,
        skipped,
    };

    // change to "done" only once
    if (cycle.state !== stateDone && cycle.specs_registered === specsDone) {
        recomputedCycle.state = stateDone;
    }

    return recomputedCycle;
}

export function getCaseStateWithKnownIssue(
    knownIssueData: KnownIssueData[],
    specFile: string,
    fullTitle: string
) {
    const out: { state: string | null; ticket?: string | null } = { state: null, ticket: null };

    for (let i = 0; i < knownIssueData.length; i++) {
        const knownIssue = knownIssueData[i];
        if (knownIssue.spec_file === specFile) {
            knownIssue.cases.forEach((c) => {
                if (c.title === fullTitle && ['bug', 'known', 'flaky'].includes(c.type)) {
                    out.state = c.type;

                    if (c.ticket) {
                        out.ticket = c.ticket;
                    }
                }
            });
        }
    }

    return out;
}

export function getCaseStateWithLastExecution(lastExecutions: LastCaseExecution[]) {
    let state;
    const lastXRun = process.env.LAST_X_RUN ? parseInt(process.env?.LAST_X_RUN, 10) : 5;
    const recentConsecutive = process.env.RECENT_CONSECUTIVE
        ? parseInt(process.env?.RECENT_CONSECUTIVE, 10)
        : 2;
    const lastXCaseExecutions = lastExecutions.filter((_, index) => lastXRun > index);
    const recentConsecutivePassed = lastXCaseExecutions.reduce(
        (acc, val) => acc && val.state === 'passed',
        true
    );
    const recentConsecutiveFailed = lastXCaseExecutions
        .filter((_, i) => i < recentConsecutive)
        .reduce((acc, val) => acc && ['failed', 'bug', 'known', 'flaky'].includes(val.state), true);

    if (recentConsecutivePassed) {
        // if x recent consecutive tests passed then test is indeed "failed"
    } else if (recentConsecutiveFailed) {
        // if x recent consecutive tests failed then test is "known"
        state = 'known';
    } else {
        // last tests were mixed of pass and fail then test is "flaky"
        state = 'flaky';
    }
    return state;
}
