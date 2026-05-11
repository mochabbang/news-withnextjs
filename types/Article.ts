import { Source } from './Source';

export type ArticleProvider =
    | 'newsapi'
    | 'naver'
    | 'gnews'
    | 'newsdata'
    | 'currents'
    | 'koreanrss';

export type Article = {
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
    source: Source;
    provider?: ArticleProvider;
    originalTitle?: string;
    originalDescription?: string | null;
    translated?: boolean;
};
