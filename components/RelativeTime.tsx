import { useEffect, useState } from 'react';
import { formatRelative } from '@/utilities/formatDate';

function deterministicFallback(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10).replace(/-/g, '.');
}

type Props = {
    iso: string;
    className?: string;
};

export default function RelativeTime({ iso, className }: Props) {
    const [text, setText] = useState(() => deterministicFallback(iso));

    useEffect(() => {
        const update = () => setText(formatRelative(iso));
        update();
        const id = setInterval(update, 60_000);
        return () => clearInterval(id);
    }, [iso]);

    return (
        <time dateTime={iso} className={className}>
            {text}
        </time>
    );
}
