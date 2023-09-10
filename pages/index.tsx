import { GetNewsTopHeadLines } from '@/apis/NewsApis';
import Categories from '@/components/Categories';
import NewsList from '@/components/NewsList';
import { NewsTopHeadLine } from '@/types/NewsTopHeadLine';
import { GetStaticProps, InferGetStaticPropsType } from 'next';

const index = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
    const { newsTopHeadLines } = props;

    return (
        <div>
            {newsTopHeadLines && (
                <>
                    <Categories />
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
