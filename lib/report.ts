import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { getCycleSummary } from '@lib/common_utils';
import { gitlabPipelineUrl } from '@lib/constant';
import { Cycle } from '@types';

dayjs.extend(duration);
dayjs.extend(localizedFormat);

export function generateTestReport(
    cycle: Cycle,
    title: string,
    pipelineID: string,
    host: string,
    testCycleKey: string,
    serverType: string,
    mmEnv: string
) {
    const { TEST_CYCLE_LINK_PREFIX } = process.env;
    const {
        pass,
        specs_registered,
        cypress_version,
        browser_name,
        browser_version,
        headless,
        os_name,
        os_version,
        node_version,
        start_at: startAt,
        end_at: endAt,
        update_at: updateAt,
    } = cycle;

    const { totalCases, passingRate, hexColor } = getCycleSummary(cycle);

    const runnerEnvValue = `cypress@${cypress_version} | node@${node_version} | ${browser_name}@${browser_version}${
        headless ? ' (headless)' : ''
    } | ${os_name}@${os_version}`;

    // prettier-ignore
    const quickSummary = `${passingRate}% (${pass}/${totalCases}) in ${specs_registered} suites`;

    let testCycleLink = '';
    if (testCycleKey) {
        testCycleLink = testCycleKey
            ? `| [Recorded test executions](${TEST_CYCLE_LINK_PREFIX}${testCycleKey})`
            : '';
    }

    const gitlabLink = `[GitLab pipeline](${gitlabPipelineUrl}/${pipelineID})`;
    const dashboardLink = `[Test dashboard](${host}/cycle/${pipelineID})`;
    const serverTypeText = serverType ? '\nTest server: ' + serverType : '';
    const mmEnvText = mmEnv ? '\nTest server override: ' + mmEnv : '';

    const start = dayjs(startAt);
    const end = endAt ? dayjs(endAt) : dayjs(updateAt);
    const statsDuration = dayjs.duration(end.diff(start)).format('H:mm:ss');

    return {
        username: 'Cypress UI Test',
        icon_url: 'https://mattermost.com/wp-content/uploads/2022/02/icon_WS.png',
        attachments: [
            {
                color: hexColor,
                author_name: 'Webapp End-to-end Testing',
                author_icon: 'https://mattermost.com/wp-content/uploads/2022/02/icon_WS.png',
                author_link: 'https://www.mattermost.com/',
                title,
                text: `${quickSummary} | ${statsDuration} ${testCycleLink}\n${runnerEnvValue}\n${`${gitlabLink} | ${dashboardLink}`}${serverTypeText}${mmEnvText}`,
            },
        ],
    };
}
