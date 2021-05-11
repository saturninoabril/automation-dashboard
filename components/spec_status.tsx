import React from 'react';

import { ClipboardIcon, ClockIcon } from '../components/icon';
import Spinner from '../components/spinner';
import TimeElapse from '../components/time_elapse';
import { isWithinTimeDuration } from '../lib/utils';
import { SpecExecution } from '../types';

type Props = {
    spec: SpecExecution;
};

function SpecStatus({ spec }: Props): React.ReactElement {
    const { duration, state, update_at: updateAt } = spec;

    if (state === 'done') {
        const threeMinutes = 3 * 60 * 1000;
        return (
            <span
                className={`flex space-x-1 ${
                    duration > threeMinutes ? 'text-amber-500' : 'text-gray-400'
                }`}
            >
                <ClockIcon />
                <TimeElapse
                    start={spec.start_at}
                    lastUpdate={spec.update_at}
                    isDone={spec.state === 'done'}
                    timeFormat="m:ss"
                />
            </span>
        );
    }

    if (state === 'started' && !isWithinTimeDuration(updateAt, { m: 10 })) {
        return (
            <span className="text-red-400">
                <ClipboardIcon />
            </span>
        );
    }

    if (state === 'started') {
        return (
            <span className="flex space-x-1">
                <Spinner />
                <TimeElapse
                    start={spec.start_at}
                    lastUpdate={spec.update_at}
                    isDone={spec.state === 'done'}
                    timeFormat="m:ss"
                />
            </span>
        );
    }

    return (
        <span className="text-gray-400">
            <ClipboardIcon />
        </span>
    );
}

export default SpecStatus;
