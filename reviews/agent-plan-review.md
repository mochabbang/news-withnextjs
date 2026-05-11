# AGENT.md 개선 계획 리뷰

## 결론

`AGENT.md`의 개선 방향은 현재 프로젝트 상태와 대체로 잘 맞습니다. 특히 UI 개편, 반응형 보완, 이미지 placeholder, 로딩/에러 처리, 타입 강화는 실제 코드에서 바로 확인되는 문제를 해결하는 항목입니다.

다만 계획이 기능 목록 중심이라 구현 순서, 선행 작업, API 설계, 검증 기준이 부족합니다. 바로 모든 항목을 동시에 진행하기보다는 데이터 계층 안정화와 UI 기반 정리를 먼저 한 뒤, 검색/페이지네이션/다크 모드 같은 확장 기능으로 넘어가는 편이 안전합니다.

## 현재 프로젝트 기준 확인 사항

- Next.js 13.4.17 기반이지만 `app` 디렉터리가 아니라 `pages` 라우터를 사용합니다.
- Tailwind CSS는 이미 설정되어 있으나 `tailwind.config.js`의 `screens.md`가 `max-width` 방식이라 일반적인 모바일 우선 Tailwind 사용 방식과 다릅니다.
- 뉴스 API 호출은 `apis/NewsApis.ts`의 `GetNewsTopHeadLines` 하나에 집중되어 있고, 현재 NewsAPI 단일 provider 구조입니다.
- `getStaticProps`에서 뉴스 데이터를 받아 초기 렌더링하고, 카테고리 변경 시 클라이언트에서 같은 API 함수를 다시 호출합니다.
- `NewsItem`은 이미지가 없으면 썸네일 영역 자체가 사라져 카드 레이아웃이 흔들릴 수 있습니다.
- `npm run lint` 기준 `components/Categories.tsx`의 `onSelectCategory: any`에서 lint 오류가 발생합니다.

## 항목별 리뷰

### 1. shadcn/ui + Tailwind UI 개편

방향은 좋지만 선행 조건이 있습니다. shadcn/ui 도입 시 `components.json`, `class-variance-authority`, `clsx`, `tailwind-merge`, Radix 계열 의존성 등이 추가될 수 있으므로 현재 단순한 컴포넌트 구조에 비해 초기 설정 비용이 생깁니다.

권장:

- 먼저 레이아웃, 카드, 버튼, 탭/카테고리 등 최소 UI 단위를 정합니다.
- `NewsItem`, `NewsList`, `Categories`를 한 번에 갈아엎기보다 공통 `ArticleCard`, `CategoryTabs` 같은 단위로 나눕니다.
- 디자인 시스템 도입 전 `tailwind.config.js`의 breakpoint 정책을 정리합니다.

리스크:

- 현재 프로젝트가 pages router이므로 shadcn 예시가 app router 기준일 때 그대로 복사하면 구조가 어긋날 수 있습니다.
- UI 개편과 데이터 구조 변경을 동시에 하면 회귀 확인이 어려워집니다.

### 2. 모바일/웹뷰 반응형

필수에 가깝습니다. 현재 `w-[768px]`, `md:w-full`, `md:max-w-[300px]` 같은 고정폭과 커스텀 `md` max-width가 섞여 있어 모바일 웹뷰에서 텍스트 줄바꿈, 이미지 비율, 카드 폭 문제가 생기기 쉽습니다.

권장:

- `max-w-screen-md w-full mx-auto px-4` 같은 방식으로 컨테이너를 정리합니다.
- 카드 이미지는 고정 `width/height`보다 `aspect-ratio` 기반으로 정리합니다.
- 긴 제목과 설명의 line-clamp 정책을 둡니다.

### 3. 다중 News API 통합

기능적으로 유용하지만 가장 설계가 필요한 항목입니다. NewsAPI, GNews 등 provider마다 응답 필드, 카테고리 이름, 국가/언어 파라미터, 무료 플랜 제한이 다릅니다.

권장:

- 각 provider 응답을 내부 공통 타입 `Article`로 normalize하는 adapter 계층을 먼저 만듭니다.
- API key는 클라이언트에 노출되지 않도록 Next.js API Routes 또는 서버 사이드 함수에서만 사용합니다.
- provider 장애 시 fallback 순서와 중복 기사 제거 기준을 계획에 추가합니다.

리스크:

- 현재 `NEXT_PUBLIC_NEWS_API_KEY`를 사용하고 있어 브라우저에 키가 노출될 수 있습니다.
- 현재 `Article` 타입은 nullable 필드를 충분히 반영하지 않아 provider 추가 시 타입 오류 또는 런타임 예외가 날 가능성이 있습니다.

### 4. 이미지 없을 때 placeholder

현재 코드의 실제 문제와 정확히 맞는 계획입니다. 이미지가 없을 때 카드의 썸네일 영역이 사라지므로 리스트 정렬이 불안정해질 수 있습니다.

