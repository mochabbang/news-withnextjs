# 헤더/브랜딩 + 검색 기능

## 현재 문제
- 사이트 타이틀/로고/네비게이션 부재 (`pages/index.tsx`가 곧바로 카테고리부터 시작)
- 검색 기능 없음 — NewsAPI `everything` 엔드포인트 미사용

## Header 컴포넌트
```tsx
// components/Header.tsx
export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center gap-4 px-4">
        <Link href="/" className="font-bold text-lg">📰 News</Link>
        <SearchBar className="flex-1 max-w-md" />
        <ThemeToggle />
      </div>
    </header>
  )
}
```

## 검색 기능

### NewsAPI everything 엔드포인트
```
GET https://newsapi.org/v2/everything?q={keyword}&language=ko&sortBy=publishedAt
```

### 검색 페이지
```
/pages/search.tsx       # ?q=keyword 쿼리스트링 기반
/pages/api/search.ts    # 다중 API 검색 통합
```

### SearchBar 구현
```tsx
// debounce + router.push 방식
const [q, setQ] = useState('')
const router = useRouter()

const onSubmit = (e: FormEvent) => {
  e.preventDefault()
  if (q.trim()) router.push(`/search?q=${encodeURIComponent(q)}`)
}

return (
  <form onSubmit={onSubmit}>
    <Input
      value={q}
      onChange={e => setQ(e.target.value)}
      placeholder="뉴스 검색..."
      className="h-9"
    />
  </form>
)
```

## Layout 컴포넌트로 Header 공통화
```tsx
// components/Layout.tsx
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-4">{children}</main>
      <Footer />
    </div>
  )
}
// _app.tsx에서 Layout으로 wrap
```
