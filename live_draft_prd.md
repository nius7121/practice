# 제품 요구사항 정의서 (PRD): Live Draft Program (Enhanced Edition)

## 1. 개요 (Overview)
- **프로젝트 명:** Live Draft Program (라이브 드래프트 프로그램 - 프로페셔널 에디션)
- **목적:** 기존의 획일적이고 평이한 AI 생성 스타일의 UI/UX를 탈피하여, **애플(Apple) 스타일의 미니멀하고 세련된 디자인**, 강력한 실시간 인터랙션, 그리고 시연(Presentation)과 공유에 최적화된 하이엔드 드래프트 플랫폼으로 재구축합니다.
- **배포 및 호스팅:** GitHub Pages (`https://tjdr1517.github.io/prd/`) 및 Firebase 연동 구조
- **타겟 사용자:** 교사 해커톤 참여자, 교육 현장 실무자, 협업 프로젝트 팀원 및 프레젠테이션 시연자

---

## 2. 목표 및 대상 (Objectives & Target Audience)
- **핵심 목표:**
  1. **Apple-like Aesthetics:** 샌프란시스코 폰트 느낌의 깔끔한 타이포그래피, 세련된 공백(Whitespace), 글래스모피즘(Glassmorphism)과 미세한 블러 효과, 다크 모드/라이트 모드 완벽 지원.
  2. **Live Demonstration Ready:** 발표 및 시연 시 청중의 이목을 사로잡을 수 있는 부드러운 애니메이션, 모던한 카드 레이아웃, 직관적인 상태 변화 시각화.
  3. **Seamless Sharing & Export:** 작성된 드래프트를 원클릭으로 정교한 Markdown(`.md`) 파일로 다운로드하거나 URL을 통해 타인과 즉시 공유.
- **타겟 사용자:**
  - 교육 현장 및 공모전에서 세련된 웹 프로토타입과 시연을 필요로 하는 교사 및 개발자
  - 실시간으로 아이디어를 구조화하고 문서화해야 하는 기획자 및 팀 프로젝트 리더

---

## 3. 핵심 기능 (Core Features)
1. **실시간 인터랙티브 드래프트 에디터 (Live Draft Workspace):**
   - 좌측 실시간 입력 및 섹션 구성 패널과 우측 라이브 프리뷰 패널의 실시간 양방향 동기화.
   - 드래그 앤 드롭 및 직관적인 섹션 순서 변경 기능.
2. **애플 스타일 미니멀 UI/UX 테마:**
   - 일관된 카드 컴포넌트, 섬세한 테두리(Border), 미려한 섀도우, 부드러운 호버(Hover) 효과.
   - 직관적인 토글 스위치 형태의 테마 및 뷰 모드 전환.
3. **발표 및 시연(Presentation) 모드:**
   - 복잡한 UI 요소를 숨기고 핵심 드래프트 내용만 풀스크린으로 깔끔하게 보여주는 시연용 포커스 뷰 제공.
4. **원클릭 마크다운(.md) 다운로드 및 파싱:**
   - 작성된 구조를 표준 Markdown 형식으로 완벽하게 변환하여 브라우저 내에서 즉시 `.md` 파일로 다운로드.
5. **클라우드 공유 및 세션 링크 생성:**
   - 고유 링크를 통해 다른 사람들과 드래프트 내용을 공유하고 검토할 수 있는 협업 베이스 제공.

---

## 4. 화면 구성 (Screen Architecture)
- **상단 내비게이션 바 (Top Header):**
  - 로고 및 프로젝트 타이틀 입력 필드 ("Live Draft Program").
  - 우측 액션 버튼 군: [시연 모드 전환], [공유하기], [다운로드 (.md)].
- **메인 레이아웃 (Split-Screen Workspace):**
  - **좌측 패널 (Section & Content Controller):** 섹션 추가/삭제, 항목 관리, 실시간 입력 폼.
  - **우측 패널 (Live Preview & Structural Inspector):** 애플 스타일의 카드형 카드 레이아웃으로 실시간 렌더링되는 프리뷰 영역.
- **모달 및 알림 창 (Toast & Modals):**
  - 다운로드 완료 알림, 공유 링크 복사 완료 피드백 등 미려한 토스트 메시지 UI.

---

## 5. 기술 스택 (Tech Stack)
- **Frontend Framework:** Vanilla HTML5, CSS3 (Tailwind CSS v3/v4 활용 및 커스텀 Apple 스타일 디자인 시스템 적용), Modern JavaScript (ES6+)
- **Build & Version Control:** Antigravity IDE 환경에서의 개발 및 테스트
- **Deployment:** GitHub Pages (`https://tjdr1517.github.io/prd/`) 및 Firebase Hosting 병행 지원
- **Utilities:** Markdown 파서 및 Blob API를 활용한 클라이언트 사이드 `.md` 파일 생성 다운로드 엔진

---

## 6. 범위 (In-Scope vs Out-of-Scope)

### In-Scope (이번 개편에 포함되는 범위)
- 애플 스타일의 미니멀 UI/UX 디자인 시스템 전면 적용 (색상 팔레트, 타이포그래피, 글래스모피즘)
- 좌우 분할형 실시간 드래프트 편집 및 프리뷰 시스템 구현
- 원클릭 `.md` 파일 다운로드 기능 고도화
- 발표 및 시연을 위한 프레젠테이션 포커스 모드 구현
- GitHub Pages 배포 설정 (`https://tjdr1517.github.io/prd/`)

### Out-of-Scope (향후 고도화 단계에서 다룰 범위)
- 백엔드 데이터베이스를 활용한 실시간 멀티플레이어 동시 편집 (WebSocket 기반 실시간 커서 공유)
- 복잡한 사용자 권한 관리(RBAC) 및 팀 워크스페이스 조직도 기능
- 외부 서드파티 서비스(Notion, Google Docs 등) API 양방향 실시간 동기화
