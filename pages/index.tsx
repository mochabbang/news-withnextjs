import { GetNewsTopHeadLines } from '@/apis/NewsApis';
import Categories from '@/components/Categories';
import NewsList from '@/components/NewsList';
import { Article } from '@/types/Article';
import { NewsTopHeadLine } from '@/types/NewsTopHeadLine';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useCallback, useEffect, useState } from 'react';

const index = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
    const { newsTopHeadLines } = props;
    const [category, setCategory] = useState('all');
    const [articles, setArticles] = useState<Article[]>([]);
    const onSelectCategory = useCallback(
        (category: string) => setCategory(category),
        [],
    );

    useEffect(() => {
        if (newsTopHeadLines && newsTopHeadLines.articles.length > 0) {
            setArticles(newsTopHeadLines.articles);
        }
    }, []);

    // useEffect(() => {
    //     console.log('execute');

    //     getCategoryData();

    //     async function getCategoryData() {
    //         return await GetNewsTopHeadLines();
    //     }
    // }, [setCategory]);

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
    const newsTopHeadLines = await GetNewsTopHeadLines();

    return {
        props: {
            newsTopHeadLines,
        },
    };
};

export default index;
