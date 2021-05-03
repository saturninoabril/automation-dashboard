import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Cycle } from '../types';

dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

const stateCutOff = [
    { cutOff: 100, color: 'green-700' },
    { cutOff: 98, color: 'cyan-600' },
    { cutOff: 95, color: 'amber-600' },
    { cutOff: 0, color: 'red-600' },
];

export function getCycleSummary(cycle: Cycle) {
    const { pass, fail, pending, skipped } = cycle;

    const totalCases = pass + fail + pending + skipped;
    const passingRate = totalCases ? (pass / totalCases) * 100 : 0;

    let color;
    for (let i = 0; i < stateCutOff.length; i++) {
        if (passingRate >= stateCutOff[i].cutOff) {
            color = stateCutOff[i].color;
            break;
        }
    }

    return { totalCases, passingRate: passingRate.toFixed(2), color };
}

/**
 * Check if it reached timeout period given the start date/time and duration
 * @param startAt in date string
 * @param duration in milliseconds
 * @returns boolean - true when it reached timeout, otherwise false
 */
export function isTimeout(startAt: string, durationInMs: number) {
    if (!startAt || !durationInMs) {
        return false;
    }

    const now = dayjs();
    const start = dayjs(startAt);

    return now.subtract(dayjs.duration(durationInMs)) > start;
}

export function formatDate(startAt: string) {
    if (!startAt) {
        return '';
    }

    const now = dayjs();
    const start = dayjs(startAt);
    const maxDays = 7;

    if (now.subtract(maxDays, 'd') < start) {
        return start.fromNow();
    }

    return start.format('ddd, LL');
}

export function formatDuration({
    startAt,
    updateAt,
    durationInMs,
    format = 'H:mm:ss',
}: {
    startAt?: string;
    updateAt?: string;
    durationInMs?: number;
    format?: string;
}) {
    if (startAt && updateAt) {
        const start = dayjs(startAt);
        const update = dayjs(updateAt);

        return dayjs.duration(update.diff(start)).format(format);
    }

    if (durationInMs) {
        return dayjs.duration(durationInMs).format(format);
    }

    return '';
}
