import axios from 'axios';
import { cleanHtmlText, safeIsoDate, sourceNameFromUrl } from '@/utilities/text';
import { NormalizedArticle } from '../normalize';

const CATEGORY_QUERY_MAP: Record<string, string> = {
    all: '오늘 주요 뉴스',
    business: '경제 금융 산업',
    entertainment: '연예 방송 영화',
    health: '건강 의료 보건',
    science: '과학 연구 우주',
    sports: '스포츠 경기',
    technology: '기술 IT 인공지능',
};

type NaverArticle = {
    title: string;
    originallink?: string;
    link: string;
    description: string;
    pubDate: string;
};

function normalizeArticles(articles: NaverArticle[]): NormalizedArticle[] {
    return articles
        .map((a) => {
            const url = a.originallink || a.link;

            return {
                author: null,
                title: cleanHtmlText(a.title),
                description: cleanHtmlText(a.description) || null,
                url,
                urlToImage: null,
                publishedAt: safeIsoDate(a.pubDate),
                content: null,
                source: {
                    name: sourceNameFromUrl(url, 'Naver News'),
                },
                provider: 'naver' as const,
            };
        })
        .filter((a) => a.title && a.url);
}

async function requestNaverNews(query: string, display = 30): Promise<NormalizedArticle[]> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('NAVER_CLIENT_ID or NAVER_CLIENT_SECRET not set');
    }

    const r = await axios.get('https://openapi.naver.com/v1/search/news.json', {
        headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret,
        },
        params: {
            query,
            display,
            sort: 'date',
        },
        timeout: 8000,
    });

    return normalizeArticles(r.data.items ?? []);
}

export async function fetchNaverNews(category: string): Promise<NormalizedArticle[]> {
    return requestNaverNews(CATEGORY_QUERY_MAP[category] ?? CATEGORY_QUERY_MAP.all);
}

export async function searchNaverNews(query: string): Promise<NormalizedArticle[]> {
    return requestNaverNews(query, 30);
}
