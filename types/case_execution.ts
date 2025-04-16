// Make Screenshot fields optional and add Playwright specific ones
export type Screenshot = {
    // Cypress fields
    url?: string;
    taken_at?: string;
    height?: number;
    width?: number;
    // Playwright fields
    name?: string;
    contentType?: string;
    path?: string;
    body?: string; // Base64 content
};

export type CaseExecution = {
    id: string;
    title: Array<string>; // Keep for Cypress, may need generation for Playwright
    full_title: string;
    key: string;
    key_step: string;
    state: string;
    duration: number;
    code: string;
    error_display: string;
    error_frame: string;
    screenshot: Screenshot;
    test_start_at: string;
    create_at: string;
    update_at: string;
    cycle_id: string;
    spec_execution_id: string;
    known_fail_type?: string; // deprecated
    known_fail_ticket?: string;
    last_execution?: LastCaseExecution[];
    runner?: 'cypress' | 'playwright'; // Added runner type
    // Optional fields for richer Playwright error info
    error_stack?: string;
    error_snippet?: string;
};

export type CaseState = 'passed' | 'failed' | 'bug' | 'known' | 'flaky' | 'pending' | 'skipped';

export type LastCaseExecution = {
    id: string;
    full_title: string;
    state: CaseState;
    update_at: string;
    spec_execution_id: string;
    spec_file: string;
    error_display?: string;
    screenshot?: Screenshot;
    cycle_id: string;
    repo: string;
    branch: string;
    build: string;
    cycle_create_at: string;
    runner?: 'cypress' | 'playwright'; // Added runner type
};
