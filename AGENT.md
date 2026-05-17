# News With Next.js 작업 컨텍스트

이 문서는 이 저장소에서 작업하는 에이전트가 따라야 할 현재 기준과 최근 구현 내용을 정리합니다.

## 프로젝트 기준

- Next.js **Pages Router**를 유지합니다. App Router로 마이그레이션하지 않습니다.
- News API 키는 서버 측에서만 사용합니다. 클라이언트에 `NEXT_PUBLIC_` API key를 노출하지 않습니다.
- 외부 뉴스 제공자는 공통 `Article`/`NormalizedArticle` 형태로 normalize한 뒤 UI에 전달합니다.
- 주요 검증 명령:
  - `npm test -- --runInBand`
  - 변경 범위가 작으면 관련 테스트 파일 우선 실행
  - `npm run build`
- 문서/주석만 변경한 경우에도 `git diff`로 의도한 변경만 포함됐는지 확인합니다.

## 한국 뉴스 RSS 파이프라인

주요 파일:

- `apis/providers/koreanRssSources.ts`
- `apis/providers/koreanRss.ts`
- `apis/newsService.ts`
- `pages/api/news.ts`
- `pages/index.tsx`

현재 한국 RSS 소스에는 다음 언론사가 포함됩니다.

- 연합뉴스
- 한겨레
- 경향신문
- 조선일보
- 한국경제
- 동아일보
- SBS 뉴스
- JTBC
- 매일경제

주의사항:

- 소스 registry에 언론사가 있어도 기본 `all` 탭에 자동으로 노출되는 것은 아닙니다.
- 기본 뉴스 목록에 보여야 하는 언론사는 `resolveFeedsForCategory('all')` 결과에 포함되어야 합니다.
- 한국경제는 `all` 피드로 `https://www.hankyung.com/feed/economy`를 사용합니다.
- 매일경제는 `all` 피드로 `https://www.mk.co.kr/rss/30000001/`를 사용합니다.
- 언론사 RSS 구조가 서로 다르므로 하나의 구조를 모든 한국 언론사에 가정하지 않습니다.

## 이미지 처리 기준

RSS 기사 이미지 추출 우선순위:

1. `media:content` URL/href
2. `media:thumbnail` URL/href
3. image `enclosure`
4. `description` HTML 안의 첫 `<img src>`
5. `content:encoded` HTML 안의 첫 `<img src>`
6. 기사 페이지 `og:image`
7. 기사 페이지 `twitter:image` / `twitter:image:src`
8. 기사 페이지 첫 `<img src>`
9. 로컬 placeholder

이미지 URL normalize 기준:

- 공백 제거
- `&amp;`를 `&`로 변환
- `//cdn.example.com/image.jpg`는 `https://...`로 변환
- `data:`, `javascript:`, 비 HTTP URL은 거부

기사 페이지 enrichment는 이미지가 없는 기사에만 적용하고, 짧은 timeout과 제한된 concurrency를 사용합니다. 한 기사 이미지 조회 실패가 전체 뉴스 목록 실패로 이어지면 안 됩니다.

## 리스트 이미지 레이아웃

최근 리스트 썸네일은 고정 높이 방식에서 기존 비율 기반 방식으로 되돌렸습니다.

- 카드 이미지 wrapper: `relative w-32 sm:w-40 shrink-0 aspect-video`
- 스켈레톤: `w-32 shrink-0 aspect-video sm:w-40`

`next/image fill`을 사용할 때는 wrapper가 `relative`여야 하며, 카드 레이아웃이 흔들리지 않도록 skeleton 크기와 실제 이미지 wrapper 크기를 맞춥니다.

## 뉴스 등록일 정렬

한국 RSS 결과는 언론사별로 섞지 않고 기사 등록일 기준 최신순으로 정렬합니다. 같은 언론사의 최신 기사가 연속으로 등록되어 있으면 그대로 연속 노출될 수 있습니다.

