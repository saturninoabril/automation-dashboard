import { KnownIssueData, LastCaseExecution } from '@types';

import { getCaseStateWithLastExecution, getCaseStateWithKnownIssue } from './server_utils';

test('getCaseStateWithKnownIssue', () => {
    const knownIssueData: KnownIssueData[] = [
        {
            spec_file: 'tests/file/to_spec.js',
            cases: [
                {
                    title: 'test title',
                    type: 'bug',
                    ticket: 'MM-1',
                },
            ],
        },
        {
            spec_file: 'tests/file/to_another_spec.js',
            cases: [
                {
                    title: 'another title',
                    type: 'known',
                },
            ],
        },
    ];

    const outOne = getCaseStateWithKnownIssue(
        knownIssueData,
        'tests/file/to_spec.js',
        'test title'
    );
    expect(outOne.state).toBe('bug');
    expect(outOne.ticket).toBe('MM-1');

    const outTwo = getCaseStateWithKnownIssue(
        knownIssueData,
        'tests/file/to_another_spec.js',
        'another title'
    );
    expect(outTwo.state).toBe('known');
    expect(outTwo.ticket).toBeNull();

    const outNoSpec = getCaseStateWithKnownIssue(
        knownIssueData,
        'tests/file/no_spec.js',
        'test title'
    );
    expect(outNoSpec.state).toBeNull();
    expect(outNoSpec.ticket).toBeNull();

    const outNoTitle = getCaseStateWithKnownIssue(
        knownIssueData,
        'tests/file/to_spec.js',
        'no title'
    );
    expect(outNoTitle.state).toBeNull();
    expect(outNoTitle.ticket).toBeNull();
});

test('getCaseStateWithLastExecution', () => {
    const lastCaseExecution: LastCaseExecution = {
        id: 'id',
        full_title: 'full_title',
        state: 'passed',
        update_at: 'update_at',
        spec_execution_id: 'spec_id',
        spec_file: 'spec_file',
        error_display: 'error_display',
        screenshot: { url: 'screenshot_url', taken_at: '2023-04-17', height: 5, width: 5 },
        cycle_id: 'cycle_id',
        repo: 'repo',
        branch: 'branch',
        build: 'build',
        cycle_create_at: 'cycle_create_at',
    };
    let lastCaseExecutions = [
        { ...lastCaseExecution },
        { ...lastCaseExecution },
        { ...lastCaseExecution },
    ];

    // should return undefined if all last X executions passed
    let state = getCaseStateWithLastExecution(lastCaseExecutions);
    expect(state).toBeUndefined;

    // should be flaky if only recent execution failed
    lastCaseExecutions[0].state = 'failed';
    state = getCaseStateWithLastExecution(lastCaseExecutions);
    expect(state).toBe('flaky');

    // should be known if last two executions failed
    lastCaseExecutions[1].state = 'failed';
    state = getCaseStateWithLastExecution(lastCaseExecutions);
    expect(state).toBe('known');

    // should be known if all executions failed
    lastCaseExecutions[2].state = 'failed';
    state = getCaseStateWithLastExecution(lastCaseExecutions);
    expect(state).toBe('known');

    // should be flaky if first execution passed and the rest failed
    lastCaseExecutions[0].state = 'passed';
    state = getCaseStateWithLastExecution(lastCaseExecutions);
    expect(state).toBe('flaky');

    // should be flaky if first execution passed and the rest failed with "failed", "bug", "known" or "flaky"
    lastCaseExecutions[1].state = 'bug';
    lastCaseExecutions[2].state = 'known';
    state = getCaseStateWithLastExecution(lastCaseExecutions);
    expect(state).toBe('flaky');

    // should be known if all executions failed
    lastCaseExecutions[0].state = 'flaky';
    state = getCaseStateWithLastExecution(lastCaseExecutions);
    expect(state).toBe('known');
});
