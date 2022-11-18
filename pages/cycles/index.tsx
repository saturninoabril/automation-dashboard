import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import Breadcrumb from '@components/bread_crumb';
import CycleList from '@components/cycle_list';
import CycleListLoading from '@components/cycle_list_loading';
import Header from '@components/header';
import Pagination from '@components/pagination';
import fetcher from '@lib/fetcher';

const PER_PAGE = 20;

function Cycles(): React.ReactElement {
    const { asPath, query: routerQuery, replace } = useRouter();

    const page = parseInt(
        (Array.isArray(routerQuery.page) ? routerQuery.page[0] : routerQuery.page) || '1'
    );

    const { repo, branch, build } = routerQuery;

    const queries = [];
    if (repo) {
        queries.push(`&repo=${repo}`);
    }
    if (branch) {
        queries.push(`&branch=${branch}`);
    }
    if (build) {
        queries.push(`&build=${build}`);
    }

    function setPage(page: number) {
        const query: Record<string, any> = {};
        if (page >= 1) {
            query.page = page.toFixed(0);
        }
        if (repo) {
            query.repo = repo;
        }
        if (branch) {
            query.branch = branch;
        }
        if (build) {
            query.build = build;
        }

        replace({
            pathname: '/cycles',
            query,
        });
    }
    const { data } = useSWR(
        `/api/cycles?page=${page}&per_page=${PER_PAGE}${queries.join('')}`,
        fetcher,
        {
            refreshInterval: 10000,
        }
    );

    if (!(data && data.cycles)) {
        return <div />;
    }

    return (
        <>
            <Head>
                <title>Cycles | Test Automation Dashboard</title>
            </Head>
            <div className="bg-gray">
                <div className="max-w-screen-lg mx-auto px-4 sm:px-6 md:px-8 mt-8">
                    <Header widerContent={true} />
                    <div className="pb-8 pt-4">
                        <Breadcrumb asPath={asPath} />
                    </div>
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
