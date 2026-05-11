const rtf = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' });

const UNITS: [number, Intl.RelativeTimeFormatUnit, number][] = [
    [60, 'second', 1],
    [3600, 'minute', 60],
    [86400, 'hour', 3600],
    [604800, 'day', 86400],
    [2592000, 'week', 604800],
    [31536000, 'month', 2592000],
];

export function formatRelative(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    for (const [limit, unit, divisor] of UNITS) {
        if (diff < limit) {
            return rtf.format(-Math.round(diff / divisor), unit);
        }
    }
    return rtf.format(-Math.round(diff / 31536000), 'year');
}
