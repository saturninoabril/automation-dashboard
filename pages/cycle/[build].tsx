import React from 'react';
import { useRouter } from 'next/router';

import Cycle from '@components/cycle';

function CyclePage(): React.ReactElement {
    const {
        asPath,
        query: { build },
    } = useRouter();

    return <Cycle asPath={asPath} build={build?.toString()} />;
}

export default CyclePage;
