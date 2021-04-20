import React from 'react';

import CheckCircleIcon from '../components/icon/check_circle';
import ChevronLeftIcon from '../components/icon/chevron_left';
import ChevronRightIcon from '../components/icon/chevron_right';

type Props = {
    perPage: number;
};

function CycleListLoading({ perPage }: Props): React.ReactElement {
    return (
        <div className="bg-white sm:shadow border border-gray-200 overflow-hidden sm:rounded-md mt-4">
            <ul>
                {Array(perPage)
                    .fill(null)
                    .map((_, i) => (
                        <li className={i !== 0 ? 'border-t border-gray-200' : ''} key={i}>
                            <div className="flex items-center px-4 sm:px-6 py-4">
                                <div className="min-w-0 flex-1 flex items-center">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm leading-5">
                                            <div className="h-4 bg-blue-100 w-2/5 sm:w-2/5 md:w-2/5"></div>
                                        </div>
                                        <div className="mt-1 flex items-center">
                                            <div className="h-4 bg-gray-100 w-1/2 sm:w-1/2 md:w-1/2"></div>
                                        </div>
                                        <div className="mt-1 flex items-center">
                                            <div className="h-3 bg-gray-100 w-1/3 sm:w-1/3 md:w-1/3"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-6 mr-4 flex items-center text-gray-100">
                                    <div className="h-3 bg-gray-100 w-10"></div>
                                    <CheckCircleIcon />
                                </div>
                                <div className="text-gray-100">
                                    <ChevronRightIcon />
                                </div>
                            </div>
                        </li>
                    ))}
            </ul>
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between items-center sm:hidden">
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-gray-100 text-sm leading-5 font-medium rounded-md bg-white">
                        Previous
                    </button>
                    <div className="text-base leading-6 text-gray-500">
                        <div className="h-3 w-4 bg-gray-100 inline-block mr-1" />/
                        <div className="h-3 w-4 bg-gray-100 inline-block ml-1" />
                    </div>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-gray-100 text-sm leading-5 font-medium rounded-md bg-white ml-4">
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="h-3 w-32 bg-gray-100" />
                    <div>
                        <nav className="relative z-0 inline-flex shadow-sm text-gray-200 leading-5">
                            <div className="-ml-px relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white rounded-l-md">
                                <ChevronLeftIcon />
                            </div>
                            {Array(6)
                                .fill(null)
                                .map((_, i) => (
                                    <div
                                        key={i}
                                        className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white"
                                    >
                                        &nbsp;&nbsp;
                                    </div>
                                ))}
                            <div className="-ml-px relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white rounded-r-md">
                                <ChevronRightIcon />
                            </div>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CycleListLoading;
