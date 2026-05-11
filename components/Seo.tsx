import Head from 'next/head';

interface Props {
    title?: string;
    description?: string;
    image?: string;
}

export default function Seo({ title, description, image }: Props) {
    const t = title ? `${title} | 뉴스` : '뉴스 — 한국 헤드라인';
    const d = description ?? '실시간 한국 최신 뉴스 헤드라인';
    const img = image ?? '/images/news-placeholder.svg';

    return (
        <Head>
            <title>{t}</title>
            <meta name="description" content={d} />
            <meta property="og:title" content={t} />
            <meta property="og:description" content={d} />
            <meta property="og:image" content={img} />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
        </Head>
    );
}
