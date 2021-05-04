import React from 'react';

type Props = {
    perPage?: number;
};

function SpecListLoading({ perPage = 50 }: Props): React.ReactElement {
    return (
        <>
            {Array(perPage)
                .fill(null)
                .map((_, i) => (
                    <tr
                        key={i}
                        className={`table-row ${
                            i !== perPage - 1 ? ' border-b border-gray-200' : ''
                        }`}
                    >
                        <td className="leading-5">
                            <div className="flex content-start h-7">
                                <div className="ml-4 mt-2 h-3 w-3/5 bg-gray-100" />
                            </div>
                        </td>
                        <td className="leading-5">
                            <div className="flex content-start h-7">
                                <div className="ml-2 mt-2 h-3 w-3/5 bg-blue-100" />
                            </div>
                        </td>
                        <td className="leading-5">
                            <div className="ml-20 h-3 w-6 bg-gray-100" />
                        </td>
                        <td className="leading-5">
                            <div className="h-3 w-4 bg-gray-100" />
                        </td>
                    </tr>
                ))}
        </>
    );
}

export default SpecListLoading;
