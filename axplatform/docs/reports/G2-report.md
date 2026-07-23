# G2 — F1r [확인 필요] 4건 처리 (목업 정합 마감) 보고서

> `tsc -b` EXIT 0 · 전 목업 ID 충돌 재검 **동일 ID·상이 제목 0건** (스캔 대상 93개 항목 ID)
> 목업 데이터·상수만 수정, 로직·타입·내부 식별자 무변경.

## 처리 개요 (F1r [확인 필요] 대응)

| # | F1r 항목 | 결정 | 결과 |
|---|---|---|---|
| 1 | Admin 데모 큐 ID 충돌 | SSOT 일원화하지 않고 **새 ID(다음 순번) 발급** | 충돌 21건 재배번 |
| 2 | AdminUsers 감사 로그 | 이력 원본 보존 | **무변경 확인** |
| 3 | statsMockData DOMAIN_LABELS 8종 | BusinessDomain **6종 정합** | 라벨·집계·차트 6종화 |
| 4 | 텍스트 드리프트(VIBE 요약·PA 담당자) | 상세 페이지를 **SSOT로 통일** | 정정 완료 |

---

## 1. Admin 데모 큐 ID 충돌 해소

원칙: **카탈로그 SSOT(`ProjectListPage.MOCK_ASSET_ITEMS`)와 같은 ID를 다른 제목으로 쓰는 건만** 대상.
새 ID = 해당 카테고리·2026년 **다음 순번**(전 목업 사용 최대값 이후, 결번 없이 연속). 제목(미게시 모델명 포함)은 유지.
동일 데모 항목(원본 ID·제목 동일)이 여러 화면에 나뉘어 있으면 **같은 새 ID**로 통일, 원본 ID가 같아도 제목이 다르면 별개로 취급.

카테고리별 발급 시작 순번: N8N=32, PA=13, AST=19, AIO=12, ML=6, VIBE=7, ETC=2.

### 재배번 매핑

| 파일 | 위치 | 제목 | 기존 ID | 새 ID |
|---|---|---|---|---|
| AdminDashboard | PENDING | GPT-5.4 Mini | AIO-2026-007 | **AIO-2026-012** |
| AdminDashboard | PENDING | 불량품 분류 ML 모델 | ML-2026-003 | **ML-2026-006** |
| AdminDashboard | RECENT_APPROVED | Claude Sonnet 5 | AIO-2026-005 | **AIO-2026-013** |
| AdminDashboard | RECENT_APPROVED | 주간 보고서 초안 생성 도구 | VIBE-2026-001 | **VIBE-2026-007** |
| AdminProjectManage | INITIAL | Outlook 긴급 메일 자동 전달 | N8N-2026-001 | **N8N-2026-032** |
| AdminProjectManage · AdminStatistics | INITIAL · TOP5 | 구매 결재 자동 승인 플로우 | PA-2026-001 | **PA-2026-013** |
| AdminProjectManage · AdminStatistics | INITIAL · TOP5 | 해외법인 계약서 1차 검토 비서 | AST-2026-001 | **AST-2026-019** |
| AdminProjectManage · AdminStatistics | INITIAL · TOP5 | Claude Opus 4.8 | AIO-2026-002 | **AIO-2026-014** |
| AdminProjectManage · AdminStatistics | INITIAL · TOP5 | 성분 이미지 품질 분류 모델 | ML-2026-001 | **ML-2026-007** |
| AdminProjectManage | INITIAL | 원가 계산 자동화 스크립트 | VIBE-2026-001 | **VIBE-2026-008** |
| AdminProjectManage · AdminReview · AdminTaxonomy | INITIAL · 큐 · 자유태그 | 사내 AI 뉴스 주간 요약 미니 프로젝트 | ETC-2026-001 | **ETC-2026-002** |
| AdminReview · AdminTaxonomy | 큐 · 자유태그 | 구매 결재 자동 승인 플로우 | PA-2026-003 | **PA-2026-014** |
| AdminReview | 큐 | GPT-4o | AIO-2026-006 | **AIO-2026-015** |
| AdminReview · AdminTaxonomy | 큐 · 자유태그 | 성분 이미지 품질 분류 모델 | ML-2026-002 | **ML-2026-008** |
| AdminTaxonomy | 자유태그 | 재고 임계치 도달 시 Teams 알림 | N8N-2026-010 | **N8N-2026-033** |
| AdminTaxonomy | 자유태그 | 신제품 기획서 초안 작성 도우미 | AST-2026-007 | **AST-2026-020** |
| AdminTaxonomy | 자유태그 | Llama 3 | AIO-2026-005 | **AIO-2026-016** |
| AdminTaxonomy | 자유태그 | Cursor 기반 내부 API 자동 생성 | VIBE-2026-001 | **VIBE-2026-009** |

> 참고: 원본 `AIO-2026-005`는 두 화면에서 **다른 제목**(Claude Sonnet 5 / Llama 3)으로 쓰여 각각 013·016으로 분리. 원본 `VIBE-2026-001`도 세 화면에서 서로 다른 제목이라 007·008·009로 분리.

### 유지(충돌 아님) 확인
- **대기 큐 미게시 모델명**(Claude Sonnet 5, GPT-5.4 Mini, GPT-4o, Llama 3 등) 제목은 정상 시나리오로 **유지** — ID만 교체.
- SSOT와 **동일 ID·동일 제목** 참조는 정상 참조로 유지: AdminStatistics TOP5 `N8N-2026-001`(신규 입사자 계정 자동 생성), AdminReview `AST-2026-011`·`N8N-2026-014`, AdminTaxonomy `N8N-2026-011`, AdminDashboard `N8N-2026-029`/`PA-2026-009`/`N8N-2026-031`/`AST-2026-018`/`PA-2026-012` 등 SSOT 순번 밖 신규 ID.
- **통계 수치는 재정렬하지 않음**: AdminStatistics TOP5의 reviewCount/avgLikes/company·순서 불변, ID 문자열만 교체.

