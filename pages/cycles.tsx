import React, { ChangeEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import CycleList from '../components/cycle_list';
import CycleListLoading from '../components/cycle_list_loading';
import Header from '../components/header';
import Pagination from '../components/pagination';
import fetcher from '../lib/fetcher';

const PER_PAGE = 20;

function Cycles(): React.ReactElement {
    const { query: routerQuery, replace } = useRouter();

    const page = parseInt(
        (Array.isArray(routerQuery.page) ? routerQuery.page[0] : routerQuery.page) || '1'
    );
    const query =
        (Array.isArray(routerQuery.query) ? routerQuery.query[0] : routerQuery.query) || '';

    function handleSearchInput(event: ChangeEvent<HTMLInputElement>) {
        const query = event.target.value ? { query: event.target.value } : undefined;
        replace({
            pathname: '/cycles',
            query,
        });
    }

    function setPage(page: number) {
        const query = page !== 1 ? { page: page.toFixed(0) } : undefined;
        replace({
            pathname: '/cycles',
            query,
        });
    }
    const { data, error } = useSWR(`/api/cycles?page=${page}&per_page=${PER_PAGE}`, fetcher);

    return (
        <>
            <Head>
                <title>Cycles | Test Automation Dashboard</title>
            </Head>
            <div className="bg-gray">
                <Header widerContent={true} />
                <div className="max-w-screen-lg mx-auto px-4 sm:px-6 md:px-8 mt-8">
                    <label htmlFor="query" className="font-medium sr-only">
                        Search
                    </label>
                    <input
                        id="query"
                        className="block w-full px-4 py-2 leading-normal bg-white border border-gray-200 rounded-lg outline-none shadow hover:shadow-sm focus:shadow-sm appearance-none focus:border-gray-300 hover:border-gray-300 mt-1"
                        type="text"
                        placeholder={
                            !data ? 'Search to follow' : `Search to follow (${data.total} cycles)`
                        }
                        value={query}
                        onChange={handleSearchInput}
                    />
                </div>
                <div className="sm:max-w-screen-lg sm:mx-auto sm:px-6 md:px-8 pb-4 sm:pb-12">
                    {data === undefined ? (
                        <CycleListLoading perPage={PER_PAGE} />
                    ) : data === null ? (
                        <div className="p-4 text-center sm:text-left text-sm leading-5 font-medium text-gray-500 truncate">
                            Failed to load cycles
                        </div>
                    ) : (
                        <div className="bg-white sm:shadow border border-gray-200 overflow-hidden sm:rounded-md mt-4">
                            {data.cycles.length == 0 ? (
                                <div className="p-4 text-center sm:text-left text-sm leading-5 font-medium text-gray-500 truncate">
                                    No cycles found
                                </div>
                            ) : (
                                <CycleList cycles={data.cycles} />
                            )}
                            <Pagination
                                cycleCount={data.cycles.length}
                                total={data.total}
                                page={page}
                                perPage={PER_PAGE}
                                setPage={setPage}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Cycles;
