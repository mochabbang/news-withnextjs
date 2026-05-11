const HTML_ENTITY_MAP: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    '#39': "'",
};

export function cleanHtmlText(value: string | null | undefined): string {
    if (!value) return '';

    return value
        .replace(/<[^>]*>/g, '')
        .replace(/&([^;]+);/g, (_, entity: string) => {
            if (entity.startsWith('#x')) {
                return String.fromCharCode(parseInt(entity.slice(2), 16));
            }
            if (entity.startsWith('#')) {
                return String.fromCharCode(parseInt(entity.slice(1), 10));
            }
            return HTML_ENTITY_MAP[entity] ?? `&${entity};`;
        })
        .replace(/\s+/g, ' ')
        .trim();
}

export function safeIsoDate(value: string | null | undefined): string {
    const parsed = value ? new Date(value) : new Date();
    if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
    return parsed.toISOString();
}

export function sourceNameFromUrl(value: string | null | undefined, fallback: string) {
    if (!value) return fallback;

    try {
        return new URL(value).hostname.replace(/^www\./, '');
    } catch {
        return fallback;
    }
}
