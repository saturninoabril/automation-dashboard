import { KnownIssueData } from '@types';

import { knownIssueDataSchema } from './known_issue';

test('knownIssueDataSchema', () => {
    const input: KnownIssueData = {
        spec_file: 'tests/file/to_spec.js',
        cases: [
            {
                title: 'test title',
                type: 'known',
            },
        ],
    };

    // valid data should not return an error
    let { error } = knownIssueDataSchema.validate(input);
    expect(error).toBeUndefined();

    input.cases[0].type = 'flaky';
    ({ error } = knownIssueDataSchema.validate(input));
    expect(error).toBeUndefined();

    // invalid type should return an error
    // @ts-ignore
    input.cases[0].type = 'invalid_type';
    ({ error } = knownIssueDataSchema.validate(input));
    expect(error?.message).toBe('"cases[0].type" must be one of [bug, known, flaky]');

    // bug type requires ticket field
    input.cases[0].type = 'bug';
    ({ error } = knownIssueDataSchema.validate(input));
    expect(error?.message).toBe('"cases[0].ticket" is required');

    // invalid ticket should return an error
    input.cases[0] = { ...input.cases[0], ticket: 'MM-invalid' };
    ({ error } = knownIssueDataSchema.validate(input));
    expect(error?.message).toBe(
        '"cases[0].ticket" with value "MM-invalid" fails to match the required pattern: /^(MM-)\\d+/'
    );

    // valid data should not return an error
    input.cases[0] = { ...input.cases[0], ticket: 'MM-1' };
    ({ error } = knownIssueDataSchema.validate(input));
    expect(error).toBeUndefined();
});
