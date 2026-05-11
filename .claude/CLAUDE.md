# News App (Next.js 13 Page Router)

한국 뉴스 사이트. TS, Tailwind, axios.
UI: Radix(scroll-area, slot, tabs) + shadcn 스타일 (`components/ui/*`) + `next-themes` 다크모드 + `lucide-react` 아이콘.

## Quick Start
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드 (dev 종료 후)
npm run lint
npx tsc --noEmit
```
Path alias: `@/*` → 프로젝트 루트 (`@/types`, `@/apis`, `@/components`, `@/utilities`).

## 데이터 소스
- 한국: RSS 5개(연합·한겨레·경향·조선·한국경제) primary, 키 보유 시 Naver/GNews/NewsData/Currents/NewsAPI 보강.
- 한국 외: NewsAPI `/v2/top-headlines`(country) → `/v2/everything`(language) → GNews → NewsData → Currents 순으로 fallback. `top-headlines`가 jp/cn/de/fr 등에서 0건 반환하는 문제 회피.
- 검색: 한국 = RSS 코퍼스(전 카테고리 합집합)에서 키워드 필터, 한국 외 = NewsAPI top-headlines → everything → GNews/NewsData/Currents 동일 체인.
- GNews/NewsData/Currents는 `(category, country, language)` 파라미터로 호출 (이전엔 kr/ko 하드코딩이었음).
- ISR 600초.

## AI 요약 (OpenAI ChatGPT)
- 모델 기본 `gpt-4o-mini`, `SUMMARY_MODEL`로 override.
- 트리거: 카드가 viewport에 진입할 때 lazy fetch (`IntersectionObserver`, rootMargin 100px).
- 서버: `apis/summarize.ts` 메모리 LRU(500건, TTL 24h), system prompt 고정.
- 클라이언트는 `{title, description}`만 전송 → 서버 API route(`pages/api/summarize.ts`)에서 OpenAI 호출.
- `OPENAI_API_KEY` 미설정 시 카드는 요약 없이 정상 렌더(에러는 silent).

## 환경 변수
- **필수(한국 외 국가)**: `NEWS_API_KEY` — NewsAPI.org top-headlines/everything.
- **선택(한국 보강)**: `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`, `GNEWS_API_KEY`, `NEWSDATA_API_KEY`, `CURRENTS_API_KEY`. RSS 실패 시 순차 fallback.
- **AI 요약**: `OPENAI_API_KEY` (활성화 키), `SUMMARY_MODEL` (override).
- **번역(한국 외 헤드라인 → 한국어)**: `NEWS_TRANSLATE_PROVIDER=none|mymemory|libretranslate` (기본 none). `TRANSLATE_MAX_ARTICLES=5`로 비용 통제. `country !== 'kr'`이고 `translate=true`일 때만 호출.
- 전부 서버 전용. 클라이언트 번들에 노출 X (`NEXT_PUBLIC_` 접두사 사용 금지).

## 시간 표시
- `components/RelativeTime.tsx`: SSR은 결정적 `YYYY.MM.DD` 출력 → mount 후 `formatRelative`로 swap → 60초마다 갱신. Hydration mismatch 방지.

## 구성
- `pages/`: index, search, api/(news|search|summarize)
- `components/`: NewsList, NewsItem, NewsImage, NewsSummary, RelativeTime, Categories, CountrySelector, SearchBar, ...
- `apis/`: newsService(orchestration), providers/(koreanRss, naver, gnews, newsData, currents, newsApi), countries, normalize, translation, summarize
- `types/`, `utilities/`

## 결정 로그
- Pages Router 유지.
- API key는 서버에만 (NEWS_API_KEY/NAVER_*/OPENAI_API_KEY 등 모두 클라이언트 노출 X).
- Article normalize 계층(`apis/normalize.ts`) 선행, provider별 변환 후 통합.
- 요약은 서버 캐시 우선 + lazy fetch로 비용 통제.
- `next/image`는 `unoptimized` 사용 — 외부 호스트 이미지가 다양해 Next 최적화 파이프라인을 통과시키지 않음 (`components/NewsImage.tsx`, `utilities/ImageLoader.ts`).
- 한국 RSS는 카테고리 매핑이 비대칭(예: 조선일보는 `all`만, 한국경제는 `business`/`entertainment`/`science`/`sports`/`technology`만). `resolveFeedsForCategory`가 `feeds[category] ?? feeds.all`로 fallback.
- top-headlines getStaticProps 실패 시 빈 articles + `revalidate: 60`으로 재시도 단축 (`pages/index.tsx`).
- 검색은 `pages/api/search.ts` 별도 라우트; 한국은 RSS 전 카테고리 합집합에 단순 substring 필터, 한국 외는 NewsAPI 검색.

## 검증
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (dev 서버 종료 후)
- 모바일 뷰포트 + 카드 가시화 시 요약 동작 확인.

## 참고 문서 (`docs/`)
구현 배경·페이즈별 계획서. 현재 코드보다 오래된 스냅샷이므로 **현재 상태와 충돌하면 코드 우선**, 의도·이유 파악 용도로만 사용.
- `00-index.md` — 전체 9단계 구현 순서 및 변경 파일 매트릭스 (진입점)
- `09-tdd-workflow.md` — Red/Green/Blue 워크플로 (공통 원칙)
- `08-quick-wins.md` — 타입·접근성·API 키·이미지 폴백 (Phase 1)
- `02-responsive-mobile.md` — 모바일 breakpoint·컨테이너 정책 (Phase 5)
- `01-shadcn-ui-setup.md` — shadcn/ui 도입 배경 (Phase 6)
- `03-multi-news-api.md` — provider adapter 설계 배경 (Phase 7)
- `04-image-fallback.md` — `NewsImage` 폴백 로직 (Phase 4)
- `05-header-search.md` — 검색 UX (Phase 8)
- `06-loading-error-pagination.md` — 로딩/에러/페이지네이션 (Phase 3)
- `07-darkmode-seo-utils.md` — 다크모드/SEO/상대시간 (Phase 9)

특정 영역(예: provider 추가, 이미지 폴백, shadcn 컴포넌트) 작업 전 해당 문서를 우선 읽으면 의도 빠르게 파악 가능.
