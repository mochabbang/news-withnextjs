import { GetNewsTopHeadLines } from '@/apis/NewsApis';
import Categories from '@/components/Categories';
import NewsList from '@/components/NewsList';
import { NewsTopHeadLine } from '@/types/NewsTopHeadLine';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useCallback, useState } from 'react';

const index = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
    const { newsTopHeadLines } = props;
    const [category, setCategory] = useState('all');
    const onSelectCategory = useCallback((category:string) => setCategory(category), []);

    return (
        <div>
            {newsTopHeadLines && (
                <>
                    <Categories category={category} onSelectCategory={onSelectCategory} />
                    <NewsList
                        status={newsTopHeadLines.status}
                        totalResults={newsTopHeadLines.totalResults}
                        articles={newsTopHeadLines.articles}
                    />
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
