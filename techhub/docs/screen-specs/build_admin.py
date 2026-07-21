# -*- coding: utf-8 -*-
"""PHASE 2 v2 — 관리자 영역 화면정의서 → admin-screens.pptx
무언어 실루엣 + 우측 Description. p0 = 구조 트리 + 흐름."""
import os
from pptx.enum.text import PP_ALIGN
from spec_common import (
    new_deck, def_slide, screen, sil_box, sil_button, sil_input, sil_lines,
    sil_grid, sil_bars, sil_linechart, sil_pill, sil_circle, tiny, seg,
    G33, G66, G99, GCC, GDD, GEE, GF7, WHITE, INK,
)

prs = new_deck()


def chrome(s, R):
    """AdminNavbar(top) + AdminSidebar(left) 실루엣. 콘텐츠 rect 반환."""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    sil_box(s, x, y, w, 0.28, True, lw=1.3, fill=GF7)
    sil_pill(s, x + 0.08, y + 0.07, 0.7, 0.14, True)
    sil_circle(s, x + w - 0.28, y + 0.04, 0.2, True)
    sw = 1.05
    sil_box(s, x, y + 0.34, sw, h - 0.34, True, lw=1.3, fill=GF7)
    for i in range(6):
        sil_pill(s, x + 0.1, y + 0.46 + i * 0.32, sw - 0.2, 0.16, True)
    cx = x + sw + 0.16
    return {"x": cx, "y": y + 0.38, "w": x + w - cx, "h": y + h - (y + 0.38)}


# ============================================================
# ADM-01 관리자 대시보드
# ============================================================
def_slide(
    prs, "ADM-01", "관리자 대시보드 (Dashboard)",
    tree=[
        (0, "대시보드 (/admin)"),
        (1, "헤더 (타이틀·조회 범위 선택기)"),
        (1, "KPI 카드 ×5"),
        (1, "승인 대기 · 최근 승인 (2열)"),
        (1, "월별 등록 추이 · 카테고리별 구성"),
        (1, "비즈니스 도메인 분포"),
    ],
    flow=["범위 선택", "KPI 집계", "대기·최근 검토", "검토/상세 이동"],
    sections=[
        ("정의", ["admin·companyAdmin 공용 대시보드",
                "KPI 5 + 대기·최근 목록 + 등록 추이·카테고리·도메인"]),
        ("목적", ["그룹 전체 등록·승인 현황 조망", "전사·관계사 범위별 확인"]),
        ("룰", ["KPI 5종: 전체 등록물·승인 대기(부분 승인 포함)·이번 달 신규·게시된 도구·누적 활용 후기",
               "운영 상태 폐기('게시된 도구'=승인 완료·게시 기준)",
               "pendingCount는 baseScope 기준(조회 선택과 무관)"]),
        ("기획 의도", ["권한 범위(baseScope)·조회 범위(viewScope) 분리",
                    "출처 색상·라벨 PLATFORMS 파생"]),
    ],
)


def draw_adm01(s, R, ctx):
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]
    sil_box(s, x, y, w * 0.6, 0.28, ctx.on(1), lw=1.2)
    sil_button(s, x + w - 1.6, y, 1.5, 0.26, ctx.on(1)); tiny(s, x + w - 1.6, y, 1.5, "범위", ctx.on(1)); ctx.mk(s, 1, x - 0.02, y - 0.02)
    cy = y + 0.4
    for i in range(5):
        sil_box(s, x + i * (w / 5), cy, (w / 5) - 0.08, 0.6, ctx.on(2), lw=1.3, fill=GF7)
    ctx.mk(s, 2, x - 0.02, cy - 0.02)
    cy += 0.74
    half = (w - 0.2) / 2
    sil_box(s, x, cy, half, 1.0, ctx.on(3), lw=1.3)
    for i in range(3):
        sil_lines(s, x + 0.1, cy + 0.14 + i * 0.28, half - 0.2, ctx.on(3), n=1)
    ctx.mk(s, 3, x - 0.02, cy - 0.02)
    sil_box(s, x + half + 0.2, cy, half, 1.0, ctx.on(4), lw=1.3)
    for i in range(3):
        sil_lines(s, x + half + 0.3, cy + 0.14 + i * 0.28, half - 0.2, ctx.on(4), n=1)
    ctx.mk(s, 4, x + half + 0.2 - 0.02, cy - 0.02)
    cy += 1.14
    third = (w - 0.3) / 2
    sil_bars(s, x, cy, third, 0.9, ctx.on(5)); tiny(s, x, cy - 0.02, third, "추이", ctx.on(5)); ctx.mk(s, 5, x - 0.02, cy - 0.02)
    sil_box(s, x + third + 0.3, cy, third, 0.9, ctx.on(6), lw=1.3); sil_bars(s, x + third + 0.4, cy + 0.15, third - 0.2, 0.6, ctx.on(6), pattern=[0.9, 0.7, 0.5, 0.3])
    ctx.mk(s, 6, x + third + 0.3 - 0.02, cy - 0.02)
    cy += 1.02
    sil_box(s, x, cy, w, y + h - cy - 0.02, ctx.on(7), lw=1.3)
    sil_bars(s, x + 0.1, cy + 0.1, w - 0.2, y + h - cy - 0.22, ctx.on(7), pattern=[0.6, 0.9, 0.5, 0.7, 0.4, 0.55])
    ctx.mk(s, 7, x - 0.02, cy - 0.02)


screen(prs, ("관리자 대시보드", "대시보드", "ADM-01", "/admin"), draw_adm01, [
    (1, "헤더·조회 범위 선택기", "역할별 eyebrow + 타이틀 '대시보드'. admin 항상·companyAdmin 담당 2곳↑ 선택기, 1곳=배지, 0곳=안내", "0곳: '담당 관계사가 지정되지 않았습니다. 전사관리자에게 문의하세요.'"),
    (2, "KPI 카드 ×5", "전체 등록물 · 승인 대기(부분 승인 N건 포함) · 이번 달 신규 · 게시된 도구 · 누적 활용 후기"),
    (3, "승인 대기 패널", "미종결 대기 항목(소스·제목·부서·유형·신청일) + [전체 보기 →] + 항목별 [검토]"),
    (4, "최근 승인 패널", "최근 승인건(소스·제목·부서·승인일·'승인' 배지) + [전체 보기 →], 행 클릭→상세"),
    (5, "월별 등록 추이", "2025 · 카테고리별 7유형 스택 막대(PLATFORMS 색)"),
    (6, "카테고리별 구성", "누적 N건 구성비"),
    (7, "비즈니스 도메인 분포", "AX 플랫폼 기준 도메인 분포"),
])

