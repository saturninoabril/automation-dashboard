export type KnownIssue = {
    id: string;
    cycle_id: string;
    hash: string;
    data: KnownIssueData[];
    create_at: string;
};

export type KnownIssueData = {
    spec_file: string;
    cases: KnownIssueCase[];
};

type KnownIssueType = 'known' | 'flaky' | 'bug';

export type KnownIssueCase = {
    title: string;
    type: KnownIssueType;
    ticket?: string;
};
