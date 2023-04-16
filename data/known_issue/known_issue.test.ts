import { KnownIssueData } from '@types';
import { knownIssueDataSchema } from '../../lib/schema/known_issue';

import onpremEnt from './onprem-ent.json';
import cloudEnt from './cloud-ent.json';

test('onprem-ent.json', () => {
    const data = onpremEnt as KnownIssueData[];
    data.forEach((d) => {
        const { error } = knownIssueDataSchema.validate(d);
        if (error) {
            console.log(error);
        }
        expect(d.spec_file).toBeTruthy();
        expect(error).toBeUndefined();
    });
});

test('cloud-ent.json', () => {
    const data = cloudEnt as KnownIssueData[];
    data.forEach((d) => {
        const { error } = knownIssueDataSchema.validate(d);
        if (error) {
            console.log(error);
        }
        expect(d.spec_file).toBeTruthy();
        expect(error).toBeUndefined();
    });
});