# ============================================================
# ADM-02 등록 검토 (병렬 2-슬롯)
# ============================================================
def_slide(
    prs, "ADM-02", "등록 검토 (병렬 2-슬롯 승인)",
    tree=[
        (0, "등록 검토 (/admin/review)"),
        (1, "SummaryStrip 필터 ×4"),
        (1, "등록 신청 목록 (SlotPill)"),
        (1, "상세 검토 패널"),
        (2, "SlotCard 관계사 / 전사"),
        (2, "반려 (사유 필수)"),
        (2, "검토 필드(공통·유형별)"),
        (2, "승인 이력"),
    ],
    flow=["신청 수신", "검토", "슬롯 승인"],
    flow_branch=(2, "반려 → 종결"),
    sections=[
        ("정의", ["AX 항목 등록 신청 검토. 순서 없는 병렬 승인 슬롯 2개",
                "관계사 슬롯 / 전사 슬롯을 개별 처리"]),
        ("목적", ["슬롯 단위 병렬 승인/반려로 게시 여부 결정",
                "관계사·전사 권한 범위 분리 검토"]),
        ("룰", ["두 슬롯 모두 승인→게시됨, 어느 한쪽 반려→반려(종결)",
               "일괄 게시 버튼 없음(게시는 두 번째 승인의 파생)",
               "전사 공용 항목은 company 슬롯도 admin만 승인",
               "'1차/2차' 서수 명칭 전면 폐기"]),
        ("기획 의도", ["SlotPill·SlotCard로 병렬 진행 시각화",
                    "'두 승인이 모두 완료되면 게시됩니다.' 배너로 파생 게시 고지"]),
    ],
)


def draw_adm02(s, R, ctx):
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]
    for i in range(4):
        sil_box(s, x + i * (w / 4), y, (w / 4) - 0.08, 0.42, ctx.on(1), lw=1.3, fill=GF7)
    ctx.mk(s, 1, x - 0.02, y - 0.02)
    cy = y + 0.52
    lw = w * 0.36; rx = x + lw + 0.16; rw = w - lw - 0.16
    sil_input(s, x, cy, lw, 0.2, ctx.on(2)); tiny(s, x, cy, lw, "필터", ctx.on(2)); ctx.mk(s, 2, x - 0.02, cy - 0.02)
    ly = cy + 0.3
    for i in range(4):
        sil_box(s, x, ly + i * 0.5, lw, 0.42, ctx.on(3), lw=1.2)
        sil_pill(s, x + 0.06, ly + 0.06 + i * 0.5, lw * 0.4, 0.12, ctx.on(3))
        sil_box(s, x + lw - 1.0, ly + 0.14 + i * 0.5, 0.9, 0.16, ctx.on(3), lw=1.0)  # SlotPill
    ctx.mk(s, 3, x - 0.02, ly - 0.02)
    # 상세 패널
    sil_box(s, rx, cy, rw, 0.26, ctx.on(8), lw=1.1, fill=GF7); ctx.mk(s, 8, rx - 0.02, cy - 0.02)  # 게시 배너
    dy = cy + 0.34
    sil_lines(s, rx, dy, rw * 0.7, ctx.on(4), n=1); ctx.mk(s, 4, rx - 0.02, dy - 0.02)
    dy += 0.24
    sil_box(s, rx, dy, rw * 0.48, 0.6, ctx.on(4), lw=1.3); sil_box(s, rx + rw * 0.52, dy, rw * 0.48, 0.6, ctx.on(4), lw=1.3)
    sil_button(s, rx + 0.1, dy + 0.38, rw * 0.3, 0.16, ctx.on(4)); sil_button(s, rx + rw * 0.52 + 0.1, dy + 0.38, rw * 0.3, 0.16, ctx.on(4))
    dy += 0.7
    sil_button(s, rx, dy, 0.7, 0.2, ctx.on(5)); tiny(s, rx, dy, 0.7, "반려", ctx.on(5)); ctx.mk(s, 5, rx - 0.02, dy - 0.02)
    dy += 0.3
    sil_box(s, rx, dy, rw, 0.7, ctx.on(6), lw=1.3, fill=GF7); sil_lines(s, rx + 0.1, dy + 0.12, rw - 0.2, ctx.on(6), n=4); ctx.mk(s, 6, rx - 0.02, dy - 0.02)
    dy += 0.82
    sil_box(s, rx, dy, rw, y + h - dy - 0.02, ctx.on(7), lw=1.2); sil_lines(s, rx + 0.1, dy + 0.1, rw - 0.2, ctx.on(7), n=2); ctx.mk(s, 7, rx - 0.02, dy - 0.02)


_adm02 = [
    (1, "SummaryStrip 필터", "전체 · 승인 대기 · 부분 승인 · 처리완료 4칩(카운트 겸 필터)", "부분 승인 count>0 시 '관계사만 N · 전사만 N' 서브라인"),
    (2, "소스 필터 · 목록 필터", "카테고리(전체+7유형) select + 역할 배너(관계사/전사 승인 담당)"),
    (3, "등록 신청 목록", "소스·단계 배지·제목·부서·신청자 + SlotPill(관계사|전사 2분할, 승인 시 초록 ✓)", "빈 목록 '해당하는 신청 건이 없습니다.'"),
    (4, "상세 헤더·SlotCard", "카테고리·단계 배지·ID·신청일 + 슬롯 카드 2장(관계사 관리자 승인 / 전사 관리자 승인, [이 슬롯 승인])"),
    (5, "반려", "'반려' → 사유 필수 → 반려 확정 시 종결(신청자에 그대로 전달)"),
    (6, "검토 필드", "공통(이미지·제목·요약·상세·도메인·태그) + 유형별(n8n 다이어그램·난이도·절감시간 / 비서 프롬프트·모델 / AI Agent 가용·강점·URL·모델명·글분량·비용 / ML 유형·데이터·도구 / vibe·etc 공통만)"),
    (7, "승인 이력", "슬롯·액션·처리자·일시·사유 이력"),
    (8, "게시 배너", "'내용을 직접 수정한 후 승인할 수 있습니다. 두 승인이 모두 완료되면 게시됩니다.'"),
]
screen(prs, ("등록 검토 (병렬 2-슬롯)", "등록 신청 목록", "ADM-02", "/admin/review"), draw_adm02,
       _adm02, active={1, 2, 3, 4, 5, 8}, page_no=1, page_total=2, subtitle="목록·슬롯 승인")
screen(prs, ("등록 검토 (병렬 2-슬롯)", "검토 필드·이력", "ADM-02", "/admin/review"), draw_adm02,
       _adm02, active={6, 7}, page_no=2, page_total=2, subtitle="검토 필드·이력")

