import Image from 'next/image';
import { useEffect, useState } from 'react';

const FALLBACK = '/images/news-placeholder.svg';

function isValidImageUrl(src: string | null | undefined): src is string {
    if (!src) return false;
    if (!src.trim()) return false;
    return /^https?:\/\//i.test(src);
}

interface Props {
    src: string | null;
    alt: string;
    sizes?: string;
}

export default function NewsImage({
    src,
    alt,
    sizes = '(max-width: 640px) 128px, 160px',
}: Props) {
    const initial = isValidImageUrl(src) ? src : FALLBACK;
    const [imgSrc, setImgSrc] = useState(initial);

    useEffect(() => {
        setImgSrc(initial);
    }, [initial]);

    return (
        <Image
            src={imgSrc}
            alt={imgSrc === FALLBACK ? `이미지 없음 — ${alt}` : alt}
            fill
            sizes={sizes}
            className="object-cover"
            unoptimized
            onError={() => setImgSrc(FALLBACK)}
        />
    );
}
