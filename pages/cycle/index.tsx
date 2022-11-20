import React from 'react';
import { useRouter } from 'next/router';

import Cycle from '@components/cycle';

function CyclePage(): React.ReactElement {
    let {
        asPath,
        query: { id: cycleId, repo, branch, build },
    } = useRouter();

    if (!(cycleId && repo && branch && build)) {
        branch = 'master';
    }

    return (
        <Cycle
            asPath={asPath}
            cycleId={cycleId?.toString()}
            repo={repo?.toString()}
            branch={branch?.toString()}
            build={build?.toString()}
        />
    );
}

export default CyclePage;
