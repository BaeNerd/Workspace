# -*- coding: utf-8 -*-
"""PHASE 2 — 관리자 화면 p0(정의 슬라이드) 콘텐츠. STRUCTURE.md 정책 기반."""

DEFS = {
    "ADM-01": dict(
        screen_id="ADM-01", screen_name="관리자 대시보드 (Admin Dashboard)",
        definition=[
            "관리자·관계사 관리자 공용 대시보드. 라우트 /admin (requireAdmin + allowCompanyAdmin).",
            "KPI 5개 + 승인 대기·최근 승인 목록 + 등록 추이·카테고리·도메인 분포.",
        ],
        purpose=[
            "그룹 전체 AX 등록·승인 현황을 한눈에 조망하는 관리 진입점.",
            "조회 범위 선택으로 전사·관계사 단위 현황을 유연하게 확인.",
        ],
        rules=[
            "KPI 5종: 전체 등록물 / 승인 대기(부분 승인 포함) / 이번 달 신규 / 게시된 도구 / 누적 활용 후기.",
            "운영 상태 폐기 — '사용 가능 도구' → '게시된 도구'(승인 완료·게시 기준)로 변경.",
            "pendingCount는 baseScope 기준(조회 선택 viewScope와 무관).",
            "목업 ID는 {PREFIX}-2026-{NNN} 형식으로 통일.",
        ],
        intent=[
            "권한 범위(baseScope)와 조회 범위(viewScope)를 분리해 companyAdmin도 안전하게 조망.",
            "출처 색상·라벨을 PLATFORMS에서 파생(etc 포함)해 일관성 유지.",
        ],
    ),
    "ADM-02": dict(
        screen_id="ADM-02", screen_name="등록 검토 (병렬 2-슬롯 승인)",
        definition=[
            "AX 항목 등록 신청 검토 화면. 라우트 /admin/review (requireAdmin + allowCompanyAdmin).",
            "항목마다 순서 없는 병렬 승인 슬롯 2개(관계사 / 전사)를 개별 처리.",
        ],
        purpose=[
            "신청 항목을 슬롯 단위로 병렬 승인/반려해 게시 여부를 결정.",
            "관계사 관리자와 전사 관리자의 권한 범위를 분리해 검토.",
        ],
        rules=[
            "병렬 2-슬롯: company 슬롯(관계사 관리자 승인) / global 슬롯(전사 관리자 승인).",
            "순서 무관 — 두 슬롯 모두 승인 시 '게시됨', 어느 한쪽 반려 시 '반려'(종결).",
            "일괄 게시 버튼 없음 — 게시는 두 번째 슬롯 승인의 결과로 파생.",
            "전사 공용(company:[]) 항목은 company 슬롯도 admin만 승인 → admin이 양 슬롯 처리.",
        ],
        intent=[
            "직렬 1차/2차 폐기 — '1차/2차' 서수 명칭 전면 폐기.",
            "SlotPill·SlotCard로 병렬 진행을 시각화하고 슬롯별 자격을 명확히.",
            "배너 안내 '두 승인이 모두 완료되면 게시됩니다.'로 파생 게시 규칙 고지.",
        ],
    ),
    "ADM-03": dict(
        screen_id="ADM-03", screen_name="항목 관리 (Project Manage)",
        definition=[
            "게시된 AX 항목 전체 관리. 라우트 /admin/projects (requireAdmin + allowCompanyAdmin).",
            "편집 필드는 등록 폼과 동일한 간소화 7유형 체계.",
        ],
        purpose=[
            "게시본의 수정·삭제·노출(하이라이트/금주의 발견)을 관리.",
            "관계사 관리자는 담당 범위 항목의 제한적 관리를 수행.",
        ],
        rules=[
            "CompanyAdmin: canManageItem(담당 관계사 + 전사 공용)만 표시, 삭제만 가능.",
            "Admin 전용: ★ 하이라이트 토글, ✦ 금주의 발견 토글, 수정, 직접 등록.",
            "상태·관계사·실행 URL 편집 없음(간소화 체계 유지).",
            "expectedTimeSaved 직렬화/역직렬화(timeSavedValue·timeSavedPeriod) 유지.",
        ],
        intent=[
            "등록 폼과 동일 필드 체계로 편집 학습 비용 최소화.",
            "역할별 가능한 액션을 분리해 권한 경계를 명확히.",
        ],
    ),
    "ADM-04": dict(
        screen_id="ADM-04", screen_name="통계 (Statistics)",
        definition=[
            "통계 대시보드. 라우트 /admin/statistics (requireAdmin + allowCompanyAdmin).",
            "조회 범위 선택기 노출(pendingCount 없음).",
        ],
        purpose=[
            "등록·도메인·절감 효과·후기 등 정량 지표로 AX 확산 현황을 분석.",
            "전사·관계사 범위별로 지표를 비교.",
        ],
        rules=[
            "상단 카드 4개: 전체 등록물 / 이번 달 신규 / 참여 부서 / 참여 관계사.",
            "운영 상태 폐기 — '활성 항목' 카드 및 '항목 상태 4그룹' 차트 제거.",
            "구성 난이도 분석은 n8n 전용, 비용 구간 분석은 AI Agent 대상.",
            "절감 효과: parseTimeSaved → 연간 환산(PERIOD_MULTIPLIER).",
        ],
        intent=[
            "baseScope/viewScope·AdminScopeSelect 구조를 대시보드와 공유.",
            "출처 색상은 PLATFORMS에서 파생해 차트 일관성 유지.",
        ],
    ),
    "ADM-05": dict(
        screen_id="ADM-05", screen_name="분류 체계 관리 (Taxonomy)",
        definition=[
            "AX 항목 분류체계 관리. 라우트 /admin/taxonomy (requireAdmin 전용).",
            "탭 4종 + 자유 태그 관리.",
        ],
        purpose=[
            "등록·검토·통계에서 공용으로 쓰는 분류 축을 중앙에서 관리.",
            "유형별 전용 분류(난이도·비용·ML 유형)를 일관 유지.",
        ],
        rules=[
            "탭 4종: 업무 도메인 · 구성 난이도 · 비용 등급 · ML 모델 유형.",
            "구성 난이도는 n8n 전용.",
            "자유 태그 출처(sourceKind)는 etc(표시명 'AI 프로젝트') 포함 7유형 대응.",
            "고아 분류(n8n 노드 힌트·PA 커넥터·연동 앱·Vibe 도구 힌트)는 삭제됨.",
        ],
        intent=[
            "등록 폼에서 사라진 입력의 분류는 정리해 데이터 정합성 유지.",
            "n8n은 JSON 업로드 전환으로 수동 노드 입력이 없어 관련 분류 제거.",
        ],
    ),
    "ADM-06": dict(
        screen_id="ADM-06", screen_name="카테고리 관리 (Platforms)",
        definition=[
            "7개 카테고리 메타데이터 CRUD. 라우트 /admin/platforms (requireAdmin 전용).",
            "필드: 이름·설명·경로·색상·아이콘.",
        ],
        purpose=[
            "카탈로그 전반의 카테고리 표시(이름·색상·아이콘·경로)를 중앙 관리.",
            "신규 아이콘 프리셋을 즉시 반영.",
        ],
        rules=[
            "표시 문자열은 '카테고리', 라우트/파일명/코드 심볼은 platform 계열 유지.",
            "IconPicker는 ICON_PRESETS 그리드(repeat(3,1fr))로 선택.",
            "미등록 아이콘 키는 iconPreset() 폴백(automation)으로 방어.",
            "PlatformIcon이 iconPreset(icon).path로 SVG 렌더.",
        ],
        intent=[
            "출처 색상·경로 SSOT(PLATFORMS)를 편집하는 단일 지점.",
            "아이콘 레지스트리 확장이 선택 패널에 자동 노출되도록 설계.",
        ],
    ),
    "ADM-07": dict(
        screen_id="ADM-07", screen_name="조직 관리 (Org)",
        definition=[
            "조직 관리 4개 섹션. 라우트 /admin/org (requireAdmin 전용).",
            "관계사 노출 · 부서 · 관계사 관리자 현황 · 문의 채널 설정.",
        ],
        purpose=[
            "관계사·부서 조직 데이터와 노출 정책, 운영 설정을 관리.",
            "관계사 관리자 지정 현황을 읽기 전용으로 조망.",
        ],
        rules=[
            "섹션1 관계사 노출: visible:true인 관계사만 사용자 목록·필터·통계에 노출.",
            "섹션3 관계사 관리자 현황은 읽기 전용 투영 — 지정·해제는 AdminUsers에서만.",
            "섹션4 문의 채널: Teams 채널 URL(config/operations.ts 연동 대상).",
            "비노출 처리해도 기존 항목 데이터는 삭제되지 않음.",
        ],
        intent=[
            "편집 지점(사용자 관리)과 현황판(조직 관리)을 분리해 SSOT 유지.",
            "isGroupViewer 보유자는 비노출 관계사도 조회 가능.",
        ],
    ),
    "ADM-08": dict(
        screen_id="ADM-08", screen_name="사용자·권한 관리 (Users)",
        definition=[
            "사용자 권한 관리. 라우트 /admin/users (requireAdmin 전용). 탭 4종.",
            "'관리자 권한' 탭이 관리자 지정의 유일한 편집 지점.",
        ],
        purpose=[
            "전사/관계사 관리자 지정·회수와 담당 관계사 편집을 수행.",
            "그룹 전체보기·등록자·활동 로그를 관리.",
        ],
        rules=[
            "2-tier 권한: User / Admin. adminScope global(전사)·company(관계사).",
            "companyAdmin은 managedCompanies: string[] (복수 담당 가능).",
            "가드1 — 전사 관리자 최소 1명 유지: '전사 관리자는 최소 1명 유지해야 합니다. 회수할 수 없습니다.'",
            "가드2 — 담당 관계사 최소 1곳: '담당 관계사는 1곳 이상이어야 합니다. 담당을 모두 해제하려면 권한 회수를 사용하세요.'",
        ],
        intent=[
            "관리자 지정 SSOT를 이 화면 한 곳으로 집중(AdminOrg는 읽기 전용 투영).",
            "담당 관계사 칩 인라인 편집으로 복수 관계사 담당을 직관적으로 관리.",
        ],
    ),
}
