import React from 'react';
import { useRouter } from 'next/router';

import Cycle from '@components/cycle';

function CyclePage(): React.ReactElement {
    const {
        asPath,
        query: { id: cycleId },
    } = useRouter();

    return <Cycle asPath={asPath} cycleId={cycleId?.toString()} />;
}

export default CyclePage;
