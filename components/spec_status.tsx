import React from 'react';

import { ClipboardIcon, ClockIcon } from '@components/icon';
import Spinner from '@components/spinner';
import TimeElapse from '@components/time_elapse';
import { isWithinTimeDuration } from '@lib/client_utils';
import { SpecExecution } from '@types';
import { stateDone, stateStarted } from '@lib/constant';

type Props = {
    spec: SpecExecution;
};

function SpecStatus({ spec }: Props): React.ReactElement {
    const { duration, state, update_at: updateAt } = spec;

    if (state === stateDone) {
        const threeMinutes = 3 * 60 * 1000;
        return (
            <span
                className={`flex space-x-1 ${
                    duration > threeMinutes ? 'text-amber-700' : 'text-gray-400'
                }`}
            >
                <ClockIcon />
                <TimeElapse
                    start={spec.start_at}
                    lastUpdate={spec.update_at}
                    isDone={spec.state === stateDone}
                    timeFormat="m:ss"
                />
            </span>
        );
    }

    if (state === stateStarted && !isWithinTimeDuration(updateAt, { m: 10 })) {
        return (
            <span className="text-red-400">
                <ClipboardIcon />
            </span>
        );
    }

    if (state === stateStarted) {
        return (
            <span className="flex space-x-1">
                <Spinner />
                <TimeElapse
                    start={spec.start_at}
                    lastUpdate={spec.update_at}
                    isDone={spec.state === stateDone}
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
