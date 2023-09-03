import { NewsTopHeadLine } from '@/types/NewsTopHeadLine';
import axios from 'axios';
import { env } from 'process';

// 탑 헤드라인 뉴스 목록 가져오기
export const GetNewsTopHeadLines = async () => {
    const apiKey = env.NEWS_API_KEY;
    const apiNewsTopHeadLines = await axios.get(
        `https://newsapi.org/v2/top-headlines?country=kr&apiKey=${apiKey}`,
    );

    const newsTopHeadLines: NewsTopHeadLine = apiNewsTopHeadLines.data;

    return newsTopHeadLines;
};
