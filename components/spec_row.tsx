import React, { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';

import {
    ChevronDownIcon,
    ChevronUpIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    StopIcon,
    XCircleIcon,
} from '../components/icon';
import Codeblock from '../components/code_block';
import SpecStatus from '../components/spec_status';
import { CaseExecution, SpecExecution } from '../types';
import { formatDuration } from '../lib/utils';

import fetcher from '../lib/fetcher';

type Props = {
    spec: SpecExecution;
    index: number;
    last: boolean;
};

function SpecRow({ spec, index, last }: Props) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <SpecSummaryView spec={spec} index={index} last={last} open={open} setOpen={setOpen} />
            {open && <SpecDetailView spec={spec} />}
        </>
    );
}

type SpecSummaryViewProps = {
    spec: SpecExecution;
    index: number;
    last: boolean;
    open: boolean;
    setOpen: (open: boolean) => void;
};

function SpecSummaryView({
    spec,
    index,
    last,
    open,
    setOpen,
}: SpecSummaryViewProps): React.ReactElement {
    const [hover, setHover] = useState(false);

    return (
        <tr
            className={`table-row cursor-pointer hover:bg-gray-100
                ${last && !open ? '' : ' border-b border-gray-200'}
                ${open ? ' bg-gray-200' : ''}
            `}
            onClick={() => setOpen(!open)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <td className="whitespace-no-wrap text-sm text-gray-400">
                <span className={'px-2 py-1 w-full block text-gray-300'} tabIndex={-1}>
                    <SpecStatus spec={spec} />
                </span>
            </td>
            <td className="whitespace-no-wrap text-sm text-blue-500">
                <span className="py-1 w-full block truncate">
                    <span className="">
                        {`${index + 1}. ${spec.file.replace('cypress/integration/', '')}`}
                    </span>
                </span>
            </td>
            <td className="whitespace-no-wrap text-sm leading-5 text-gray-500 text-right">
                <span
                    className="px-4 py-1 pl-1 w-full h-full block flex flex-row-reverse"
                    tabIndex={-1}
                >
                    <span className="flex space-x-2 text-right">
                        {spec.pass > 0 && (
                            <span className="flex w-10 space-x-1 text-green-600">
                                <CheckCircleIcon />
                                <span>{spec.pass}</span>
                            </span>
                        )}
                        {spec.fail > 0 && (
                            <span className="flex w-10 space-x-1 text-red-400">
                                <XCircleIcon />
                                <span>{spec.fail}</span>
                            </span>
                        )}
                        {spec.skipped > 0 && (
                            <span className="flex w-10 space-x-1 text-purple-700">
                                <StopIcon />
                                <span>{spec.skipped}</span>
                            </span>
                        )}
                        {spec.pending > 0 && (
                            <span className="flex w-10 space-x-1 text-blue-700">
                                <ExclamationCircleIcon />
                                <span>{spec.pending}</span>
                            </span>
                        )}
                    </span>
                </span>
            </td>
            <td
                className={`text-sm text-gray-500
                ${!open ? ' opacity-20' : ''}
                ${!open && hover ? ' opacity-100' : ''}
            `}
            >
                {open && <ChevronUpIcon />}
                {!open && <ChevronDownIcon />}
            </td>
        </tr>
    );
}

type SpecDetailViewProps = {
    spec: SpecExecution;
};

function SpecDetailView({ spec }: SpecDetailViewProps): React.ReactElement {
    return (
        <>
            {spec.cases
                // prettier-ignore
                .sort((a: Partial<CaseExecution>, b: Partial<CaseExecution>) => { // eslint-disable-line
                    if (!a.test_start_at) {
                        return 1;
                    }
                    if (!b.test_start_at) {
                        return -1;
                    }

                    const aStart = new Date(a.test_start_at);
                    const bStart = new Date(b.test_start_at);
                    return aStart.getTime() - bStart.getTime();
                })
                .map((c) => (
                    <CaseRow key={c.id} case_execution={c} />
                ))}
        </>
    );
}

type CaseRowProps = {
    case_execution: CaseExecution;
    last?: boolean;
};

function CaseRow({ case_execution, last }: CaseRowProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <CaseSummaryView
                key={case_execution.id}
                case_execution={case_execution}
                open={open}
                setOpen={setOpen}
            />
            {open && <CaseDetailView case_execution={case_execution} />}
        </>
    );
}

type CaseSummaryViewProps = {
    case_execution: CaseExecution;
    last?: boolean;
    open: boolean;
    setOpen: (open: boolean) => void;
};

