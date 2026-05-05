# AI Chat — 실행 계획 (TODO)

> 각 Phase는 이전 Phase의 완료를 전제로 합니다.  
> 체크박스를 사용해 진행 상황을 추적하세요.

---

## Phase 1 — 프로젝트 초기화

> 목표: 로컬에서 `npm run dev`가 실행되는 골격 완성

- [x] **1.1** Next.js 15 프로젝트 생성
  ```bash
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
  ```
- [x] **1.2** `next.config.ts`에 `output: 'standalone'` 추가 (Cloud Run 빌드용)
- [x] **1.3** shadcn/ui 초기화
  ```bash
  npx shadcn@latest init
  ```
- [x] **1.4** 핵심 패키지 설치
  ```bash
  npm install @anthropic-ai/sdk mongoose
  npm install -D @types/mongoose
  ```
- [x] **1.5** `.env.local` 파일 생성 (`.env.example` 기반)
  ```
  ANTHROPIC_API_KEY=
  MONGODB_URI=
  ACCESS_CODE=
  ADMIN_CODE=
  SESSION_SECRET=
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```
- [x] **1.6** `.gitignore`에 `.env.local`, `.env*.local` 포함 확인
- [x] **1.7** 디렉토리 구조 생성
  ```
  src/lib/db/models/
  src/lib/
  src/types/
  src/components/chat/
  src/components/characters/
  src/components/ui/
  ```

---

## Phase 2 — 데이터베이스 & 모델

> 목표: MongoDB Atlas 연결 + Mongoose 모델 정의

- [ ] **2.1** MongoDB Atlas 클러스터 생성 (Free Tier M0 권장) — **수동 작업 필요**
  - Network Access: `0.0.0.0/0` (개발용) → 배포 후 Cloud Run IP로 제한
  - Database User 생성 후 `MONGODB_URI`를 `.env.local`에 입력
- [x] **2.2** `src/lib/db/connect.ts` — Mongoose 연결 싱글톤 구현
  - 개발 환경에서 핫 리로드 시 연결 재사용 (`global._mongooseConn` 패턴)
- [x] **2.3** `src/lib/db/models/character.ts` — Character 스키마 정의
  ```
  name, description, personality, systemPrompt,
  avatarUrl?, isPublic, createdBy, createdAt
  ```
- [x] **2.4** `src/lib/db/models/conversation.ts` — Conversation 스키마 정의
  ```
  characterId (ref), sessionId, messages[{role, content, createdAt}], updatedAt
  ```
- [x] **2.5** `src/types/character.ts`, `src/types/conversation.ts` — TypeScript 인터페이스 작성
- [x] **2.6** `scripts/seed.ts` — 관리자 캐릭터 시드 스크립트 작성 (샘플 캐릭터 4개)
  ```bash
  # MONGODB_URI를 .env.local에 입력한 뒤 실행
  npx tsx scripts/seed.ts
  ```

---

## Phase 3 — 핵심 라이브러리

> 목표: 공통 유틸리티 완성

- [x] **3.1** `src/lib/claude.ts` — Anthropic 클라이언트 싱글톤
- [x] **3.2** `src/lib/session.ts` — 클라이언트 세션 ID 헬퍼
  - `getSessionId()`: `localStorage`에서 UUID 읽기, 없으면 `crypto.randomUUID()`로 생성 후 저장
- [x] **3.3** `src/lib/auth.ts` — 액세스 코드 검증 유틸리티
  - `verifyAccessCode`, `verifyAdminCode` — timing-safe 비교
  - `signAccessToken` / `verifyAccessToken` — HMAC-SHA256 서명 + 만료 검증

---

## Phase 4 — 접근 제어 (Access Control)

> 목표: 액세스 코드 없이는 앱에 진입 불가

- [x] **4.1** `src/proxy.ts` — Next.js 16 Proxy (구 미들웨어) 작성
  - `access_token` 쿠키 검증 (jose HS256 JWT)
  - 미인증 요청 → `/access?from=...`으로 리디렉션
- [x] **4.2** `src/app/api/access/route.ts` — `POST /api/access`
  - 요청 body의 `code`를 `ACCESS_CODE` env와 timing-safe 비교
  - 성공 시 `access_token` HttpOnly 쿠키 설정 (만료: 7일)
  - 실패 시 401 반환
- [x] **4.3** `src/app/access/page.tsx` — 액세스 코드 입력 페이지
  - shadcn/ui `Input` + `Button`, `useSearchParams` Suspense 래핑
  - 성공 시 원래 경로로 리디렉션

---

## Phase 5 — 캐릭터 API

> 목표: 캐릭터 CRUD REST API 완성

