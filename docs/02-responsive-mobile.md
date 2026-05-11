# 반응형 모바일/웹뷰 대응

## 현재 문제
- `tailwind.config.js`의 `md: { max: '768px' }` — max-width 방식으로 모바일 우선 설계 불명확
- 웹뷰(앱 내 브라우저) 고려 없음

## 개선 전략

### breakpoint 재정의
```js
// tailwind.config.js
screens: {
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
}
```

### 레이아웃 구조
```
모바일(~768px): 1열 카드 리스트, 하단 고정 카테고리 탭
태블릿(768~): 2열 그리드
데스크탑(1024~): 3열 그리드
```

### 웹뷰 대응
- `viewport` 메타태그: `width=device-width, initial-scale=1, viewport-fit=cover`
- `safe-area-inset` 패딩 적용 (iOS 노치/홈바)
- 터치 영역 최소 44px 보장 (`min-h-[44px]`)
- 폰트 크기 `text-sm` 이상 유지 (16px 미만 시 iOS 자동 확대)
- 스크롤: `overflow-x-hidden` body, 카테고리는 `overflow-x-auto`

### _document.tsx 수정
```tsx
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### 카테고리 컴포넌트
```tsx
// 모바일: 수평 스크롤 탭
<div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
  {categories.map(cat => <Badge key={cat} ... />)}
</div>
```

## 현재 코드 문제점
- `NewsList.tsx`: `w-[768px]` 고정폭 → `max-w-screen-md mx-auto`로 교체
- `Categories.tsx`: `div onClick` → `<button>`으로 교체 (접근성/터치)
- `NewsItem.tsx`: `flex` 가로 배치 고정 → 모바일 세로/데스크탑 가로 조건부
- `tailwind.config.js`: `md: { max: '768px' }` (max-width) → 표준 min-width 방식으로 변경 필요

## 권장 NewsItem 레이아웃
```tsx
<Card className="flex flex-col sm:flex-row overflow-hidden">
  <div className="relative aspect-video sm:w-40 sm:aspect-square shrink-0">
    <NewsImage ... />
  </div>
  <CardContent className="flex-1 p-3 sm:p-4">
    <h3 className="font-semibold line-clamp-2">{title}</h3>
    <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{description}</p>
    <time className="text-xs text-muted-foreground mt-2 block">{relative}</time>
  </CardContent>
</Card>
```

## line-clamp 정책
- 제목: `line-clamp-2` (최대 2줄, 모바일/데스크탑 동일)
- 설명: `line-clamp-3` 모바일, `line-clamp-2` sm 이상 (가로 카드일 때)
- Tailwind v3.3.x는 `line-clamp` 빌트인 — 별도 plugin 불필요

## 컨테이너 정리
```tsx
// before: w-[768px] my-0 mx-auto md:w-full
// after
<div className="max-w-screen-md w-full mx-auto px-4">
```

## aspect-ratio 우선
- `w-[130px] h-[100px]` → `aspect-video` 또는 `aspect-[4/3]`
- 이미지 유무와 무관하게 카드 높이 일정 → 리스트 흔들림 제거
