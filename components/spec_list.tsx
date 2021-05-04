import React, { useState, createRef, useEffect } from 'react';
import Link from 'next/link';

import {
    ChevronRightIcon,
    ClipboardIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    RefreshIcon,
    SearchIcon,
    StopIcon,
    XCircleIcon,
} from '../components/icon';
import SpecListLoading from '../components/spec_list_loading';
import { formatDuration, isTimeout } from '../lib/utils';
import { SpecExecution, SpecExecutionGroup } from '../types';

type Props = {
    specs?: SpecExecution[];
    selectedSpecGroup?: SpecExecutionGroup;
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
            on_queue: 'on queue',
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
                                    const statusIcon = (spec: SpecExecution) => {
                                        const { duration, state, update_at: updateAt } = spec;

                                        if (state === 'done') {
                                            const threeMinutes = 3 * 60 * 1000;
                                            return (
                                                <span
                                                    className={`flex space-x-1 ${
                                                        duration > threeMinutes
                                                            ? 'text-amber-500'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    <ClockIcon />
                                                    <span>
                                                        {formatDuration({
                                                            durationInMs: duration,
                                                            format: 'm:ss',
                                                        })}
                                                    </span>
                                                </span>
                                            );
                                        }

                                        const tenMinutes = 10 * 60 * 1000;
                                        if (
                                            state === 'started' &&
                                            isTimeout(updateAt, tenMinutes)
                                        ) {
                                            return (
                                                <span className="text-red-400">
                                                    <ClipboardIcon />
                                                </span>
                                            );
                                        }

                                        if (state === 'started') {
                                            return (
                                                <span className="text-yellow-400">
                                                    <RefreshIcon />
                                                </span>
                                            );
                                        }

                                        return (
                                            <span className="text-gray-400">
                                                <ClipboardIcon />
                                            </span>
                                        );
                                    };

                                    return (
                                        <tr
                                            key={i}
                                            className={`table-row hover:bg-gray-100 ${
                                                i !== selectedSpecs.length - 1
                                                    ? 'border-b border-gray-200'
                                                    : ''
                                            }`}
                                        >
                                            <td className="whitespace-no-wrap text-sm leading-5 text-gray-400">
                                                <Link href={`/specs/${spec.id}`}>
                                                    <a
                                                        className={
                                                            'px-2 sm:pl-3 md:pl-4 py-1 w-full block text-gray-300'
                                                        }
                                                        tabIndex={-1}
                                                    >
                                                        {statusIcon(spec)}
                                                    </a>
                                                </Link>
                                            </td>
                                            <td className="whitespace-no-wrap text-sm text-blue-500 leading-5">
                                                <Link href={`/specs/${spec.id}`}>
                                                    <a className="pl-2 py-1 w-full block truncate">
                                                        <span className="font-light">
                                                            {`${i + 1}. ${spec.file.replace(
                                                                'cypress/integration/',
                                                                ''
                                                            )}`}
                                                        </span>
                                                    </a>
                                                </Link>
                                            </td>
                                            <td className="whitespace-no-wrap text-sm leading-5 text-gray-500 text-right">
                                                <Link href={`/specs/${spec.id}`}>
                                                    <a
                                                        className="px-4 py-1 pl-1 w-full h-full block flex flex-row-reverse"
                                                        tabIndex={-1}
                                                    >
                                                        <span className="flex space-x-2 text-right">
                                                            {spec.pass > 0 && (
                                                                <span className="flex w-10 space-x-1 text-green-600">
                                                                    <CheckCircleIcon />
                                                                    <span>{spec.pass}</span>
                                                                </span>
                                                            )}
                                                            {spec.fail > 0 && (
                                                                <span className="flex w-10 space-x-1 text-red-400">
                                                                    <XCircleIcon />
                                                                    <span>{spec.fail}</span>
                                                                </span>
                                                            )}
                                                            {spec.skipped > 0 && (
                                                                <span className="flex w-10 space-x-1 text-purple-700">
                                                                    <StopIcon />
                                                                    <span>{spec.skipped}</span>
                                                                </span>
                                                            )}
                                                            {spec.pending > 0 && (
                                                                <span className="flex w-10 space-x-1 text-blue-700">
                                                                    <ExclamationCircleIcon />
                                                                    <span>{spec.pending}</span>
                                                                </span>
                                                            )}
                                                        </span>
                                                    </a>
                                                </Link>
                                            </td>
                                            <td className="text-sm text-gray-500">
                                                <ChevronRightIcon />
                                            </td>
                                        </tr>
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
