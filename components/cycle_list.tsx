import React from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

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
import { formatDate, formatDuration, isWithinTimeDuration } from '@lib/client_utils';
import { getCycleSummary } from '@lib/common_utils';
import { stateDone } from '@lib/constant';

dayjs.extend(localizedFormat);

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
                    end_at: endAt,
                    create_at: createAt,
                    update_at: updateAt,
                } = cycle;

                const end = endAt || updateAt;
                const { totalCases, passingRate, color } = getCycleSummary(cycle);
                const formattedStartDate = formatDate(startAt);
                const formattedDuration = formatDuration({
                    startAt,
                    updateAt: end,
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
                                            {startAt && totalCases > 0 && (
                                                <span className={`text-${color}`}>
                                                    {pass} / {totalCases} cases passed{' '}
                                                    {totalCases
                                                        ? `(${passingRate}%)` // prettier-ignore
                                                        : ''}
                                                </span>
                                            )}
                                            {!startAt && (
                                                <div className="flex space-x-1">
                                                    <ClockIcon />
                                                    {isWithinTimeDuration(end, {
                                                        m: 10,
                                                    }) ? (
                                                        <span className={'text-gray-600'}>
                                                            {'on queue'}
                                                        </span>
                                                    ) : (
                                                        <span className={'text-red-400'}>
                                                            {'timed out'}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-1 flex items-center text-sm leading-5 text-gray-600 space-x-3">
                                            {end && (
                                                <>
                                                    {formattedStartDate && (
                                                        <p className="flex space-x-1">
                                                            <CalendarIcon />
                                                            <span>{formattedStartDate}</span>
                                                        </p>
                                                    )}
                                                    {startAt && formattedDuration && (
                                                        <p className="flex space-x-1">
                                                            {cycle.state !== stateDone &&
                                                            isWithinTimeDuration(end, {
                                                                m: 10,
                                                            }) ? (
                                                                <Spinner />
                                                            ) : (
                                                                <ClockIcon />
                                                            )}
                                                            <TimeElapse
                                                                start={startAt}
                                                                lastUpdate={end}
                                                                isDone={cycle.state === stateDone}
                                                            />
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                            {!startAt && (
                                                <p className="flex space-x-1">
                                                    <CalendarIcon />
                                                    <span>{formatDate(createAt)}</span>
                                                </p>
                                            )}
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
