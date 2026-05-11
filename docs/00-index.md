# Skills 인덱스 / 권장 구현 순서 (리뷰 반영판)

리뷰 문서: `reviews/agent-plan-review.md`
핵심 변경: 데이터 계층 안정화 → UI 기반 정리 → 확장 기능 순서로 재배치.

## 파일 목록
| # | 파일 | 영역 |
|---|------|------|
| 09 | `09-tdd-workflow.md` | **공통 원칙** TDD Red/Green/Blue |
| 08 | `08-quick-wins.md` | **🔴 최우선** 타입/접근성/API키/이미지 폴백 |
| 04 | `04-image-fallback.md` | 이미지 폴백 (Quick Win 일부) |
| 06 | `06-loading-error-pagination.md` | 로딩/에러/페이징 |
| 02 | `02-responsive-mobile.md` | 모바일/웹뷰 반응형 |
| 01 | `01-shadcn-ui-setup.md` | shadcn/ui 도입 |
| 03 | `03-multi-news-api.md` | 다중 News API + adapter |
| 05 | `05-header-search.md` | 헤더/검색 |
| 07 | `07-darkmode-seo-utils.md` | 다크모드/SEO/유틸 |

## 9단계 안전 구현 순서

### 공통 원칙 — TDD (09)
- 모든 Phase는 `09-tdd-workflow.md`의 Red → Green → Blue 순서로 진행
- 기존 기능은 개선 전에 characterization test로 먼저 고정
- 각 Phase 완료 시 `npm run test`, `npm run lint`, 필요 시 `npm run build` 실행

### Phase 1 — 기초 정리 (Quick Wins, 08)
1. **타입/lint/접근성**
   - `Article` 타입 nullable 반영 (urlToImage, description 등)
   - `Categories.tsx`: `onSelectCategory: any` → 구체 타입
   - `div onClick` → `<button>` (키보드 접근성)
   - `alt="thumname"` → 기사 제목 기반

### Phase 2 — 데이터 계층 정리 (03 일부)
2. **API key 서버 이전**
   - `NEXT_PUBLIC_NEWS_API_KEY` → `NEWS_API_KEY`
   - `pages/api/news.ts` API Route 신규 (단일 provider)
   - `apis/NewsApis.ts` → fetch 호출만 남김

### Phase 3 — UX 안정화 (06)
3. **로딩/에러/빈 결과 상태**
   - `isLoading`, `error`, `empty` state 분리
   - try/catch + 사용자 노출 메시지
   - Skeleton 카드(개수 = 기존 리스트 폭과 동일)

### Phase 4 — 이미지/카드 안정화 (04)
4. **이미지 placeholder + 카드 레이아웃**
   - `/public/images/news-placeholder.png`
   - `NewsImage` 컴포넌트 (null/빈문자열/onError 모두 처리)
   - `aspect-video` 고정으로 카드 흔들림 제거

### Phase 5 — 반응형 정비 (02)
5. **Tailwind breakpoint + 컨테이너 정리**
   - `screens.md: { max: '768px' }` → 표준 min-width
   - `w-[768px]` 고정 → `max-w-screen-md w-full mx-auto px-4`
   - line-clamp 정책 (제목 2줄, 설명 3줄)

### Phase 6 — UI 컴포넌트 시스템 (01)
6. **shadcn/ui 도입**
   - `components.json` 생성, `cn` util 추가
   - Card / Badge / Button / Skeleton / Tabs / Input
   - 기존 컴포넌트를 점진적으로 교체 (한 번에 갈아엎지 X)

### Phase 7 — 다중 API 통합 (03)
7. **News provider adapter 계층**
   - `apis/providers/newsApi.ts`, `apis/providers/gnews.ts`
   - 공통 `NormalizedArticle` 타입 + adapter
   - Promise.allSettled + fallback 순서 + 중복 제거(title 기준)

### Phase 8 — 확장 기능 (05, 06)
8. **검색 + 더 보기/페이지네이션**
   - `/pages/search.tsx` + `/pages/api/search.ts`
   - 더 보기 버튼 우선 (무한 스크롤은 후순위)
   - 빈 검색어 / 결과 없음 / 에러 상태 정의

### Phase 9 — 마무리 (07)
9. **SEO + 다크모드 + 상대시간**
   - `next/head` 기본 + Open Graph
   - `next-themes` 또는 직접 `darkMode: 'class'`
   - `Intl.RelativeTimeFormat` 또는 date-fns

## 각 Phase 완료 기준
- `npm run lint` 통과 (no errors)
- `npm run build` 통과
- 모바일 뷰포트(375px)에서 가로 스크롤 없음
- 카드 레이아웃 흔들림 없음 (이미지 유무와 무관)

## 변경되는 핵심 파일
| 파일 | 변경 유형 | Phase |
|------|-----------|-------|
| `types/Article.ts` | nullable 반영 | 1 |
| `components/Categories.tsx` | button + 타입 | 1 |
| `components/NewsItem.tsx` | alt + Card 리팩터링 | 1, 4, 6 |
| `apis/NewsApis.ts` | fetch만 남김 | 2 |
| `pages/api/news.ts` | 신규 | 2, 7 |
| `pages/index.tsx` | state 분리 + fetch 변경 | 2, 3 |
| `components/NewsImage.tsx` | 신규 | 4 |
| `tailwind.config.js` | breakpoint, theme | 5, 6 |
| `components/ui/*` | shadcn 자동생성 | 6 |
| `apis/providers/*` | 신규 adapter | 7 |
| `pages/search.tsx`, `pages/api/search.ts` | 신규 | 8 |
| `_document.tsx`, `_app.tsx` | meta + theme | 9 |
| `.env` | 키 prefix 제거 | 2 |
| `next.config.js` | images.domains | 4 |