function CaseSummaryView({
    case_execution,
    last,
    open,
    setOpen,
}: CaseSummaryViewProps): React.ReactElement {
    const [hover, setHover] = useState(false);
    const { id, duration, state, title } = case_execution;
    return (
        <tr
            key={id}
            className={`table-row cursor-pointer
                ${
                    state === 'passed'
                        ? ' bg-green-100 hover:bg-green-200'
                        : ' bg-red-100 hover:bg-red-200'
                }
                ${last && !open ? '' : ' border-b border-gray-100'}
            `}
            onClick={() => setOpen(!open)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <td className="whitespace-no-wrap text-sm leading-5 text-gray-400">
                <span className={'px-2 py-1 w-full block text-gray-300'} tabIndex={-1}>
                    <span
                        className={`flex space-x-1 ${
                            duration > 60 * 1000 ? 'text-amber-500' : 'text-gray-400'
                        }`}
                    >
                        <span className="invisible">
                            <ClockIcon />
                        </span>
                        <span>
                            {formatDuration({
                                durationInMs: duration,
                                format: 'm:ss',
                            })}
                        </span>
                    </span>
                </span>
            </td>
            <td className="whitespace-no-wrap text-sm text-blue-500 leading-5">
                <span className="flex py-1 w-full block truncate">
                    <span className="font-light">{`* ${title[title.length - 1]}`}</span>
                </span>
            </td>
            <td className="whitespace-no-wrap text-sm leading-5 text-gray-500 text-right">
                <span
                    className="px-4 py-1 pl-1 w-full h-full block flex flex-row-reverse"
                    tabIndex={-1}
                >
                    <span className="flex space-x-2 text-right">
                        {state === 'passed' && (
                            <span className="flex w-10 space-x-1 text-green-600">
                                <CheckCircleIcon />
                            </span>
                        )}
                        {state === 'failed' && (
                            <span className="flex w-10 space-x-1 text-red-400">
                                <XCircleIcon />
                            </span>
                        )}
                        {state === 'skipped' && (
                            <span className="flex w-10 space-x-1 text-purple-700">
                                <StopIcon />
                            </span>
                        )}
                        {state === 'pending' && (
                            <span className="flex w-10 space-x-1 text-blue-700">
                                <ExclamationCircleIcon />
                            </span>
                        )}
                    </span>
                </span>
            </td>
            <td
                className={`text-sm text-gray-500
                ${!open ? ' opacity-20' : ''}
                ${!open && hover ? ' opacity-100' : ''}
            `}
            >
                {open && <ChevronUpIcon />}
                {!open && <ChevronDownIcon />}
            </td>
        </tr>
    );
}

type CaseDetailViewProps = {
    case_execution: CaseExecution;
};

function CaseDetailView({ case_execution }: CaseDetailViewProps): React.ReactElement {
    const res = useSWR(`/api/executions/case/${case_execution.id}`, fetcher);
    const caseExecution = res.data;

    if (!caseExecution) {
        return <span />;
    }
    console.log('CaseDetailView caseExecution', caseExecution.screenshot);

    return (
        <tr key={case_execution.id} className={'table-row'}>
            <td colSpan={4} className="text-sm">
                {caseExecution.error_display && (
                    <>
                        <div className="border-l-4 border-red-200">
                            <span className="pl-4 pr-4 bg-yellow-100 text-red-500">
                                Error Display
                            </span>
                            <Codeblock code={`  ${caseExecution.error_display}`} language="bash" />
                        </div>
                        <hr />
                    </>
                )}
                {caseExecution.error_frame && (
                    <>
                        <div className="border-l-4 border-red-200">
                            <span className="pl-4 pr-4 bg-yellow-100 text-red-500">
                                Error Frame
                            </span>
                            <Codeblock
                                code={`  ${caseExecution.error_frame}`}
                                language="javascript"
                            />
                        </div>
                        <hr />
                    </>
                )}
                {caseExecution.code && (
                    <div className="border-l-4 border-gray-200">
                        <span className="pl-4 pr-4 bg-yellow-100">Code Block</span>
                        <Codeblock code={`  ${caseExecution.code}`} language="javascript" />
                    </div>
                )}
                {caseExecution.screenshot?.url && (
                    <div className="border-l-4 border-gray-200">
                        <span className="pl-4 pr-4 bg-yellow-100">Screenshot</span>
                        <Image
                            src={caseExecution.screenshot.url}
                            alt={`Screenshot for ${
                                caseExecution.title[caseExecution.title.length - 1]
                            }`}
                            height={270}
                            width={480}
                            layout="responsive"
                        />
                    </div>
                )}
            </td>
        </tr>
    );
}

export default SpecRow;
