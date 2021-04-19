export type Screenshot = {
    url: string;
    taken_at: string;
    height: number;
    width: number;
};

export type CaseExecution = {
    id: string;
    title: Array<string>;
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
};