- [x] **5.1** `src/app/api/characters/route.ts`
  - `GET` — 공개 캐릭터 + 현재 세션의 캐릭터 목록 반환 (`X-Session-Id` 헤더 기반)
  - `POST` — 새 캐릭터 생성 (`createdBy` = 세션 ID)
- [x] **5.2** `src/app/api/characters/[id]/route.ts`
  - `GET` — 단일 캐릭터 조회
  - `PATCH` — 수정 (소유자 또는 admin 캐릭터면 `X-Admin-Code` 검증)
  - `DELETE` — 삭제 (소유자 또는 admin만 가능)
- [x] **5.3** Zod v4 입력 유효성 검증
  - `name`, `description`, `systemPrompt` 필수 / `avatarUrl` URL 형식 검증
  - 공통 응답 헬퍼 `src/lib/api-helpers.ts` 추가

---

## Phase 6 — 대화 API & 스트리밍 채팅

> 목표: 실시간 스트리밍 채팅 및 대화 히스토리 저장

- [x] **6.1** `src/app/api/conversations/route.ts`
  - `GET` — 세션 ID로 대화 목록 반환 (최신순, 캐릭터 정보 populate)
- [x] **6.2** `src/app/api/conversations/[id]/route.ts`
  - `GET` — 전체 메시지 반환 (세션 소유자 검증)
- [x] **6.3** `src/app/api/chat/route.ts` — 스트리밍 채팅 엔드포인트
  - `{ characterId, conversationId?, message }` + `X-Session-Id` 헤더
  - 최근 40개 메시지 히스토리 유지
  - `anthropic.messages.stream()` → `ReadableStream` 청크 스트리밍
  - 스트림 완료 후 MongoDB에 비동기 저장 (클라이언트 블로킹 없음)
  - 응답 헤더 `X-Conversation-Id`로 대화 ID 전달

---

## Phase 7 — UI 컴포넌트

> 목표: 재사용 가능한 UI 컴포넌트 라이브러리 구성

- [x] **7.1** shadcn/ui 컴포넌트 설치 (card, textarea, avatar, badge, scroll-area, separator, dialog)
- [x] **7.2** `src/components/characters/CharacterCard.tsx` — 아바타/이름/설명 + 대화시작/편집/삭제 버튼
- [x] **7.3** `src/components/characters/CharacterGrid.tsx` — 반응형 그리드 + "새 캐릭터 만들기" 버튼
- [x] **7.4** `src/components/characters/CharacterForm.tsx` — shadcn Dialog 모달, 생성/편집 공용
- [x] **7.5** `src/components/chat/MessageBubble.tsx` — 사용자(우, 다크) / 어시스턴트(좌, 회색) 버블
- [x] **7.6** `src/components/chat/StreamingMessage.tsx` — 타이핑 도트 애니메이션 + 커서 깜박임
- [x] **7.7** `src/components/chat/ChatInput.tsx` — 자동 높이 조절, Enter 전송, Shift+Enter 줄바꿈
- [x] **7.8** `src/components/chat/ConversationSidebar.tsx` — 대화 목록, 활성 대화 하이라이트
- [x] `src/lib/hooks/use-session-id.ts` — localStorage sessionId SSR-safe 훅

---

## Phase 8 — 페이지 구현

> 목표: 완전히 동작하는 앱 플로우 완성

- [x] **8.1** `src/app/page.tsx` — 캐릭터 선택 홈 (서버 컴포넌트, 공개 캐릭터 초기 로드)
- [x] **8.2** `src/app/chat/[characterId]/page.tsx` + `ChatInterface.tsx` — 채팅 인터페이스
  - 서버에서 캐릭터 로드, 클라이언트에서 스트리밍 + 히스토리 관리
  - `ReadableStream` 청크 누적 → `streamingText` 상태로 실시간 렌더링
- [x] **8.3** `src/app/characters/page.tsx` — 내 캐릭터 관리 (스켈레톤 로딩 포함)
- [x] **8.4** `src/app/layout.tsx` + `NavBar.tsx` — Geist 폰트, 조건부 네비게이션 (usePathname으로 /access에서 숨김)

---

## Phase 9 — 관리자 기능

> 목표: 관리자 캐릭터 등록 및 관리

- [x] **9.1** `src/app/api/admin/characters/route.ts` + `[id]/route.ts`
  - 모든 요청에 `X-Admin-Code` 헤더 검증
  - GET (목록), POST (생성, createdBy: "admin"), PATCH, DELETE
- [x] **9.2** `src/app/admin/page.tsx` — 관리자 캐릭터 관리 페이지
  - 2단계 인증: 접근코드(proxy) → 관리자코드(페이지 내 폼)
  - 테이블 뷰 + 공개/비공개 토글 + 편집/삭제
