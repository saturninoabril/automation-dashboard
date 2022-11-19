import React from 'react';
import Link from 'next/link';

import {
    CalendarIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ClockIcon,
    ExclamationCircleIcon,
    FastForwardIcon,
    XCircleIcon,
} from '@components/icon';
import Spinner from '@components/spinner';
import TimeElapse from '@components/time_elapse';

import { Cycle } from '@types';
import {
    formatDate,
    formatDuration,
    getCycleSummary,
    isWithinTimeDuration,
} from '@lib/client_utils';

type Props = {
    cycles: Array<Cycle>;
};

function CycleList({ cycles }: Props) {
    return (
        <ul>
            {cycles.map((cycle, i) => {
                const {
                    id,
                    repo,
                    branch,
                    build,
                    specs_done,
                    specs_registered,
                    pass,
                    fail,
                    known_fail,
                    pending,
                    skipped,
                    start_at: startAt,
                    update_at: updateAt,
                } = cycle;

                const { totalCases, passingRate, color } = getCycleSummary(cycle);
                const formattedStartDate = formatDate(startAt);
                const formattedDuration = formatDuration({
                    startAt,
                    updateAt,
                });
                return (
                    <li className={i !== 0 ? 'border-t border-gray-200' : ''} key={i}>
                        <Link
                            href={`/cycles/${id}`}
                            className="block hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition duration-150 ease-in-out"
                            passHref
                        >
                            <div className="flex items-center px-4 sm:px-6 py-2">
                                <div className="min-w-0 flex-1 flex items-center">
                                    <div className="min-w-0 flex-1">
                                        <div className="leading-5 font-medium text-gray-600 truncate">
                                            {repo} / {branch} / {build}
                                        </div>
                                        <div className="mt-1 space-x-2 flex items-center text-sm leading-5 text-gray-600">
                                            <span>
                                                {specs_done} / {specs_registered} specs
                                            </span>
                                            <span className={`text-${color}`}>
                                                {pass} / {totalCases} cases passed{' '}
                                                {totalCases
                                                    ? `(${passingRate}%)` // prettier-ignore
                                                    : ''}
                                            </span>
                                        </div>

                                        <div className="mt-1 flex items-center text-sm leading-5 text-gray-600 space-x-3">
                                            {updateAt ? (
                                                <>
                                                    {formattedStartDate && (
                                                        <p className="flex space-x-1">
                                                            <CalendarIcon />
                                                            <span>{formattedStartDate}</span>
                                                        </p>
                                                    )}
                                                    {startAt && formattedDuration && (
                                                        <p className="flex space-x-1">
                                                            {cycle.state !== 'done' &&
                                                            isWithinTimeDuration(updateAt, {
                                                                m: 10,
                                                            }) ? (
                                                                <Spinner />
                                                            ) : (
                                                                <ClockIcon />
                                                            )}
                                                            <TimeElapse
                                                                start={startAt}
                                                                lastUpdate={updateAt}
                                                                isDone={cycle.state === 'done'}
                                                            />
                                                        </p>
                                                    )}
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                                {pass ? (
                                    <div className="ml-1 mr-1 lg:ml-2 lg:mr-2 flex space-x-1 items-center text-green-600">
                                        <div>{pass}</div>
                                        <CheckCircleIcon />
                                    </div>
                                ) : null}
                                {fail ? (
                                    <div className="ml-1 mr-1 lg:ml-2 lg:mr-2 flex space-x-1 items-center text-red-400">
                                        <div>{fail}</div>
                                        <XCircleIcon />
                                    </div>
                                ) : null}
                                {known_fail ? (
                                    <div className="ml-1 mr-1 lg:ml-2 lg:mr-2 flex space-x-1 items-center text-amber-700">
                                        <div>{known_fail}</div>
                                        <XCircleIcon />
                                    </div>
                                ) : null}
                                {pending ? (
                                    <div className="ml-1 mr-1 lg:ml-2 lg:mr-2 flex space-x-1 items-center text-blue-700">
                                        <div>{pending}</div>
                                        <ExclamationCircleIcon />
                                    </div>
                                ) : null}
                                {skipped ? (
                                    <div className="ml-1 mr-1 lg:ml-2 lg:mr-2 flex space-x-1 items-center text-purple-700">
                                        <div>{skipped}</div>
                                        <FastForwardIcon />
                                    </div>
                                ) : null}
                                <div className="text-gray-600">
                                    <ChevronRightIcon />
                                </div>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

export default CycleList;