# ============================================================
# ADM-03 항목 관리
# ============================================================
def_slide(
    prs, "ADM-03", "항목 관리 (Project Manage)",
    tree=[
        (0, "항목 관리 (/admin/projects)"),
        (1, "좌 통합 목록"),
        (2, "전체 항목·직접 등록/담당 배지"),
        (2, "검색·소스 필터"),
        (2, "항목 리스트"),
        (1, "우 상세/편집"),
        (2, "헤더·액션(하이라이트·금주의 발견·수정·삭제)"),
        (2, "기본·유형별·신청자·담당자"),
    ],
    flow=["항목 선택", "수정/토글", "저장", "게시본 반영"],
    flow_branch=(1, "삭제 → 확인"),
    sections=[
        ("정의", ["게시된 AX 항목 전체 관리. 등록 폼과 동일 간소화 7유형 체계",
                "좌 목록 + 우 상세/편집 마스터-디테일"]),
        ("목적", ["게시본 수정·삭제·노출(하이라이트·금주의 발견) 관리"]),
        ("룰", ["CompanyAdmin: 담당+전사 공용만 표시, 삭제만 가능",
               "Admin 전용: ★ 하이라이트·✦ 금주의 발견·수정·직접 등록",
               "상태·관계사·실행 URL 편집 없음",
               "expectedTimeSaved 직렬화(timeSavedValue·timeSavedPeriod)"]),
        ("기획 의도", ["등록 폼과 동일 필드로 편집 학습 비용 최소화",
                    "역할별 가능 액션 분리로 권한 경계 명확화"]),
    ],
)


def draw_adm03(s, R, ctx):
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]
    lw = w * 0.34; rx = x + lw + 0.16; rw = w - lw - 0.16
    sil_box(s, x, y, lw, 0.28, ctx.on(1), lw=1.2); sil_button(s, x + lw - 1.0, y + 0.02, 0.95, 0.22, ctx.on(1)); ctx.mk(s, 1, x - 0.02, y - 0.02)
    sil_input(s, x, y + 0.36, lw, 0.2, ctx.on(2))
    for i in range(4):
        sil_pill(s, x + i * (lw / 4), y + 0.62, (lw / 4) - 0.05, 0.14, ctx.on(2))
    ctx.mk(s, 2, x - 0.02, y + 0.32)
    ly = y + 0.86
    for i in range(5):
        sil_box(s, x, ly + i * 0.42, lw, 0.36, ctx.on(3), lw=1.2)
        sil_pill(s, x + 0.06, ly + 0.05 + i * 0.42, lw * 0.35, 0.1, ctx.on(3)); sil_lines(s, x + 0.06, ly + 0.19 + i * 0.42, lw * 0.8, ctx.on(3), n=1)
    ctx.mk(s, 3, x - 0.02, ly - 0.02)
    # 우 상세/편집
    sil_lines(s, rx, y, rw * 0.5, ctx.on(4), n=1)
    for i in range(4):
        sil_button(s, rx + rw - 1.9 + i * 0.48, y - 0.02, 0.44, 0.22, ctx.on(4))
    ctx.mk(s, 4, rx - 0.02, y - 0.04)
    dy = y + 0.36
    sil_box(s, rx, dy, rw, 1.3, ctx.on(5), lw=1.3)
    sil_box(s, rx + 0.1, dy + 0.1, rw - 0.2, 0.4, ctx.on(5), lw=1.1, fill=GF7)
    sil_input(s, rx + 0.1, dy + 0.6, rw - 0.2, 0.18, ctx.on(5)); sil_input(s, rx + 0.1, dy + 0.88, rw - 0.2, 0.18, ctx.on(5))
    ctx.mk(s, 5, rx - 0.02, dy - 0.02)
    dy += 1.42
    sil_box(s, rx, dy, rw, 0.85, ctx.on(6), lw=1.3, fill=GF7); sil_lines(s, rx + 0.1, dy + 0.12, rw - 0.2, ctx.on(6), n=3); ctx.mk(s, 6, rx - 0.02, dy - 0.02)
    dy += 0.97
    sil_box(s, rx, dy, rw, 0.28, ctx.on(7), lw=1.1); ctx.mk(s, 7, rx - 0.02, dy - 0.02)
    dy += 0.36
    sil_box(s, rx, dy, rw, y + h - dy - 0.02, ctx.on(8), lw=1.2)
    for i in range(4):
        sil_input(s, rx + 0.1 + i * ((rw - 0.2) / 4), dy + 0.1, (rw - 0.4) / 4, 0.16, ctx.on(8))
    ctx.mk(s, 8, rx - 0.02, dy - 0.02)


_adm03 = [
    (1, "목록 헤더", "'전체 항목' N + admin 전용 [+ 직접 등록] / companyAdmin '…담당' 배지"),
    (2, "검색·소스 필터", "항목명·부서 검색 + 소스(전체+7유형) 칩 필터", "빈 목록 '검색 결과가 없습니다.'"),
    (3, "항목 리스트", "카테고리 배지·ID·제목·부서·수정일, 선택 행 강조"),
    (4, "상세 헤더·액션", "admin: ★/☆ 하이라이트 토글·✦ 금주의 발견(단일)·수정·삭제 / companyAdmin: 삭제만(담당+전사 공용만 표시)"),
    (5, "기본 정보", "첨부 사진·제목·요약·상세·업무 도메인·등록 부서·태그(쉼표 구분)"),
    (6, "유형별 세부", "n8n/PA=다이어그램·절감시간·난이도 / 비서=프롬프트·모델 / AI Agent=가용·강점·URL·모델명·글분량·비용 / ML=유형·데이터·도구"),
    (7, "등록 신청자 정보", "createdByEmail 직접 수정('퇴사·인사이동 시 직접 수정')"),
    (8, "담당자", "이름·부서·이메일·역할 + [+ 담당자 추가]"),
]
screen(prs, ("항목 관리", "항목 관리 — 목록·액션", "ADM-03", "/admin/projects"), draw_adm03,
       _adm03, active={1, 2, 3, 4}, page_no=1, page_total=2, subtitle="목록·액션")
screen(prs, ("항목 관리", "항목 관리 — 편집 필드", "ADM-03", "/admin/projects"), draw_adm03,
       _adm03, active={5, 6, 7, 8}, page_no=2, page_total=2, subtitle="편집 필드")

