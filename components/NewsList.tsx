import { Article } from '@/types/Article';
import NewsItem from './NewsItem';

interface Props {
    articles: Article[];
}

const NewsList = (props: Props) => {
    const { articles } = props;

    return (
        <div className="grid box-border pb-6 my-0 mx-auto w-[768px] px-4 md:w-full md:px-8 bg-gray-200 rounded-[4px]">
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