처리 흐름:

1. URL 기준 중복 제거
2. `publishedAt` 기준 최신순 정렬
3. 필요한 limit/page slice 적용

관련 함수:

- `sortByPublishedAt`
- `fetchKoreanRss`

검증할 때는 `/api/news?category=all&country=kr&page=1&pageSize=30` 응답의 `publishedAt`이 내림차순인지 확인합니다.

## 페이징과 무한 스크롤

`/api/news`는 다음 query parameter를 지원합니다.

- `page`
- `pageSize`
- `category`
- `country`

응답 contract:

```json
{
  "articles": [],
  "page": 1,
  "pageSize": 15,
  "hasMore": false
}
```

메인 페이지는 `IntersectionObserver` 기반 무한 스크롤을 사용합니다.

- 최초 page 1 로딩
- sentinel이 보이면 다음 page 요청
- URL 기준 중복 제거
- category/country 변경 시 목록과 page 상태 초기화

## 이메일 뉴스 구독/알림

Supabase 기반 이메일 뉴스 구독 MVP를 사용합니다.

주요 파일:

- `supabase/migrations/202605170001_newsletter_notifications.sql`
- `lib/supabase/admin.ts`
- `lib/supabase/public.ts`
- `apis/notifications/subscriptions.ts`
- `apis/notifications/digest.ts`
- `apis/messaging/email.ts`
- `components/EmailSubscriptionForm.tsx`
- `pages/subscriptions/confirmed.tsx`
- `pages/api/subscriptions/email/subscribe.ts`
- `pages/api/subscriptions/email/activate.ts`
- `pages/api/subscriptions/unsubscribe.ts`
- `pages/api/cron/send-top-news.ts`
- `vercel.json`

운영 기준:

- 이메일 구독은 Supabase Auth 이메일 인증 후 `newsletter_subscriptions.active=true`가 됩니다.
- DB 쓰기와 발송 이력 기록은 서버에서 `SUPABASE_SERVICE_ROLE_KEY`로만 처리합니다.
- 공개 client에는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 사용합니다.
- Cron은 `/api/cron/send-top-news`를 2시간마다 호출하며 `CRON_SECRET`으로 보호합니다.
- digest 이메일 발송은 Resend adapter를 사용합니다. `RESEND_API_KEY`와 `EMAIL_FROM`이 없으면 발송 실패로 기록됩니다.
- 구독자별 최근 24시간 내 발송된 기사 URL은 재발송하지 않습니다.
- Supabase 프로젝트를 새로 만들면 migration SQL을 먼저 적용하고, Auth redirect URL에 `/subscriptions/confirmed`를 허용해야 합니다.

## 예정 기능 개선 계획

다음 항목은 우선 검토/구현할 기능 개선 계획입니다.

### 1. 사용자 접속 이력

목표:

- 방문자 접속 이력과 기본 사용 흐름을 파악합니다.
- 개인을 직접 식별하는 정보 수집은 최소화합니다.

구현 방향:

- Vercel Analytics 또는 직접 구현한 서버 측 이벤트 로깅 중 하나를 선택합니다.
- 직접 구현 시 `/api/analytics/visit` 같은 서버 API를 두고 페이지 방문, 기사 클릭, 검색어, 국가/카테고리 변경 이벤트를 기록합니다.
- IP, User-Agent 등 개인정보 가능성이 있는 값은 저장 전 hashing/truncation 또는 미저장을 우선 검토합니다.
- 저장소는 Vercel Postgres, Supabase, Neon, Firebase 등 배포 환경과 맞는 관리형 DB를 우선 검토합니다.
- 관리자 확인 화면이 필요하면 별도 보호된 admin route를 추가합니다.

검증 기준:

- 새 방문/기사 클릭/검색 이벤트가 중복 과다 없이 기록됩니다.
- 개인정보 최소 수집 원칙을 문서화합니다.
- 클라이언트 오류나 analytics API 실패가 뉴스 사용 흐름을 막지 않습니다.