# ============================================================
# ADM-04 통계
# ============================================================
def_slide(
    prs, "ADM-04", "통계 (Statistics)",
    tree=[
        (0, "통계 (/admin/statistics)"),
        (1, "헤더·조회 범위 선택기"),
        (1, "상단 카드 ×4"),
        (1, "기간 프리셋 · 월 지정"),
        (1, "등록 추이 · 카테고리별 현황"),
        (1, "도메인·부서 · 절감 효과"),
        (1, "3-col 분석 · TOP5 · 키워드"),
    ],
    flow=["범위·기간 선택", "지표 집계", "차트·표 분석"],
    sections=[
        ("정의", ["통계 대시보드. 조회 범위 선택기 노출(pendingCount 없음)",
                "등록·도메인·절감·후기·키워드 정량 분석"]),
        ("목적", ["정량 지표로 AX 확산 현황 분석", "전사·관계사 범위별 비교"]),
        ("룰", ["상단 카드 4: 전체 등록물·이번 달 신규·참여 부서·참여 관계사",
               "운영 상태 폐기('활성 항목' 카드·상태 4그룹 차트 제거)",
               "난이도=n8n 전용, 비용 구간=AI Agent 대상",
               "절감 효과 parseTimeSaved→연간 환산"]),
        ("기획 의도", ["baseScope/viewScope·AdminScopeSelect 대시보드와 공유",
                    "출처 색상 PLATFORMS 파생"]),
    ],
)


def draw_adm04(s, R, ctx):
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]
    sil_box(s, x, y, w * 0.55, 0.26, ctx.on(1), lw=1.2); sil_button(s, x + w - 1.6, y, 1.5, 0.24, ctx.on(1)); tiny(s, x + w - 1.6, y, 1.5, "범위", ctx.on(1)); ctx.mk(s, 1, x - 0.02, y - 0.02)
    cy = y + 0.36
    for i in range(4):
        sil_box(s, x + i * (w / 4), cy, (w / 4) - 0.08, 0.5, ctx.on(2), lw=1.3, fill=GF7)
    ctx.mk(s, 2, x - 0.02, cy - 0.02)
    cy += 0.62
    for i in range(4):
        sil_button(s, x + i * 0.9, cy, 0.82, 0.2, ctx.on(3))
    sil_button(s, x + w - 0.9, cy, 0.85, 0.2, ctx.on(3)); ctx.mk(s, 3, x - 0.02, cy - 0.02)
    cy += 0.32
    half = (w - 0.2) / 2
    sil_bars(s, x, cy, half, 0.75, ctx.on(4)); tiny(s, x, cy - 0.02, half, "추이", ctx.on(4)); ctx.mk(s, 4, x - 0.02, cy - 0.02)
    sil_grid(s, x + half + 0.2, cy, half, 0.75, ctx.on(5), 3, 1); ctx.mk(s, 5, x + half + 0.2 - 0.02, cy - 0.02)
    cy += 0.88
    sil_box(s, x, cy, half, 0.7, ctx.on(6), lw=1.3); sil_bars(s, x + 0.1, cy + 0.12, half - 0.2, 0.45, ctx.on(6), pattern=[0.6, 0.9, 0.5, 0.7])
    ctx.mk(s, 6, x - 0.02, cy - 0.02)
    sil_box(s, x + half + 0.2, cy, half, 0.7, ctx.on(7), lw=1.3, fill=GF7); sil_lines(s, x + half + 0.3, cy + 0.12, half - 0.2, ctx.on(7), n=3)
    ctx.mk(s, 7, x + half + 0.2 - 0.02, cy - 0.02)
    cy += 0.82
    third = (w - 0.4) / 3
    for i in range(3):
        sil_box(s, x + i * (third + 0.2), cy, third, y + h - cy - 0.02, ctx.on(8 if i < 2 else 9), lw=1.2)
        sil_bars(s, x + i * (third + 0.2) + 0.08, cy + 0.1, third - 0.16, y + h - cy - 0.22, ctx.on(8 if i < 2 else 9), pattern=[0.7, 0.4, 0.9])
    ctx.mk(s, 8, x - 0.02, cy - 0.02); ctx.mk(s, 9, x + 2 * (third + 0.2) - 0.02, cy - 0.02)
    ctx.mk(s, 10, x + w - 0.28, cy - 0.02)


_adm04 = [
    (1, "헤더·조회 범위 선택기", "타이틀 '통계 대시보드' + AdminScopeSelect(pendingCount 미표시), 담당 1곳=배지·0곳=안내"),
    (2, "상단 카드 ×4", "전체 등록물 · 이번 달 신규 · 참여 부서 · 참여 관계사"),
    (3, "기간 컨트롤", "프리셋(이번 달·최근 3개월·최근 6개월·올해 전체) + [월 지정](연/월 select)"),
    (4, "등록 추이", "7유형 스택 막대(PLATFORMS 색), 기간 라벨 표기"),
    (5, "카테고리별 등록 현황", "3-col 카테고리별 건수·비율"),
    (6, "도메인·부서", "비즈니스 도메인 분포 + 부서별 현황", "빈 상태 '해당 범위의 부서 데이터가 없습니다.'"),
    (7, "절감 효과 요약", "n8n·PA 예상 절감 시간 연간 환산 + 집계 가능/추정 불가 건수"),
    (8, "3-col 분석", "난이도 분포(n8n 전용) · 비용 구간(AI Agent) · ML 모델 유형"),
    (9, "후기 많은 항목 TOP 5", "누적 후기 수 기준 상위 5(제목·ID·평균 ♥)", "빈 상태 '해당 범위의 후기 데이터가 없습니다.'"),
    (10, "탐색 키워드 빈도", "사용자 탐색 상위 키워드 막대"),
]
screen(prs, ("통계", "통계 대시보드 — 카드·추이", "ADM-04", "/admin/statistics"), draw_adm04,
       _adm04, active={1, 2, 3, 4, 5}, page_no=1, page_total=2, subtitle="카드·추이")
screen(prs, ("통계", "통계 대시보드 — 분석", "ADM-04", "/admin/statistics"), draw_adm04,
       _adm04, active={6, 7, 8, 9, 10}, page_no=2, page_total=2, subtitle="분석")

