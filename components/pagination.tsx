import React from 'react';

import * as pagination from '../lib/pagination';
import { ChevronLeftIcon, ChevronRightIcon } from './icon';

type Props = {
    cycleCount: number;
    total: number;
    page: number;
    perPage: number;
    setPage: (page: number) => void;
};

function Pagination({ cycleCount, total, page, perPage, setPage }: Props): React.ReactElement {
    const pageCount = pagination.pageCount({
        total,
        perPage,
    });
    const hasPrevious = pagination.hasPrevious({ page });
    const hasNext = pagination.hasNext({
        page,
        total,
        perPage,
    });
    const centerPage = Math.max(4, Math.min(page, pageCount - 2));

    return (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between items-center sm:hidden">
                <ControlButton
                    disabled={!hasPrevious}
                    onClick={() => setPage(page - 1)}
                    ariaLabel="Previous"
                    extraClassName="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md bg-white ml-4"
                >
                    <span>{'Previous'}</span>
                </ControlButton>
                <div className="text-base leading-6 text-gray-500">
                    {page}/{pageCount}
                </div>
                <ControlButton
                    disabled={!hasNext}
                    onClick={() => setPage(page + 1)}
                    ariaLabel="Next"
                    extraClassName="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md bg-white ml-4"
                >
                    <span>{'Next'}</span>
                </ControlButton>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm leading-5 text-gray-700">
                        Showing <span className="font-medium">{(page - 1) * perPage + 1}</span> to{' '}
                        <span className="font-medium">{(page - 1) * perPage + cycleCount}</span> of{' '}
                        <span className="font-medium">{total}</span> results
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex shadow-sm">
                        <ControlButton
                            disabled={!hasPrevious}
                            onClick={() => setPage(page - 1)}
                            ariaLabel="Previous"
                            extraClassName="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm leading-5 font-medium"
                        >
                            <ChevronLeftIcon />
                        </ControlButton>
                        <NumberButton page={page} pageNumber={1} setPage={setPage} />
                        {centerPage - 2 === 2 && centerPage - 2 <= pageCount ? (
                            <NumberButton page={page} pageNumber={2} setPage={setPage} />
                        ) : (
                            <Filler />
                        )}
                        {centerPage - 1 <= pageCount ? (
                            <NumberButton
                                page={page}
                                pageNumber={centerPage - 1}
                                setPage={setPage}
                            />
                        ) : null}
                        {centerPage <= pageCount ? (
                            <NumberButton page={page} pageNumber={centerPage} setPage={setPage} />
                        ) : null}
                        {centerPage + 1 <= pageCount ? (
                            <NumberButton
                                page={page}
                                pageNumber={centerPage + 1}
                                setPage={setPage}
                            />
                        ) : null}
                        {centerPage + 2 === pageCount ? (
                            <NumberButton
                                page={page}
                                pageNumber={centerPage + 2}
                                setPage={setPage}
                            />
                        ) : null}
                        {pageCount > centerPage + 2 ? <Filler /> : null}
                        <ControlButton
                            disabled={!hasNext}
                            onClick={() => setPage(page + 1)}
                            ariaLabel="Next"
                            extraClassName="-ml-px relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm leading-5 font-medium"
                        >
                            <ChevronRightIcon />
                        </ControlButton>
                    </nav>
                </div>
            </div>
        </div>
    );
}

type NumberButtonProps = {
    page: number;
    pageNumber: number;
    setPage: (pageNumber: number) => void;
};

function NumberButton({ page, pageNumber, setPage }: NumberButtonProps): React.ReactElement {
    return (
        <button
            onClick={() => setPage(pageNumber)}
            className={`hidden md:inline-flex -ml-px relative items-center px-4 py-2 border border-gray-300 text-sm leading-5 ${
                page === pageNumber
                    ? 'bg-gray-100 font-semibold text-gray-800'
                    : 'bg-white font-medium text-gray-700'
            } hover:text-gray-500 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150`}
        >
            {pageNumber}
        </button>
    );
}

type ControlButtonProps = {
    children: React.ReactElement;
    disabled: boolean;
    extraClassName: string;
    ariaLabel: string;
    onClick: () => void;
};
function ControlButton({
    children,
    disabled,
    extraClassName,
    ariaLabel,
    onClick,
}: ControlButtonProps): React.ReactElement {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`${extraClassName} ${
                disabled
                    ? 'text-gray-300 cursor-default'
                    : 'text-gray-700 hover:text-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 active:bg-gray-100 active:text-gray-700'
            } transition ease-in-out duration-150`}
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );
}

function Filler(): React.ReactElement {
    return (
        <span className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm leading-5 font-medium text-gray-700">
            ...
        </span>
    );
}

export default Pagination;
