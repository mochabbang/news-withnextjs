import { GetNewsTopHeadLines } from '@/apis/NewsApis';
import { NewsTopHeadLine } from '@/types/NewsTopHeadLine';
import { GetStaticProps } from 'next';

const index = (
    props: GetStaticProps<{ newsTopHeadLines: NewsTopHeadLine }>,
) => {
    const newsTopHeadLines = props;

    return (
        <div>
            <p className="text-3xl font-bold underline">Hello World</p>
            {newsTopHeadLines && (
                <textarea
                    rows={10}
                    value={JSON.stringify(newsTopHeadLines, null, 2)}
                    readOnly
                />
            )}
        </div>
    );
};

export const getStaticProps = async () => {
    const newsTopHeadLines = await GetNewsTopHeadLines();

    return {
        props: {
            newsTopHeadLines,
        },
    };
};

export default index;
