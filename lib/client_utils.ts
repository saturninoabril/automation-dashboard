import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

import { CaseState, SpecExecution, SpecExecutionState } from '@types';
import { stateDone, stateOnQueue, stateStarted, stateTimedOut } from './constant';

dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

/**
 * Check if it reached timeout period given the start date/time and duration
 * @param startAt in date string
 * @param duration in milliseconds
 * @returns boolean - true when it reached timeout, otherwise false
 */
export function isWithinTimeDuration(startAt: string, duration: Record<string, number>) {
    if (!startAt || !duration) {
        return false;
    }

    const now = dayjs();
    const start = dayjs(startAt);

    return start.add(dayjs.duration(duration)) > now;
}

export function formatDate(startAt: string) {
    if (!startAt) {
        return '';
    }

    const now = dayjs();
    const start = dayjs(startAt);
    const maxDays = 1;

    if (now.subtract(maxDays, 'd') < start) {
        return start.fromNow();
    }

    return start.format('lll');
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

    if (updateAt) {
        const now = dayjs();
        const update = dayjs(updateAt);

        return dayjs.duration(now.diff(update)).format(format);
    }

    if (durationInMs) {
        return dayjs.duration(durationInMs).format(format);
    }

    return '';
}

export function getTimeElapse({
    startAt,
    format = 'H:mm:ss',
}: {
    startAt: string;
    format?: string;
}) {
    const now = dayjs();
    const started = dayjs(startAt);

    return dayjs.duration(now.diff(started)).format(format);
}

function getSpecGroup(spec: SpecExecution) {
    const { update_at: updateAt } = spec;

    switch (spec.state) {
        case stateDone: {
            const { pass, fail, pending, skipped, known_fail } = spec;
            const total = pass + fail + pending + skipped + known_fail;
            if (total === pass) {
                return 'passed';
            } else if (fail === 0 && known_fail > 0) {
                return 'known_fail';
            } else {
                return 'failed';
            }
        }
        case stateStarted: {
            if (!isWithinTimeDuration(updateAt, { m: 10 })) {
                return stateTimedOut;
            }
            return stateStarted;
        }
        default:
            return stateOnQueue;
    }
}

export function getSpecsByGroup(specsExecution: SpecExecution[] = [], group: SpecExecutionState) {
    if (!group) {
        return null;
    }

    return specsExecution.filter((spec) => getSpecGroup(spec) === group);
}

export function getSpecsByState(specsExecution: SpecExecution[] = [], state: CaseState) {
    if (!state) {
        return null;
    }

    return specsExecution.filter((spec) => Boolean(spec[state]));
}

export function getSpecsGroupByCount(specsExecution: SpecExecution[] = []) {
    return specsExecution.reduce(
        // prettier-ignore
        (acc: Record<SpecExecutionState, number>, spec) => { // eslint-disable-line
      const group = getSpecGroup(spec);
      if (acc[group]) {
        acc[group] += 1;
      } else {
        acc[group] = 1;
      }

      return acc;
    },
        { passed: 0, failed: 0, known_fail: 0, started: 0, timed_out: 0, on_queue: 0 }
    );
}
