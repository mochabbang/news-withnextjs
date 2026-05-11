# TDD 작업 원칙 — Red / Green / Blue

> 모든 개선 작업은 가능한 한 테스트를 먼저 작성하고, 실패를 확인한 뒤, 최소 구현과 리팩터링을 분리해서 진행한다.

## 목표

이 프로젝트의 UI 개편, API 계층 정리, 이미지 fallback, 로딩/에러 처리, 검색/페이지네이션 개선은 서로 영향을 많이 받는다. 기능을 한 번에 바꾸면 회귀를 놓치기 쉬우므로 각 개선 단위를 TDD 사이클로 작게 나눈다.

## 선행 작업: 테스트 환경 구성

현재 `package.json`에는 테스트 스크립트와 테스트 의존성이 없다. 개선 작업을 시작하기 전에 아래 중 하나의 테스트 기반을 먼저 추가한다.

### 권장 스택

- Jest + `next/jest`
- React Testing Library
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- API mocking이 필요한 경우 MSW 또는 axios/fetch mock

### 권장 스크립트

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 기본 검증 명령

```bash
npm run test
npm run lint
npm run build
```

## 1. Red 단계: 테스트 코드로 실패를 먼저 만든다

개선 작업을 시작할 때 곧바로 구현하지 않는다. 먼저 기대 동작을 테스트로 적고, 해당 테스트가 실패하는 것을 확인한다.

### Red 단계 원칙

- 새 기능은 요구사항을 테스트 이름으로 먼저 표현한다.
- 버그 수정은 재현 테스트를 먼저 작성한다.
- 리팩터링 전에는 현재 동작을 고정하는 characterization test를 먼저 작성한다.
- 실패 원인이 테스트 자체의 오류가 아니라 실제 미구현/버그 때문인지 확인한다.

### 예시: 카테고리 접근성 개선

```tsx
// components/Categories.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Categories from './Categories'

it('카테고리를 버튼으로 렌더링하고 선택 콜백을 호출한다', async () => {
  const user = userEvent.setup()
  const onSelectCategory = jest.fn()

  render(<Categories category="all" onSelectCategory={onSelectCategory} />)

  await user.click(screen.getByRole('button', { name: '비즈니스' }))

  expect(onSelectCategory).toHaveBeenCalledWith('business')
})
```

현재 구현은 `div onClick` 기반이므로 `getByRole('button')` 테스트가 실패해야 정상이다.

### 예시: 이미지 placeholder

```tsx
// components/NewsItem.test.tsx
import { render, screen } from '@testing-library/react'
import NewsItem from './NewsItem'

it('기사 이미지가 없으면 placeholder 이미지를 보여준다', () => {
  render(
    <NewsItem
      author={null}
      title="테스트 기사"
      description="설명"
      url="https://example.com/news"
      urlToImage={null}
      publishedAt="2026-04-29T00:00:00Z"
      content={null}
      source={{ name: 'Example' }}
    />,
  )

  expect(screen.getByAltText('테스트 기사')).toBeInTheDocument()
})
```

현재 타입과 렌더링은 `urlToImage: string` 및 조건부 이미지 영역이라 이 테스트가 실패해야 한다.

## 2. Green 단계: 최소 코드 구현으로 테스트를 통과시킨다

Red 테스트가 확인되면 가장 작은 변경으로 테스트를 통과시킨다. 이 단계에서는 구조 개선 욕심을 줄이고, 테스트가 요구한 동작만 구현한다.

### Green 단계 원칙

- 테스트 통과에 필요한 최소 코드만 작성한다.
- unrelated refactor, 스타일 전면 개편, 파일 이동을 섞지 않는다.
- 기능 변경 후 `npm run test`를 먼저 실행한다.
- 영향 범위가 넓으면 관련 테스트만 먼저 통과시킨 뒤 전체 테스트를 실행한다.

### 예시: Categories 최소 구현

```tsx
interface Props {
  category: string
  onSelectCategory: (category: string) => void
}

<button
  type="button"
  aria-pressed={category === c.name}
  onClick={() => onSelectCategory(c.name)}
>
  {c.text}
</button>
```

### Green 완료 기준

- 새로 작성한 Red 테스트가 통과한다.
- 기존 테스트가 깨지지 않는다.
- `npm run lint`에서 새 오류가 생기지 않는다.

## 3. Blue 단계: 리팩터링으로 구조와 품질을 개선한다

이 프로젝트에서는 Red → Green 이후 리팩터링 단계를 Blue로 부른다. Blue 단계에서는 테스트가 초록색으로 유지되는 상태에서 구조를 정리한다.

### Blue 단계 원칙

- 동작을 바꾸지 않고 중복, 네이밍, 컴포넌트 분리, 타입 구조를 개선한다.
- 테스트를 계속 통과시키며 작은 단위로 커밋 가능한 상태를 유지한다.
- UI 리팩터링은 스냅샷보다 사용자 관점 테스트를 우선한다.
- API 리팩터링은 provider adapter와 normalize 결과를 테스트로 보호한다.

### Blue에서 할 수 있는 작업

- `NewsItem` 내부 이미지 렌더링을 `NewsImage` 컴포넌트로 분리
- `Categories`의 category 타입을 string에서 union 타입으로 강화
- `GetNewsTopHeadLines` 이름을 `getNewsTopHeadlines`로 정리
- API 응답 normalize 함수 분리
- Skeleton, EmptyState, ErrorState 컴포넌트 분리

### Blue 완료 기준

- `npm run test` 통과
- `npm run lint` 통과
- `npm run build` 통과
- 기능 변경 없이 코드 구조만 개선되었는지 diff 확인

## 4. 현재 구현된 기능은 테스트 코드로 먼저 고정한다

