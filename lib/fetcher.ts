// @ts-nocheck
export default async function fetcher(...args) {
    const res = await fetch(...args);
    const data = await res.json();

    return data;
}
