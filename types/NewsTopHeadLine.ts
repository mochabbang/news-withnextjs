import { Article } from './Article';

export type NewsTopHeadLine = {
    status: string;
    totalResults: number;
    articles: Article[];    
};
