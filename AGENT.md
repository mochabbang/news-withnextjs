# 개선 계획 (리뷰 반영판)

## 결정사항
- Pages Router 유지 (App Router 마이그레이션 X)
- API key 서버 측 이전 필수 (`NEXT_PUBLIC_` 제거)
- 공통 `Article` normalize 계층 선행
- 검증: `npm run lint`, `npm run build` 통과

## 구현 순서 (안전 순서)
1. 타입/lint/접근성 기초 (any 제거, button화)
2. API key 서버 이전, API 호출 계층 정리
3. 로딩/에러/빈 결과 상태 추가
4. 이미지 placeholder + 카드 레이아웃 안정화
5. 반응형/Tailwind breakpoint 정리
6. shadcn/ui 기반 컴포넌트 도입
7. 다중 News API adapter 구조
8. 검색/더보기·페이지네이션
9. SEO, 다크 모드, 상대시간 마무리

## 완료 기준
각 단계마다 lint/build 통과, 모바일 뷰포트 확인.