### 스코프 확장 (검증 기준 충족 위해)
F1r가 지목한 5개 Admin 파일 외에도, **전 목업 0건** 재검 과정에서 동일 클래스 충돌이 사용자 화면에서 추가 발견되어 같은 원칙으로 정리했습니다(모두 목업 문자열 한정, 로직 무변경).

| 파일 | 성격 | 제목 | 기존 ID | 처리 |
|---|---|---|---|---|
| MyStatusPage | 내 신청(부분 승인) | 원료 성분 규제 문의 봇 | AST-2026-011 | **AST-2026-021** (AdminReview AST-2026-011과 충돌 해소) |
| MyStatusPage | 내 신청(승인 대기) | 신제품 출시 승인 자동화 플로우 | PA-2026-003 | **PA-2026-015** (SSOT PA-2026-003 충돌 해소) |
| MyStatusPage | 내 신청(반려) | 색차 불량 이미지 분류 모델 | ML-2026-005 | **ML-2026-009** (SSOT ML-2026-005 충돌 해소) |
| AssetItemDetailPage | AST-2026-001 활용 후기 | (itemTitle 드리프트) | — | itemTitle "계약서 AI 검토 비서" → **"법무 검토 보조 봇"** (SSOT 제목 통일) |
| MyStatusPage | 내가 남긴 후기(mr2) | (itemTitle 드리프트) | — | itemTitle "해외법인 계약서 1차 검토 비서" → **"법무 검토 보조 봇"** (SSOT 제목 통일) |

> 재배번 대상은 모두 게시 전(대기/부분/반려) 신청이라 상세 이동 링크가 없어 라우팅 영향 없음. 반려 사유의 `ML-2026-001` 참조(유사 운영 모델)는 실제 SSOT 항목이라 유지.

---

## 2. AdminUsers 감사 로그 — 무변경 확인

`LOGS` 배열의 이력 레코드는 원본 보존 원칙에 따라 **일절 수정하지 않음**:
- `AGENT-2025-007` (원료 추천 에이전트 · 승인 이력)
- `HKGPT-2025-018` (계약서 요약 비서 · 반려 이력)
- (`N8N-2025-031` 등 여타 2025년 감사 로그 포함) — 과거 이벤트 기록으로 규격 외 접두어라도 이력 원본 그대로 보존.

`git diff` 상 `AdminUsers.tsx` 변경 없음.

---

## 3. statsMockData `DOMAIN_LABELS` 6종 정합

8종(제조/생산·IT 인프라·재무/회계·데이터/분석·HR/인사·마케팅·영업/CRM·기타) → 정식 **BusinessDomain 6종(영업·생산·연구·재무·HR·IT)**.

컬럼 매핑(전 관계사 동일 적용, 각 사 합계 보존):
- 영업 ← 마케팅 + 영업/CRM
- 생산 ← 제조/생산
- 연구 ← 데이터/분석 + 기타
- 재무 ← 재무/회계
- HR ← HR/인사
- IT ← IT 인프라

`DOMAIN_BY_COMPANY` 각 배열 8→6 재배분(합계 불변). `aggregateDomain`이 `DOMAIN_LABELS` 길이를 그대로 따르므로 AdminDashboard·AdminStatistics 도메인 차트 자동 6종화.

---

## 4. 텍스트 드리프트 → SSOT 통일 (AssetItemDetailPage)

| 항목 | 필드 | 상세(기존) | SSOT(정본) | 처리 |
|---|---|---|---|---|
| VIBE-2026-001 | summary | …판매 실적 **요약 리포트를** Slack으로 발송 | …판매 실적 **요약을** Slack으로 발송 | 상세를 SSOT로 통일 |
| PA-2026-003 | owner / ownerEmail | 이지원 / jiwon.lee@ | 김재원 / jaewon.kim@ | 상세를 SSOT로 통일 |

> PA-2026-003 담당자는 표기 일관성을 위해 이름·이메일을 함께 SSOT 값으로 정정. 지시 범위(요약·담당자) 외 필드(조회수·태그 등)는 미변경.

---

## 검증

```
tsc -b            → EXIT 0
전 목업 ID 재검   → 동일 ID·상이 제목 0건 (93개 항목 ID 스캔)
```

재검 방식: `src/**/*.{ts,tsx}`에서 `id`/`itemId` + `title`/`itemTitle` 쌍을 추출해 ID별 제목 집합을 집계, 2개 이상 제목을 갖는 ID를 0으로 확인.

### 변경 파일
- `frontend/src/mocks/statsMockData.ts` — 도메인 6종
- `frontend/src/pages/admin/AdminDashboard.tsx` — ID 4건
- `frontend/src/pages/admin/AdminProjectManage.tsx` — ID 7건
- `frontend/src/pages/admin/AdminReview.tsx` — ID 4건
- `frontend/src/pages/admin/AdminStatistics.tsx` — TOP5 ID 4건
- `frontend/src/pages/admin/AdminTaxonomy.tsx` — 자유태그 ID 7건
- `frontend/src/pages/MyStatusPage.tsx` — 신청 ID 3건 + 후기 제목 1건 (스코프 확장)
- `frontend/src/pages/AssetItemDetailPage.tsx` — VIBE 요약·PA 담당자 + AST-2026-001 후기 제목
- `frontend/src/pages/admin/AdminUsers.tsx` — **무변경**(감사 로그 보존 확인)
