# CLAUDE.md

이 파일은 Claude Code 또는 다른 코딩 에이전트가 이 저장소에서 작업할 때 참고할 운영 지침입니다. 상세 컨텍스트는 `AGENT.md`와 함께 유지합니다.

## 기본 원칙

- Next.js Pages Router 유지. App Router 마이그레이션 금지.
- API key는 서버 측에서만 사용. `NEXT_PUBLIC_` API key 노출 금지.
- 외부 뉴스 데이터는 공통 normalize 계층을 거쳐 UI에 전달.
- 한국어 사용자 요청에는 한국어로 응답.
- 변경 완료 전 관련 테스트와 build를 실행하고 결과를 기록.

## 주요 파일

- 한국 RSS 소스: `apis/providers/koreanRssSources.ts`
- 한국 RSS fetch/normalize/image enrichment: `apis/providers/koreanRss.ts`
- 뉴스 서비스 fallback/pagination: `apis/newsService.ts`
- 뉴스 API route: `pages/api/news.ts`
- 메인 뉴스 목록/무한 스크롤: `pages/index.tsx`
- 뉴스 카드: `components/NewsItem.tsx`
- 스켈레톤: `components/NewsItemSkeleton.tsx`

## 현재 구현 상태

### 한국 RSS 소스

현재 포함 언론사:

- 연합뉴스
- 한겨레
- 경향신문
- 조선일보
- 한국경제
- 동아일보
- SBS 뉴스
- JTBC
- 매일경제

중요:

- `all` 탭에 보여야 하는 소스는 `resolveFeedsForCategory('all')`에 포함되어야 합니다.
- 한국경제 `all`: `https://www.hankyung.com/feed/economy`
- 매일경제 `all`: `https://www.mk.co.kr/rss/30000001/`

### 이미지 fallback

RSS 이미지 추출은 `media:content`, `media:thumbnail`, `enclosure`, description/content HTML 이미지, 기사 페이지 meta image 순서로 시도합니다. 이미지 없는 기사만 page HTML enrichment를 수행하며 실패는 non-fatal이어야 합니다.

### 리스트 썸네일

현재 리스트 썸네일은 비율 기반입니다.

```tsx
relative w-32 sm:w-40 shrink-0 aspect-video
```

스켈레톤도 동일한 비율 기반 크기를 사용합니다.

```tsx
w-32 shrink-0 aspect-video sm:w-40
```

사용자가 “이미지 크기 원상복구” 맥락을 말하면 고정 높이 방식으로 되돌리지 않도록 주의합니다.

### 언론사 분산 정렬

한국 RSS는 최신순만 사용하지 않고 source별 round-robin 분산 정렬을 사용합니다. 특정 언론사가 첫 페이지를 독점하지 않도록 `diversifyBySource` 동작을 유지합니다.

### 페이징/무한 스크롤

`/api/news`는 `page`와 `pageSize`를 받으며 다음 형태로 응답합니다.

```json
{
  "articles": [],
  "page": 1,
  "pageSize": 15,
  "hasMore": false
}
```

메인 페이지는 `IntersectionObserver`로 다음 페이지를 불러오고 URL 기준 중복 제거를 수행합니다.

## 검증 명령

작은 변경:

```bash
npm test -- <관련 테스트 파일> --runInBand
```

일반 변경:

```bash
npm test -- --runInBand
npm run build
```

문서만 변경한 경우:

```bash
git diff --check
git diff
```

## 배포 확인

GitHub PR을 `master`에 merge하면 Vercel Production deployment가 생성됩니다. 확인 순서:

1. GitHub deployments API에서 merge commit의 Production deployment 확인
2. latest status가 `success`인지 확인
3. 공개 URL 확인: `https://news-withnextjs.vercel.app`
4. API 기능 변경이면 실제 API 응답도 확인

주의:

- Vercel deployment URL은 SSO 보호 때문에 `401 Unauthorized`가 날 수 있습니다.
- 공개 production alias 응답은 deployment URL과 별도로 확인해야 합니다.

## 작업 체크리스트

- [ ] `git status --short --branch`로 현재 브랜치 확인
- [ ] 최신 `master`에서 작업 브랜치 생성
- [ ] 의도한 파일만 변경
- [ ] 관련 테스트/build 실행
- [ ] `git diff` 확인
- [ ] commit/push/PR 생성
- [ ] merge 후 배포 및 공개 URL 확인

더 자세한 배경과 최근 변경 내용은 `AGENT.md`를 참조하세요.
