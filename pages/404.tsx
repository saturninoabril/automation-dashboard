import React from 'react';

function Custom404(): React.ReactElement {
    return (
        <div className="h-screen">
            <div className="container">
                <div>
                    <h1 className="title">404</h1>
                    <div className="subtitle">
                        <h2 className="description">
                            Don't panic! We're on it! Page on going construction.
                        </h2>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .container {
                    color: #000;
                    background: #fff;
                    font-family: -apple-system, BlinkMacSystemFont, Roboto, 'Segoe UI', 'Fira Sans',
                        Avenir, 'Helvetica Neue', 'Lucida Grande', sans-serif;
                    height: 100vh;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .title {
                    display: inline-block;
                    border-right: 1px solid rgba(0, 0, 0, 0.3);
                    margin: 0;
                    margin-right: 20px;
                    padding: 10px 23px 10px 0;
                    font-size: 24px;
                    font-weight: 500;
                    vertical-align: top;
                }

                .subtitle {
                    display: inline-block;
                    text-align: left;
                    line-height: 49px;
                    height: 49px;
                    vertical-align: middle;
                }

                .description {
                    font-size: 14px;
                    font-weight: normal;
                    line-height: inherit;
                    margin: 0;
                    padding: 0;
                }
            `}</style>
        </div>
    );
}

export default Custom404;