권장:

- placeholder 이미지를 `public`에 추가하거나, CSS 배경/아이콘 기반 placeholder 컴포넌트를 만듭니다.
- `urlToImage`가 빈 문자열, `null`, 깨진 URL인 경우까지 처리합니다.
- 이미지 `alt`는 `"thumname"` 대신 기사 제목 기반으로 변경합니다.

### 5. 헤더/브랜딩, 검색 기능

헤더/브랜딩은 UI 개편과 함께 진행하기 좋습니다. 검색 기능은 API provider별 지원 방식이 달라 다중 API 통합 이후에 진행하는 편이 안전합니다.

권장:

- 헤더는 먼저 정적 브랜드와 카테고리 탐색 중심으로 구성합니다.
- 검색은 query 상태, debounce, 빈 검색어 처리, 검색 결과 없음 상태까지 포함해 정의합니다.

### 6. 로딩 Skeleton, 에러 처리

우선순위가 높습니다. 현재 카테고리 전환 중 로딩 상태가 없고, API 실패 시 사용자에게 표시되는 fallback도 없습니다.

권장:

- `isLoading`, `error`, `empty` 상태를 `pages/index.tsx`에 명확히 둡니다.
- API 함수는 실패 시 조용히 깨지지 않도록 에러 타입 또는 안전한 결과 타입을 반환합니다.
- Skeleton은 리스트 카드 개수와 동일한 형태로 제공하면 레이아웃 흔들림을 줄일 수 있습니다.

### 7. 무한 스크롤 / 페이지네이션

좋은 확장 기능이지만 다중 API 통합보다 뒤가 적절합니다. provider마다 page/pageSize 또는 token 방식이 다를 수 있기 때문입니다.

권장:

- 먼저 페이지네이션 가능한 공통 인터페이스를 정의합니다.
- 초기에는 버튼형 `더 보기`가 무한 스크롤보다 디버깅과 접근성 면에서 안전합니다.

### 8. 다크 모드, SEO 메타태그

SEO 메타태그는 빠르게 추가할 수 있어 우선순위가 높습니다. 다크 모드는 UI 컴포넌트 정리 이후에 적용하는 것이 효율적입니다.

권장:

- `next/head`로 기본 title, description, Open Graph를 먼저 추가합니다.
- 다크 모드는 `next-themes` 같은 도구를 도입할지, Tailwind `darkMode: 'class'`로 직접 처리할지 결정합니다.

### 9. 상대 시간 포맷, 타입 강화, 접근성

현재 코드 품질을 바로 올릴 수 있는 항목입니다. 특히 `onSelectCategory: any`, nullable 가능성이 있는 기사 필드, 클릭 가능한 `div` 카테고리 UI는 개선 대상입니다.

권장:

- `Article` 타입에서 nullable 필드를 실제 API 응답에 맞게 반영합니다.
- 카테고리 항목은 `button`으로 변경해 키보드 접근성을 확보합니다.
- 날짜는 `Intl.RelativeTimeFormat` 또는 작은 유틸 함수로 상대 시간 표기를 적용합니다.

## 권장 구현 순서

1. 타입/린트/접근성 기초 정리
2. API key 노출 제거 및 API 호출 계층 정리
3. 로딩/에러/빈 결과 상태 추가
4. 이미지 placeholder 및 카드 레이아웃 안정화
5. 반응형 레이아웃과 Tailwind breakpoint 정리
6. shadcn/ui 기반 컴포넌트 도입
7. 다중 News API adapter 구조 추가
8. 검색, 페이지네이션 또는 더 보기 기능 추가
9. SEO, 다크 모드, 상대 시간 포맷 마무리

## 계획 보완 제안

`AGENT.md`에 아래 내용을 추가하면 실행 가능한 계획으로 더 좋아집니다.

- pages router 기준으로 구현할지, app router로 마이그레이션할지 결정
- API key를 public env에서 제거하고 서버 측으로 숨기는 작업 추가
- 다중 API 통합 전 공통 `Article` normalize 계층 추가
- 각 기능별 완료 기준 추가
- `npm run lint`와 `npm run build`를 검증 단계로 명시

## 최종 평가

계획 자체는 이상 없습니다. 다만 지금 상태로는 "무엇을 만들지"는 있지만 "어떤 순서로 안전하게 바꿀지"가 부족합니다. 특히 다중 API 통합, shadcn/ui 도입, 반응형 개편은 서로 영향을 주므로 순서를 나누는 것이 중요합니다.

가장 먼저 처리할 추천 작업은 `any` lint 오류 제거, 카테고리 접근성 개선, API key 서버 측 이전, 이미지 placeholder 추가입니다. 이 네 가지를 먼저 끝내면 이후 UI 개편과 API 확장을 훨씬 안정적으로 진행할 수 있습니다.
