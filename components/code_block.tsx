import React from 'react';
import Highlight, { defaultProps } from 'prism-react-renderer';
import theme from 'prism-react-renderer/themes/vsLight';

type Props = {
    code: string;
    language: 'javascript' | 'bash';
};

function Codeblock({ code, language }: Props): React.ReactElement {
    return (
        <Highlight {...defaultProps} theme={theme} code={code} language={language}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre className={className + ' overflow-y-auto p-4 text-xs'} style={style}>
                    {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line, key: i })} className={className}>
                            {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token, key })} />
                            ))}
                        </div>
                    ))}
                </pre>
            )}
        </Highlight>
    );
}

export default Codeblock;