이미 동작 중인 기능은 개선 전에 테스트로 현재 동작을 검증한다. 이 테스트는 이후 리팩터링 중 기존 기능이 깨졌는지 알려주는 안전망이다.

### 우선 작성할 현재 기능 테스트

| 대상 | 검증할 현재 동작 |
|------|------------------|
| `components/Categories.tsx` | 전체보기/비즈니스/엔터테인먼트 등 카테고리 표시 |
| `components/Categories.tsx` | 카테고리 클릭 시 선택 콜백 호출 |
| `components/NewsList.tsx` | articles 배열 개수만큼 기사 카드 렌더링 |
| `components/NewsItem.tsx` | 제목, 설명, 게시일, 링크 표시 |
| `components/NewsItem.tsx` | 외부 링크가 새 탭 속성으로 렌더링 |
| `apis/NewsApis.ts` | 카테고리에 따라 NewsAPI query가 구성됨 |
| `pages/index.tsx` | 초기 기사 목록을 렌더링하고 카테고리 변경 시 목록 갱신 |

### characterization test 예시

```tsx
// components/NewsList.test.tsx
import { render, screen } from '@testing-library/react'
import NewsList from './NewsList'

const articles = [
  {
    author: '작성자',
    title: '첫 번째 기사',
    description: '첫 번째 설명',
    url: 'https://example.com/1',
    urlToImage: 'https://example.com/1.png',
    publishedAt: '2026-04-29T00:00:00Z',
    content: '본문',
    source: { name: 'Example' },
  },
  {
    author: '작성자',
    title: '두 번째 기사',
    description: '두 번째 설명',
    url: 'https://example.com/2',
    urlToImage: 'https://example.com/2.png',
    publishedAt: '2026-04-29T00:00:00Z',
    content: '본문',
    source: { name: 'Example' },
  },
]

it('articles 배열의 기사를 목록으로 렌더링한다', () => {
  render(<NewsList articles={articles} />)

  expect(screen.getByText('첫 번째 기사')).toBeInTheDocument()
  expect(screen.getByText('두 번째 기사')).toBeInTheDocument()
})
```

## 개선 항목별 TDD 적용 가이드

### Phase 1: 타입/lint/접근성

Red:

- `Categories`가 button role로 검색되는 테스트 작성
- `onSelectCategory`가 string category를 받는 테스트 작성
- nullable article fixture로 `NewsItem` 렌더링 테스트 작성

Green:

- `any` 제거
- `div`를 `button`으로 변경
- nullable 타입과 null guard 추가

Blue:

- `CategoryName` union 타입 도입
- category 목록을 별도 타입/상수로 정리

### Phase 2: API key 서버 이전

Red:

- 클라이언트 API 함수가 `/api/news?category=...`를 호출하는 테스트 작성
- API route가 `NEWS_API_KEY`를 사용해 provider를 호출하는 테스트 작성
- 응답 실패 시 안전한 에러 응답을 반환하는 테스트 작성

Green:

- `pages/api/news.ts` 추가
- 클라이언트 함수에서 외부 NewsAPI 직접 호출 제거
- `.env` 키를 `NEWS_API_KEY`로 변경

Blue:

- server/client API 함수를 분리
- 에러 응답 타입 정리

### Phase 3: 로딩/에러/빈 결과

Red:

- 카테고리 변경 중 skeleton이 보이는 테스트 작성
- API 실패 시 에러 메시지가 보이는 테스트 작성
- articles가 비어 있으면 빈 상태가 보이는 테스트 작성

Green:

- `loading`, `error`, `empty` 상태 추가
- try/catch/finally 구현

Blue:

- `NewsItemSkeleton`, `ErrorState`, `EmptyState` 컴포넌트 분리

### Phase 4: 이미지 fallback

Red:

- `urlToImage`가 `null`일 때 placeholder가 보이는 테스트 작성
- 이미지 alt가 기사 제목인 테스트 작성

Green:

- placeholder 경로 적용
- `alt={title}` 적용

Blue:

- `NewsImage` 컴포넌트 분리
- 이미지 로드 실패 `onError` 처리 추가

### Phase 5 이후: UI/다중 API/검색/SEO

Red:

- 사용자 관점의 렌더링/상호작용 테스트를 먼저 작성
- provider normalize 함수는 순수 함수 테스트를 먼저 작성
- 검색은 query 입력, 빈 결과, 실패 상태를 테스트로 고정

Green:

- 테스트를 통과하는 최소 구현

Blue:

- shadcn/ui 컴포넌트로 교체
- provider adapter 구조 정리
- 공통 유틸과 타입을 정리

## 작업 체크리스트

각 개선 작업 PR 또는 커밋 전 아래 순서를 확인한다.

- [ ] 변경하려는 동작을 설명하는 테스트를 먼저 작성했다.
- [ ] 테스트가 실패하는 Red 단계를 확인했다.
- [ ] 최소 구현으로 Green을 만들었다.
- [ ] 테스트가 통과한 상태에서 Blue 리팩터링을 진행했다.
- [ ] 기존 구현 기능에 대한 characterization test를 추가했다.
- [ ] `npm run test`를 실행했다.
- [ ] `npm run lint`를 실행했다.
- [ ] 필요 시 `npm run build`를 실행했다.

## 주의 사항

- 테스트가 없는 상태에서 대규모 UI 개편을 시작하지 않는다.
- 외부 News API를 실제로 호출하는 테스트를 기본값으로 두지 않는다. 네트워크는 mock한다.
- 구현 세부사항보다 사용자가 보는 결과를 테스트한다.
- shadcn/ui 도입 테스트는 클래스명보다 role, text, label, aria 상태를 우선 검증한다.
- 리팩터링 중 실패한 테스트는 기능 회귀인지 테스트 보정 대상인지 먼저 판단한다.
