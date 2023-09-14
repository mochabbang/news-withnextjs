import { GetNewsTopHeadLines } from '@/apis/NewsApis';
import Categories from '@/components/Categories';
import NewsList from '@/components/NewsList';
import { Article } from '@/types/Article';
import { NewsTopHeadLine } from '@/types/NewsTopHeadLine';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { env } from 'process';
import { useCallback, useState } from 'react';

const index = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
    const { newsTopHeadLines } = props;
    const [category, setCategory] = useState('all');
    const [articles, setArticles] = useState<Article[]>(
        newsTopHeadLines.articles,
    );

    const onSelectCategory = useCallback((category: string) => {
        setCategory(category);
        getCategoryArticles(category);
    }, []);

    const getCategoryArticles = async (category: string) => {
        const data = await GetNewsTopHeadLines(category);

        if (!data) {
            return;
        }

        setArticles(data.articles);
    };

    return (
        <div>
            {newsTopHeadLines && (
                <>
                    <Categories
                        category={category}
                        onSelectCategory={onSelectCategory}
                    />
                    <NewsList articles={articles} />
                </>
            )}
        </div>
    );
};

export const getStaticProps: GetStaticProps<{
    newsTopHeadLines: NewsTopHeadLine;
}> = async () => {
    const newsTopHeadLines = await GetNewsTopHeadLines('');

    return {
        props: {
            newsTopHeadLines,
        },
    };
};

export default index;
