import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import Breadcrumb from '../../components/bread_crumb';
import Header from '../../components/header';
import CycleDetail from '../../components/cycle_detail';
import SpecList from '../../components/spec_list';
import fetcher from '../../lib/fetcher';
import { isWithinTimeDuration } from '../../lib/utils';
import { SpecExecution, SpecExecutionGroup, CaseState } from '../../types';

function CyclePage(): React.ReactElement {
    const {
        asPath,
        query: { id: cycleId },
    } = useRouter();
    const [refreshInterval, setRefreshInterval] = useState<number>(0);
    const [selectedSpecGroup, setSelectedSpecGroup] = useState<SpecExecutionGroup>();
    const [selectedCaseState, setSelectedCaseState] = useState<CaseState>();

    const refreshOption = refreshInterval ? { refreshInterval } : {};

    const cycleRes = useSWR(`/api/cycles/${cycleId}`, fetcher, refreshOption);
    const cycle = cycleRes.data;
    const title = cycle ? `Cycle for ${cycle.repo} / ${cycle.branch} / ${cycle.build}` : '';

    useEffect(() => {
        const interval = cycle && isWithinTimeDuration(cycle.update_at, { m: 10 }) ? 10000 : 0;
        setRefreshInterval(interval);
    }, [cycle]);

    // Set to maximum while working on proper pagination
    const PER_PAGE = 1000;
    const specsRes = useSWR(
        `/api/executions/specs?cycle_id=${cycleId}&per_page=${PER_PAGE}`,
        fetcher,
        refreshOption
    );

    let specs: SpecExecution[] | undefined;
    let specsGroupByCount;
    if (specsRes.data && specsRes.data.specs) {
        specs = specsRes.data.specs;
        specsGroupByCount = getSpecsGroupByCount(specs);
    }

    let selectedSpecs;
    if (selectedSpecGroup) {
        selectedSpecs = getSpecsByGroup(specs, selectedSpecGroup);
    }

    if (selectedCaseState) {
        selectedSpecs = getSpecsByState(specs, selectedCaseState);
    }

    return (
        <>
            <Head>
                <title>{`${title} | Test Automation Dashboard`}</title>
            </Head>
            <div className="bg-gray">
                <div className="bg-gray-50 min-h-full">
                    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8 py-2 pb-8 pt-4">
                        <Header widerContent={true} />
                        <div className="pb-8 pt-4">
                            <Breadcrumb asPath={asPath} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <SpecList
                                specs={selectedSpecs || specs}
                                selectedSpecGroup={selectedSpecGroup}
                            />
                            <CycleDetail
                                cycle={cycle}
                                specsGroup={specsGroupByCount}
                                selectedSpecGroup={selectedSpecGroup}
                                setSelectedSpecGroup={setSelectedSpecGroup}
                                selectedCaseState={selectedCaseState}
                                setSelectedCaseState={setSelectedCaseState}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function getSpecGroup(spec: SpecExecution) {
    const { update_at: updateAt } = spec;

    switch (spec.state) {
        case 'done': {
            const { pass, fail, pending, skipped } = spec;
            const total = pass + fail + pending + skipped;
            if (total === pass) {
                return 'passed';
            } else {
                return 'failed';
            }
        }
        case 'started': {
            if (!isWithinTimeDuration(updateAt, { m: 10 })) {
                return 'timed_out';
            }
            return 'started';
        }
        default:
            return 'on_queue';
    }
}

function getSpecsByGroup(specsExecution: SpecExecution[] = [], group: SpecExecutionGroup) {
    if (!group) {
        return null;
    }

    return specsExecution.filter((spec) => getSpecGroup(spec) === group);
}

function getSpecsByState(specsExecution: SpecExecution[] = [], state: CaseState) {
    if (!state) {
        return null;
    }

    return specsExecution.filter((spec) => Boolean(spec[state]));
}

function getSpecsGroupByCount(specsExecution: SpecExecution[] = []) {
    return specsExecution.reduce(
        // prettier-ignore
        (acc: Record<SpecExecutionGroup, number>, spec) => { // eslint-disable-line
            const group = getSpecGroup(spec);
            if (acc[group]) {
                acc[group] += 1;
            } else {
                acc[group] = 1;
            }

            return acc;
        },
        { passed: 0, failed: 0, started: 0, timed_out: 0, on_queue: 0 }
    );
}

export default CyclePage;
