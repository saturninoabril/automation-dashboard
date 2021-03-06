import React, { Dispatch, SetStateAction } from 'react';

import {
    CalendarIcon,
    CheckCircleIcon,
    ClipboardCheckIcon,
    ClipboardListIcon,
    ClipboardIcon,
    ClockIcon,
    DocumentIcon,
    DocumentReportIcon,
    DocumentTextIcon,
    FastForwardIcon,
    ExclamationCircleIcon,
    XCircleIcon,
} from '../components/icon';
import Divider from '../components/divider';
import Spinner from '../components/spinner';
import TimeElapse from '../components/time_elapse';
import { getCycleSummary, formatDate } from '../lib/utils';
import { CaseState, Cycle, SpecExecutionGroup } from '../types';

type Props = {
    cycle: Cycle;
    specsGroup?: Record<SpecExecutionGroup, number>;
    selectedSpecGroup?: SpecExecutionGroup;
    setSelectedSpecGroup: Dispatch<SetStateAction<SpecExecutionGroup | undefined>>;
    selectedCaseState?: CaseState;
    setSelectedCaseState: Dispatch<SetStateAction<CaseState | undefined>>;
};

function CycleDetail({
    cycle,
    specsGroup,
    selectedSpecGroup,
    setSelectedSpecGroup,
    selectedCaseState,
    setSelectedCaseState,
}: Props): React.ReactElement {
    if (!cycle) {
        return <div />;
    }

    function setSelectedGroup(e: React.MouseEvent<HTMLDivElement>) {
        e.preventDefault();

        const targetEl = e.target as HTMLDivElement;
        const parentEl = targetEl.parentNode as HTMLDivElement;
        const group = (targetEl.dataset.group ||
            (parentEl && parentEl.dataset.group)) as SpecExecutionGroup;

        if (group !== selectedSpecGroup) {
            setSelectedSpecGroup(group);
            setSelectedCaseState(undefined);
        }
    }

    function setSelectedState(e: React.MouseEvent<HTMLDivElement>) {
        e.preventDefault();

        const targetEl = e.target as HTMLDivElement;
        const parentEl = targetEl.parentNode as HTMLDivElement;
        const state = (targetEl.dataset.state || (parentEl && parentEl.dataset.state)) as CaseState;

        if (state !== selectedCaseState) {
            setSelectedCaseState(state);
            setSelectedSpecGroup(undefined);
        }
    }

    const {
        repo,
        branch,
        build,
        state,
        pass,
        fail,
        pending,
        skipped,
        specs_registered,
        browser_name,
        browser_version,
        os_name,
        os_version,
        cypress_version,
        node_version,
        start_at,
        update_at,
    } = cycle;

    const { totalCases, passingRate, color } = getCycleSummary(cycle);
    const formattedStartDate = formatDate(start_at);

    return (
        <div className="col-span-1 row-start-1 md:row-start-auto flex flex-col sm:flex-row md:flex-col gap-4">
            <div className="max-w-sm w-full shadow-sm rounded-lg border border-gray-200 overflow-hidden text-sm">
                <div className="bg-gray-50 p-4 text-gray-700">
                    <div className="text-xl font-bold text-gray-800">{branch}</div>
                    <div>{`${repo} / ${build}`}</div>
                    <div className={`flex text-${color} font-bold text-sm space-x-2`}>
                        <DocumentReportIcon />
                        <p>{`${passingRate}% passed`}</p>
                    </div>
                    <div className="flex space-x-2">
                        <ClockIcon />
                        <TimeElapse
                            start={start_at}
                            lastUpdate={update_at}
                            isDone={state === 'done'}
                        />
                    </div>
                    {formattedStartDate && (
                        <div className="flex space-x-2">
                            <CalendarIcon />
                            <p>{formattedStartDate}</p>
                        </div>
                    )}
                    <Divider />
                    <div
                        className={`flex space-x-2 cursor-pointer hover:bg-gray-200 ${
                            !selectedSpecGroup ? 'text-gray-700' : 'text-gray-300'
                        }`}
                        onClick={setSelectedGroup}
                    >
                        <DocumentIcon />
                        <p>{`${specs_registered} specs`}</p>
                    </div>
                    {specsGroup && specsGroup.passed > 0 && (
                        <div
                            className={`flex space-x-2 cursor-pointer hover:bg-gray-200 ${
                                !selectedSpecGroup || selectedSpecGroup === 'passed'
                                    ? 'text-green-600'
                                    : 'text-gray-300'
                            }`}
                            data-group="passed"
                            onClick={setSelectedGroup}
                        >
                            <ClipboardCheckIcon />
                            <p>{`${specsGroup.passed} passed`}</p>
                        </div>
                    )}
                    {specsGroup && specsGroup.failed > 0 && (
                        <div
                            className={`flex space-x-2 cursor-pointer hover:bg-gray-200 ${
                                !selectedSpecGroup || selectedSpecGroup === 'failed'
                                    ? 'text-red-400'
                                    : 'text-gray-300'
                            }`}
                            data-group="failed"
                            onClick={setSelectedGroup}
                        >
                            <ClipboardListIcon />
                            <p>{`${specsGroup.failed} failed`}</p>
                        </div>
                    )}
                    {specsGroup && specsGroup.started > 0 && (
                        <div
                            className={`flex space-x-2 cursor-pointer hover:bg-gray-200 ${
                                !selectedSpecGroup || selectedSpecGroup === 'started'
                                    ? 'text-blue-400'
                                    : 'text-gray-300'
                            }`}
                            data-group="started"
                            onClick={setSelectedGroup}
                        >
                            <Spinner />
                            <p>{`${specsGroup.started} processing`}</p>
                        </div>
                    )}
                    {specsGroup && specsGroup.timed_out > 0 && (
                        <div
                            className={`flex space-x-2 cursor-pointer hover:bg-gray-200 ${
                                !selectedSpecGroup || selectedSpecGroup === 'timed_out'
                                    ? 'text-red-400'
                                    : 'text-gray-300'
                            }`}
                            data-group="timed_out"
                            onClick={setSelectedGroup}
                        >
                            <ClipboardIcon />
                            <p>{`${specsGroup.timed_out} timed out`}</p>
                        </div>
                    )}
                    {specsGroup && specsGroup.on_queue > 0 && (
                        <div
                            className={`flex space-x-2 cursor-pointer hover:bg-gray-200 ${
                                !selectedSpecGroup || selectedSpecGroup === 'on_queue'
                                    ? 'text-gray-500'
                                    : 'text-gray-300'
                            }`}
                            data-group="on_queue"
                            onClick={setSelectedGroup}
                        >
                            <ClipboardIcon />
                            <p>{`${specsGroup.on_queue} on queue`}</p>
                        </div>
                    )}
                    <Divider />
                    <div
                        className={`flex space-x-2 cursor-pointer hover:bg-gray-200 ${
                            !selectedCaseState ? 'text-gray-700' : 'text-gray-300'
                        }`}
                        onClick={setSelectedState}
                    >
                        <DocumentTextIcon />
                        <p>{`${totalCases} tests`}</p>
                    </div>
                    <div
                        className={`flex space-x-2 cursor-pointer hover:bg-gray-200 ${
                            !selectedCaseState || selectedCaseState === 'pass'
                                ? 'text-green-600'
                                : 'text-gray-300'
                        }`}
                        data-state="pass"
                        onClick={setSelectedState}
                    >
                        <CheckCircleIcon />
                        <p>{`${pass} passed`}</p>
                    </div>
                    <div
                        className={`flex space-x-2 cursor-pointer hover:bg-gray-200 ${
                            !selectedCaseState || selectedCaseState === 'fail'
                                ? 'text-red-400'
                                : 'text-gray-300'
                        }`}
                        data-state="fail"
                        onClick={setSelectedState}
                    >
                        <XCircleIcon />
                        <p>{`${fail} failed`}</p>
                    </div>
                    {skipped > 0 && (
                        <div
                            className={`flex space-x-2 cursor-pointer hover:bg-gray-200 ${
                                !selectedCaseState || selectedCaseState === 'skipped'
                                    ? 'text-purple-700'
                                    : 'text-gray-300'
                            }`}
                            data-state="skipped"
                            onClick={setSelectedState}
                        >
                            <FastForwardIcon />
                            <p>{`${skipped} skipped`}</p>
                        </div>
                    )}
                    {pending > 0 && (
                        <div
                            className={`flex space-x-2 cursor-pointer hover:bg-gray-200 ${
                                !selectedCaseState || selectedCaseState === 'pending'
                                    ? 'text-blue-700'
                                    : 'text-gray-300'
                            }`}
                            data-state="pending"
                            onClick={setSelectedState}
                        >
                            <ExclamationCircleIcon />
                            <p>{`${pending} pending`}</p>
                        </div>
                    )}
                    <Divider />
                    {(cypress_version || browser_version || node_version || os_version) && (
                        <>
                            {cypress_version && <p>{`cypress@${cypress_version}`}</p>}
                            {browser_version && <p>{`${browser_name}@${browser_version}`}</p>}
                            {node_version && <p>{`node@${node_version}`}</p>}
                            {os_version && <p>{`${os_name}@${os_version}`}</p>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CycleDetail;
