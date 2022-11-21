import { KnownIssue, KnownIssueObj, KnownIssueCaseObj, Cycle, SpecExecution } from '@types';
import { stateDone } from './constant';

export const defaultBuildSuffix = 'onprem-ent';
export const defaultKnownIssueType = 'require_verification';

export function getCaseTitle(title: string[] = []) {
    return title ? title.join(' > ') : '';
}

export function knownIssuesToObject(knownIssues?: KnownIssue[]) {
    if (!knownIssues?.length) {
        return {};
    }

    return knownIssues.reduce<KnownIssueObj>((specs, spec) => {
        const casesObj = spec.cases.reduce<KnownIssueCaseObj>((ces, ce) => {
            ces[ce.title] = ce;
            return ces;
        }, {});

        specs[spec.spec_file] = { ...spec, casesObj };
        return specs;
    }, {});
}

export function parseBuild(build = '') {
    // format: pipelineID-imageTag-buildSuffix
    const minLength = 3;

    const out = {
        pipelineID: '',
        imageTag: '',
        buildSuffix: '',
    };

    const parts = build.split('-');
    if (parts.length >= minLength) {
        out.pipelineID = parts[0];
        out.imageTag = parts[1];
        out.buildSuffix = parts.slice(2, parts.length).join('-');
    }

    return out;
}

export function recomputeCycleTestValues(
    cycle: Cycle,
    specs: SpecExecution[],
    knownIssues?: KnownIssue[]
): Partial<Cycle> {
    // transform as an object to easily workaround with the data
    const knownIssuesObj = knownIssuesToObject(knownIssues);

    let specsDone = 0;
    let duration = 0;
    let pass = 0;
    let fail = 0;
    let knownFail = 0;
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
                    // prettier-ignore
                    if (knownIssuesObj[spec.file]?.casesObj[getCaseTitle(caseExecution.title)]?.is_known) {
                        knownFail += 1;
                    } else {
                        fail += 1;
                    }

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
        known_fail: knownFail,
        pending,
        skipped,
    };

    // change to "done" only once
    if (cycle.state !== stateDone && cycle.specs_registered === specsDone) {
        recomputedCycle.state = stateDone;
    }

    return recomputedCycle;
}
