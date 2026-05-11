# 다크모드 / SEO / 유틸리티 개선

## 다크 모드 (next-themes)

### 설치
```bash
npm i next-themes
```

### Provider 설정
```tsx
// pages/_app.tsx
import { ThemeProvider } from 'next-themes'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
```

### Toggle 컴포넌트
```tsx
// components/ThemeToggle.tsx
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button variant="ghost" size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      <Sun className="h-5 w-5 dark:hidden" />
      <Moon className="h-5 w-5 hidden dark:block" />
    </Button>
  )
}
```

### tailwind.config.js
```js
darkMode: ['class'],
```

---

## SEO 메타태그

### 현재 문제
- `_document.tsx`의 `<Head>` 비어있음
- 페이지별 title/description 없음

### 공통 SEO 컴포넌트
```tsx
// components/Seo.tsx
import Head from 'next/head'

export function Seo({ title, description, image }: {
  title?: string; description?: string; image?: string
}) {
  const t = title ? `${title} | 뉴스` : '뉴스 — 한국 헤드라인'
  const d = description ?? '실시간 한국 뉴스 헤드라인'
  const img = image ?? '/images/og-default.png'
  return (
    <Head>
      <title>{t}</title>
      <meta name="description" content={d} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  )
}
```

### _document.tsx 보강
```tsx
<Head>
  <meta charSet="utf-8" />
  <link rel="icon" href="/favicon.ico" />
  <meta name="theme-color" content="#000000" />
</Head>
```

---

## 날짜 포맷 (상대 시간)

### Option A: Intl.RelativeTimeFormat (의존성 0)
```ts
// utilities/formatDate.ts
const rtf = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' })

export function formatRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2592000, 'week'],
    [31536000, 'month'],
  ]
  for (const [limit, unit] of units) {
    if (diff < limit) {
      const value = Math.round(diff / (limit / (unit === 'second' ? 60 : 60)))
      return rtf.format(-value, unit)
    }
  }
  return rtf.format(-Math.round(diff / 31536000), 'year')
}
```
번들 크기 우선 시 권장.

### Option B: date-fns
```bash
npm i date-fns
```
```tsx
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export function formatRelative(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ko })
  // "3시간 전", "어제"
}
```
출력 자연스러움 우선 시 권장.

### NewsItem 적용
```tsx
<time dateTime={publishedAt} className="text-xs text-muted-foreground">
  {formatRelative(publishedAt)}
</time>
```

---

## 타입 강화 / 접근성

### Categories.tsx — `any` 제거
```tsx
interface Props {
  category: string
  onSelectCategory: (category: string) => void  // any → 구체적 타입
}
```

### div onClick → button
```tsx
<button
  type="button"
  onClick={() => onSelectCategory(c.name)}
  aria-pressed={category === c.name}
  className="..."
>
  {c.text}
</button>
```

### Link에 aria-label 추가
```tsx
<Link href={url} aria-label={`기사 읽기: ${title}`} target="_blank" rel="noopener noreferrer">
```

---

## 즐겨찾기 (선택)

### localStorage 기반
```ts
// hooks/useBookmarks.ts
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([])
  useEffect(() => {
    setBookmarks(JSON.parse(localStorage.getItem('bookmarks') || '[]'))
  }, [])
  const toggle = (url: string) => {
    setBookmarks(prev => {
      const next = prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
      localStorage.setItem('bookmarks', JSON.stringify(next))
      return next
    })
  }
  return { bookmarks, toggle }
}
```

`/pages/bookmarks.tsx`에서 저장된 기사 표시.