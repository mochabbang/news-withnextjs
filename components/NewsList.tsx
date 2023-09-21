import { Article } from '@/types/Article';
import NewsItem from './NewsItem';

interface Props {
    articles: Article[];
}

const NewsList = (props: Props) => {
    const { articles } = props;

    return (
        <div className="box-border pb-12 my-0 mx-auto mt-2 w-[768px] px-4 md:w-full md:px-8 ">
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
