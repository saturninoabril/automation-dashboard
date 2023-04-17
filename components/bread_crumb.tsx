import React from 'react';
import Link from 'next/link';

import { HomeIcon } from './icon';

type Props = {
    asPath?: string;
};

function Breadcrumb({ asPath = '' }: Props): React.ReactElement {
    const segments = asPath.split('/').splice(1);
    return (
        <div className="flex space-x-2 text-gray-500">
            <HomeIcon />
            {asPath &&
                asPath.length > 0 &&
                segments.map((path: string, i: number) => {
                    const link = segments.slice(0, i + 1).join('/');
                    return (
                        <span className="flex space-x-2" key={i}>
                            <span>{'/'}</span>
                            <Link href={`${link ? `/${link}` : ''}`} className="link no-underline">
                                {path}
                            </Link>
                        </span>
                    );
                })}
        </div>
    );
}

export default Breadcrumb;
