import React, { createRef, useEffect, useState } from 'react';

import { parseBuild } from '@lib/common_utils';
import { gitlabPipelineUrl } from '@lib/constant';
import Codeblock from '@components/code_block';
import { SearchIcon } from '@components/icon';
import SpecListLoading from '@components/spec_list_loading';
import SpecRow from '@components/spec_row';
import { KnownIssue, SpecExecution, SpecExecutionState } from '@types';

type Props = {
    specs?: SpecExecution[];
    selectedSpecGroup?: SpecExecutionState;
    requireVerification?: KnownIssue[];
    build?: string;
};

function SpecList({ specs, selectedSpecGroup, requireVerification, build }: Props) {
    const [openRequireVerification, setOpenRequireVerification] = useState(false);
    const [query, setQuery] = useState('');
    const searchInput = createRef<HTMLInputElement>();
    useEffect(() => {
        function onPress(e: KeyboardEvent) {
            if (searchInput.current && searchInput.current !== document.activeElement) {
                if (e.key === 'f') {
                    e.preventDefault();
                    searchInput.current.focus();
                }
            }
        }
        window.addEventListener('keypress', onPress);
        return () => window.removeEventListener('keypress', onPress);
    }, [searchInput]);

    function querySpecsByFile(specsExecution: SpecExecution[] = [], term: string) {
        if (!term) {
            return null;
        }

        return specsExecution.filter((spec) => spec.file.includes(term));
    }

    function getSearchMessage(
        term: string,
        group?: string,
        allSpecs?: SpecExecution[],
        selected?: SpecExecution[]
    ) {
        const groups: Record<string, string> = {
            on_queue: 'on queue',
            started: 'processing',
            timed_out: 'timed out',
        };
        const ratio = `${selected ? selected.length : 0} / ${allSpecs ? allSpecs.length : 0}`;

        let message;
        if (term && group) {
            message = `"${term}" term from "${groups[group] || group}" specs`;
        } else if (term) {
            message = `"${term}" term`;
        }

        return `* ${ratio} matched with ${message}`;
    }

    const selectedSpecs = querySpecsByFile(specs, query) || specs;
    const { pipelineID, buildSuffix } = parseBuild(build);

    return (
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <div className="flex flex-col overflow-x-auto">
                <div className="inline-block min-w-full shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full table-fixed w-full">
                        <colgroup>
                            <col className="w-24" />
                            <col className="w-max-content" />
                            <col className="w-32" />
                            <col className="w-5" />
                        </colgroup>
                        <thead>
                            <tr className="table-row border-b-2 border-gray-200">
                                <td colSpan={4} className="">
                                    <div className="flex w-full">
                                        <div className="px-2 sm:pl-3 md:pl-4 py-1 text-gray-400">
                                            <SearchIcon />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full pl-3 text-gray-700 text-sm outline-none bg-gray-50"
                                            onChange={(e) => setQuery(e.target.value)}
                                            value={query}
                                            placeholder={`Search from ${
                                                specs ? specs.length : 0
                                            } specs...`}
                                            ref={searchInput}
                                        />
                                    </div>
                                </td>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {!specs && <SpecListLoading />}
                            {selectedSpecs &&
                                selectedSpecs.map((spec, i) => {
                                    return (
                                        <SpecRow
                                            key={spec.id}
                                            spec={spec}
                                            index={i}
                                            last={selectedSpecs.length - 1 === i}
                                        />
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
                {(query || selectedSpecGroup) && query && (
                    <span className="text-sm text-gray-400">
                        {getSearchMessage(query, selectedSpecGroup, specs, selectedSpecs)}
                    </span>
                )}
                {requireVerification && requireVerification.length > 0 && (
                    <>
                        <br />
                        <span
                            className="mt-4 text-sm text-red-500 cursor-pointer"
                            onClick={() => setOpenRequireVerification(!openRequireVerification)}
                        >{`* Raw data that requires verification ${
                            openRequireVerification ? '(hide)' : '(show)'
                        } `}</span>
                        {openRequireVerification && (
                            <div className={`border-l-4`}>
                                <Codeblock
                                    code={JSON.stringify(requireVerification, null, 2)}
                                    language="json"
                                />
                                <ul className="mx-4">
                                    <li>
                                        <span className="text-sm text-gray-600">{`1. Verify each failed test if product bug, flaky or requires to be updated.`}</span>
                                    </li>

                                    <li>
                                        <span className="text-sm text-gray-600">
                                            {
                                                '2. If requires test to be updated due to changes in PR, ask submitter to fix in the PR itself and not as a follow up change. Ensure corresponding written test case is updated too by filing a PR at '
                                            }
                                            <a
                                                className="text-blue-500"
                                                href="https://github.com/mattermost/mattermost-test-management/tree/main/data/test-cases"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {'mattermost-test-management.'}
                                            </a>
                                            {' Run E2E test again and see if all passed.'}
                                        </span>
                                    </li>
                                    <li>
                                        <span className="text-sm text-gray-600">
                                            {'3. If product bug, report an issue in '}
                                            <a
                                                className="text-blue-500"
                                                href="https://mattermost.atlassian.net/jira/software/c/projects/MM/issues"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {'Jira Board'}
                                            </a>
                                            {' or in a board being used by the product or team.'}
                                        </span>
                                    </li>
                                    <li>
                                        <span className="text-sm text-gray-600">
                                            {
                                                '4. If product bug or flaky test, submit a known issue PR to '
                                            }
                                            <a
                                                className="text-blue-500"
                                                href={`https://github.com/saturninoabril/automation-dashboard/blob/main/data/known_issue/${buildSuffix}.json`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {'automation-dashboard.'}
                                            </a>
                                            {
                                                ' Once merged, restart the "report" job in corresponding '
                                            }
                                            <a
                                                className="text-blue-500"
                                                href={`${gitlabPipelineUrl}/${pipelineID}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {'GitLab pipeline'}
                                            </a>
                                            {' and see if all passed.'}
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default SpecList;
