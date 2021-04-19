export function hasPrevious({ page }) {
    return page > 1;
}

export function hasNext({ total, perPage, page }) {
    return page < pageCount({ total, perPage });
}

export function pageCount({ total, perPage }) {
    return Math.ceil(total / perPage);
}