- [x] **9.3** `scripts/seed.ts` 실행 완료 — 캐릭터 4개 Atlas에 등록
  - `dotenv`가 `.env.local`을 자동 인식 못해 `config({ path: ".env.local" })`로 수정

---

## Phase 10 — 품질 검증

> 목표: 주요 흐름 E2E 동작 확인

- [x] **10.1** 액세스 코드 흐름 확인 *(자동 검증 완료)*
  - 잘못된 코드 → HTTP 401 + `"잘못된 접근 코드입니다."` ✓
  - 미인증 요청 → 307 `/access?from=<원래경로>` ✓ (`/`, `/admin`, `/characters` 전부 확인)
  - `/access` 페이지 200 응답 ✓
  - 올바른 코드 흐름 → 홈으로 리디렉션 + 쿠키 설정 ✓
- [x] **10.2** 캐릭터 선택 → 채팅 → 스트리밍 응답 확인 ✓
- [x] **10.3** 대화 히스토리 저장 및 재개 확인 ✓
- [x] **10.4** 사용자 캐릭터 생성/편집/삭제 확인 ✓
- [x] **10.5** `npm run build` 오류 없이 통과 확인 — 14개 라우트 모두 정상 빌드 ✓
- [x] **10.6** 모바일 반응형 레이아웃 확인 ✓

---

## Phase 11 — Docker & Cloud Run 배포

> 목표: 프로덕션 환경 배포

- [x] **11.1** `Dockerfile` 작성 (멀티스테이지 빌드, node:24-alpine 기반)
- [x] **11.2** `.dockerignore` 작성 (`node_modules`, `.env*`, `.git`)
- [ ] **11.3** Google Cloud 프로젝트 설정 — **수동 작업 필요**
  - Cloud Run API, Artifact Registry API, Secret Manager API 활성화
  ```bash
  gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
  ```
- [ ] **11.4** Google Cloud Secret Manager에 시크릿 등록 — **수동 작업 필요**
  ```bash
  echo -n "값" | gcloud secrets create ANTHROPIC_API_KEY --data-file=-
  echo -n "값" | gcloud secrets create MONGODB_URI --data-file=-
  echo -n "값" | gcloud secrets create ACCESS_CODE --data-file=-
  echo -n "값" | gcloud secrets create ADMIN_CODE --data-file=-
  echo -n "값" | gcloud secrets create SESSION_SECRET --data-file=-
  ```
- [ ] **11.5** Artifact Registry 저장소 생성 및 Docker 이미지 빌드/푸시 — **수동 작업 필요**
  ```bash
  gcloud artifacts repositories create ai-chat --repository-format=docker --location=asia-northeast3
  gcloud auth configure-docker asia-northeast3-docker.pkg.dev
  docker build -t asia-northeast3-docker.pkg.dev/[PROJECT_ID]/ai-chat/app .
  docker push asia-northeast3-docker.pkg.dev/[PROJECT_ID]/ai-chat/app
  ```
- [ ] **11.6** Cloud Run 서비스 배포 — **수동 작업 필요**
  ```bash
  gcloud run deploy ai-chat \
    --image asia-northeast3-docker.pkg.dev/[PROJECT_ID]/ai-chat/app \
    --platform managed \
    --region asia-northeast3 \
    --allow-unauthenticated \
    --set-secrets ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,MONGODB_URI=MONGODB_URI:latest,ACCESS_CODE=ACCESS_CODE:latest,ADMIN_CODE=ADMIN_CODE:latest,SESSION_SECRET=SESSION_SECRET:latest \
    --set-env-vars NEXT_PUBLIC_APP_URL=https://[SERVICE_URL]
  ```
- [ ] **11.7** 배포 URL에서 프로덕션 동작 최종 확인
- [ ] **11.8** (선택) 커스텀 도메인 연결 및 HTTPS 확인

---

## 진행 현황

| Phase | 설명 | 상태 |
|---|---|---|
| 1 | 프로젝트 초기화 | ✅ 완료 |
| 2 | 데이터베이스 & 모델 | ✅ 완료 (2.1은 수동 작업 필요) |
| 3 | 핵심 라이브러리 | ✅ 완료 |
| 4 | 접근 제어 | ✅ 완료 |
| 5 | 캐릭터 API | ✅ 완료 |
| 6 | 대화 API & 스트리밍 | ✅ 완료 |
| 7 | UI 컴포넌트 | ✅ 완료 |
| 8 | 페이지 구현 | ✅ 완료 |
| 9 | 관리자 기능 | ✅ 완료 |
| 10 | 품질 검증 | ✅ 완료 |
| 11 | Docker & 배포 | ⬜ 대기 |
