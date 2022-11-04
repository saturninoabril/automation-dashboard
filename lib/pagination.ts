export function hasPrevious(page: number) {
    return page > 1;
}

export function hasNext(total: number, perPage: number, page: number) {
    return page < pageCount(total, perPage);
}

export function pageCount(total: number, perPage: number) {
    return Math.ceil(total / perPage);
}
