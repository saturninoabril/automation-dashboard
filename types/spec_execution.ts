export type SpecExecution = {
    id: string;
    file: string;
    server: string;
    state: string;
    duration: number;
    tests: number;
    pass: number;
    fail: number;
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
};

export type SpecExecutionGroup = 'passed' | 'failed' | 'started' | 'timed_out' | 'on_queue';
