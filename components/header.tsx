import React from 'react';
import Link from 'next/link';

type Props = {
    subtitle?: string;
    widerContent?: boolean;
};

function Header({ subtitle, widerContent }: Props): React.ReactElement {
    return (
        <div className="relative py-6 z-10">
            <nav
                className={`mx-auto flex items-center justify-between ${
                    widerContent ? 'max-w-screen-xl' : 'max-w-screen-lg lg:p-0'
                }`}
            >
                <Link href="/">
                    <a className="flex items-center">
                        <div className="flex flex-col justify-center">
                            <div className="font-bold text-gray-900 leading-tight text-2xl sm:text-3xl tracking-tight">
                                Test Automation Dashboard
                            </div>
                            {subtitle && (
                                <div className="font-normal text-sm sm:text-lg leading-tight tracking-tight">
                                    {subtitle}
                                </div>
                            )}
                        </div>
                    </a>
                </Link>
            </nav>
        </div>
    );
}

export default Header;
