export default function imageLoader({
    src,
    width,
    quality,
}: {
    src: string;
    width: number;
    quality: number;
}) {
    return `https://example.com/${src}?w=${width}&q=${quality || 75}`;
}
