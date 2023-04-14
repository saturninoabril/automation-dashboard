export type KnownIssueSchema = {
    id: string;
    cycle_id: string;
    hash: string;
    data: KnownIssue[];
    create_at: string;
};

export type KnownIssue = {
    spec_file: string;
    cases: KnownIssueCase[];
};

type KnownIssueType = 'known' | 'flaky' | 'bug' | 'require_verification';

export type KnownIssueCase = {
    title: string;
    type: KnownIssueType;
    ticket?: string;
};

export type KnownIssueObj = Record<
    string,
    { spec_file: string; casesObj: Record<string, KnownIssueCase> }
>;

export type KnownIssueCaseObj = Record<
    string,
    {
        title: string;
        type: KnownIssueType;
        ticket?: string;
    }
>;