### 2. SEO 추가

목표:

- 메인/검색/기사 상세 페이지의 검색 노출 품질을 개선합니다.
- 뉴스 사이트로서 기본 metadata와 crawlability를 갖춥니다.

구현 방향:

- Pages Router 기준으로 `next/head`를 사용합니다.
- 공통 SEO 컴포넌트 또는 helper를 만들고 title, description, canonical, Open Graph, Twitter Card를 관리합니다.
- 기사 상세 페이지에는 기사 제목/요약/이미지를 기반으로 동적 metadata를 구성합니다.
- `robots.txt`, `sitemap.xml` 또는 동적 sitemap API를 추가합니다.
- JSON-LD `NewsArticle` 구조화 데이터를 기사 상세에 추가하는 것을 검토합니다.

검증 기준:

- 페이지별 title/description/canonical이 중복 없이 생성됩니다.
- 공유 미리보기 이미지와 설명이 정상 표시됩니다.
- sitemap/robots가 production URL 기준으로 응답합니다.

### 3. 구글 애드센스 추가

목표:

- Google AdSense 승인과 광고 게재를 위한 기본 스크립트/슬롯을 추가합니다.
- 뉴스 목록 UX를 과도하게 해치지 않는 광고 위치를 사용합니다.

구현 방향:

- AdSense publisher ID는 환경변수로 관리합니다. 예: `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT`
- `_document.tsx` 또는 `_app.tsx`/공통 Head에 AdSense script를 조건부 삽입합니다.
- 광고 컴포넌트를 별도로 만들고 client ID, slot ID, format, responsive 설정을 props로 관리합니다.
- 광고 위치는 우선 목록 중간, 기사 상세 하단 등 제한된 위치부터 적용합니다.
- 개발/테스트 환경에서는 실제 광고 로딩을 막거나 no-op 처리합니다.

검증 기준:

- 환경변수가 없으면 광고 script/slot이 렌더링되지 않습니다.
- production에서 AdSense script가 1회만 삽입됩니다.
- 광고 로딩 실패가 페이지 렌더링을 깨지 않습니다.

## Vercel/GitHub 배포 흐름

이 저장소는 GitHub와 Vercel이 연결되어 있습니다.

권장 흐름:

1. feature branch 생성
2. 변경/테스트/build
3. commit/push
4. GitHub PR 생성
5. PR merge로 `master`에 반영
6. GitHub deployments API로 Production deployment 생성/성공 확인
7. 공개 alias `https://news-withnextjs.vercel.app`를 별도로 HTTP 확인

주의사항:

- Vercel deployment URL은 SSO 보호로 `401`이 날 수 있습니다.
- Production alias가 최신 배포를 즉시 가리키지 않거나 stale behavior를 보일 수 있으므로 alias 응답을 별도로 확인합니다.
- 배포 성공만으로 기능 반영을 단정하지 말고 실제 API 응답까지 확인합니다.

## 최근 반영된 주요 변경

- 한국 RSS 언론사 추가 및 이미지 fallback/enrichment 개선
- 리스트 이미지 크기를 비율 기반 기존 방식으로 원상복구
- 한국 뉴스 등록일 최신순 정렬 적용
- `/api/news` page/pageSize 기반 페이징 추가
- 메인 페이지 무한 스크롤 추가
- 한국경제를 기본 `all` 뉴스 피드에 포함
- 관련 테스트 보강

## 변경 시 체크리스트

- [ ] 활성 브랜치와 원격 상태 확인
- [ ] 변경 대상 파일과 데이터 흐름 확인
- [ ] 관련 unit test 추가/수정
- [ ] 관련 테스트 실행
- [ ] `npm run build` 실행
- [ ] `git diff`로 의도한 변경만 포함됐는지 확인
- [ ] PR/merge 후 Production deployment와 공개 URL 확인
