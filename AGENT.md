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

## 언론사 분산 정렬

한국 RSS 결과는 단순 최신순으로만 정렬하지 않습니다. 특정 언론사가 첫 페이지를 독점하지 않도록 다음 흐름을 사용합니다.

1. URL 기준 중복 제거
2. 기사 최신순 정렬
3. `source.name` 기준 그룹화
4. 언론사별 bucket을 round-robin 방식으로 섞음
5. 필요한 limit/page slice 적용

관련 함수:

- `dedupeAndSort`
- `diversifyBySource`
- `fetchKoreanRss`

검증할 때는 `/api/news?category=all&country=kr&page=1&pageSize=30` 응답에서 source 분포를 확인합니다.

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
- 한국 뉴스 언론사별 분산 정렬 적용
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
