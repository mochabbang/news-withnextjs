# Quick Wins — 최우선 4가지 (Phase 1)

> 리뷰 권장: 이 4가지 먼저 끝내면 이후 UI 개편/API 확장이 안정적으로 진행됨.
> 각 작업은 독립적이며, lint/build 즉시 검증 가능.

## ① Article 타입 nullable 반영

### 현재 (`types/Article.ts`)
```ts
export type Article = {
    author: string;
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    content: string;
    source: Source;
};
```

### 문제
NewsAPI 실제 응답에서 `author`, `description`, `urlToImage`, `content`는 `null` 가능. 타입과 런타임 불일치 → 추후 provider 추가 시 더 어긋남.

### 수정
```ts
export type Article = {
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
    source: Source;
};
```

### 영향
- `NewsItem.tsx`: `description.substring(0, 100)` → null guard 필요
  ```tsx
  {description ? `${description.substring(0, 100)}...` : ''}
  ```

---

## ② Categories any 제거 + 접근성

### 현재 (`components/Categories.tsx`)
```tsx
interface Props {
    category: string;
    onSelectCategory: any;  // ❌ lint error
}
// ...
<div onClick={() => onSelectCategory(c.name)}>  // ❌ 키보드 미지원
```

### 수정
```tsx
interface Props {
    category: string;
    onSelectCategory: (category: string) => void;
}

// div → button
<button
    type="button"
    onClick={() => onSelectCategory(c.name)}
    aria-pressed={category === c.name}
    className={`text-lg whitespace-pre font-semibold pb-1 hover:text-cyan-500 md:text-base ${
        category === c.name ? categoryActiveClass : ''
    }`}
    key={c.name}
>
    {c.text}
</button>
```

### 검증
```bash
npm run lint  # any 오류 사라지는지
# Tab 키로 카테고리 순환 가능 확인
```

---

## ③ API Key 서버 이전

### 현재 (`apis/NewsApis.ts`)
```ts
const key = process.env.NEXT_PUBLIC_NEWS_API_KEY;  // ❌ 브라우저 노출
const apiNewsTopHeadLines = await axios.get(
    `https://newsapi.org/v2/top-headlines?country=kr${query}&apiKey=${key}`,
);
```

### 수정 단계
1. **`.env` 키 prefix 제거**
   ```
   # before
   NEXT_PUBLIC_NEWS_API_KEY=xxx
   # after
   NEWS_API_KEY=xxx
   ```

2. **`pages/api/news.ts` 신규**
   ```ts
   import type { NextApiRequest, NextApiResponse } from 'next'
   import axios from 'axios'

   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     const { category } = req.query
     const key = process.env.NEWS_API_KEY  // 서버 전용
     const q = !category || category === 'all' ? '' : `&category=${category}`
     try {
       const r = await axios.get(
         `https://newsapi.org/v2/top-headlines?country=kr${q}&apiKey=${key}`
       )
       res.status(200).json(r.data)
     } catch (e) {
       res.status(502).json({ error: 'fetch failed', articles: [] })
     }
   }
   ```

3. **`apis/NewsApis.ts` 수정**
   ```ts
   export const GetNewsTopHeadLines = async (category: string) => {
     const r = await fetch(`/api/news?category=${category}`)
     if (!r.ok) return null
     return r.json() as Promise<NewsTopHeadLine>
   }
   ```

4. **`pages/index.tsx` getStaticProps**
   ```ts
   // getStaticProps는 서버에서 실행되므로 직접 NewsAPI 호출 가능
   // 또는 절대 URL로 자체 API Route 호출
   import axios from 'axios'

   export const getStaticProps = async () => {
     const r = await axios.get(
       `https://newsapi.org/v2/top-headlines?country=kr&apiKey=${process.env.NEWS_API_KEY}`
     )
     return { props: { newsTopHeadLines: r.data }, revalidate: 6000 }
   }
   ```

### 주의
- `getStaticProps`는 빌드 타임 서버 실행 → `process.env.NEWS_API_KEY` 사용 가능
- 클라이언트 카테고리 변경은 반드시 `/api/news` 경유

---

## ④ 이미지 alt + null 처리

### 현재 (`components/NewsItem.tsx`)
```tsx
{urlToImage && (  // ❌ 없으면 영역 자체 사라짐 → 카드 흔들림
    <Image src={urlToImage} alt="thumname" ... />  // ❌ 의미없는 alt
)}
```

### 즉시 가능한 수정 (placeholder 도입 전 임시)
```tsx
<div className="m-1 relative w-[130px] h-[100px] md:min-w-[100px]">
    <Image
        src={urlToImage || '/images/news-placeholder.png'}
        alt={title}
        unoptimized
        fill
        style={{ objectFit: 'cover' }}
        className="rounded-[4px]"
    />
</div>
```

### 사전 작업
1. `/public/images/news-placeholder.png` 추가 (1200x630 권장)
2. `next.config.js` 외부 이미지 도메인 허용
   ```js
   images: { unoptimized: true }
   // 또는 specific domains
   ```

상세는 `04-image-fallback.md` 참조 — `NewsImage` 컴포넌트로 onError까지 처리하는 단계는 Phase 4.

---

## Phase 1 완료 체크리스트
- [ ] `npm run lint` 0 errors
- [ ] `npm run build` 성공
- [ ] 카테고리 탭 키보드(Tab/Enter)로 조작 가능
- [ ] 브라우저 DevTools Network 탭에서 `apiKey=` 노출 없음
- [ ] 이미지 없는 기사도 카드 높이 일정 (placeholder 적용 후)

이 4가지 완료 후 → Phase 2 (loading/error 상태) 진행.
