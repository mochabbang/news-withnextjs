# 뉴스 이미지 폴백 처리

## 문제
뉴스 기사에 `urlToImage`가 null/빈 문자열/깨진 URL일 때:
- 현재 `NewsItem.tsx`는 `{urlToImage && (...)}` 패턴 → 이미지 영역 자체가 사라져 **카드 높이가 흔들림**
- alt가 `"thumname"` (오타) → 접근성/SEO 손해

## nullable 케이스 (모두 처리 필요)
1. `urlToImage === null`
2. `urlToImage === ''` (빈 문자열)
3. URL은 있으나 404/CORS/timeout — `onError` 이벤트로 잡아야 함
4. URL 형식 자체가 깨짐 (drive 링크, javascript: 등)

## 해결 방법

### 1. 공통 Placeholder 이미지 준비
```
/public/images/news-placeholder.png  (권장 크기: 1200x630)
```
뉴스 카드 비율 16:9 또는 2:1 기준.

### 2. NewsImage 컴포넌트 생성
```tsx
// components/NewsImage.tsx
import Image from 'next/image'
import { useState } from 'react'

const FALLBACK = '/images/news-placeholder.png'

function isValidImageUrl(src: string | null | undefined): src is string {
  if (!src) return false
  if (!src.trim()) return false
  return /^https?:\/\//.test(src)
}

export function NewsImage({ src, alt }: { src: string | null; alt: string }) {
  const initial = isValidImageUrl(src) ? src : FALLBACK
  const [imgSrc, setImgSrc] = useState(initial)

  return (
    <Image
      src={imgSrc}
      alt={alt}  // ⚠️ "thumname" 같은 placeholder text 사용 금지
      fill
      className="object-cover"
      unoptimized
      onError={() => setImgSrc(FALLBACK)}
    />
  )
}
```

### alt 정책
- 기사 제목을 그대로 사용 (`alt={title}`)
- placeholder 이미지일 때도 의미있는 alt 유지 (`"뉴스 이미지 없음 — ${title}"`)
- 빈 문자열 alt는 장식 이미지에만

### 3. NewsItem에서 사용
```tsx
<div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
  <NewsImage src={article.urlToImage} alt={article.title} />
</div>
```

### 4. next.config.js — 외부 도메인 허용
```js
images: {
  domains: ['*'],  // 또는 구체적 도메인 목록
  unoptimized: true,
}
```

## 추가: 소스별 기본 이미지
카테고리별 placeholder를 다르게 설정 시:
```ts
const CATEGORY_FALLBACKS: Record<string, string> = {
  business: '/images/business.png',
  sports: '/images/sports.png',
  default: '/images/news-placeholder.png',
}
```
