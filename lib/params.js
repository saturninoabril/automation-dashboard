const PAGE_DEFAULT = 1;
const PER_PAGE_DEFAULT = 20;

export function params(query = {}) {
    const page = parseInt(query.page, 10) || PAGE_DEFAULT;
    const perPage = parseInt(query.per_page, 10) || PER_PAGE_DEFAULT;

    return {
        limit: perPage,
        offset: (page - 1) * perPage,
        page,
        perPage,
    };
}
