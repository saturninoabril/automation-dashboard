export type Cycle = {
    id: string;
    repo: string;
    branch: string;
    build: string;
    state: CycleState;
    specs_registered: number;
    specs_done: number;
    duration: number;
    pass: number;
    fail: number;
    bug: number;
    known: number;
    known_fail: number; // deprecated
    flaky: number;
    pending: number;
    skipped: number;
    cypress_version: string;
    browser_name: string;
    browser_version: string;
    headless: boolean;
    os_name: string;
    os_version: string;
    node_version: string;
    start_at: string;
    end_at: string;
    create_at: string;
    update_at: string;
};

export type CycleState = 'done' | 'started' | 'timed_out' | 'on_queue';
