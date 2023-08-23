import { Article } from './Article';

export interface NewsTopHeadLine {
    status: string;
    totalResults: number;
    articles: Article[];
}
