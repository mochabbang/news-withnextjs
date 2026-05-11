# 로딩 / 에러 / 페이지네이션

## 현재 문제
- `pages/index.tsx`: 카테고리 변경 시 로딩 표시 없음 — 빈 화면 깜빡임
- `apis/NewsApis.ts`: try/catch 없음 — API 실패 시 앱 크래시 가능
- 모든 기사를 한 번에 표시 — 모바일에서 스크롤 부담

## 로딩 상태

### shadcn Skeleton 사용
```tsx
// components/NewsItemSkeleton.tsx
export function NewsItemSkeleton() {
  return (
    <Card className="flex">
      <Skeleton className="w-32 aspect-video" />
      <div className="flex-1 p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </Card>
  )
}

// 사용
{loading ? Array.from({length: 6}).map((_, i) => <NewsItemSkeleton key={i} />)
        : articles.map(a => <NewsItem {...a} />)}
```

### loading state 추가
```tsx
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const getCategoryArticles = async (cat: string) => {
  setLoading(true); setError(null)
  try {
    const res = await fetch(`/api/news?category=${cat}`)
    if (!res.ok) throw new Error('Failed to fetch')
    setArticles((await res.json()).articles)
  } catch (e) {
    setError('뉴스를 불러올 수 없습니다.')
  } finally {
    setLoading(false)
  }
}
```

### 안전한 결과 타입 (Result/Either 패턴)
API 함수가 throw 대신 `Result` 반환 → 호출부 분기 명확화
```ts
// utilities/result.ts
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// apis/NewsApis.ts
export async function getNews(category: string): Promise<Result<Article[]>> {
  try {
    const r = await fetch(`/api/news?category=${category}`)
    if (!r.ok) return { ok: false, error: 'API error' }
    const json = await r.json()
    return { ok: true, data: json.articles ?? [] }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}

// 사용
const result = await getNews(cat)
if (!result.ok) setError(result.error)
else setArticles(result.data)
```

### 4가지 상태 분리
```tsx
// loading | error | empty | success
{loading && <SkeletonList />}
{!loading && error && <ErrorAlert message={error} />}
{!loading && !error && articles.length === 0 && <EmptyState />}
{!loading && !error && articles.length > 0 && <NewsList articles={articles} />}
```

## 에러 처리

### 에러 UI (shadcn Alert)
```tsx
{error && (
  <Alert variant="destructive">
    <AlertTitle>오류</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

### API Route 에러 처리
```ts
// pages/api/news.ts
try {
  const results = await Promise.allSettled([...])
  const articles = mergeAndDedup(results)
  if (articles.length === 0) {
    return res.status(503).json({ error: 'All sources failed' })
  }
  res.status(200).json({ articles })
} catch (e) {
  res.status(500).json({ error: 'Internal error' })
}
```

## 페이지네이션 / 무한 스크롤

### Option A: 더 보기 버튼 (간단)
```tsx
const [page, setPage] = useState(1)
const visible = articles.slice(0, page * 10)

<Button onClick={() => setPage(p => p + 1)}>더 보기</Button>
```

### Option B: 무한 스크롤 (IntersectionObserver)
```tsx
const sentinelRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  const obs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) setPage(p => p + 1)
  })
  if (sentinelRef.current) obs.observe(sentinelRef.current)
  return () => obs.disconnect()
}, [])

<div ref={sentinelRef} className="h-10" />
```

### NewsAPI 페이지네이션
- `pageSize=20` (기본 20, 최대 100)
- `page=N` 파라미터로 다음 페이지 요청
- 무료 플랜은 100건 제한 있음 — 클라이언트 분할이 더 안전