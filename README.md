# News With Next.js

한국 뉴스는 무료 RSS를 우선 사용하고, 한국 외 국가는 NewsAPI.org로 조회하는 Next.js 뉴스 앱입니다. 각 기사는 OpenAI를 통해 한국어 한 줄 요약을 lazy 생성합니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 환경변수

`.env.example`을 기준으로 `.env`를 설정합니다.

```bash
# 한국 외 국가 뉴스 (필수)
NEWS_API_KEY=

# 한국 뉴스 보강 (선택, RSS만으로도 동작)
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
GNEWS_API_KEY=
NEWSDATA_API_KEY=
CURRENTS_API_KEY=

# AI 요약 (선택, 미설정 시 요약 미표시)
OPENAI_API_KEY=
SUMMARY_MODEL=
```

## 한국 뉴스 fallback 순서

1. **RSS 5개 동시 fetch + 머지** — 키 불필요, 무제한
   - 연합뉴스, 한겨레, 경향신문, 조선일보, 한국경제
2. Naver Search News API (`NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`)
3. GNews (`GNEWS_API_KEY`)
4. NewsData.io (`NEWSDATA_API_KEY`)
5. Currents (`CURRENTS_API_KEY`)
6. NewsAPI.org 한국 헤드라인 (`NEWS_API_KEY`)

한국 검색은 RSS 전체 카테고리 합집합에서 키워드 필터(클라이언트 사이드)로 동작합니다.

한국 외 국가는 화면의 국가 선택값을 기준으로 NewsAPI.org `/v2/top-headlines`를 호출합니다.

## AI 요약

각 뉴스 카드가 화면에 들어오면 `IntersectionObserver`로 `/api/summarize`에 요청해 한 줄 한국어 요약을 받아옵니다. 비용 통제를 위해:

- 카드별 1회만 요청 (mount 시점)
- 서버 메모리 LRU 캐시(500건, TTL 24시간) — 같은 기사 재요약 방지
- 모델 기본값 `gpt-4o-mini` (`SUMMARY_MODEL` env로 override)
- `OPENAI_API_KEY` 미설정 시 요약 영역은 표시되지 않음 (silent fail)

## 번역

한국 외 국가 뉴스는 `translate=true`로 API route를 호출하며, 아래 중 하나가 설정되어 있으면 제목/요약을 한국어로 번역합니다.

```bash
NEWS_TRANSLATE_PROVIDER=mymemory
MYMEMORY_EMAIL=you@example.com
TRANSLATE_MAX_ARTICLES=5
```

또는 LibreTranslate 호환 서버:

```bash
NEWS_TRANSLATE_PROVIDER=libretranslate
LIBRETRANSLATE_URL=https://your-libretranslate-host
LIBRETRANSLATE_API_KEY=
```

번역 provider가 없으면 원문을 그대로 보여줍니다.

## 시간 표시

`components/RelativeTime.tsx`는 hydration mismatch 방지를 위해 SSR 단계에서는 결정적 `YYYY.MM.DD` 형식을 출력하고, 클라이언트 mount 후 `formatRelative`로 교체하며 60초마다 갱신합니다.

## 구조

```
apis/
  newsService.ts        한국/외국 분기 + provider fallback
  providers/
    koreanRss.ts        RSS 병렬 fetch + fast-xml-parser 파싱
    koreanRssSources.ts 5개 소스 × 카테고리 레지스트리
    naver.ts            Naver Search API
    gnews.ts, newsData.ts, currents.ts, newsApi.ts
  summarize.ts          OpenAI Chat Completions + LRU 캐시
  normalize.ts          Article 통합 스키마
  countries.ts          국가 코드/언어 매핑
  translation.ts        MyMemory/LibreTranslate
pages/
  index.tsx             ISR 600s, 카테고리/국가 selector
  search.tsx
  api/
    news.ts             top-headlines
    search.ts
    summarize.ts        OpenAI 요약
components/
  NewsItem, NewsList, NewsImage, NewsSummary, RelativeTime,
  Categories, CountrySelector, SearchBar, ...
```
