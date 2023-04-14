import type { CaseExecution } from './case_execution';

export type SpecExecution = {
    id: string;
    file: string;
    server: string;
    state: string;
    duration: number;
    tests: number;
    pass: number;
    fail: number;
    bug: number;
    known: number;
    known_fail: number; // deprecated
    flaky: number;
    pending: number;
    skipped: number;
    sort_weight: number;
    test_end_at: string;
    test_start_at: string;
    start_at: string;
    end_at: string;
    create_at: string;
    update_at: string;
    cycle_id: string;
    cases: CaseExecution[];
    last_execution: LastSpecExecution[];
};

export type SpecExecutionState =
    | 'passed'
    | 'failed'
    | 'bug'
    | 'known'
    | 'flaky'
    | 'started'
    | 'timed_out'
    | 'on_queue';

export type LastSpecExecution = {
    id: string;
    pass: number;
    fail: number;
    bug: number;
    known: number;
    flaky: number;
    pending: number;
    skipped: number;
    update_at: string;
    cycle_id: string;
    repo: string;
    branch: string;
    build: string;
    cycle_create_at: string;
};