# ============================================================
# ADM-05 분류 체계 관리
# ============================================================
def_slide(
    prs, "ADM-05", "분류 체계 관리 (Taxonomy)",
    tree=[
        (0, "분류체계 (/admin/taxonomy)"),
        (1, "탭 (도메인·난이도·비용·ML) | 자유 태그"),
        (1, "고정 분류 탭"),
        (2, "좌 분류 카드·항목 리스트"),
        (2, "우 항목 추가"),
        (1, "자유 태그 탭"),
        (2, "목록·출처 필터·표준화"),
        (1, "운영 유의사항"),
    ],
    flow=["탭 선택", "항목 추가/수정/삭제", "저장"],
    flow_branch=(1, "자유 태그 → 표준화 편입"),
    sections=[
        ("정의", ["AX 항목 분류체계 관리. 탭 4종 + 자유 태그",
                "등록·검토·통계 공용 분류 축 관리"]),
        ("목적", ["공용 분류 축 중앙 관리", "유형별 전용 분류 일관 유지"]),
        ("룰", ["탭 4: 업무 도메인·구성 난이도·비용 등급·ML 모델 유형",
               "구성 난이도=n8n 전용, 비용=AI Agent 전용",
               "자유 태그 출처는 etc('AI 프로젝트') 포함 7유형",
               "고아 분류(노드 힌트·커넥터·연동앱·도구 힌트) 삭제"]),
        ("기획 의도", ["사라진 입력의 분류 정리로 데이터 정합성",
                    "n8n JSON 업로드 전환으로 노드 분류 제거"]),
    ],
)


def draw_adm05_fixed(s, R, ctx):
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]
    for i in range(5):
        sil_pill(s, x + i * 1.0, y, 0.9, 0.2, ctx.on(1) if i < 4 else False)
    ctx.mk(s, 1, x - 0.02, y - 0.02)
    cy = y + 0.34
    lw = w * 0.6; rx = x + lw + 0.2; rw = w - lw - 0.2
    sil_box(s, x, cy, lw, y + h - cy - 0.5, ctx.on(2), lw=1.3)
    sil_lines(s, x + 0.12, cy + 0.12, lw * 0.5, ctx.on(2), n=1)
    for i in range(6):
        sil_box(s, x + 0.12, cy + 0.42 + i * 0.36, lw - 0.24, 0.3, ctx.on(3), lw=1.1)
        sil_button(s, x + lw - 1.0, cy + 0.48 + i * 0.36, 0.4, 0.18, ctx.on(3)); sil_button(s, x + lw - 0.55, cy + 0.48 + i * 0.36, 0.4, 0.18, ctx.on(3))
    ctx.mk(s, 2, x - 0.02, cy - 0.02); ctx.mk(s, 3, x + lw - 1.05, cy + 0.42)
    sil_box(s, rx, cy, rw, 1.0, ctx.on(4), lw=1.3, fill=GF7); sil_input(s, rx + 0.1, cy + 0.4, rw - 0.2, 0.2, ctx.on(4)); sil_button(s, rx + 0.1, cy + 0.7, rw - 0.2, 0.2, ctx.on(4))
    ctx.mk(s, 4, rx - 0.02, cy - 0.02)
    sil_box(s, x, y + h - 0.42, w, 0.42, ctx.on(5), lw=1.1, fill=GF7); ctx.mk(s, 5, x - 0.02, y + h - 0.44)


def draw_adm05_free(s, R, ctx):
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]
    for i in range(5):
        sil_pill(s, x + i * 1.0, y, 0.9, 0.2, i == 4)
    ctx.mk(s, 1, x + 4.0 - 0.02, y - 0.02)
    cy = y + 0.34
    sil_lines(s, x, cy, w * 0.5, ctx.on(6), n=1)
    for i in range(7):
        sil_pill(s, x + i * 0.62, cy + 0.24, 0.54, 0.14, ctx.on(6))
    ctx.mk(s, 6, x - 0.02, cy - 0.02)
    ly = cy + 0.5
    for i in range(5):
        sil_box(s, x, ly + i * 0.4, w, 0.34, ctx.on(7), lw=1.2)
        sil_circle(s, x + 0.06, ly + 0.08 + i * 0.4, 0.16, ctx.on(7)); sil_pill(s, x + 0.3, ly + 0.09 + i * 0.4, 0.5, 0.14, ctx.on(7)); sil_lines(s, x + 0.86, ly + 0.1 + i * 0.4, w * 0.4, ctx.on(7), n=1)
        sil_button(s, x + w - 1.4, ly + 0.08 + i * 0.4, 0.6, 0.16, ctx.on(8)); sil_button(s, x + w - 0.75, ly + 0.08 + i * 0.4, 0.6, 0.16, ctx.on(8))
    ctx.mk(s, 7, x - 0.02, ly - 0.02); ctx.mk(s, 8, x + w - 1.42, ly - 0.02)
    sil_box(s, x, y + h - 0.5, w, 0.42, ctx.on(9), lw=1.2, fill=GF7); ctx.mk(s, 9, x - 0.02, y + h - 0.52)


screen(prs, ("분류 체계 관리", "분류체계 관리 — 고정 분류", "ADM-05", "/admin/taxonomy"), draw_adm05_fixed, [
    (1, "탭", "업무 도메인·구성 난이도·비용 등급·ML 모델 유형 | 자유 태그(카운트 배지)"),
    (2, "분류 카드·설명", "분류명 + 'AX 플랫폼 항목 전용' 배지 + 설명(난이도=n8n 전용·비용=AI Agent 전용)"),
    (3, "항목 리스트", "행별 [수정][삭제](인라인 편집/삭제 확인 '\"{label}\" 삭제할까요?')"),
    (4, "항목 추가", "항목명 입력 + [추가]", "placeholder '새 항목 입력 후 Enter 또는 추가'"),
    (5, "운영 유의사항", "'고정 분류 항목을 삭제하면 기존 항목이 공란으로 처리될 수 있습니다. 삭제 전 사용 중인 항목 수를 확인하세요.'"),
], page_no=1, page_total=2, subtitle="고정 분류")

screen(prs, ("분류 체계 관리", "분류체계 관리 — 자유 태그", "ADM-05", "/admin/taxonomy"), draw_adm05_free, [
    (1, "자유 태그 탭", "'자유 태그 누적 목록' + 설명(7유형 등록에서 수집)"),
    (6, "출처 필터", "전체 + 카테고리별 칩 필터"),
    (7, "태그 행", "체크박스·출처 배지·#태그·'사용 N건'·제안자·사용 항목 컨텍스트"),
    (8, "행 액션", "[표준화](ai-orchestration→비용, ml→ML 유형만)·[삭제]·[선택 삭제 (N)]"),
    (9, "표준화 편입 / 빈 상태", "편입 분류 select + [편입 확정]", "빈 상태 '누적된 자유 태그가 없습니다.'"),
], page_no=2, page_total=2, subtitle="자유 태그")

