import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';

type Props = {
    subtitle?: string;
    widerContent?: boolean;
};

function Header({ subtitle, widerContent }: Props): React.ReactElement {
    const out = useSession();
    const session = out.data;
    const loading = out.status === 'loading';
    console.log('session', session, loading);

    return (
        <div className="relative py-6 z-10">
            <nav
                className={`mx-auto flex items-center justify-between ${
                    widerContent ? 'max-w-screen-xl' : 'max-w-screen-lg lg:p-0'
                }`}
            >
                <Link href="/" className="flex items-center no-underline" passHref>
                    <div className="flex flex-col justify-center">
                        <div className="font-bold text-gray-900 leading-tight text-2xl sm:text-3xl tracking-tight">
                            {'Test Automation Dashboard'}
                        </div>
                        {subtitle && (
                            <div className="font-normal text-sm sm:text-lg leading-tight tracking-tight">
                                {subtitle}
                            </div>
                        )}
                    </div>
                </Link>
            </nav>
            <noscript>
                <style>{`.nojs-show { opacity: 1; top: 0; }`}</style>
            </noscript>
            <div>
                <p className={`nojs-show ${!session && loading ? 'loading' : 'loaded'}`}>
                    {!session && (
                        <>
                            <span>You are not signed in</span>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    signIn('github');
                                }}
                            >
                                {'Sign in with GitHub'}
                            </a>
                        </>
                    )}
                    {session?.user && (
                        <>
                            {session.user.image && (
                                <>
                                    <span
                                        className="h-5 w-5"
                                        style={{ backgroundImage: `url('${session.user.image}')` }}
                                    />
                                    <Image
                                        src={session.user.image}
                                        alt={`Avatar of ${session.user.name}`}
                                        height={30}
                                        width={30}
                                    />
                                </>
                            )}
                            <span>
                                <small>Signed in as</small>
                                <br />
                                <strong>{session.user.email ?? session.user.name}</strong>
                            </span>
                            <a
                                href={'/api/auth/signout'}
                                onClick={(e) => {
                                    e.preventDefault();
                                    signOut();
                                }}
                            >
                                Sign out
                            </a>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}

export default Header;
