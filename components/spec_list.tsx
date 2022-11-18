import React, { createRef, useEffect, useState } from 'react';

import { SearchIcon } from '@components/icon';
import SpecListLoading from '@components/spec_list_loading';
import SpecRow from '@components/spec_row';
import { SpecExecution, SpecExecutionState } from '@types';

type Props = {
    specs?: SpecExecution[];
    selectedSpecGroup?: SpecExecutionState;
};

function SpecList({ specs, selectedSpecGroup }: Props) {
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
        // prettier-ignore
        const groups: Record<string, string> = { // eslint-disable-line
      on_queue: "on queue",
      started: "processing",
      timed_out: "timed out",
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
            </div>
        </div>
    );
}

export default SpecList;
