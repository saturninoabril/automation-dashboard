import React from 'react';
import Link from 'next/link';
import TimeAgo from 'timeago-react';

import CheckCircleIcon from '../components/icon/check_circle';
import ChevronRightIcon from '../components/icon/chevron_right';
import ExclamationCircleIcon from '../components/icon/exclamation_circle';
import FastForwardIcon from '../components/icon/fast_forward';
import XCircleIcon from '../components/icon/x_circle';
import { Cycle } from '../types';

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
                const totalCases = pass + fail + pending + skipped;

                return (
                    <li className={i !== 0 ? 'border-t border-gray-200' : ''} key={i}>
                        <Link href={`/cycles/${id}`}>
                            <a className="block hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition duration-150 ease-in-out">
                                <div className="flex items-center px-4 sm:px-6 py-2">
                                    <div className="min-w-0 flex-1 flex items-center">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm leading-5 font-medium text-blue-500 truncate">
                                                {repo} / {branch} / {build}
                                            </div>
                                            <div className="mt-1 space-x-4 flex items-center text-sm leading-5 text-gray-600">
                                                <span>
                                                    {specs_done} / {specs_registered} specs
                                                </span>
                                                <span>
                                                    {pass} / {totalCases} cases passed{' '}
                                                    {totalCases
                                                        ? `(${((pass / totalCases) * 100).toFixed(
                                                              2
                                                          )}%)`
                                                        : ''}
                                                </span>
                                            </div>

                                            <div className="mt-1 flex items-center text-sm leading-5 text-gray-600 space-x-1">
                                                {cycle.update_at ? (
                                                    <>
                                                        <span
                                                            className="truncate"
                                                            title={new Date(
                                                                update_at
                                                            ).toLocaleString()}
                                                        >
                                                            <TimeAgo
                                                                live={true}
                                                                datetime={update_at}
                                                                locale="en"
                                                            />
                                                        </span>
                                                        <span>
                                                            {formatDuration(start_at, update_at)}
                                                        </span>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    {pass ? (
                                        <div className="ml-1 mr-1 lg:ml-2 lg:mr-2 flex items-center text-green-400">
                                            <div>{pass}</div>
                                            <CheckCircleIcon />
                                        </div>
                                    ) : null}
                                    {fail ? (
                                        <div className="ml-1 mr-1 lg:ml-2 lg:mr-2 flex items-center text-red-400">
                                            <div>{fail}</div>
                                            <XCircleIcon />
                                        </div>
                                    ) : null}
                                    {pending ? (
                                        <div className="ml-1 mr-1 lg:ml-2 lg:mr-2 flex items-center text-purple-700">
                                            <div>{pending}</div>
                                            <ExclamationCircleIcon />
                                        </div>
                                    ) : null}
                                    {skipped ? (
                                        <div className="ml-1 mr-1 lg:ml-2 lg:mr-2 flex items-center text-blue-700">
                                            <div>{skipped}</div>
                                            <FastForwardIcon />
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

function formatDuration(startAt: string, updateAt: string) {
    const start = new Date(startAt);
    const update = new Date(updateAt);
    const durationInMs = update.getTime() - start.getTime();
    const inHour = Math.floor(durationInMs / (1000 * 60 * 60));
    const inMinute = Math.floor((durationInMs / 1000 / 60) % 60);
    const inSecond = Math.floor((durationInMs / 1000) % 60);

    const hourStr = inHour ? ` ${inHour}h` : '';
    const minuteStr = inMinute ? ` ${inMinute}m` : '';
    const secondStr = inSecond ? ` ${inSecond}s` : '';

    return inHour || inMinute || inSecond ? `in${hourStr}${minuteStr}${secondStr}` : '';
}

export default CycleList;
