import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { getCycleIDsByBranchAndBuildLike } from '@lib/store/cycles';
import { getSpecsWithCases } from '@lib/store/specs';
import { getCaseTitle, knownIssuesToObject } from '@lib/utils';
import type { KnownIssue } from '@types';

type SpecsWithRecentRun = {
    file: string;
    recent_run: string[];
    with_fail: boolean;
    cases: Record<string, string[]>;
};

// Note: each key should have corresponding JSON file at data/known_issue/ folder
const builds: Record<string, string> = {
    'cloud-ent': '%cloud-ent',
    'onprem-ent': '%onprem-ent',
    'onprem-ent-ha': '%onprem-ent-ha',
    'onprem-ent-graphql': '%onprem-ent-graphql',
};

async function getUnstableTests(req: NextApiRequest, res: NextApiResponse) {
    const { query } = req;

    if (!query.build_suffix) {
        return res.redirect(307, '/api/cycles/unstable?build_suffix=onprem-ent');
    }

    const buildSuffix = query.build_suffix.toString();
    const buildLike = builds[buildSuffix];
    if (!buildLike) {
        return res.status(400).json({
            errorMessage: 'Found invalid "build_suffix" value in query parameter.',
        });
    }

    const branch = query.branch ? query.branch.toString() : 'master';
    const limit = getLimitFromQuery(query);

    const { cycleIDs } = await getCycleIDsByBranchAndBuildLike(branch, buildLike, limit);

    if (!cycleIDs?.length) {
        return res.status(400).json({
            errorMessage: 'No cycle found.',
        });
    }

    const { rawUnstableSpecs, unstableSpecs } = await getRawUnstableSpecs(cycleIDs, buildSuffix);

    if (query.out === 'all') {
        return res.status(200).json({
            total: unstableSpecs.length,
            unstable_specs: unstableSpecs,
            cycles: cycleIDs.map((id) => `${req.headers.host}/cycles/${id}`),
            unstable_raw_specs: rawUnstableSpecs,
        });
    }

    return res.status(200).json(unstableSpecs);
}

async function getRawUnstableSpecs(cycleIDs: string[], buildSuffix: string) {
    const responses = await Promise.all(
        cycleIDs.map((id) => {
            return getSpecsWithCases(id);
        })
    );

    const allSpecs: Record<string, SpecsWithRecentRun> = {};
    for (let i = 0; i < responses.length; i++) {
        const specs = responses[i].specs || [];
        for (let j = 0; j < specs.length; j++) {
            const spec = specs[j];
            const { file, pass, fail, pending, skipped } = spec;
            if (!allSpecs[file]) {
                // @ts-ignore
                allSpecs[file] = { file };
            }

            if (!allSpecs[file].recent_run) {
                allSpecs[file] = {
                    ...allSpecs[file],
                    recent_run: new Array(cycleIDs.length),
                };
            }

            if (allSpecs[file].recent_run) {
                const recent_run = allSpecs[file].recent_run;

                if (pass || fail || pending || skipped) {
                    let recent = '';
                    if (pass) {
                        recent += `${pass}P`;
                    }
                    if (fail) {
                        recent += `${fail}F`;
                    }
                    if (pending) {
                        recent += `${pending}G`;
                    }
                    if (skipped) {
                        recent += `${skipped}S`;
                    }

                    recent_run[i] = recent;
                } else {
                    recent_run[i] = '0';
                }

                allSpecs[file].recent_run = recent_run;
            }

            if (fail || pending || skipped) {
                allSpecs[file].with_fail = true;
            }
        }
    }

    const rawUnstableSpecs = Object.values(allSpecs)
        .filter((us) => us.with_fail)
        .reduce<Record<string, SpecsWithRecentRun>>((acc, us) => {
            acc[us.file] = us;
            return acc;
        }, {});

    for (let i = 0; i < responses.length; i++) {
        const specs = responses[i].specs || [];
        for (let j = 0; j < specs.length; j++) {
            const spec = specs[j];

            if (rawUnstableSpecs[spec.file]) {
                if (!rawUnstableSpecs[spec.file].cases) {
                    rawUnstableSpecs[spec.file].cases = {};
                }

                for (let k = 0; k < spec.cases.length; k++) {
                    const ce = spec.cases[k];

                    if (!ce.title) {
                        continue;
                    }

                    const title = getCaseTitle(ce.title);

                    if (!rawUnstableSpecs[spec.file].cases[title]) {
                        const cases = rawUnstableSpecs[spec.file].cases;

                        const recent_run = new Array(cycleIDs.length);
                        recent_run[i] = ce.state;
                        rawUnstableSpecs[spec.file].cases = { ...cases, [title]: recent_run };
                    } else {
                        const recent_run = rawUnstableSpecs[spec.file].cases[title];
                        recent_run[i] = ce.state;
                        rawUnstableSpecs[spec.file].cases[title] = recent_run;
                    }
                }
            }
        }
    }

    let knownIssues: KnownIssue[] = [];
    try {
        knownIssues = require(`../../../data/known_issue/${buildSuffix}.json`);
    } catch (error) {
        // ignore error and use default empty array
    }

    // transform as an object to easily workaround with the data
    const knownIssuesObj = knownIssuesToObject(knownIssues);

    const unstableSpecs = Object.values(rawUnstableSpecs)
        .map((unstableRawSpec) => {
            return {
                spec_file: unstableRawSpec.file,
                cases: Object.entries(unstableRawSpec.cases)
                    .filter(([_, v]) => v.includes('failed'))
                    .map(([title, _]) => ({ title })),
            };
        })
        .map((unstableRawSpec) => {
            if (knownIssuesObj[unstableRawSpec.spec_file]) {
                const newCases = unstableRawSpec.cases.map((ce) => {
                    return (
                        knownIssuesObj[unstableRawSpec.spec_file].casesObj[ce.title] || {
                            ...ce,
                            is_known: false,
                            type: 'require_verification',
                        }
                    );
                });

                return { ...unstableRawSpec, cases: newCases };
            }

            const newCases = unstableRawSpec.cases.map((ce) => {
                return { ...ce, is_known: false, type: 'require_verification' };
            });

            return { ...unstableRawSpec, cases: newCases };
        })
        .sort((a, b) => a.spec_file.localeCompare(b.spec_file));

    return { rawUnstableSpecs, unstableSpecs };
}

function getLimitFromQuery(query: Partial<{ [key: string]: string | string[] }>) {
    const defaultLimit = 5;
    const limit = query.limit ? parseInt(query.limit.toString(), 10) || defaultLimit : defaultLimit;
    return limit > defaultLimit ? defaultLimit : limit;
}

const handler = nextConnect();
handler.get(getUnstableTests);

export default handler;