# ============================================================
# ADM-06 카테고리 관리
# ============================================================
def_slide(
    prs, "ADM-06", "카테고리 관리 (Platforms)",
    tree=[
        (0, "카테고리 관리 (/admin/platforms)"),
        (1, "좌 카테고리 목록 (7)"),
        (1, "우 상세/편집"),
        (2, "기본 정보 (ID·표시명·설명)"),
        (2, "경로·연결 (라우트·접속 URL)"),
        (2, "표시 스타일 (IconPicker·색상)"),
        (2, "노출 상태 · 액션"),
    ],
    flow=["카테고리 선택", "메타 수정", "저장", "카탈로그 반영"],
    flow_branch=(0, "추가 → 신규"),
    sections=[
        ("정의", ["7개 카테고리 메타데이터 CRUD",
                "필드: 식별자·표시명·짧은 설명·경로·접속 URL·색상·아이콘·노출"]),
        ("목적", ["카탈로그 카테고리 표시(이름·색상·아이콘·경로) 중앙 관리",
                "신규 아이콘 프리셋 즉시 반영"]),
        ("룰", ["표시 문자열은 '카테고리', route/파일/심볼은 platform 계열 유지",
               "IconPicker는 ICON_PRESETS 3열 그리드",
               "미등록 아이콘 키는 iconPreset() 폴백(automation)",
               "식별자(ID)는 저장 후 변경 불가"]),
        ("기획 의도", ["출처 색상·경로 SSOT(PLATFORMS) 편집 단일 지점",
                    "아이콘 레지스트리 확장이 선택 패널에 자동 노출"]),
    ],
)


def draw_adm06(s, R, ctx):
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]
    lw = w * 0.34; rx = x + lw + 0.16; rw = w - lw - 0.16
    sil_box(s, x, y, lw, 0.26, ctx.on(1), lw=1.2); sil_button(s, x + lw - 0.7, y + 0.02, 0.65, 0.2, ctx.on(1))
    for i in range(7):
        sil_box(s, x, y + 0.34 + i * 0.42, lw, 0.36, ctx.on(1), lw=1.2)
        sil_circle(s, x + 0.08, y + 0.4 + i * 0.42, 0.24, ctx.on(1)); sil_lines(s, x + 0.42, y + 0.44 + i * 0.42, lw * 0.5, ctx.on(1), n=1)
    ctx.mk(s, 1, x - 0.02, y - 0.02)
    # 우
    dy = y
    sil_box(s, rx, dy, rw, 1.05, ctx.on(3), lw=1.3)
    sil_input(s, rx + 0.1, dy + 0.2, rw - 0.2, 0.18, ctx.on(3)); sil_input(s, rx + 0.1, dy + 0.5, rw - 0.2, 0.18, ctx.on(3)); sil_input(s, rx + 0.1, dy + 0.8, rw - 0.2, 0.18, ctx.on(3))
    ctx.mk(s, 3, rx - 0.02, dy - 0.02)
    dy += 1.17
    sil_box(s, rx, dy, rw, 0.7, ctx.on(4), lw=1.3); sil_input(s, rx + 0.1, dy + 0.18, rw - 0.2, 0.18, ctx.on(4)); sil_input(s, rx + 0.1, dy + 0.46, rw - 0.2, 0.18, ctx.on(4))
    ctx.mk(s, 4, rx - 0.02, dy - 0.02)
    dy += 0.82
    sil_box(s, rx, dy, rw, 0.95, ctx.on(5), lw=1.3, fill=GF7)
    sil_grid(s, rx + 0.1, dy + 0.14, rw * 0.5, 0.6, ctx.on(5), 3, 2)
    sil_button(s, rx + rw * 0.6, dy + 0.2, rw * 0.35, 0.2, ctx.on(5)); sil_button(s, rx + rw * 0.6, dy + 0.5, rw * 0.35, 0.2, ctx.on(5))
    ctx.mk(s, 5, rx - 0.02, dy - 0.02)
    dy += 1.07
    sil_box(s, rx, dy, rw, y + h - dy - 0.02, ctx.on(6), lw=1.2)
    sil_button(s, rx + rw - 1.4, dy + 0.1, 0.65, 0.22, ctx.on(6)); sil_button(s, rx + rw - 0.7, dy + 0.1, 0.65, 0.22, ctx.on(6))
    ctx.mk(s, 6, rx - 0.02, dy - 0.02)


screen(prs, ("카테고리 관리", "자동화·AI 도구 관리", "ADM-06", "/admin/platforms"), draw_adm06, [
    (1, "카테고리 목록", "'카테고리' N + [+ 추가], 7종 PlatformIcon·이름·ID(비활성 '비활성' 배지)", "부제 '등록물의 출처가 되는 도구 종류를 관리합니다.'"),
    (3, "기본 정보", "식별자(ID·저장 후 변경 불가) · 표시명 · 짧은 설명"),
    (4, "경로·연결", "라우트 경로('/'로 시작) · 접속 URL(없으면 미설정)"),
    (5, "표시 스타일", "IconPicker(ICON_PRESETS 3열 그리드·폴백 방어) + 출처 색상(전경색/배경색·프리셋 8종)"),
    (6, "노출 상태·액션", "활성/비활성 토글 + [수정][삭제] / [저장][취소]", "'삭제 대신 비활성화를 권장합니다.'"),
])

# ============================================================
# ADM-07 조직 관리
# ============================================================
def_slide(
    prs, "ADM-07", "조직 관리 (Org)",
    tree=[
        (0, "부서/조직 관리 (/admin/org)"),
        (1, "섹션1 관계사 노출 관리"),
        (1, "섹션2 부서 관리"),
        (2, "필터·부서 목록(아코디언)"),
        (2, "부서 추가·Teams 연동"),
        (1, "섹션3 관계사 관리자 현황(읽기 전용)"),
        (1, "섹션4 문의 채널 설정"),
    ],
    flow=["노출 설정", "부서 관리", "관리자 현황 확인", "문의 채널 설정"],
    sections=[
        ("정의", ["조직 관리 4개 섹션. 관계사 노출·부서·관리자 현황·문의 채널",
                "관계사·본부·부서 3단계 조직 구조"]),
        ("목적", ["조직 데이터·노출 정책·운영 설정 관리", "관계사 관리자 지정 현황 조망"]),
        ("룰", ["섹션1: visible:true 관계사만 사용자 목록·필터·통계 노출",
               "섹션3은 읽기 전용 투영(지정·해제는 사용자 관리에서만)",
               "섹션4: Teams 채널 URL(operations.ts 연동)",
               "비노출 처리해도 기존 항목 데이터 미삭제"]),
        ("기획 의도", ["편집 지점(사용자 관리)·현황판(조직 관리) 분리로 SSOT",
                    "isGroupViewer는 비노출 관계사도 조회"]),
    ],
)


