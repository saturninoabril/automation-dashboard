import React from 'react';
import App from 'next/app';
import { SessionProvider } from 'next-auth/react';

import type { AppProps } from 'next/app';
import type { Session } from 'next-auth';

import '@components/app.css';

export default function AutomationDashboardApp({
    Component,
    pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
    return (
        <SessionProvider session={session}>
            <div className="h-screen">
                <Component {...pageProps} />
            </div>
        </SessionProvider>
    );
}
