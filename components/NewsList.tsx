import { Article } from '@/types/Article';
import NewsItem from './NewsItem';

interface Props {
    status: string;
    totalResults: number;
    articles: Article[];
}

const NewsList = (props: Props) => {
    const { articles } = props;

    return (
        <div
            className="box-border pb-12 my-0 mx-auto mt-8 md:w-full px-4"
            style={{ width: '768px' }}
        >
            {articles &&
                articles.map(
                    (article): JSX.Element => (
                        <NewsItem key={article.url} {...article} />
                    ),
                )}
        </div>
    );
};

export default NewsList;
