import React from 'react';
import Head from 'next/head';

import homeStyles from '../styles/home.module.css';
import '../styles/home.module.css';

export default function Home() {
    return (
        <div className={homeStyles.container}>
            <Head>
                <title>Automation Dashboard</title>
            </Head>

            <main className={homeStyles.main}>
                <h1 className={homeStyles.title}>
                    Welcome to{' '}
                    <a href="https://github.com/saturninoabril/automation-dashboard">
                        Automation Dashboard!
                    </a>
                </h1>
            </main>

            <footer className={homeStyles.footer}>
                <a
                    href="https://github.com/saturninoabril/automation-dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Powered by Automation Dashboard
                </a>
            </footer>
        </div>
    );
}
