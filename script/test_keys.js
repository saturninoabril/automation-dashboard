const fetch = require('node-fetch');

main();

async function main() {
    console.log('\n\n------ January Baseline Performance ------');

    const UNSTABLE_JAN_BASELINE =
        'https://mm-cypress-report.s3.amazonaws.com/2602-master-e20-unstable-mattermost-enterprise-edition:master/all.json';
    const PROD_JAN_BASELINE =
        'https://mm-cypress-report.s3.amazonaws.com/2580-master-e20-prod-mattermost-enterprise-edition:master/all.json';

    await computeBaselinePerformance({
        prodJsonUrl: PROD_JAN_BASELINE,
        unstableJsonUrl: UNSTABLE_JAN_BASELINE,
        date: 'January',
    });

    console.log('\n\n------ March 31 Baseline Performance ------');

    const UNSTABLE_MARCH_31_BASELINE =
        'https://mm-cypress-report.s3.amazonaws.com/4012-master-e20-unstable-mattermost-enterprise-edition:master/all.json';
    const PROD_MARCH_31_BASELINE =
        'https://mm-cypress-report.s3.amazonaws.com/4044-webapp-pr-7798-mattermost-enterprise-edition:a2cd8ab/all.json';
    await computeBaselinePerformance({
        prodJsonUrl: PROD_MARCH_31_BASELINE,
        unstableJsonUrl: UNSTABLE_MARCH_31_BASELINE,
        date: 'March 31',
    });

    console.log('\n\n------ As of April 27 Current Performance ------');

    // Note: Change these values depending on target Cycle IDs of prod and unstable
    // April 27 Prod tests - see BASE_API_URL/executions/cases?cycle_id=913e4789-9ae5-4f53-8d1e-1f850bed0734
    const PROD_CYCLE_ID = '913e4789-9ae5-4f53-8d1e-1f850bed0734';

    // April 27 Unstable tests - see BASE_API_URL/executions/cases?cycle_id=a89659eb-6c61-4e70-b08f-38c6ae3c17f9
    const UNSTABLE_CYCLE_ID = 'a89659eb-6c61-4e70-b08f-38c6ae3c17f9';
    await computeCurrentPerformance({
        prodCycleId: PROD_CYCLE_ID,
        unstableCycleId: UNSTABLE_CYCLE_ID,
    });
}

async function getCases({ cycleId, url, description }) {
    let header;
    let totalCases;
    if (url) {
        const res = await fetch(url);
        const fullReport = await res.json();

        totalCases = getAllTests(fullReport.results);
        header = description;
    } else if (cycleId) {
        const BASE_API_URL = 'https://automation-dashboard.vercel.app/api';

        const cycleRes = await fetch(`${BASE_API_URL}/cycles/${cycleId}`);
        const cycle = await cycleRes.json();

        const caseRes = await fetch(`${BASE_API_URL}/executions/cases?cycle_id=${cycleId}`);
        totalCases = await caseRes.json();
        header = `${cycle[0].branch}: ${cycle[0].start_at.split('T')[0]}`;
    }

    const withKey = getCasesWithKey(totalCases, Boolean(url));
    const groupByKey = groupCasesWithKey(totalCases, Boolean(url));

    console.log(header);
    console.log(`- ${totalCases.length} total cases`);
    console.log(`- ${withKey.length} test cases with key`);
    console.log(`- ${Object.keys(groupByKey).length} unique test keys`);

    return { totalCases, withKey, groupByKey };
}

function getAllTests(results) {
    const tests = [];
    results.forEach((result) => {
        result.tests.forEach((test) => {
            tests.push(test);
        });

        if (result.suites.length > 0) {
            getAllTests(result.suites).forEach((test) => tests.push(test));
        }
    });

    return tests;
}

function getCasesWithKey(cases, fromJsonUrl = false) {
    return cases
        .filter((item) =>
            /^(MM-T)\w+/g.test(fromJsonUrl ? item.title : item.title[item.title.length - 1])
        )
        .map((item) => {
            return {
                title: fromJsonUrl ? item.title : item.full_title,
                duration: item.duration,
                state: item.state,
                pass: fromJsonUrl ? item.pass : item.state === 'passed',
                fail: fromJsonUrl ? item.fail : item.state === 'failed',
                pending: fromJsonUrl ? item.pending : item.state === 'pending',
            };
        });
}

function groupCasesWithKey(cases = [], fromJsonUrl = false) {
    console.log('');
    return getCasesWithKey(cases, fromJsonUrl).reduce((acc, item) => {
        // Extract the key to exactly match with "MM-T[0-9]+"
        const key = item.title.match(/(MM-T\d+)/)[0];

        if (acc[key]) {
            acc[key].push(item);
        } else {
            acc[key] = [item];
        }

        return acc;
    }, {});
}

async function computeBaselinePerformance({ prodJsonUrl, unstableJsonUrl, date }) {
    const prod = await getCases({ url: prodJsonUrl, description: `Prod tests ${date}` });
    const unstable = await getCases({
        url: unstableJsonUrl,
        description: `Unstable tests ${date}`,
    });

    showSummary(prod, unstable);
}

async function computeCurrentPerformance({ prodCycleId, unstableCycleId }) {
    const prod = await getCases({ cycleId: prodCycleId });
    const unstable = await getCases({ cycleId: unstableCycleId });

    showSummary(prod, unstable);
}

function showSummary(prod = [], unstable = []) {
    const prodTotal = prod.totalCases.length;
    const prodWithKey = prod.withKey.length;

    const unstableTotal = unstable.totalCases.length;
    const unstableWithKey = unstable.withKey.length;

    const totalCases = prodTotal + unstableTotal;
    const totalWithKeys = prodWithKey + unstableWithKey;

    const prodCasesRate = (prodTotal / totalCases) * 100;
    const reportedCasesRate = (totalWithKeys / totalCases) * 100;
    const prodHitRate = (prodWithKey / prodTotal) * 100;
    const unstableHitRate = (unstableWithKey / unstableTotal) * 100;
    const averagePerformance = (prodCasesRate + reportedCasesRate) / 2;

    console.log('\nSummary:');

    console.log(
        `- ${prodCasesRate.toFixed(2)}% (${prodTotal} / ${totalCases}) promoted to production`
    );

    // To be accurate in the future, this should compare against the actual saved executions at Zephyr.
    // It will be done soon once the full reporting is processed from the Dashboard instead of
    // relying in CircleCI artifacts where artifacts are prone to getting wiped out when
    // CircleCI's machine crashed.
    // Percent error might be approximately -3% due to error saving into Zephyr (mismatch steps, etc)
    // but not due to missing test keys.
    console.log(
        `- ${reportedCasesRate.toFixed(2)}% (${totalWithKeys} / ${totalCases}) reported to Zephyr`
    );
    console.log(`  -> ${prodHitRate.toFixed(2)}% (${prodWithKey} / ${prodTotal}) in prod`);
    console.log(
        `  -> ${unstableHitRate.toFixed(2)}% (${unstableWithKey} / ${unstableTotal}) in unstable`
    );
    console.log(`- ${averagePerformance.toFixed(2)}% average performance`);
}
