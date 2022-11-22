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
    known_fail: number;
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
};

export type SpecExecutionState =
    | 'passed'
    | 'failed'
    | 'known_fail'
    | 'started'
    | 'timed_out'
    | 'on_queue';
