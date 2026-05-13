import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useCallback, useState } from 'react';
import { Article } from '@/types/Article';
import { NewsTopHeadLine } from '@/types/NewsTopHeadLine';
import { getNews } from '@/apis/NewsApis';
import Categories from '@/components/Categories';
import CountrySelector from '@/components/CountrySelector';
import NewsList from '@/components/NewsList';
import Seo from '@/components/Seo';
import { articlesToTopHeadline, getTopArticles } from '@/apis/newsService';

export default function Home({
    newsTopHeadLines,
}: InferGetStaticPropsType<typeof getStaticProps>) {
    const [category, setCategory] = useState('all');
    const [country, setCountry] = useState('kr');
    const [articles, setArticles] = useState<Article[]>(
        newsTopHeadLines.articles ?? [],
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSelectCategory = useCallback(
        async (cat: string) => {
            if (cat === category) return;
            setCategory(cat);
            setLoading(true);
            setError(null);

            const result = await getNews(cat, country);
            setLoading(false);

            if (!result.ok) {
                setError(result.error);
            } else {
                setArticles(result.data);
            }
        },
        [category, country],
    );

    const onSelectCountry = useCallback(
        async (selectedCountry: string) => {
            if (selectedCountry === country) return;
            setCountry(selectedCountry);
            setLoading(true);
            setError(null);

            const result = await getNews(category, selectedCountry);
            setLoading(false);

            if (!result.ok) {
                setError(result.error);
            } else {
                setArticles(result.data);
            }
        },
        [category, country],
    );

    return (
        <>
            <Seo />
            <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Categories
                    category={category}
                    onSelectCategory={onSelectCategory}
                />
                <CountrySelector
                    country={country}
                    onSelectCountry={onSelectCountry}
                    disabled={loading}
                />
            </div>
            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive mb-3">
                    {error}
                </div>
            )}
            <NewsList articles={articles} loading={loading} country={country} />
        </>
    );
}

export const getStaticProps: GetStaticProps<{
    newsTopHeadLines: NewsTopHeadLine;
}> = async () => {
    try {
        const articles = await getTopArticles({
            category: 'all',
            country: 'kr',
        });

        return {
            props: { newsTopHeadLines: articlesToTopHeadline(articles) },
            revalidate: 600,
        };
    } catch {
        return {
            props: {
                newsTopHeadLines: {
                    status: 'ok',
                    totalResults: 0,
                    articles: [],
                },
            },
            revalidate: 60,
        };
    }
};
