# 다중 뉴스 API 통합

## ⚠️ 선행 조건 (Phase 7 진입 전)
1. **Phase 1 완료**: `Article` 타입 nullable 반영 (`08-quick-wins.md`)
2. **Phase 2 완료**: API key 서버 측 이전 (NEXT_PUBLIC_ 제거)
3. **공통 `NormalizedArticle` 타입과 adapter 계층 선행** — provider별 응답 차이 흡수

이 순서를 어기면: 클라이언트 키 노출 / 타입 불일치 / 카테고리/필드 매핑 혼선 발생.

## 추가 API 후보

### 1. GNews API (https://gnews.io)
- 무료: 100 req/day
- 한국 뉴스 지원 (`lang=ko`, `country=kr`)
- 엔드포인트: `https://gnews.io/api/v4/top-headlines?lang=ko&country=kr&token={KEY}`
- 환경변수: `GNEWS_API_KEY` (서버 전용, NEXT_PUBLIC_ 금지)

### 2. Currents API (https://currentsapi.services)
- 무료: 600 req/day
- 언어/국가 필터 지원
- 엔드포인트: `https://api.currentsapi.services/v1/latest-news?language=ko`
- 환경변수: `CURRENTS_API_KEY` (서버 전용)

### Provider별 무료 플랜 제한 / fallback 순서
| Provider | 일일 제한 | 카테고리 매핑 | 검색 |
|----------|-----------|---------------|------|
| NewsAPI  | 100 req   | 7개 표준      | `everything` |
| GNews    | 100 req   | 9개 (entertainment 등) | `search` |
| Currents | 600 req   | category 다수 | `search` |

**fallback 순서**: NewsAPI → GNews → Currents (1차 실패 시 다음 사용)
또는 병렬 호출 후 머지 (`Promise.allSettled`)

## 통합 구조

### Adapter 계층 분리
```
apis/
├── providers/
│   ├── newsApi.ts      # NewsAPI 응답 → NormalizedArticle
│   ├── gnews.ts        # GNews 응답 → NormalizedArticle
│   └── currents.ts     # Currents 응답 → NormalizedArticle
├── normalize.ts        # 공통 타입 + dedup
└── NewsApis.ts         # 클라이언트용 fetch wrapper
```

### /apis/normalize.ts
```ts
// 공통 Article 타입으로 정규화
export interface NormalizedArticle {
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  source: string
  provider: 'newsapi' | 'gnews' | 'currents'  // 디버깅/우선순위용
}

export async function fetchAllNews(category: string): Promise<NormalizedArticle[]> {
  const [newsApi, gnews] = await Promise.allSettled([
    fetchNewsAPI(category),
    fetchGNews(category),
  ])
  return deduplicateByTitle([
    ...(newsApi.status === 'fulfilled' ? newsApi.value : []),
    ...(gnews.status === 'fulfilled' ? gnews.value : []),
  ])
}
```

### API Route 생성 (/pages/api/news.ts)
- 서버사이드에서 API 키 보호 (`NEXT_PUBLIC_` 제거)
- category 쿼리 파라미터 수신
- Promise.allSettled로 복수 API 병렬 호출 후 병합

### .env 추가
```
NEWS_API_KEY=...
GNEWS_API_KEY=...
CURRENTS_API_KEY=...
```

## 현재 코드 변경 포인트
- `apis/NewsApis.ts`: `NEXT_PUBLIC_NEWS_API_KEY` 클라이언트 노출 → API Route 경유로 변경
- `pages/index.tsx`: `GetNewsTopHeadLines` 직접 호출 → `fetch('/api/news?category=...')` 호출
- `getStaticProps`: 빌드 시 모든 API 동시 호출, 실패 케이스 fallback 처리

## 중복 제거 전략
```ts
function deduplicateByTitle(arts: NormalizedArticle[]) {
  const seen = new Set<string>()
  return arts.filter(a => {
    const key = a.title.trim().toLowerCase().slice(0, 50)
    if (seen.has(key)) return false
    seen.add(key); return true
  })
}
// 추가: publishedAt 기준 정렬
.sort((a,b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
```

## API 응답 정규화 예
```ts
// NewsAPI: { articles: [{ title, urlToImage, source: { name } }] }
// GNews:   { articles: [{ title, image, source: { name } }] }
// → 공통 NormalizedArticle 매핑 시 image vs urlToImage, source 위치 차이 주의
```

## 카테고리 매핑
| 앱 카테고리 | NewsAPI | GNews |
|---|---|---|
| business | business | business |
| entertainment | entertainment | entertainment |
| health | health | health |
| science | science | science |
| sports | sports | sports |
| technology | technology | technology |
| 전체 | general | general |
