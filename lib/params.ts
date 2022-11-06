const PAGE_DEFAULT = 1;
const PER_PAGE_DEFAULT = 20;

export function params(query: Partial<Record<string, string | string[]>> = {}) {
    const page = query.page ? parseInt(query.page.toString(), 10) || PAGE_DEFAULT : PAGE_DEFAULT;
    const perPage = query.per_page
        ? parseInt(query.per_page.toString(), 10) || PER_PAGE_DEFAULT
        : PER_PAGE_DEFAULT;

    return {
        limit: perPage,
        offset: (page - 1) * perPage,
        page,
        perPage,
    };
}
