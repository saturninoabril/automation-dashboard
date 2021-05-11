import React from 'react';
import Link from 'next/link';

import {
    CalendarIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ClockIcon,
    ExclamationCircleIcon,
    StopIcon,
    XCircleIcon,
} from '../components/icon';
import Spinner from '../components/spinner';
import TimeElapse from '../components/time_elapse';

import { Cycle } from '../types';
import { getCycleSummary, formatDate, formatDuration, isWithinTimeDuration } from '../lib/utils';

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
                    pending,
                    skipped,
                    start_at,
                    update_at,
                } = cycle;

                const { totalCases, passingRate, color } = getCycleSummary(cycle);
                const formattedStartDate = formatDate(start_at);
                const formattedDuration = formatDuration({
                    startAt: start_at,
                    updateAt: update_at,
                });
                return (
                    <li className={i !== 0 ? 'border-t border-gray-200' : ''} key={i}>
                        <Link href={`/cycles/${id}`}>
                            <a className="block hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition duration-150 ease-in-out">
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
                                                {cycle.update_at ? (
                                                    <>
                                                        {formattedStartDate && (
                                                            <p className="flex space-x-1">
                                                                <CalendarIcon />
                                                                <span>{formattedStartDate}</span>
                                                            </p>
                                                        )}
                                                        {formattedDuration && (
                                                            <p className="flex space-x-1">
                                                                {cycle.state !== 'done' &&
                                                                isWithinTimeDuration(
                                                                    cycle.update_at,
                                                                    { m: 10 }
                                                                ) ? (
                                                                    <Spinner />
                                                                ) : (
                                                                    <ClockIcon />
                                                                )}
                                                                <TimeElapse
                                                                    start={cycle.start_at}
                                                                    lastUpdate={cycle.update_at}
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
                                    {pending ? (
                                        <div className="ml-1 mr-1 lg:ml-2 lg:mr-2 flex space-x-1 items-center text-blue-700">
                                            <div>{pending}</div>
                                            <ExclamationCircleIcon />
                                        </div>
                                    ) : null}
                                    {skipped ? (
                                        <div className="ml-1 mr-1 lg:ml-2 lg:mr-2 flex space-x-1 items-center text-purple-700">
                                            <div>{skipped}</div>
                                            <StopIcon />
                                        </div>
                                    ) : null}
                                    <div className="text-gray-600">
                                        <ChevronRightIcon />
                                    </div>
                                </div>
                            </a>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

export default CycleList;