def draw_adm07(s, R, ctx):
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]
    # 섹션1
    sil_box(s, x, y, w, 0.55, ctx.on(1), lw=1.3)
    sil_button(s, x + 0.1, y + 0.15, w * 0.5, 0.24, ctx.on(1)); tiny(s, x + 0.1, y + 0.15, w * 0.5, "노출", ctx.on(1)); ctx.mk(s, 1, x - 0.02, y - 0.02)
    sil_box(s, x, y + 0.62, w, 0.3, ctx.on(2), lw=1.1, fill=GF7); ctx.mk(s, 2, x - 0.02, y + 0.58)
    cy = y + 1.0
    # 섹션2
    lw = w * 0.62; rx = x + lw + 0.2; rw = w - lw - 0.2
    sil_box(s, x, cy, lw, 1.5, ctx.on(3), lw=1.3)
    sil_input(s, x + 0.1, cy + 0.12, lw * 0.5, 0.18, ctx.on(3))
    for i in range(3):
        sil_box(s, x + 0.1, cy + 0.42 + i * 0.34, lw - 0.2, 0.28, ctx.on(3), lw=1.1)
    ctx.mk(s, 3, x - 0.02, cy - 0.02)
    sil_box(s, rx, cy, rw, 0.7, ctx.on(4), lw=1.3, fill=GF7); sil_input(s, rx + 0.1, cy + 0.2, rw - 0.2, 0.18, ctx.on(4)); sil_button(s, rx + 0.1, cy + 0.44, rw - 0.2, 0.18, ctx.on(4))
    sil_box(s, rx, cy + 0.8, rw, 0.7, ctx.on(4), lw=1.3); sil_lines(s, rx + 0.1, cy + 0.92, rw - 0.2, ctx.on(4), n=3)
    ctx.mk(s, 4, rx - 0.02, cy - 0.02)
    cy += 1.62
    # 섹션3
    sil_box(s, x, cy, w, 0.75, ctx.on(5), lw=1.3)
    for i in range(3):
        sil_box(s, x + 0.1, cy + 0.12 + i * 0.2, w - 0.2, 0.16, ctx.on(5), lw=1.0)
    ctx.mk(s, 5, x - 0.02, cy - 0.02)
    cy += 0.87
    # 섹션4
    sil_box(s, x, cy, w, y + h - cy - 0.02, ctx.on(6), lw=1.3)
    sil_input(s, x + 0.1, cy + 0.14, w - 1.2, 0.2, ctx.on(6)); sil_button(s, x + w - 0.9, cy + 0.14, 0.8, 0.2, ctx.on(6))
    ctx.mk(s, 6, x - 0.02, cy - 0.02)
    ctx.mk(s, 7, x + w - 0.28, cy + 0.1)


_adm07 = [
    (1, "섹션1 관계사 노출 관리", "관계사별 visible on/off(접근 게이트, CompanyVisibilityDropdown), '노출 N / 전체 29' 배지"),
    (2, "섹션1 안내", "'비노출 관계사는 해당 소속 아닌 사용자에게 목록·필터·통계에서 숨김. 그룹 전체보기 권한자는 예외.'"),
    (3, "섹션2 부서 관리", "부서명 검색 + 관계사/본부 필터 + [모두 펼치기/접기] + 관계사 아코디언·부서 행(수정·삭제, Teams 출처 배지)"),
    (4, "섹션2 부서 추가·Teams", "부서 수동 추가(관계사 필수) + Microsoft Teams 연동(현황/설정/동기화 탭, 중복 병합)"),
    (5, "섹션3 관계사 관리자 현황", "'읽기 전용' 투영 — 노출 관계사별 관리자 칩·'담당 N곳' 배지·'미지정'", "'지정·해제는 사용자 관리에서 관리' + [사용자 관리로 이동]"),
    (6, "섹션4 문의 채널 설정", "랜딩 문의 카드 연결 Teams 채널 URL 편집(유효성 검사), operations.ts 연동"),
    (7, "하단 운영 유의사항", "'관계사 비노출 전환해도 기존 AX 항목 데이터는 삭제되지 않습니다. 부서 삭제 시 태깅된 항목 영향 확인.'"),
]
screen(prs, ("조직 관리", "부서 / 조직 관리 — 섹션 1·2", "ADM-07", "/admin/org"), draw_adm07,
       _adm07, active={1, 2, 3, 4}, page_no=1, page_total=2, subtitle="섹션 1·2")
screen(prs, ("조직 관리", "부서 / 조직 관리 — 섹션 3·4", "ADM-07", "/admin/org"), draw_adm07,
       _adm07, active={5, 6, 7}, page_no=2, page_total=2, subtitle="섹션 3·4")

# ============================================================
# ADM-08 사용자·권한 관리
# ============================================================
def_slide(
    prs, "ADM-08", "사용자·권한 관리 (Users)",
    tree=[
        (0, "사용자/권한/로그 (/admin/users)"),
        (1, "탭 4종"),
        (1, "관리자 권한 탭"),
        (2, "전사 관리자 / 관계사 관리자 목록"),
        (2, "담당 관계사 칩 편집"),
        (2, "권한 부여 패널"),
        (1, "그룹 전체보기 · 등록자 · 활동 로그"),
    ],
    flow=["SSO 검색", "역할 지정", "담당 관계사 지정", "부여/회수"],
    flow_branch=(3, "가드: 최소 1명/1곳"),
    sections=[
        ("정의", ["사용자 권한 관리. 탭 4종. '관리자 권한' 탭이 지정 유일 편집 지점",
                "SSO로 계정 자동 관리"]),
        ("목적", ["전사/관계사 관리자 지정·회수·담당 관계사 편집",
                "그룹 전체보기·등록자·활동 로그 관리"]),
        ("룰", ["2-tier: User/Admin. adminScope global(전사)·company(관계사)",
               "companyAdmin은 managedCompanies[](복수 담당)",
               "가드1 전사 관리자 최소 1명 유지·회수 불가",
               "가드2 담당 관계사 최소 1곳(전체 해제는 권한 회수)"]),
        ("기획 의도", ["관리자 지정 SSOT를 이 화면에 집중(AdminOrg는 읽기 전용)",
                    "담당 관계사 칩 인라인 편집으로 복수 담당 직관 관리"]),
    ],
)


