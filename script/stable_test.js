const fetch = require('node-fetch');
var intersectionBy = require('lodash.intersectionby');

main();

async function main() {
    // Changed to target build IDs
    const buildIds = [4742, 4728, 4693, 4670, 4642];

    const stableTests = [];

    for (const buildId of buildIds) {
        const { stable } = await getCases(getUrl(buildId));
        stableTests.push(stable);
    }

    const finalStableTests = intersectionBy(...stableTests, 'file');
    finalStableTests.forEach((test) => console.log('Stable -->', test));
}

function getUrl(buildId) {
    return `https://mm-cypress-report.s3.amazonaws.com/${buildId}-master-e20-unstable-mattermost-enterprise-edition:master/all.json`;
}

async function getCases(url) {
    const res = await fetch(url);
    const report = await res.json();

    const tests = getAllTests(report.results).reduce((acc, curr) => {
        if (acc[curr.specFile]) {
            if (acc[curr.specFile][curr.state]) {
                acc[curr.specFile][curr.state].push(curr.fullTitle);
            } else {
                acc[curr.specFile][curr.state] = [curr.fullTitle];
            }
        } else {
            acc[curr.specFile] = { [curr.state]: [curr.fullTitle] };
        }

        return acc;
    }, {});

    const stable = [];
    Object.entries(tests).forEach(([file, value]) => {
        if (Object.keys(value).length === 1 && Object.keys(value)[0] === 'passed') {
            stable.push({ file, value });
        }
    });

    return { report, tests, stable };
}

function getAllTests(results, specFile) {
    const tests = [];
    results.forEach((result) => {
        result.tests.forEach((test) => {
            tests.push({ ...test, specFile: specFile || result.file });
        });

        if (result.suites.length > 0) {
            getAllTests(result.suites, specFile || result.file).forEach((test) =>
                tests.push({ ...test, specFile: specFile || result.file })
            );
        }
    });

    return tests;
}
