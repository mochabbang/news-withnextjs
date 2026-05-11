# shadcn/ui 설치 및 UI 개선

## 설치
```bash
npx shadcn-ui@latest init
# baseColor: slate, CSS variables: yes
```

## 필요 컴포넌트
```bash
npx shadcn-ui@latest add card badge button skeleton tabs
npx shadcn-ui@latest add input dropdown-menu sheet scroll-area
# 검색/모바일 메뉴/다크모드 토글용
```

## 사전 준비
- `tsconfig.json` paths에 `@/*` 이미 존재 (사용 가능)
- `components.json` 생성 시 `style: default`, `rsc: false` (Page Router)
- `globals.css`에 shadcn CSS variables 자동 주입됨

## 컴포넌트 매핑
| 기존 | shadcn/ui 대체 |
|------|----------------|
| NewsItem.tsx | `<Card>` + `<CardContent>` |
| Categories.tsx | `<Tabs>` or `<Badge>` 버튼 목록 |
| 로딩 상태 | `<Skeleton>` |

## 파일 구조 변경
- `components/ui/` — shadcn 자동 생성 (수정 금지)
- `components/` — 기존 커스텀 컴포넌트 유지

## 주요 변경 포인트
- `NewsItem`: Card 레이아웃, aspect-ratio 이미지 고정
- `Categories`: Tabs 또는 ScrollArea + Badge 버튼으로 교체
- `NewsList`: CSS Grid → shadcn 친화적 반응형 grid
- 색상 테마: `tailwind.config.js`에 CSS variable 기반 테마 추가

## tailwind.config.js 수정
```js
// shadcn init 후 자동 추가되는 내용 확인
content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
theme: { extend: { colors: { border: "hsl(var(--border))", ... } } }
```
