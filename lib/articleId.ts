function toBase64Url(buf: Buffer): string {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(id: string): Buffer | null {
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
    const padded = id.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    try {
        return Buffer.from(padded + pad, 'base64');
    } catch {
        return null;
    }
}

export function encodeArticleId(url: string): string {
    return toBase64Url(Buffer.from(url, 'utf8'));
}

export function decodeArticleId(id: string): string | null {
    if (!id) return null;
    const buf = fromBase64Url(id);
    if (!buf) return null;
    const url = buf.toString('utf8');
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
        return url;
    } catch {
        return null;
    }
}