def draw_adm08_perm(s, R, ctx):
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]
    for i in range(4):
        sil_pill(s, x + i * 1.05, y, 0.95, 0.2, i == 0)
    ctx.mk(s, 1, x - 0.02, y - 0.02)
    cy = y + 0.34
    lw = w * 0.6; rx = x + lw + 0.2; rw = w - lw - 0.2
    sil_box(s, x, cy, lw, 0.28, ctx.on(2), lw=1.1); sil_input(s, x + lw - 1.6, cy + 0.04, 1.5, 0.18, ctx.on(2)); ctx.mk(s, 2, x - 0.02, cy - 0.02)
    for i in range(2):
        sil_box(s, x, cy + 0.4 + i * 0.62, lw, 0.55, ctx.on(3), lw=1.2)
        sil_lines(s, x + 0.1, cy + 0.5 + i * 0.62, lw * 0.5, ctx.on(3), n=1); sil_button(s, x + lw - 1.0, cy + 0.5 + i * 0.62, 0.9, 0.18, ctx.on(3))
    ctx.mk(s, 3, x - 0.02, cy + 0.36)
    for i in range(2):
        sil_box(s, x, cy + 1.7 + i * 0.62, lw, 0.55, ctx.on(4), lw=1.2)
        sil_lines(s, x + 0.1, cy + 1.78 + i * 0.62, lw * 0.4, ctx.on(4), n=1)
        for j in range(3):
            sil_pill(s, x + 0.1 + j * 0.6, cy + 2.0 + i * 0.62, 0.54, 0.14, ctx.on(4))
    ctx.mk(s, 4, x - 0.02, cy + 1.66)
    sil_box(s, rx, cy, rw, 1.6, ctx.on(5), lw=1.3, fill=GF7)
    sil_input(s, rx + 0.1, cy + 0.16, rw - 0.8, 0.2, ctx.on(5)); sil_button(s, rx + rw - 0.65, cy + 0.16, 0.55, 0.2, ctx.on(5))
    sil_button(s, rx + 0.1, cy + 0.55, rw * 0.45, 0.2, ctx.on(5)); sil_button(s, rx + rw * 0.5, cy + 0.55, rw * 0.45, 0.2, ctx.on(5))
    sil_box(s, rx + 0.1, cy + 0.9, rw - 0.2, 0.3, ctx.on(5), lw=1.1)
    sil_button(s, rx + 0.1, cy + 1.28, rw - 0.2, 0.24, ctx.on(5))
    ctx.mk(s, 5, rx - 0.02, cy - 0.02)
    sil_box(s, rx, cy + 1.72, rw, y + h - (cy + 1.72) - 0.02, ctx.on(6), lw=1.1, fill=GF7); ctx.mk(s, 6, rx - 0.02, cy + 1.7)


def draw_adm08_other(s, R, ctx):
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]
    for i in range(4):
        sil_pill(s, x + i * 1.05, y, 0.95, 0.2, i in (1, 2, 3))
    ctx.mk(s, 1, x + 1.05 - 0.02, y - 0.02)
    cy = y + 0.34
    sil_box(s, x, cy, w, 1.0, ctx.on(7), lw=1.3)
    sil_box(s, x + 0.1, cy + 0.12, w * 0.6, 0.24, ctx.on(7), lw=1.1, fill=GF7)
    for i in range(2):
        sil_box(s, x + 0.1, cy + 0.44 + i * 0.26, w - 0.2, 0.22, ctx.on(7), lw=1.0)
    ctx.mk(s, 7, x - 0.02, cy - 0.02)
    cy += 1.12
    sil_box(s, x, cy, w, 1.0, ctx.on(8), lw=1.3)
    seg(s, x + 0.1, cy + 0.28, x + w - 0.1, cy + 0.28, color=GCC if ctx.on(8) else GDD, w=1.2)
    for i in range(3):
        sil_lines(s, x + 0.1, cy + 0.42 + i * 0.2, w - 0.2, ctx.on(8), n=1)
    ctx.mk(s, 8, x - 0.02, cy - 0.02)
    cy += 1.12
    sil_input(s, x, cy, w * 0.5, 0.2, ctx.on(9))
    for i in range(5):
        sil_pill(s, x + w * 0.55 + i * 0.4, cy, 0.36, 0.18, ctx.on(9))
    sil_box(s, x, cy + 0.3, w, y + h - (cy + 0.3) - 0.02, ctx.on(9), lw=1.3)
    seg(s, x + 0.1, cy + 0.56, x + w - 0.1, cy + 0.56, color=GCC if ctx.on(9) else GDD, w=1.2)
    for i in range(3):
        sil_lines(s, x + 0.1, cy + 0.68 + i * 0.2, w - 0.2, ctx.on(9), n=1)
    ctx.mk(s, 9, x - 0.02, cy - 0.02)


screen(prs, ("사용자·권한 관리", "사용자 / 권한 / 로그 관리 — 관리자 권한", "ADM-08", "/admin/users"), draw_adm08_perm, [
    (1, "탭 4종", "관리자 권한 · 그룹 전체보기 · 등록자 관리 · 활동 로그 (SSO 자동 관리 안내 배너)"),
    (2, "목록 헤더·검색", "'관리자' + '전사 N · 관계사 N' 카운트 + 통합 검색(이름·부서·이메일)"),
    (3, "전사 관리자 목록", "배지·메타 + [권한 회수]", "가드 '전사 관리자는 최소 1명 유지해야 합니다. 회수할 수 없습니다.'(본인 회수 불가)"),
    (4, "관계사 관리자·담당 칩", "담당 관계사 칩(오렌지) × 제거 + [+ 관계사 추가]", "가드 '담당 관계사는 1곳 이상이어야 합니다. 담당을 모두 해제하려면 권한 회수를 사용하세요.'"),
    (5, "관리자 권한 부여", "SSO 검색 → 역할 토글(전사/관계사 관리자) → CompanyMultiSelect → [지정]"),
    (6, "운영 유의사항", "'전사 관리자는 전체 승인·관리, 관계사 관리자는 담당 범위만. 전사 관리자 최소 1명 유지, 본인 회수 불가.'"),
], page_no=1, page_total=2, subtitle="관리자 권한")

screen(prs, ("사용자·권한 관리", "사용자 / 권한 / 로그 관리 — 권한·로그", "ADM-08", "/admin/users"), draw_adm08_other, [
    (1, "탭 4종", "그룹 전체보기·등록자 관리·활동 로그 탭"),
    (7, "그룹 전체보기 탭", "권한자 목록 + SSO 검색 부여(부여 사유 필수), 비노출 관계사도 조회 가능·조회 전용"),
    (8, "등록자 관리 탭", "읽기 전용 표 — 이름/부서·이메일·등록 수·승인·대기/반려·최근 신청"),
    (9, "활동 로그 탭", "사용자·대상·액션 검색 + 카테고리 필터(전체·등록물·권한·분류체계·조직) + 표(일시·사용자·액션·대상)"),
], page_no=2, page_total=2, subtitle="권한·로그")

# ============================================================
out = os.path.join(os.path.dirname(__file__), "admin-screens.pptx")
prs.save(out)
print("SAVED", out, "slides=", len(prs.slides._sldIdLst))
