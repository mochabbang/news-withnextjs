import { NewsTopHeadLine } from '@/types/NewsTopHeadLine';
import axios from 'axios';

// 탑 헤드라인 뉴스 목록 가져오기
export const GetNewsTopHeadLines = async (category: string) => {
    //const key = apiKey === undefined ? env.NEXT_PUBLIC_NEWS_API_KEY : apiKey;
    const key = process.env.NEXT_PUBLIC_NEWS_API_KEY;
    const query =
        category === 'all' || category === '' ? '' : `&category=${category}`;

    const apiNewsTopHeadLines = await axios.get(
        `https://newsapi.org/v2/top-headlines?country=kr${query}&apiKey=${key}`,
    );

    const newsTopHeadLines: NewsTopHeadLine = apiNewsTopHeadLines.data;

    return newsTopHeadLines;
};
