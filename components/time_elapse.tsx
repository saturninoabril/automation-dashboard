import React, { useEffect, useState } from 'react';

import { formatDuration, getTimeElapse, isWithinTimeDuration } from '../lib/utils';

type Props = {
    className?: string;
    isDone: boolean;
    lastUpdate: string;
    start: string;
    timeFormat?: string;
};

function TimeElapse({
    start,
    lastUpdate,
    isDone,
    className,
    timeFormat,
}: Props): React.ReactElement {
    const [currentTime, setCurrentTime] = useState<number>(0);
    const initialTimeElapse = formatDuration({
        startAt: start,
        updateAt: lastUpdate,
        format: timeFormat,
    });
    const [timeElapse, setTimeElapse] = useState<string>(
        !start || !lastUpdate ? '' : initialTimeElapse
    );
    useEffect(() => {
        const timer = setTimeout(() => {
            const done = isDone || !isWithinTimeDuration(lastUpdate, { m: 10 });
            if (!done) {
                setCurrentTime(Date.now());
                setTimeElapse(getTimeElapse({ startAt: start, format: timeFormat }));
            } else {
                setTimeElapse(
                    formatDuration({ startAt: start, updateAt: lastUpdate, format: timeFormat })
                );
            }
        }, 750);

        return () => clearTimeout(timer);
    }, [start, lastUpdate, currentTime, isDone, timeFormat]);

    return <span className={className}>{timeElapse}</span>;
}

export default TimeElapse;
