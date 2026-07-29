# -*- coding: utf-8 -*-
"""V4 / SPEC-RENDER v2-ADM — 관리자 영역 화면정의서 → admin-screens.pptx
확정 템플릿: 무언어 실루엣 와이어프레임 + 우측 Description + 하단 '화면 룰·기획 근거' 박스.
p0 = 좌[구조 트리 / 사용자 흐름 + 설계 근거 주석] · 우[정의·역할/목적/기획 의도/룰/개발 연동 노트 5단].

렌더 규약(v2 — 사용자 덱과 동일)
 1) 실루엣 배치는 LAYOUT 정본을 그대로 옮긴다 — 자동 구성 금지.
 2) 텍스트(마커 라벨·설명·rule_box)는 payload 정본 — 변형 금지.
    LAYOUT의 [rule_box 추가] 표기만 해당 rule_box에 문장으로 덧붙인다.
 3) 마커 지름: 1자리 0.26in / 2자리 0.30in (spec_common.marker 자동 처리).
 4) 마커는 대상 실루엣의 좌상단에 인접 배치 — 행 끝 배치 금지.
 5) LAYOUT의 들여쓰기(└)는 컨테이너 '내부'를 뜻한다 — 소속 관계를 도형으로 지킨다.

공통 서두(PAYLOAD-META)
 · 관리자 화면은 AdminNavbar(상단) + AdminSidebar(좌) 콘솔 레이아웃 — chrome()이 전 화면 공통 렌더.
 · 폭 표준 1320 / 마스터 300 / 패딩 32 → MASTER_R = 300/1320, PAD = 0.11in.
 · 사이드바 승인 대기 건수는 본인 권한 기준 고정(조회 범위 선택과 무관) — 사이드바 뱃지 실루엣.

마스터·디테일 분할 규칙(v2-ADM 신설)
 · 마스터-디테일 화면(ADM-02·03)의 분할 2페이지는 양쪽 모두 좌우 2열 골격을 그린다.
 · 해당 페이지의 마커 영역만 정상 톤, 반대편은 톤다운(무마커) + 빨간 점선 테두리(기존 관례).

수록 화면: ADM-01 대시보드 · 02 등록 신청 검토 · 03 카드 관리 · 04 통계 · 05 분류체계 ·
          06 자동화·AI 도구 관리 · 07 부서·조직 관리 · 08 사용자·권한·로그 · 09 공지·업데이트"""
import os
import spec_common
from spec_common import (
    new_deck, def_slide, screen, rect, sil_box, sil_button, sil_input, sil_lines,
    sil_grid, sil_pill, sil_circle, tiny, seg,
    G33, G66, G99, GCC, GDD, GEE, GF7, WHITE, RED,
)

spec_common.AUTHOR = "배상혁"
prs = new_deck()

PAD = 0.11                # 콘솔 패딩 32 → 0.11in
MASTER_R = 300.0 / 1320.0  # 마스터 컬럼 폭 표준(1320 기준 300)


# ============================================================
# 공용 실루엣 조각
# ============================================================
def hline(s, x, y, w, active, weight=1.1):
    """단일 가로 텍스트 라인 실루엣."""
    seg(s, x, y, x + w, y, color=(G66 if active else GDD), w=weight)


def dashed_box(s, x, y, w, h, active):
    """점선 안내/추가 박스."""
    from pptx.enum.dml import MSO_LINE_DASH_STYLE
    sp = rect(s, x, y, w, h, fill=WHITE, line=(G99 if active else GDD), line_w=1.1)
    sp.line.dash_style = MSO_LINE_DASH_STYLE.DASH
    return sp


def ghost_frame(s, x, y, w, h):
    """분할 2페이지 규약 — 반대편(톤다운) 영역을 빨간 점선으로 두른다."""
    from pptx.enum.dml import MSO_LINE_DASH_STYLE
    sp = rect(s, x, y, w, h, fill=None, line=RED, line_w=1.0)
    sp.line.dash_style = MSO_LINE_DASH_STYLE.DASH
    return sp


def toggle(s, x, y, active, w=0.40, h=0.20):
    """ON/OFF 토글 실루엣."""
    sil_pill(s, x, y, w, h, active)
    sil_circle(s, x + w - h + 0.02, y + 0.02, h - 0.04, active)


def xmark(s, x, y, d, active):
    """이미지 캐러셀의 삭제 X 표시."""
    col = G66 if active else GDD
    sil_circle(s, x, y, d, active)
    seg(s, x + d * 0.26, y + d * 0.26, x + d * 0.74, y + d * 0.74, color=col, w=1.0)
    seg(s, x + d * 0.74, y + d * 0.26, x + d * 0.26, y + d * 0.74, color=col, w=1.0)


def hbar(s, x, y, w, h, frac, active):
    """가로 막대."""
    rect(s, x, y, max(0.05, w * frac), h, fill=(GCC if active else GEE),
         line=(G66 if active else GDD), line_w=0.75)


def segbar(s, x, y, w, h, fracs, active):
    """전폭 스택바(카테고리 구성비)."""
    cx = x
    for i, f in enumerate(fracs):
        sw = w * f
        rect(s, cx, y, sw, h, fill=((GCC if i % 2 == 0 else GEE) if active else (GEE if i % 2 == 0 else WHITE)),
             line=(G66 if active else GDD), line_w=0.75)
        cx += sw


def stacked_cols(s, x, y, w, h, active, cols=7, heights=None, segs=(0.42, 0.33, 0.25)):
    """카테고리 스택 막대(월별 등록 추이)."""
    hs = heights or [0.55, 0.80, 0.45, 0.95, 0.62, 0.75, 0.50]
    seg(s, x, y + h, x + w, y + h, color=(G33 if active else GDD), w=1.3)
    step = w / cols
    bw = step * 0.54
    for i in range(cols):
        bx = x + i * step + (step - bw) / 2
        total = h * hs[i % len(hs)]
        cy = y + h
        for j, fr in enumerate(segs):
            sh = total * fr
            cy -= sh
            fill = (GCC, GEE, GF7)[j % 3] if active else (GEE, GF7, WHITE)[j % 3]
            rect(s, bx, cy, bw, sh, fill=fill, line=(G66 if active else GDD), line_w=0.7)


def chrome(s, R):
    """AdminNavbar(상단) + AdminSidebar(좌) 콘솔 실루엣. 콘텐츠 rect 반환.
    사이드바 뱃지 = 승인 대기 건수(본인 권한 기준 고정)."""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    sil_box(s, x, y, w, 0.28, True, lw=1.3, fill=GF7)
    sil_pill(s, x + 0.08, y + 0.07, 0.72, 0.14, True)          # 브랜드
    sil_circle(s, x + w - 0.28, y + 0.04, 0.20, True)          # 계정
    sw = 1.00
    sil_box(s, x, y + 0.34, sw, h - 0.34, True, lw=1.3, fill=GF7)
    for i in range(9):
        sil_pill(s, x + 0.09, y + 0.46 + i * 0.30, sw - 0.18, 0.16, True)
    sil_circle(s, x + sw - 0.28, y + 0.75, 0.14, True)         # 승인 대기 건수 뱃지
    cx = x + sw + 0.16
    return {"x": cx, "y": y + 0.38, "w": x + w - cx, "h": y + h - (y + 0.38)}


def split(C):
    """마스터(300) / 디테일 컬럼 분해."""
    mw = C["w"] * MASTER_R
    dx = C["x"] + mw + 0.16
    return mw, dx, C["x"] + C["w"] - dx


class Tone:
    """분할 2페이지 톤 제어 — live 페이지만 정상 톤·마커 표시, 반대편은 톤다운·무마커."""
    def __init__(self, ctx, live):
        self.ctx = ctx
        self.live = live

    def on(self, n):
        return self.live and self.ctx.on(n)

    def mk(self, s, n, x, y):
        if self.live:
            self.ctx.mk(s, n, x, y)


# ============================================================
# ADM-01 대시보드
# ============================================================
def_slide(
    prs, "ADM-01", "대시보드 (Dashboard)",
    tree=[
        (0, "대시보드 (/admin)"),
        (1, "헤더 (조회 범위)"),
        (1, "KPI 3종"),
        (1, "처리 대기 (승인·수정 요청)"),
        (1, "현황 (최근 게시·최근 활동)"),
        (1, "통계 링크"),
    ],
    flow=["진입", "처리 대기 확인", "위젯 클릭", "해당 관리 화면"],
    flow_branch=[(0, "담당 미지정 → 안내 배너"), (1, "companyAdmin → 담당 범위 부분집합")],
    flow_note=[
        "대시보드=운영(지금 처리할 것)·통계=분석(확산 여부)의 질문 축을 분리해 화면 역할을 겹치지 않게 한다.",
        "스냅숏 화면이므로 기간 필터를 두지 않고, 전 위젯이 해당 관리 화면의 진입점을 겸한다.",
    ],
    sections=[
        ("정의·역할", ["접근: admin · companyAdmin",
                    "관리자 시작 화면 — '지금 처리할 일' 요약 운영 콕핏"]),
        ("목적", ["처리 대기 업무 확인 + 관리 화면 즉시 진입"]),
        ("기획 의도", ["대시보드=운영(지금 처리할 것)·통계=분석(확산 여부)의 질문 축 분리",
                    "분석 차트는 통계로 일원화, 전 위젯이 진입점 겸임",
                    "스냅숏 화면이므로 기간 필터 없음"]),
        ("지켜야 할 룰", ["기간 필터 없음",
                     "누적=전체 기간, 이번 달 신규=당월 실측",
                     "companyAdmin 수치는 ownerCompany 담당 범위 부분집합(0.6)"]),
        ("개발 연동 노트", ["getDashboardData(scope) — 검토 큐·카탈로그·활동 피드 파생",
                      "연동 시 기존 자원 조합 우선(활동 피드 GET /activity 후보), 가시성 서버 재검증"]),
    ],
)


def draw_adm01(s, R, ctx):
    """LAYOUT ADM-01
    행1 2열: 좌 제목+①조회 범위 선택기 | 우 여백 / 행2: ②KPI 3열
    행3 2열(55:45): 좌 ③승인 대기 큐(헤더+행 5+링크) | 우 ④수정 요청 대기(건수+빈/최근 상태)
    행4 2열(50:50): 좌 ⑤최근 게시된 카드(행 4) | 우 ⑥최근 활동(행 5) / 행5: ⑦통계 링크(우측 정렬)"""
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]

    # 행1 — 좌 제목 + ① 조회 범위 선택기 (우 여백)
    hline(s, x, y + 0.14, w * 0.20, True, 1.8)
    selx = x + w * 0.26
    sil_button(s, selx, y, 1.30, 0.30, ctx.on(1))
    tiny(s, selx, y + 0.02, 1.30, "범위", ctx.on(1))
    ctx.mk(s, 1, selx - 0.02, y - 0.02)

    # 행2 — ② KPI 3열
    r2 = y + 0.42
    kw = (w - 2 * PAD) / 3
    for i in range(3):
        kx = x + i * (kw + PAD)
        sil_box(s, kx, r2, kw, 0.60, ctx.on(2), lw=1.3, fill=GF7)
        hline(s, kx + 0.12, r2 + 0.18, kw * 0.52, ctx.on(2))
        hline(s, kx + 0.12, r2 + 0.40, kw * 0.72, ctx.on(2), 2.0)
    ctx.mk(s, 2, x - 0.02, r2 - 0.02)

    # 행3 — 2열(55:45)
    r3, r3h = r2 + 0.72, 1.42
    aw = (w - PAD) * 0.55
    bx = x + aw + PAD
    bw = w - aw - PAD
    # ③ 승인 대기 큐 (헤더 + 행 5 + 링크)
    sil_box(s, x, r3, aw, r3h, ctx.on(3), lw=1.3)
    hline(s, x + PAD, r3 + 0.18, aw * 0.42, ctx.on(3), 1.8)
    for i in range(5):
        ry = r3 + 0.32 + i * 0.19
        sil_pill(s, x + PAD, ry, 0.30, 0.12, ctx.on(3))            # 단계 칩
        sil_pill(s, x + PAD + 0.34, ry, 0.26, 0.12, ctx.on(3))     # 등록 관계사 뱃지
        hline(s, x + PAD + 0.66, ry + 0.07, aw - 2 * PAD - 0.66, ctx.on(3))
    hline(s, x + aw - PAD - 0.80, r3 + r3h - 0.18, 0.80, ctx.on(3))
    ctx.mk(s, 3, x - 0.02, r3 - 0.02)
    # ④ 수정 요청 대기 (건수 + 최근 건)
    sil_box(s, bx, r3, bw, r3h, ctx.on(4), lw=1.3)
    hline(s, bx + PAD, r3 + 0.18, bw * 0.42, ctx.on(4), 1.8)
    sil_box(s, bx + PAD, r3 + 0.32, bw - 2 * PAD, 0.46, ctx.on(4), lw=1.2, fill=GF7)
    for i in range(3):
        hline(s, bx + PAD, r3 + 0.94 + i * 0.17, (bw - 2 * PAD) * (1.0 if i < 2 else 0.55), ctx.on(4))
    ctx.mk(s, 4, bx - 0.02, r3 - 0.02)

    # 행4 — 2열(50:50)
    r4, r4h = r3 + r3h + 0.12, 1.42
    cw = (w - PAD) / 2
    x2 = x + cw + PAD
    # ⑤ 최근 게시된 카드 (행 4)
    sil_box(s, x, r4, cw, r4h, ctx.on(5), lw=1.3)
    hline(s, x + PAD, r4 + 0.18, cw * 0.44, ctx.on(5), 1.8)
    for i in range(4):
        ry = r4 + 0.34 + i * 0.24
        sil_pill(s, x + PAD, ry, 0.28, 0.13, ctx.on(5))
        hline(s, x + PAD + 0.34, ry + 0.07, cw - 2 * PAD - 0.34, ctx.on(5))
    ctx.mk(s, 5, x - 0.02, r4 - 0.02)
    # ⑥ 최근 활동 (행 5)
    sil_box(s, x2, r4, cw, r4h, ctx.on(6), lw=1.3, fill=GF7)
    hline(s, x2 + PAD, r4 + 0.18, cw * 0.40, ctx.on(6), 1.8)
    for i in range(5):
        ry = r4 + 0.34 + i * 0.20
        sil_circle(s, x2 + PAD, ry, 0.14, ctx.on(6))
        hline(s, x2 + PAD + 0.22, ry + 0.07, cw - 2 * PAD - 0.22, ctx.on(6))
    ctx.mk(s, 6, x2 - 0.02, r4 - 0.02)

    # 행5 — ⑦ 통계 링크 (텍스트 링크 수준, 우측 정렬)
    r5 = r4 + r4h + 0.10
    lx5 = x + w - 1.10
    hline(s, lx5, r5 + 0.13, 1.10, ctx.on(7), 1.4)
    ctx.mk(s, 7, lx5 - 0.30, r5 - 0.02)


screen(prs, ("대시보드", "대시보드", "ADM-01", "/admin  (admin·companyAdmin)"), draw_adm01, [
    (1, "헤더", "조회 범위 선택기[admin]·담당 범위 뱃지[companyAdmin]"),
    (2, "KPI 3종", "총 카드 수·이번 달 신규·승인 대기 총계[부분 승인 병기]"),
    (3, "승인 대기 큐", "상위 5건: 카드 ID·제목·단계 칩·등록 관계사 뱃지 → 검토 화면"),
    (4, "수정 요청 대기", "건수·최근 건 → 검토 화면"),
    (5, "최근 게시된 카드", "→ 카드 관리"),
    (6, "최근 활동", "후기·게시글 최신 5 → 카드 상세"),
    (7, "통계 링크", "\"상세 분석은 통계에서 보기\""),
], rule_box=(
    ["기간 필터를 두지 않는다(고정 스냅숏)",
     "담당 관계사 미지정 companyAdmin에게 안내 배너"],
    "getDashboardData(scope) — 검토 큐·카탈로그·활동 피드 파생. 연동 시 기존 자원 조합 우선(활동 피드 GET /activity 후보), 가시성 서버 재검증.",
))

# ============================================================
# ADM-02 등록 신청 검토
# ============================================================
def_slide(
    prs, "ADM-02", "등록 신청 검토 (Review)",
    tree=[
        (0, "검토 (/admin/review)"),
        (1, "좌 신청 목록 (요약 칩·필터·행)"),
        (1, "우 상세 (이력·편집 폼·슬롯 2·반려)"),
    ],
    flow=["목록 선택", "내용 확인·보완 편집", "슬롯 승인(관계사/전사)", "2/2 게시"],
    flow_branch=[(0, "companyAdmin → 담당 등록 건만 가시"),
                 (1, "반려(사유 필수)"),
                 (2, "승인 취소(게시 전)")],
    flow_note=[
        "검토 중 편집을 허용해 경미한 보완 때문에 반려-재신청을 반복하는 비용을 줄인다.",
        "한 슬롯 오승인 후 상대가 승인하면 즉시 게시되므로, 승인 취소를 실수 복구 경로로 남긴다.",
    ],
    sections=[
        ("정의·역할", ["접근: admin · companyAdmin",
                    "등록 신청의 검토·승인·반려 — 병렬 2-슬롯 승인 실행 지점"]),
        ("목적", ["내용 확인·보완 후 슬롯 승인 또는 사유 반려"]),
        ("기획 의도", ["검토 중 편집 허용 — 경미 보완의 반려-재신청 반복 비용 축소",
                    "승인 취소는 실수 복구 경로(한 슬롯 오승인 후 상대 승인 시 즉시 게시되므로)",
                    "companyAdmin에겐 자격 있는 건만 표시 — 권한 혼란 방지"]),
        ("지켜야 할 룰", ["가시성·승인 자격 = ownerCompany 단일 축 · 전사 슬롯 admin 전용",
                     "취소는 게시 전·본인 슬롯·확인 절차(0.7)",
                     "반려 사유 필수"]),
        ("개발 연동 노트", ["getReviewQueue·deriveStage. companyAdmin 필터 서버 적용",
                      "승인·취소·반려 = 슬롯+이력(approve/reject/cancel)+게시 판정 단일 트랜잭션, 각각 알림 발송(0.10)"]),
    ],
)


def adm02_master(s, C, t):
    """LAYOUT ADM-02 p1 좌 300 상당:
    ①요약 칩 2×2 그리드 → ②유형 필터 드롭다운 → ③신청 행들 → ④더보기"""
    x, y = C["x"], C["y"]
    mw = C["w"] * MASTER_R
    # ① 요약 칩 4종 (2×2)
    chw = (mw - 0.06) / 2
    for r in range(2):
        for c in range(2):
            sil_box(s, x + c * (chw + 0.06), y + r * 0.28, chw, 0.24, t.on(1), lw=1.1, fill=GF7, round=True)
    t.mk(s, 1, x - 0.02, y - 0.02)
    # ② 유형 필터 드롭다운
    fy = y + 0.62
    sil_input(s, x, fy, mw, 0.22, t.on(2))
    t.mk(s, 2, x - 0.02, fy - 0.02)
    # ③ 신청 행들 (pill·뱃지 2·제목·부서·슬롯 2미니칩)
    ly = y + 0.96
    for i in range(5):
        ry = ly + i * 0.62
        sil_box(s, x, ry, mw, 0.56, t.on(3), lw=1.2)
        sil_pill(s, x + 0.05, ry + 0.05, 0.26, 0.11, t.on(3))
        sil_pill(s, x + 0.34, ry + 0.05, 0.22, 0.11, t.on(3))
        sil_pill(s, x + 0.59, ry + 0.05, 0.22, 0.11, t.on(3))
        hline(s, x + 0.05, ry + 0.28, mw - 0.16, t.on(3))
        hline(s, x + 0.05, ry + 0.44, mw * 0.40, t.on(3))
        sil_pill(s, x + mw - 0.39, ry + 0.36, 0.16, 0.12, t.on(3))
        sil_pill(s, x + mw - 0.20, ry + 0.36, 0.16, 0.12, t.on(3))
    t.mk(s, 3, x - 0.02, ly - 0.02)
    # ④ 더보기
    by = ly + 5 * 0.62 + 0.06
    sil_button(s, x, by, mw, 0.26, t.on(4))
    t.mk(s, 4, x - 0.02, by - 0.02)


def adm02_detail(s, C, t):
    """LAYOUT ADM-02 p2 우측:
    ⑤승인 이력 스트립 → ⑥안내 배너+편집 폼(섹션 2) → ⑦슬롯 카드 2열 → ⑧반려 박스"""
    _, dx, dw = split(C)
    y = C["y"]
    # ⑤ 승인 이력 스트립 (상단)
    sil_box(s, dx, y, dw, 0.50, t.on(5), lw=1.2, fill=GF7)
    for i in range(2):
        sil_circle(s, dx + PAD, y + 0.09 + i * 0.19, 0.14, t.on(5))
        hline(s, dx + PAD + 0.22, y + 0.16 + i * 0.19, dw * 0.62, t.on(5))
    t.mk(s, 5, dx - 0.02, y - 0.02)
    # ⑥ 안내 배너 + 편집 폼(섹션 2)
    b = y + 0.62
    sil_box(s, dx, b, dw, 0.26, t.on(6), lw=1.2, fill=GF7)
    hline(s, dx + PAD, b + 0.14, dw * 0.66, t.on(6))
    f = b + 0.34
    for k in range(2):
        fy = f + k * 0.92
        sil_box(s, dx, fy, dw, 0.84, t.on(6), lw=1.3)
        hline(s, dx + PAD, fy + 0.16, dw * 0.30, t.on(6), 1.6)
        sil_input(s, dx + PAD, fy + 0.32, dw * 0.44, 0.18, t.on(6))
        sil_input(s, dx + PAD + dw * 0.50, fy + 0.32, dw * 0.44 - PAD, 0.18, t.on(6))
        sil_input(s, dx + PAD, fy + 0.58, dw - 2 * PAD, 0.18, t.on(6))
    t.mk(s, 6, dx - 0.02, b - 0.02)
    # ⑦ 슬롯 카드 2열 (라벨·상태·버튼)
    sy = y + 2.84
    sw2 = (dw - PAD) / 2
    for k in range(2):
        sx = dx + k * (sw2 + PAD)
        sil_box(s, sx, sy, sw2, 0.78, t.on(7), lw=1.3, fill=GF7)
        hline(s, sx + PAD, sy + 0.16, sw2 * 0.50, t.on(7), 1.6)
        hline(s, sx + PAD, sy + 0.32, sw2 * 0.36, t.on(7))
        sil_button(s, sx + PAD, sy + 0.44, sw2 - 2 * PAD, 0.24, t.on(7))
    t.mk(s, 7, dx - 0.02, sy - 0.02)
    # ⑧ 반려 박스 (사유 입력 + 버튼)
    ry = y + 3.74
    sil_box(s, dx, ry, dw, 0.76, t.on(8), lw=1.3)
    hline(s, dx + PAD, ry + 0.16, dw * 0.30, t.on(8), 1.6)
    sil_input(s, dx + PAD, ry + 0.32, dw - 2 * PAD - 0.92, 0.20, t.on(8))
    sil_button(s, dx + dw - PAD - 0.80, ry + 0.30, 0.80, 0.24, t.on(8))
    t.mk(s, 8, dx - 0.02, ry - 0.02)


def draw_adm02_p1(s, R, ctx):
    """p1 = 좌 목록 정상 · 우 디테일 골격 톤다운(점선)."""
    C = chrome(s, R)
    adm02_detail(s, C, Tone(ctx, False))
    _, dx, dw = split(C)
    ghost_frame(s, dx - 0.05, C["y"] - 0.05, dw + 0.10, C["h"] + 0.06)
    adm02_master(s, C, Tone(ctx, True))


def draw_adm02_p2(s, R, ctx):
    """p2 = 우 상세 정상 · 좌 마스터 골격 톤다운(점선)."""
    C = chrome(s, R)
    adm02_master(s, C, Tone(ctx, False))
    mw, _, _ = split(C)
    ghost_frame(s, C["x"] - 0.05, C["y"] - 0.05, mw + 0.10, C["h"] + 0.06)
    adm02_detail(s, C, Tone(ctx, True))


_adm02_be = ("getReviewQueue·deriveStage. companyAdmin 필터 서버 적용, 승인·취소·반려 = "
             "슬롯+이력(approve/reject/cancel)+게시 판정 단일 트랜잭션, 각각 알림 발송(0.10).")
screen(prs, ("등록 신청 검토", "등록 신청 검토", "ADM-02", "/admin/review  (admin·companyAdmin)"),
       draw_adm02_p1, [
           (1, "요약 칩 4종", "전체·승인 대기·부분 승인[관계사만/전사만 세분]·처리완료"),
           (2, "유형 필터", "카테고리 선택"),
           (3, "신청 행", "카테고리·단계·등록 관계사 뱃지·제목·부서·슬롯 표시"),
           (4, "더보기", "증분 로드"),
       ], page_no=1, page_total=2, subtitle="좌 목록", rule_box=(
           ["companyAdmin은 담당 관계사 등록 건만 표시",
            "빈 상태 \"담당 관계사의 승인 대기 신청이 없습니다\""],
           _adm02_be,
       ))

screen(prs, ("등록 신청 검토", "등록 신청 검토", "ADM-02", "/admin/review  (admin·companyAdmin)"),
       draw_adm02_p2, [
           (5, "승인 이력", "approve/reject/cancel 기록"),
           (6, "편집 안내·폼", "\"내용을 직접 수정한 후 승인할 수 있습니다\" — 기본 정보·유형별·담당자"),
           (7, "슬롯 카드 2개", "관계사/전사 — 승인·승인 취소[게시 전·확인 절차]"),
           (8, "반려", "사유 필수 — \"신청자에게 그대로 전달됩니다\""),
       ], page_no=2, page_total=2, subtitle="우 상세", rule_box=(
           ["두 슬롯 승인 완료 시 게시(0.7)",
            "게시 후 정정은 별도 경로"],
           _adm02_be,
       ))

# ============================================================
# ADM-03 카드 관리
# ============================================================
def_slide(
    prs, "ADM-03", "카드 관리 (Cards)",
    tree=[
        (0, "카드 관리 (/admin/projects)"),
        (1, "좌 목록 (검색·유형 칩·카테고리 아코디언)"),
        (1, "우 상세·편집 (이미지·유형별·신청자·담당자)"),
    ],
    flow=["카드 선택", "조회", "수정(admin)/삭제", "저장"],
    flow_branch=[(0, "companyAdmin → 담당 등록 건만·삭제만"), (2, "직접 등록(admin)")],
    flow_note=[
        "카테고리 아코디언(기본 접힘·검색 자동 펼침)으로 카드 수가 늘어도 목록이 무너지지 않게 한다.",
        "편집 항목을 등록 폼과 같은 체계로 두어 관리자의 학습 비용을 없앤다.",
    ],
    sections=[
        ("정의·역할", ["접근: admin · companyAdmin",
                    "게시된 전체 카드의 관리(조회·수정·삭제·직접 등록)"]),
        ("목적", ["게시본 품질 유지"]),
        ("기획 의도", ["카테고리 아코디언(기본 접힘·검색 자동 펼침)으로 카드 증가에 대비",
                    "편집 항목은 등록 폼과 동일 체계(이미지 포함) — 학습 비용 제거",
                    "수정·직접 등록=admin, 삭제=담당 companyAdmin 허용 — 관계사 차원 품질 관리"]),
        ("지켜야 할 룰", ["가시성·삭제 권한 = ownerCompany 축(검토와 동일 판정)",
                     "삭제는 확인+복구 불가 고지",
                     "직접 등록도 ID 규칙(0.3)"]),
        ("개발 연동 노트", ["getManagedAssetItems(카탈로그 파생). 수정 PATCH·삭제 DELETE·직접 등록 POST, 권한 서버 검증",
                      "이미지는 스토리지 선정 연동(부록 B)"]),
    ],
)


def adm03_master(s, C, t):
    """LAYOUT ADM-03 p1 좌:
    ①헤더 → ②검색+유형 칩 → ③아코디언 그룹 헤더 3(첫 그룹만 펼침) → └④카드 행들(펼친 그룹 내부)"""
    x, y = C["x"], C["y"]
    mw = C["w"] * MASTER_R
    # ① 헤더 (건수 + 직접 등록 버튼)
    hline(s, x, y + 0.12, mw * 0.38, t.on(1), 1.8)
    sil_button(s, x + mw - 0.60, y, 0.60, 0.24, t.on(1))
    t.mk(s, 1, x - 0.02, y - 0.02)
    # ② 검색 박스 + 유형 칩 줄
    sy = y + 0.36
    sil_input(s, x, sy, mw, 0.22, t.on(2))
    cw = (mw - 2 * 0.05) / 3
    for i in range(3):
        sil_pill(s, x + i * (cw + 0.05), sy + 0.30, cw, 0.15, t.on(2))
    t.mk(s, 2, x - 0.02, sy - 0.02)
    # ③ 카테고리 아코디언 그룹 헤더 (dot·카테고리명·건수)
    gy = y + 0.94

    def group(gyy):
        sil_box(s, x, gyy, mw, 0.26, t.on(3), lw=1.2, fill=GF7)
        sil_circle(s, x + 0.06, gyy + 0.07, 0.12, t.on(3))
        hline(s, x + 0.24, gyy + 0.15, mw * 0.40, t.on(3))
        hline(s, x + mw - 0.26, gyy + 0.15, 0.20, t.on(3))

    group(gy)                       # 그룹 1 — 펼침
    t.mk(s, 3, x - 0.02, gy - 0.02)
    # └ ④ 카드 행들 — 펼친 그룹 '내부' 컨테이너(들여쓰기)
    ix, iw = x + 0.09, mw - 0.09
    cy = gy + 0.26
    box_h = 4 * 0.46 + 0.10
    sil_box(s, ix, cy, iw, box_h, t.on(4), lw=1.0)
    for i in range(4):
        ry = cy + 0.06 + i * 0.46
        hline(s, ix + 0.07, ry + 0.10, iw * 0.70, t.on(4))         # 제목
        hline(s, ix + 0.07, ry + 0.26, iw * 0.38, t.on(4))         # 카드 ID·부서
        sil_pill(s, ix + iw - 0.36, ry + 0.20, 0.28, 0.12, t.on(4))  # 등록 관계사 뱃지
    t.mk(s, 4, ix - 0.02, cy + 0.02)
    gy2 = cy + box_h + 0.10
    group(gy2)                      # 그룹 2·3 — 접힘
    group(gy2 + 0.34)


def adm03_detail(s, C, t):
    """LAYOUT ADM-03 p2 우측:
    ⑤헤더 행 → ⑥기본 정보 카드(캐러셀·삭제 X·추가 버튼 → 필드들) → ⑦유형별 섹션 → ⑧신청자 → ⑨담당자"""
    _, dx, dw = split(C)
    y = C["y"]
    # ⑤ 헤더 행 (제목 좌 | 수정·삭제 버튼 우)
    hline(s, dx, y + 0.14, dw * 0.32, t.on(5), 1.8)
    sil_button(s, dx + dw - 1.22, y, 0.58, 0.26, t.on(5))
    sil_button(s, dx + dw - 0.58, y, 0.58, 0.26, t.on(5))
    t.mk(s, 5, dx - 0.02, y - 0.02)
    # ⑥ 기본 정보 카드
    b, bh = y + 0.38, 1.62
    sil_box(s, dx, b, dw, bh, t.on(6), lw=1.3)
    hline(s, dx + PAD, b + 0.16, dw * 0.24, t.on(6), 1.6)
    thw = 0.54
    for i in range(3):
        tx = dx + PAD + i * (thw + 0.08)
        sil_box(s, tx, b + 0.28, thw, 0.42, t.on(6), lw=1.1, fill=GF7)
        xmark(s, tx + thw - 0.16, b + 0.31, 0.13, t.on(6))
    dashed_box(s, dx + PAD + 3 * (thw + 0.08), b + 0.28, 0.42, 0.42, t.on(6))
    for i in range(3):
        sil_input(s, dx + PAD, b + 0.84 + i * 0.24, dw - 2 * PAD, 0.18, t.on(6))
    t.mk(s, 6, dx - 0.02, b - 0.02)
    # ⑦ 유형별 섹션 카드
    c, ch = b + bh + 0.12, 0.82
    sil_box(s, dx, c, dw, ch, t.on(7), lw=1.3, fill=GF7)
    hline(s, dx + PAD, c + 0.16, dw * 0.28, t.on(7), 1.6)
    sil_input(s, dx + PAD, c + 0.32, dw * 0.44, 0.18, t.on(7))
    sil_input(s, dx + PAD + dw * 0.50, c + 0.32, dw * 0.44 - PAD, 0.18, t.on(7))
    sil_input(s, dx + PAD, c + 0.58, dw - 2 * PAD, 0.18, t.on(7))
    t.mk(s, 7, dx - 0.02, c - 0.02)
    # ⑧ 등록 신청자 정보 카드
    d, dh = c + ch + 0.12, 0.58
    sil_box(s, dx, d, dw, dh, t.on(8), lw=1.3)
    hline(s, dx + PAD, d + 0.16, dw * 0.26, t.on(8), 1.6)
    sil_input(s, dx + PAD, d + 0.32, dw * 0.60, 0.18, t.on(8))
    t.mk(s, 8, dx - 0.02, d - 0.02)
    # ⑨ 담당자 카드
    e, eh = d + dh + 0.12, 0.74
    sil_box(s, dx, e, dw, eh, t.on(9), lw=1.3)
    hline(s, dx + PAD, e + 0.16, dw * 0.22, t.on(9), 1.6)
    fw = (dw - 2 * PAD) / 3
    for i in range(3):
        sil_input(s, dx + PAD + i * fw, e + 0.32, fw - 0.06, 0.18, t.on(9))
    hline(s, dx + PAD, e + 0.62, dw * 0.38, t.on(9))
    t.mk(s, 9, dx - 0.02, e - 0.02)


def draw_adm03_p1(s, R, ctx):
    C = chrome(s, R)
    adm03_detail(s, C, Tone(ctx, False))
    _, dx, dw = split(C)
    ghost_frame(s, dx - 0.05, C["y"] - 0.05, dw + 0.10, C["h"] + 0.06)
    adm03_master(s, C, Tone(ctx, True))


def draw_adm03_p2(s, R, ctx):
    C = chrome(s, R)
    adm03_master(s, C, Tone(ctx, False))
    mw, _, _ = split(C)
    ghost_frame(s, C["x"] - 0.05, C["y"] - 0.05, mw + 0.10, C["h"] + 0.06)
    adm03_detail(s, C, Tone(ctx, True))


_adm03_be = ("getManagedAssetItems(카탈로그 파생). 수정 PATCH·삭제 DELETE·직접 등록 POST, "
             "권한 서버 검증. 이미지는 스토리지 선정 연동(부록 B).")
screen(prs, ("카드 관리", "카드 관리", "ADM-03", "/admin/projects  (admin·companyAdmin)"),
       draw_adm03_p1, [
           (1, "헤더", "전체 카드 수·직접 등록[admin]·담당 뱃지[companyAdmin]"),
           (2, "검색·유형 칩", "카드명·부서 검색+카테고리 필터"),
           (3, "카테고리 아코디언", "그룹 헤더: 색 dot·카테고리명·건수 — 기본 접힘·검색 시 자동 펼침"),
           (4, "카드 행", "제목·카드 ID·부서·등록 관계사 뱃지"),
       ], page_no=1, page_total=2, subtitle="좌 목록", rule_box=(
           ["미선택 시 우측에 총 건수·카테고리 분포 안내"],
           _adm03_be,
       ))

screen(prs, ("카드 관리", "카드 관리", "ADM-03", "/admin/projects  (admin·companyAdmin)"),
       draw_adm03_p2, [
           (5, "헤더 액션", "수정[admin]·삭제[확인 절차]"),
           (6, "기본 정보", "수정 모드에서 이미지 추가/삭제 포함 — 등록 폼과 동일 구성"),
           (7, "유형별 섹션", "대상 카드 유형에 따름"),
           (8, "등록 신청자 정보", "신청자 이메일 등"),
           (9, "담당자", "조회·편집"),
       ], page_no=2, page_total=2, subtitle="우 상세·편집", rule_box=(
           ["수정·직접 등록은 admin 전용",
            "삭제된 카드 복구 불가 고지"],
           _adm03_be,
       ))

# ============================================================
# ADM-04 통계
# ============================================================
def_slide(
    prs, "ADM-04", "통계 (Statistics)",
    tree=[
        (0, "통계 (/admin/statistics)"),
        (1, "헤더 (조회 범위·기간 프리셋)"),
        (1, "요약 4카드"),
        (1, "등록 추이"),
        (1, "카테고리 현황"),
        (1, "도메인·부서 (상위 5)"),
        (1, "절감 효과"),
        (1, "3축 분석"),
        (1, "후기·태그"),
    ],
    flow=["기간·범위 선택", "전 차트 갱신", "차트 펼치기(상위 5→전체)"],
    flow_branch=[(0, "범위 지정 → 시작~종료 월(최대 24개월)"), (1, "companyAdmin → 담당 범위 집계")],
    flow_note=[
        "전 수치를 카탈로그 단일 소스에서 파생한다 — 화면 간 수치 불일치는 보고 신뢰를 해치기 때문(0.9).",
    ],
    sections=[
        ("정의·역할", ["접근: admin · companyAdmin",
                    "등록·활용 현황의 기간 분석 리포트 — 성과 보고 근거"]),
        ("목적", ["확산 추이·절감 효과를 기간·범위로 정량 확인"]),
        ("기획 의도", ["전 수치를 카탈로그 단일 소스 파생(0.9) — 화면 간 수치 불일치는 보고 신뢰를 해침",
                    "절감은 연간 환산+추정 불가 분리(0.8). 분석 축은 실입력 데이터만",
                    "부서·도메인은 상위 5+펼치기 — SSO 후 부서 급증 대비"]),
        ("지켜야 할 룰", ["프리셋 4종 고정(최근3·6개월/올해 전체/범위 지정 최대 24개월, 서버 재검증)",
                     "전 기간 프리셋 없음(과거는 범위 지정) · 운영 상태·검색 키워드 축 없음",
                     "성과 평가 아님 문구 유지(0.1)"]),
        ("개발 연동 노트", ["getStatsByScope(scope,range)·statsDerive 함수군 = 통계 API 계약 기준(GET /stats/*, ?company=&from=&to=)",
                      "parseTimeSaved 규칙 서버 이관 시 동일. 검증: 데모 총량 50 전 축 일치"]),
    ],
)


def draw_adm04_p1(s, R, ctx):
    """LAYOUT ADM-04 p1
    행1 2열: 좌 제목+조회 범위 | 우 ①기간 프리셋 4pill+월 select 2(같은 행 유지) / 행2: ②요약 4카드
    행3: ③등록 추이(스택 막대 7개 상당+범례 줄) / 행4: ④카테고리 현황(전폭 스택바 → 카드 3열×2행)"""
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]

    # 행1 — 좌 제목·조회 범위 | 우 ① 기간 프리셋 + 월 select (같은 행)
    hline(s, x, y + 0.14, 0.56, True, 1.8)
    sil_button(s, x + 0.66, y + 0.02, 0.66, 0.26, True)
    gw = 2.78
    gx = x + w - gw
    for i in range(4):
        sil_pill(s, gx + i * 0.48, y + 0.04, 0.44, 0.22, ctx.on(1))
    for i in range(2):
        sil_input(s, gx + 1.98 + i * 0.42, y + 0.04, 0.38, 0.22, ctx.on(1))
    ctx.mk(s, 1, gx - 0.02, y - 0.02)

    # 행2 — ② 요약 4카드
    r2 = y + 0.42
    kw = (w - 3 * PAD) / 4
    for i in range(4):
        kx = x + i * (kw + PAD)
        sil_box(s, kx, r2, kw, 0.56, ctx.on(2), lw=1.3, fill=GF7)
        hline(s, kx + 0.10, r2 + 0.16, kw * 0.55, ctx.on(2))
        hline(s, kx + 0.10, r2 + 0.36, kw * 0.72, ctx.on(2), 2.0)
    ctx.mk(s, 2, x - 0.02, r2 - 0.02)

    # 행3 — ③ 등록 추이 (카테고리 스택 막대 + 범례 줄)
    r3, r3h = r2 + 0.68, 1.50
    sil_box(s, x, r3, w, r3h, ctx.on(3), lw=1.3)
    hline(s, x + PAD, r3 + 0.16, w * 0.20, ctx.on(3), 1.6)
    stacked_cols(s, x + PAD + 0.10, r3 + 0.34, w - 2 * PAD - 0.10, 0.82, ctx.on(3), cols=7)
    for i in range(7):
        sil_circle(s, x + PAD + i * 0.44, r3 + 1.24, 0.10, ctx.on(3))
        hline(s, x + PAD + 0.14 + i * 0.44, r3 + 1.30, 0.24, ctx.on(3))
    ctx.mk(s, 3, x - 0.02, r3 - 0.02)

    # 행4 — ④ 카테고리별 현황 (전폭 스택바 → 카드 3열×2행)
    r4 = r3 + r3h + 0.12
    r4h = h - (r4 - y) - 0.02
    sil_box(s, x, r4, w, r4h, ctx.on(4), lw=1.3)
    segbar(s, x + PAD, r4 + 0.16, w - 2 * PAD, 0.22, [0.24, 0.18, 0.16, 0.13, 0.11, 0.10, 0.08], ctx.on(4))
    gw2 = (w - 2 * PAD - 2 * 0.10) / 3
    gh2 = (r4h - 0.52 - 0.10) / 2
    for r in range(2):
        for c in range(3):
            gx2 = x + PAD + c * (gw2 + 0.10)
            gy2 = r4 + 0.50 + r * (gh2 + 0.10)
            sil_box(s, gx2, gy2, gw2, gh2, ctx.on(4), lw=1.1, fill=GF7, round=True)
            hline(s, gx2 + 0.08, gy2 + 0.14, gw2 * 0.50, ctx.on(4))
            hline(s, gx2 + 0.08, gy2 + 0.32, gw2 * 0.70, ctx.on(4))
    ctx.mk(s, 4, x - 0.02, r4 - 0.02)


def draw_adm04_p2(s, R, ctx):
    """LAYOUT ADM-04 p2
    행1 2열(50:50): 좌 ⑤도메인·부서(막대 5행+"전체 보기" 버튼) | 우 동일 구조 카드
    행2: ⑥절감 3카드 가로 / 행3: ⑦3열 분석 / 행4 2열: 좌 ⑧후기 상위 5 | 우 ⑨태그 빈도"""
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]

    # 행1 — ⑤ 도메인·부서 (좌우 동일 구조, 마커는 좌측 카드에)
    r1h = 1.44
    cw = (w - PAD) / 2
    fracs = [0.95, 0.78, 0.60, 0.44, 0.30]
    for k in range(2):
        cx = x + k * (cw + PAD)
        sil_box(s, cx, y, cw, r1h, ctx.on(5), lw=1.3)
        hline(s, cx + PAD, y + 0.16, cw * 0.34, ctx.on(5), 1.6)
        for i in range(5):
            ry = y + 0.32 + i * 0.15
            hline(s, cx + PAD, ry + 0.06, 0.40, ctx.on(5))
            hbar(s, cx + PAD + 0.46, ry, cw - 2 * PAD - 0.46, 0.11, fracs[i], ctx.on(5))
        sil_button(s, cx + PAD, y + r1h - 0.32, cw * 0.46, 0.24, ctx.on(5))
    ctx.mk(s, 5, x - 0.02, y - 0.02)

    # 행2 — ⑥ 절감 효과 3카드 가로
    r2 = y + r1h + 0.12
    tw = (w - 2 * PAD) / 3
    for i in range(3):
        tx = x + i * (tw + PAD)
        sil_box(s, tx, r2, tw, 0.62, ctx.on(6), lw=1.3, fill=GF7)
        hline(s, tx + 0.10, r2 + 0.18, tw * 0.56, ctx.on(6))
        hline(s, tx + 0.10, r2 + 0.40, tw * 0.72, ctx.on(6), 2.0)
    ctx.mk(s, 6, x - 0.02, r2 - 0.02)

    # 행3 — ⑦ 3열 분석 (난이도 | 비용 | 모델 유형)
    r3, r3h = r2 + 0.74, 0.90
    for i in range(3):
        tx = x + i * (tw + PAD)
        sil_box(s, tx, r3, tw, r3h, ctx.on(7), lw=1.3)
        hline(s, tx + 0.10, r3 + 0.16, tw * 0.44, ctx.on(7), 1.6)
        for j in range(3):
            ry = r3 + 0.30 + j * 0.18
            hline(s, tx + 0.10, ry + 0.06, 0.26, ctx.on(7))
            hbar(s, tx + 0.42, ry, tw - 0.52, 0.11, [0.9, 0.62, 0.38][j], ctx.on(7))
    ctx.mk(s, 7, x - 0.02, r3 - 0.02)

    # 행4 — 2열: ⑧ 후기 상위 5 | ⑨ 태그 빈도
    r4 = r3 + r3h + 0.12
    r4h = h - (r4 - y) - 0.02
    sil_box(s, x, r4, cw, r4h, ctx.on(8), lw=1.3)
    hline(s, x + PAD, r4 + 0.16, cw * 0.32, ctx.on(8), 1.6)
    for i in range(5):
        ry = r4 + 0.32 + i * 0.16
        sil_pill(s, x + PAD, ry, 0.16, 0.12, ctx.on(8))
        hline(s, x + PAD + 0.22, ry + 0.07, cw - 2 * PAD - 0.22, ctx.on(8))
    ctx.mk(s, 8, x - 0.02, r4 - 0.02)
    x2 = x + cw + PAD
    sil_box(s, x2, r4, cw, r4h, ctx.on(9), lw=1.3, fill=GF7)
    hline(s, x2 + PAD, r4 + 0.16, cw * 0.30, ctx.on(9), 1.6)
    for i in range(6):
        ry = r4 + 0.32 + i * 0.14
        hline(s, x2 + PAD, ry + 0.05, 0.34, ctx.on(9))
        hbar(s, x2 + PAD + 0.40, ry, cw - 2 * PAD - 0.40, 0.10, [0.95, 0.82, 0.68, 0.52, 0.4, 0.28][i], ctx.on(9))
    ctx.mk(s, 9, x2 - 0.02, r4 - 0.02)


_adm04_be = ("getStatsByScope(scope,range)·statsDerive 함수군 = 통계 API 계약 기준(GET /stats/*, "
             "?company=&from=&to=). parseTimeSaved 규칙 서버 이관 시 동일. 검증: 데모 총량 50 전 축 일치.")
screen(prs, ("통계", "통계", "ADM-04", "/admin/statistics  (admin·companyAdmin)"), draw_adm04_p1, [
    (1, "조회 범위·기간", "프리셋 4종+범위 지정[시작~종료 월·최대 24개월]"),
    (2, "요약 4카드", "전체 등록물·이번 달 신규·참여 부서·참여 관계사"),
    (3, "등록 추이", "카테고리 스택 막대 — 선택 기간 연속 표시·빈 월 0"),
    (4, "카테고리별 현황", "7종 건수·비율"),
], page_no=1, page_total=2, subtitle="헤더·추이", rule_box=(
    ["올해 전체 = 당해 1월~현재 월",
     "24개월 초과 선택 불가"],
    _adm04_be,
))

screen(prs, ("통계", "통계", "ADM-04", "/admin/statistics  (admin·companyAdmin)"), draw_adm04_p2, [
    (5, "도메인·부서", "상위 5 + \"전체 보기 (N)\" 펼치기·접기"),
    (6, "절감 효과 3종", "연간 환산·집계 가능·추정 불가 분리"),
    (7, "3축 분석", "난이도[n8n]·비용[AI Model]·모델 유형[ML]"),
    (8, "후기 상위 5", "누적 후기 기준"),
    (9, "태그 빈도", "상위 태그 막대"),
], page_no=2, page_total=2, subtitle="분석", rule_box=(
    ["집계는 성과 평가 용도가 아님을 화면 문구에 유지",
     "companyAdmin은 담당 범위 집계"],
    _adm04_be,
))

# ============================================================
# ADM-05 분류체계 관리
# ============================================================
def_slide(
    prs, "ADM-05", "분류체계 관리 (Taxonomy)",
    tree=[
        (0, "분류체계 (/admin/taxonomy)"),
        (1, "고정 분류 4탭"),
        (1, "자유 태그 탭"),
        (1, "좌 값·태그 목록"),
        (1, "우 추가·편입 패널 · 운영 유의사항"),
    ],
    flow=["탭 선택", "값 추가/수정/삭제"],
    flow_branch=[(1, "자유 태그 → 출처 필터·선택 삭제·고정 분류 편입(AI Model→비용 / ML→모델 유형만)")],
    flow_note=[
        "검색·필터·통계·향후 RAG의 품질은 통제 어휘에서 나오므로 고정 분류를 축으로 삼는다.",
        "자유 태그는 등록 문턱을 낮추는 보조 수단이며, 반복 태그를 고정 분류로 편입하는 운영 순환을 상정한다.",
    ],
    sections=[
        ("정의·역할", ["접근: admin 전용",
                    "고정 분류(도메인·난이도·비용·ML 유형)와 자유 태그 관리"]),
        ("목적", ["검색·필터·통계 축의 분류 표준화 + 자유 태그 누적 관리"]),
        ("기획 의도", ["고정 분류 위주 — 검색·필터·통계·향후 RAG의 품질은 통제 어휘에서 나옴",
                    "자유 태그는 등록 문턱을 낮추는 보조 수단, 반복 태그는 고정 분류로 편입하는 운영 순환",
                    "편입은 실입력 축 2종으로 제한 — 대응 축 없는 편입은 정합 훼손"]),
        ("지켜야 할 룰", ["고정 분류 삭제 시 기존 카드 공란 처리 가능 안내(참조 무결성은 서버 일관)",
                     "자유 태그 출처 7카테고리 대응",
                     "편입 조합 2종 한정"]),
        ("개발 연동 노트", ["getCategoryTaxonomy·getFreeTags. 분류 마스터+카드-분류 참조",
                      "편입은 태그→분류 전환+카드 참조 갱신 동시 처리"]),
    ],
)


def draw_adm05_p1(s, R, ctx):
    """LAYOUT ADM-05 p1
    행1: ①탭 pill 5(분류 4+자유 태그) / 행2 2열(65:35): 좌 ②값 목록 카드(값·사용 N건·③수정/삭제) |
    우 추가 패널(입력+버튼) / 행3: ④유의사항 박스"""
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]

    # 행1 — ① 탭 pill 5
    tw = 0.78
    for i in range(5):
        sil_pill(s, x + i * (tw + 0.06), y, tw, 0.26, ctx.on(1) and i < 4)
    ctx.mk(s, 1, x - 0.02, y - 0.02)

    # 행2 — 2열(65:35)
    r2 = y + 0.38
    r2h = h - 0.38 - 0.12 - 0.62
    lw = (w - PAD) * 0.65
    rx, rw = x + lw + PAD, w - lw - PAD
    # ② 값 목록 카드
    sil_box(s, x, r2, lw, r2h, ctx.on(2), lw=1.3)
    hline(s, x + PAD, r2 + 0.18, lw * 0.32, ctx.on(2), 1.8)
    seg(s, x + PAD, r2 + 0.34, x + lw - PAD, r2 + 0.34, color=(GCC if ctx.on(2) else GEE), w=1.0)
    ctx.mk(s, 2, x - 0.02, r2 - 0.02)
    # ③ 값 행 (값 · 사용 N건 · 수정/삭제 버튼)
    btnx = x + lw - PAD - 0.92
    for i in range(6):
        ry = r2 + 0.44 + i * 0.44
        hline(s, x + PAD, ry + 0.14, lw * 0.32, ctx.on(3))
        hline(s, x + PAD + lw * 0.38, ry + 0.14, lw * 0.16, ctx.on(3))
        sil_button(s, btnx, ry, 0.44, 0.24, ctx.on(3))
        sil_button(s, btnx + 0.48, ry, 0.44, 0.24, ctx.on(3))
    ctx.mk(s, 3, btnx - 0.02, r2 + 0.42)
    # 우 추가 패널 (입력 + 버튼)
    sil_box(s, rx, r2, rw, 1.10, ctx.on(3), lw=1.3, fill=GF7)
    hline(s, rx + PAD, r2 + 0.18, rw * 0.44, ctx.on(3), 1.6)
    sil_input(s, rx + PAD, r2 + 0.44, rw - 2 * PAD, 0.22, ctx.on(3))
    sil_button(s, rx + PAD, r2 + 0.76, rw - 2 * PAD, 0.26, ctx.on(3))

    # 행3 — ④ 운영 유의사항 박스
    r3 = r2 + r2h + 0.12
    sil_box(s, x, r3, w, 0.62, ctx.on(4), lw=1.2, fill=GF7)
    hline(s, x + PAD, r3 + 0.22, w * 0.62, ctx.on(4))
    hline(s, x + PAD, r3 + 0.40, w * 0.42, ctx.on(4))
    ctx.mk(s, 4, x - 0.02, r3 - 0.02)


def draw_adm05_p2(s, R, ctx):
    """LAYOUT ADM-05 p2 (자유 태그 탭 활성)
    행1: ⑤탭 pill(자유 태그 활성+건수 뱃지) / 행2: ⑥출처 필터 칩 8 / 행3: ⑦태그 행들 4 /
    행4 2열: 좌 ⑧선택 삭제 버튼 | 우 ⑨편입 패널(분류 선택+확정)"""
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]

    # 행1 — ⑤ 탭 pill (자유 태그 활성 + 건수 뱃지)
    tw = 0.78
    for i in range(5):
        sil_pill(s, x + i * (tw + 0.06), y, tw, 0.26, ctx.on(5) and i == 4)
    fx = x + 4 * (tw + 0.06)
    sil_circle(s, fx + tw - 0.24, y + 0.05, 0.16, ctx.on(5))
    ctx.mk(s, 5, fx - 0.02, y - 0.02)

    # 행2 — ⑥ 출처 필터 칩 8
    r2 = y + 0.38
    cw = (w - 7 * 0.05) / 8
    for i in range(8):
        sil_pill(s, x + i * (cw + 0.05), r2, cw, 0.22, ctx.on(6))
    ctx.mk(s, 6, x - 0.02, r2 - 0.02)

    # 행3 — ⑦ 태그 행들 4 (체크박스·pill·#태그·건수·제안자)
    r3 = y + 0.76
    for i in range(4):
        ry = r3 + i * 0.60
        sil_box(s, x, ry, w, 0.54, ctx.on(7), lw=1.2)
        sil_box(s, x + PAD, ry + 0.19, 0.16, 0.16, ctx.on(7), lw=1.0)
        sil_pill(s, x + PAD + 0.24, ry + 0.18, 0.44, 0.18, ctx.on(7))
        hline(s, x + PAD + 0.74, ry + 0.28, w * 0.26, ctx.on(7))
        hline(s, x + w * 0.56, ry + 0.28, w * 0.14, ctx.on(7))
        hline(s, x + w * 0.74, ry + 0.28, w * 0.20, ctx.on(7))
    ctx.mk(s, 7, x - 0.02, r3 - 0.02)

    # 행4 — 2열: ⑧ 선택 삭제 | ⑨ 편입 패널
    r4 = y + 3.22
    r4h = h - 3.22 - 0.02
    hw = (w - PAD) / 2
    sil_button(s, x, r4, hw * 0.70, 0.30, ctx.on(8))
    ctx.mk(s, 8, x - 0.02, r4 - 0.02)
    px, pw = x + hw + PAD, w - hw - PAD
    sil_box(s, px, r4, pw, r4h, ctx.on(9), lw=1.3, fill=GF7)
    hline(s, px + PAD, r4 + 0.18, pw * 0.44, ctx.on(9), 1.6)
    sil_input(s, px + PAD, r4 + 0.44, pw - 2 * PAD, 0.22, ctx.on(9))
    sil_button(s, px + PAD, r4 + 0.78, pw - 2 * PAD, 0.28, ctx.on(9))
    ctx.mk(s, 9, px - 0.02, r4 - 0.02)


_adm05_be = ("getCategoryTaxonomy·getFreeTags. 분류 마스터+카드-분류 참조, "
             "편입은 태그→분류 전환+카드 참조 갱신 동시 처리.")
screen(prs, ("분류체계 관리", "분류체계 관리", "ADM-05", "/admin/taxonomy  (admin 전용)"), draw_adm05_p1, [
    (1, "분류 탭 4종", "업무 도메인·구성 난이도·비용 등급·ML 모델 유형"),
    (2, "값 목록", "값·사용 건수"),
    (3, "값 액션", "추가·수정·삭제[확인 절차]"),
    (4, "운영 유의사항", "삭제 시 공란 처리 안내"),
], page_no=1, page_total=2, subtitle="고정 분류", rule_box=(
    ["난이도=n8n 전용, 비용=AI Model 전용, ML 유형=ML 전용 — 실입력 축만 관리",
     "고정 분류 4탭은 동일 구조 — 대표 1탭 표기"],
    _adm05_be,
))

screen(prs, ("분류체계 관리", "분류체계 관리", "ADM-05", "/admin/taxonomy  (admin 전용)"), draw_adm05_p2, [
    (5, "자유 태그 탭", "누적 건수 표시"),
    (6, "출처 필터", "전체+카테고리 7종 칩"),
    (7, "태그 행", "#태그·사용 N건·제안자·사용 카드"),
    (8, "선택 삭제", "다중 선택 일괄"),
    (9, "고정 분류 편입", "대상 분류 선택 → 확정 — AI Model→비용/ML→모델 유형만"),
], page_no=2, page_total=2, subtitle="자유 태그", rule_box=(
    ["편입 가능 조합 2종 한정",
     "더보기 증분"],
    _adm05_be,
))

# ============================================================
# ADM-06 자동화·AI 도구 관리
# ============================================================
def_slide(
    prs, "ADM-06", "자동화·AI 도구 관리 (Platforms)",
    tree=[
        (0, "도구 관리 (/admin/platforms)"),
        (1, "좌 카테고리 목록"),
        (1, "우 기본 정보·경로·연결·표시 스타일·노출 상태·액션"),
    ],
    flow=["카테고리 선택", "메타 수정", "저장", "전 화면 파생 반영"],
    flow_branch=[(0, "신규 추가 → id·경로 중복 검사"), (2, "삭제 대신 비활성화 권장")],
    flow_note=[
        "카테고리 메타는 단일 소스라 편집이 목록 필터·뱃지·통계 범례로 파급된다 — 그래서 전사 관리자 전용이다.",
        "아이콘 21종·파스텔 프리셋 8종 안에서만 고르게 해 톤 일관을 유지하고 유사색 배정을 피한다.",
    ],
    sections=[
        ("정의·역할", ["접근: admin 전용",
                    "카테고리 7종 메타(식별자·표시명·설명·경로·외부 주소·아이콘·색·노출) 관리"]),
        ("목적", ["명칭·브랜딩 변경과 신규 추가를 운영 단계에서 처리"]),
        ("기획 의도", ["카테고리 메타는 단일 소스 — 목록 필터·뱃지·통계 범례가 전부 파생되므로 편집이 전 화면에 파급 → 전사 관리자 전용",
                    "아이콘 21종·파스텔 프리셋 8종 안에서만 선택해 톤 일관 유지, 유사색 배정 회피",
                    "삭제보다 비활성화 권장 — 기존 카드 참조 보존"]),
        ("지켜야 할 룰", ["내부 식별자는 생성 후 변경 불가",
                     "신규는 중복 검사 통과 필수",
                     "외부 도구 주소 미설정 허용(소비 지점 미구현 — 백로그)"]),
        ("개발 연동 노트", ["카테고리 마스터 CRUD API. 편집 파급 고려 캐시 무효화 전략 필요",
                      "비활성 카테고리의 기존 카드 정책은 명세서 확정(부록 B)"]),
    ],
)


def draw_adm06(s, R, ctx):
    """LAYOUT ADM-06 (마스터·디테일 단일 페이지)
    좌 300: ①카테고리 행 7(아이콘·명·id) | 우: ②기본 정보 → ③경로·연결 → ④표시 스타일 →
    ⑤노출 토글 행 → ⑥헤더 우측 액션 3버튼(우측 상단)"""
    C = chrome(s, R)
    x, y = C["x"], C["y"]
    mw, dx, dw = split(C)

    # ① 카테고리 행 7
    for i in range(7):
        ry = y + i * 0.50
        sil_box(s, x, ry, mw, 0.44, ctx.on(1), lw=1.2)
        sil_circle(s, x + 0.06, ry + 0.09, 0.22, ctx.on(1))
        hline(s, x + 0.34, ry + 0.16, mw - 0.44, ctx.on(1))
        hline(s, x + 0.34, ry + 0.30, mw * 0.42, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, y - 0.02)

    # ⑥ 헤더 우측 액션 3버튼 (우측 상단)
    bw = 0.62
    b0 = dx + dw - 3 * bw - 2 * 0.06
    for i in range(3):
        sil_button(s, b0 + i * (bw + 0.06), y, bw, 0.26, ctx.on(6))
    ctx.mk(s, 6, b0 - 0.02, y - 0.02)
    hline(s, dx, y + 0.14, dw * 0.24, True, 1.8)

    # ② 기본 정보 카드
    a, ah = y + 0.38, 1.10
    sil_box(s, dx, a, dw, ah, ctx.on(2), lw=1.3)
    hline(s, dx + PAD, a + 0.16, dw * 0.24, ctx.on(2), 1.6)
    for i in range(3):
        sil_input(s, dx + PAD, a + 0.34 + i * 0.24, dw - 2 * PAD, 0.18, ctx.on(2))
    ctx.mk(s, 2, dx - 0.02, a - 0.02)

    # ③ 경로·연결 카드
    b, bh = a + ah + 0.12, 0.74
    sil_box(s, dx, b, dw, bh, ctx.on(3), lw=1.3)
    hline(s, dx + PAD, b + 0.16, dw * 0.24, ctx.on(3), 1.6)
    sil_input(s, dx + PAD, b + 0.30, dw - 2 * PAD, 0.18, ctx.on(3))
    sil_input(s, dx + PAD, b + 0.52, dw - 2 * PAD, 0.18, ctx.on(3))
    ctx.mk(s, 3, dx - 0.02, b - 0.02)

    # ④ 표시 스타일 카드 (아이콘 그리드 축약 + 색 dot 8 + 미리보기 pill)
    c, ch = b + bh + 0.12, 1.30
    sil_box(s, dx, c, dw, ch, ctx.on(4), lw=1.3, fill=GF7)
    hline(s, dx + PAD, c + 0.16, dw * 0.26, ctx.on(4), 1.6)
    sil_grid(s, dx + PAD, c + 0.32, dw * 0.52, 0.60, ctx.on(4), 7, 3, gap=0.06)
    for i in range(8):
        sil_circle(s, dx + dw * 0.60 + (i % 4) * 0.20, c + 0.34 + (i // 4) * 0.22, 0.16, ctx.on(4))
    sil_pill(s, dx + dw * 0.60, c + 0.88, 0.80, 0.22, ctx.on(4))
    ctx.mk(s, 4, dx - 0.02, c - 0.02)

    # ⑤ 노출 상태 토글 행
    d = c + ch + 0.12
    sil_box(s, dx, d, dw, 0.38, ctx.on(5), lw=1.2)
    hline(s, dx + PAD, d + 0.19, dw * 0.30, ctx.on(5))
    toggle(s, dx + dw - PAD - 0.40, d + 0.09, ctx.on(5))
    ctx.mk(s, 5, dx - 0.02, d - 0.02)


screen(prs, ("자동화·AI 도구 관리", "자동화·AI 도구 관리", "ADM-06", "/admin/platforms  (admin 전용)"),
       draw_adm06, [
           (1, "카테고리 목록", "아이콘·표시명·비활성 뱃지·내부 id"),
           (2, "기본 정보", "식별자[신규만]·표시명·한 줄 설명"),
           (3, "경로·연결", "라우트 경로·외부 도구 주소[미설정 표기]"),
           (4, "표시 스타일", "아이콘 선택기 21종·색 프리셋 8종·뱃지 미리보기"),
           (5, "노출 상태", "ON/OFF 토글"),
           (6, "액션", "추가·수정·비활성화·삭제[확인·비활성화 권장 안내]"),
       ], rule_box=(
           ["식별자 형식: 소문자·숫자·하이픈",
            "id·경로 중복 검사"],
           "카테고리 마스터 CRUD API. 편집 파급 고려 캐시 무효화 전략 필요. 비활성 카테고리의 기존 카드 정책은 명세서 확정(부록 B).",
       ))

# ============================================================
# ADM-07 부서·조직 관리
# ============================================================
def_slide(
    prs, "ADM-07", "부서·조직 관리 (Org)",
    tree=[
        (0, "조직 관리 (/admin/org)"),
        (1, "섹션1 관계사 노출"),
        (1, "섹션2 부서 관리 (+Teams 연동)"),
        (1, "섹션3 관계사 관리자 현황 (읽기)"),
        (1, "섹션4 문의 채널"),
        (1, "운영 유의사항"),
    ],
    flow=["관계사 노출 토글", "목록 게이팅 즉시 반영", "부서 동기화·수동 관리"],
    flow_branch=[(1, "관리자 지정·해제 → ADM-08로 이동"), (2, "부서 삭제 → 태깅 카드 경고")],
    flow_note=[
        "관계사 노출은 준비된 관계사부터 단계적으로 개방하기 위한 게이트다.",
        "관리자 현황을 읽기 전용으로 두고 편집은 ADM-08로 일원화한다 — 부여 지점이 분산되면 감사 추적이 어렵다.",
    ],
    sections=[
        ("정의·역할", ["접근: admin 전용",
                    "관계사 노출·부서 체계·관계사 관리자 현황·문의 채널의 조직 운영 화면"]),
        ("목적", ["카탈로그의 조직 축과 운영 설정을 한 화면에서 관리"]),
        ("기획 의도", ["관계사 노출은 준비된 관계사부터 단계적 개방 지원",
                    "부서는 SSO(Entra/Teams) 동기화 기본+수동 보조 — 조직 개편 잦은 환경의 정합 유지",
                    "관리자 현황은 읽기 전용, 편집은 ADM-08 일원화 — 부여 지점 분산 시 감사 추적 곤란"]),
        ("지켜야 할 룰", ["비노출 전환에도 기존 데이터 유지 안내",
                     "부서 삭제 시 태깅 카드 수 경고",
                     "관리자 지정·해제는 이 화면에서 안 함"]),
        ("개발 연동 노트", ["getOrgCompanies·getOrgDepts·getCompanyAdmins·getTeamsSyncSource·getAssetItemRefs",
                      "부서 동기화=Entra/Teams 디렉터리 API(주기·수동 실행), 문의 채널=운영 설정 저장, 노출 토글은 목록 게이팅과 즉시 정합"]),
    ],
)


def draw_adm07_p1(s, R, ctx):
    """LAYOUT ADM-07 p1
    행1: ①섹션1 카드 — 관계사 행들 4(명·건수·토글) + 검색
    행2: ②섹션2 카드 — 관계사 아코디언 2 └③Teams 연동 서브카드(섹션2 내부 하단)"""
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]

    # 행1 — ① 섹션1 관계사 노출 관리
    r1h = 1.60
    sil_box(s, x, y, w, r1h, ctx.on(1), lw=1.3)
    hline(s, x + PAD, y + 0.18, w * 0.22, ctx.on(1), 1.8)
    sil_input(s, x + w - PAD - 1.40, y + 0.10, 1.40, 0.22, ctx.on(1))
    for i in range(4):
        ry = y + 0.44 + i * 0.28
        hline(s, x + PAD, ry + 0.12, w * 0.32, ctx.on(1))
        hline(s, x + w * 0.48, ry + 0.12, w * 0.14, ctx.on(1))
        toggle(s, x + w - PAD - 0.40, ry + 0.02, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, y - 0.02)

    # 행2 — ② 섹션2 부서 관리
    r2 = y + r1h + 0.14
    r2h = h - (r2 - y) - 0.02
    sil_box(s, x, r2, w, r2h, ctx.on(2), lw=1.3)
    hline(s, x + PAD, r2 + 0.18, w * 0.20, ctx.on(2), 1.8)
    sil_input(s, x + w - PAD - 1.20, r2 + 0.10, 1.20, 0.22, ctx.on(2))
    for k in range(2):
        ay = r2 + 0.42 + k * 0.62
        sil_box(s, x + PAD, ay, w - 2 * PAD, 0.56, ctx.on(2), lw=1.1, fill=GF7)
        hline(s, x + PAD + 0.08, ay + 0.12, w * 0.24, ctx.on(2))
        for j in range(2):
            hline(s, x + PAD + 0.26, ay + 0.32 + j * 0.14, w * 0.36, ctx.on(2))
            sil_button(s, x + w - PAD - 0.96, ay + 0.26 + j * 0.14, 0.42, 0.12, ctx.on(2))
            sil_button(s, x + w - PAD - 0.50, ay + 0.26 + j * 0.14, 0.42, 0.12, ctx.on(2))
    ctx.mk(s, 2, x - 0.02, r2 - 0.02)
    # └ ③ Teams 연동 서브카드 — 섹션2 '내부' 하단
    ty = r2 + 1.72
    th = r2h - 1.72 - PAD
    sil_box(s, x + PAD, ty, w - 2 * PAD, th, ctx.on(3), lw=1.2)
    hline(s, x + PAD + 0.10, ty + 0.16, w * 0.22, ctx.on(3), 1.6)
    hline(s, x + PAD + 0.10, ty + 0.32, w * 0.38, ctx.on(3))
    sil_input(s, x + PAD + 0.10, ty + 0.44, w * 0.42, 0.18, ctx.on(3))
    sil_input(s, x + PAD + 0.10, ty + 0.68, w * 0.42, 0.18, ctx.on(3))
    sil_button(s, x + w - PAD - 0.92, ty + 0.58, 0.80, 0.26, ctx.on(3))
    ctx.mk(s, 3, x + PAD - 0.02, ty - 0.02)


def draw_adm07_p2(s, R, ctx):
    """LAYOUT ADM-07 p2
    행1: ④섹션3 카드 — 읽기 행들 3+우상단 이동 링크 / 행2: ⑤섹션4 카드 — URL 입력+저장 /
    행3: ⑥유의사항 박스"""
    C = chrome(s, R)
    x, y, w = C["x"], C["y"], C["w"]

    # 행1 — ④ 섹션3 관계사 관리자 현황 (읽기 전용)
    r1h = 1.90
    sil_box(s, x, y, w, r1h, ctx.on(4), lw=1.3)
    hline(s, x + PAD, y + 0.20, w * 0.26, ctx.on(4), 1.8)
    hline(s, x + w - PAD - 1.00, y + 0.20, 1.00, ctx.on(4))
    for i in range(3):
        ry = y + 0.48 + i * 0.44
        sil_box(s, x + PAD, ry, w - 2 * PAD, 0.38, ctx.on(4), lw=1.1, fill=GF7)
        hline(s, x + PAD + 0.10, ry + 0.14, w * 0.22, ctx.on(4))
        for j in range(3):
            sil_pill(s, x + w * 0.40 + j * 0.52, ry + 0.11, 0.46, 0.16, ctx.on(4))
    ctx.mk(s, 4, x - 0.02, y - 0.02)

    # 행2 — ⑤ 섹션4 문의 채널 설정
    r2, r2h = y + r1h + 0.14, 1.10
    sil_box(s, x, r2, w, r2h, ctx.on(5), lw=1.3)
    hline(s, x + PAD, r2 + 0.20, w * 0.22, ctx.on(5), 1.8)
    hline(s, x + PAD, r2 + 0.42, w * 0.50, ctx.on(5))
    sil_input(s, x + PAD, r2 + 0.62, w - 2 * PAD - 0.96, 0.24, ctx.on(5))
    sil_button(s, x + w - PAD - 0.84, r2 + 0.60, 0.84, 0.28, ctx.on(5))
    ctx.mk(s, 5, x - 0.02, r2 - 0.02)

    # 행3 — ⑥ 운영 유의사항 박스
    r3 = r2 + r2h + 0.14
    sil_box(s, x, r3, w, 0.90, ctx.on(6), lw=1.2, fill=GF7)
    hline(s, x + PAD, r3 + 0.22, w * 0.30, ctx.on(6), 1.6)
    for i in range(3):
        hline(s, x + PAD, r3 + 0.44 + i * 0.16, w * (0.84 - i * 0.14), ctx.on(6))
    ctx.mk(s, 6, x - 0.02, r3 - 0.02)


_adm07_be = ("getOrgCompanies·getOrgDepts·getCompanyAdmins·getTeamsSyncSource·getAssetItemRefs. "
             "부서 동기화=Entra/Teams 디렉터리 API(주기·수동 실행), 문의 채널=운영 설정 저장, "
             "노출 토글은 목록 게이팅과 즉시 정합.")
screen(prs, ("부서·조직 관리", "부서·조직 관리", "ADM-07", "/admin/org  (admin 전용)"), draw_adm07_p1, [
    (1, "관계사 노출 관리", "관계사별 토글·검색·보유 카드 수"),
    (2, "부서 관리", "관계사 아코디언·부서 행 수정/삭제[태깅 경고]·수동 추가[중복 검사]"),
    (3, "Teams 연동 카드", "연동 현황/설정[테넌트·자동 동기화·주기]/미리보기·지금 동기화"),
], page_no=1, page_total=2, subtitle="노출·부서", rule_box=(
    ["비노출 전환해도 기존 데이터 삭제되지 않음 안내"],
    _adm07_be,
))

screen(prs, ("부서·조직 관리", "부서·조직 관리", "ADM-07", "/admin/org  (admin 전용)"), draw_adm07_p2, [
    (4, "관계사 관리자 현황", "읽기 전용 — \"사용자 관리로 이동\" 링크"),
    (5, "문의 채널 설정", "Teams 채널 URL 편집·형식 검증"),
    (6, "운영 유의사항", "조직 관리 주의점 안내"),
], page_no=2, page_total=2, subtitle="현황·설정", rule_box=(
    ["권한 편집은 ADM-08 소관(현황판은 읽기 전용)"],
    _adm07_be,
))

# ============================================================
# ADM-08 사용자·권한·로그 관리
# ============================================================
def_slide(
    prs, "ADM-08", "사용자·권한·로그 관리 (Users)",
    tree=[
        (0, "사용자 관리 (/admin/users)"),
        (1, "탭1 관리자 권한"),
        (1, "탭2 그룹 전체보기"),
        (1, "탭3 등록자 관리"),
        (1, "탭4 활동 로그"),
    ],
    flow=["SSO 검색", "역할 선택", "부여", "회수(보호 장치)"],
    flow_branch=[(3, "마지막 admin 회수 차단"), (3, "본인 회수 차단"), (3, "담당 관계사 최소 1곳")],
    flow_note=[
        "보호 장치 3종으로 권한 공백·자기 잠금을 구조적으로 막고, 서버에서도 동일하게 검증한다.",
        "그룹 전체보기는 예외 권한이므로 사유 필수+확인 절차로 부여 근거를 기록한다.",
    ],
    sections=[
        ("정의·역할", ["접근: admin 전용",
                    "관리자 권한·그룹 전체보기·등록자 현황·활동 로그의 통합 관리"]),
        ("목적", ["권한 부여·회수의 단일 지점 + 관리 행위 로그 추적"]),
        ("기획 의도", ["권한 편집을 이 화면으로 일원화",
                    "보호 장치 3종(최소 1명·본인 차단·담당 최소 1곳)으로 권한 공백·자기 잠금을 구조적으로 방지 — 서버 동일 검증",
                    "그룹 전체보기는 예외 권한이므로 사유 필수+확인 절차로 부여 근거를 기록"]),
        ("지켜야 할 룰", ["보호 장치는 UI·서버 양쪽 적용",
                     "권한 변경은 활동 로그 기록",
                     "로그 소급 수정 금지(감사 무결성)"]),
        ("개발 연동 노트", ["getAdmins·getGroupViewers·getRegistrants·getAuditLogs·getSsoUsers·getSelectableCompanies·getCompanyAdmins",
                      "SSO 검색=디렉터리 API, 권한 변경=audit_logs 단일 트랜잭션, 보호 장치 서버 재검증(0.6)"]),
    ],
)


def draw_adm08_p1(s, R, ctx):
    """LAYOUT ADM-08 p1 (탭1 활성)
    행1: ①탭바 4 / 행2 2열(55:45): 좌 관리자 목록(전사 그룹+관계사 그룹, 행: 이름·pill·④회수·⑤담당 칩) |
    우 부여 패널(②SSO 검색 → ③역할 세그먼트+담당 복수 선택+부여 버튼)"""
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]

    # 행1 — ① 탭바 4
    tw = 0.94
    for i in range(4):
        sil_pill(s, x + i * (tw + 0.06), y, tw, 0.26, ctx.on(1) and i == 0)
    ctx.mk(s, 1, x - 0.02, y - 0.02)

    # 행2 — 2열(55:45)
    r2 = y + 0.38
    r2h = h - 0.38 - 0.02
    lw = (w - PAD) * 0.55
    rx, rw = x + lw + PAD, w - lw - PAD
    sil_box(s, x, r2, lw, r2h, True, lw=1.3)

    # 전사 그룹 (행: 이름·pill·④ 회수 버튼)
    hline(s, x + PAD, r2 + 0.18, lw * 0.28, True, 1.6)
    btnx = x + lw - PAD - 0.62
    for i in range(2):
        ry = r2 + 0.34 + i * 0.42
        sil_box(s, x + PAD, ry, lw - 2 * PAD, 0.36, ctx.on(4), lw=1.1)
        hline(s, x + PAD + 0.10, ry + 0.15, lw * 0.26, ctx.on(4))
        sil_pill(s, x + lw * 0.44, ry + 0.10, 0.40, 0.16, ctx.on(4))
        sil_button(s, btnx, ry + 0.06, 0.62, 0.24, ctx.on(4))
    ctx.mk(s, 4, btnx - 0.02, r2 + 0.32)

    # 관계사 그룹 (행: 이름·pill·회수·⑤ 담당 칩+편집)
    gy = r2 + 1.28
    hline(s, x + PAD, gy + 0.14, lw * 0.30, True, 1.6)
    for i in range(3):
        ry = gy + 0.30 + i * 0.66
        sil_box(s, x + PAD, ry, lw - 2 * PAD, 0.60, ctx.on(5), lw=1.1)
        hline(s, x + PAD + 0.10, ry + 0.15, lw * 0.24, ctx.on(5))
        sil_pill(s, x + lw * 0.42, ry + 0.10, 0.38, 0.16, ctx.on(5))
        sil_button(s, x + lw - PAD - 0.58, ry + 0.06, 0.58, 0.22, ctx.on(5))
        for j in range(3):
            sil_pill(s, x + PAD + 0.10 + j * 0.44, ry + 0.36, 0.40, 0.16, ctx.on(5))
        sil_button(s, x + lw - PAD - 0.46, ry + 0.34, 0.46, 0.20, ctx.on(5))
    ctx.mk(s, 5, x + PAD + 0.08, gy + 0.28)

    # 우 — 부여 패널
    sil_box(s, rx, r2, rw, 2.60, True, lw=1.3, fill=GF7)
    sy = r2 + 0.14
    sil_input(s, rx + PAD, sy, rw - 2 * PAD - 0.52, 0.22, ctx.on(2))
    sil_button(s, rx + rw - PAD - 0.48, sy, 0.48, 0.22, ctx.on(2))
    for i in range(2):
        sil_box(s, rx + PAD, sy + 0.32 + i * 0.26, rw - 2 * PAD, 0.22, ctx.on(2), lw=1.0)
    ctx.mk(s, 2, rx + PAD - 0.02, sy - 0.02)
    gy3 = sy + 0.94
    segw = (rw - 2 * PAD) / 2
    for i in range(2):
        sil_pill(s, rx + PAD + i * (segw + 0.04), gy3, segw - 0.02, 0.24, ctx.on(3))
    for r in range(2):
        for c in range(3):
            sil_pill(s, rx + PAD + c * 0.54, gy3 + 0.32 + r * 0.24, 0.50, 0.20, ctx.on(3))
    sil_button(s, rx + PAD, gy3 + 0.86, rw - 2 * PAD, 0.28, ctx.on(3))
    ctx.mk(s, 3, rx + PAD - 0.02, gy3 - 0.02)


def draw_adm08_p2(s, R, ctx):
    """LAYOUT ADM-08 p2
    행1: 탭바(2 활성 톤) / 행2: ⑥그룹 전체보기 카드 / 행3: ⑦등록자 테이블 / 행4: ⑧활동 로그"""
    C = chrome(s, R)
    x, y, w, h = C["x"], C["y"], C["w"], C["h"]

    # 행1 — 탭바 (탭2 활성 톤)
    tw = 0.94
    for i in range(4):
        sil_pill(s, x + i * (tw + 0.06), y, tw, 0.26, i == 1)

    # 행2 — ⑥ 그룹 전체보기 카드 (부여 행 + 사유 입력 + 회수)
    r2, r2h = y + 0.38, 1.20
    sil_box(s, x, r2, w, r2h, ctx.on(6), lw=1.3)
    hline(s, x + PAD, r2 + 0.18, w * 0.22, ctx.on(6), 1.8)
    for i in range(2):
        ry = r2 + 0.34 + i * 0.28
        sil_box(s, x + PAD, ry, w - 2 * PAD, 0.24, ctx.on(6), lw=1.0)
        sil_button(s, x + w - PAD - 0.56, ry + 0.02, 0.54, 0.20, ctx.on(6))
    sil_input(s, x + PAD, r2 + 0.94, w - 2 * PAD - 0.72, 0.20, ctx.on(6))
    sil_button(s, x + w - PAD - 0.62, r2 + 0.92, 0.62, 0.24, ctx.on(6))
    ctx.mk(s, 6, x - 0.02, r2 - 0.02)

    # 행3 — ⑦ 등록자 테이블 (헤더 + 행 3 + 더보기)
    r3, r3h = r2 + r2h + 0.12, 1.10
    sil_box(s, x, r3, w, r3h, ctx.on(7), lw=1.3)
    colw = (w - 2 * PAD) / 4
    for c in range(4):
        hline(s, x + PAD + c * colw, r3 + 0.18, colw * 0.54, ctx.on(7))
    seg(s, x + PAD, r3 + 0.28, x + w - PAD, r3 + 0.28, color=(GCC if ctx.on(7) else GDD), w=1.2)
    for i in range(3):
        ry = r3 + 0.44 + i * 0.20
        for c in range(4):
            hline(s, x + PAD + c * colw, ry, colw * 0.70, ctx.on(7))
    hline(s, x + w / 2 - 0.35, r3 + r3h - 0.14, 0.70, ctx.on(7))
    ctx.mk(s, 7, x - 0.02, r3 - 0.02)

    # 행4 — ⑧ 활동 로그 (필터 칩 + 검색 → 테이블 + 더보기)
    r4 = r3 + r3h + 0.12
    r4h = h - (r4 - y) - 0.02
    for i in range(5):
        sil_pill(s, x + i * 0.46, r4, 0.42, 0.20, ctx.on(8))
    sil_input(s, x + w - 1.50, r4, 1.50, 0.20, ctx.on(8))
    tb, tbh = r4 + 0.30, r4h - 0.30
    sil_box(s, x, tb, w, tbh, ctx.on(8), lw=1.3)
    for c in range(4):
        hline(s, x + PAD + c * colw, tb + 0.16, colw * 0.50, ctx.on(8))
    seg(s, x + PAD, tb + 0.26, x + w - PAD, tb + 0.26, color=(GCC if ctx.on(8) else GDD), w=1.2)
    for i in range(4):
        ry = tb + 0.42 + i * 0.18
        for c in range(4):
            hline(s, x + PAD + c * colw, ry, colw * 0.68, ctx.on(8))
    hline(s, x + w / 2 - 0.35, tb + tbh - 0.14, 0.70, ctx.on(8))
    ctx.mk(s, 8, x - 0.02, r4 - 0.02)


_adm08_be = ("getAdmins·getGroupViewers·getRegistrants·getAuditLogs·getSsoUsers·getSelectableCompanies·"
             "getCompanyAdmins. SSO 검색=디렉터리 API, 권한 변경=audit_logs 단일 트랜잭션, "
             "보호 장치 서버 재검증(0.6).")
screen(prs, ("사용자·권한·로그 관리", "사용자 관리", "ADM-08", "/admin/users  (admin 전용)"), draw_adm08_p1, [
    (1, "관리자 권한 탭", "전사/관계사 관리자 목록"),
    (2, "SSO 사용자 검색", "디렉터리 검색"),
    (3, "역할 선택·부여", "전사/관계사 — 관계사는 담당 복수 선택"),
    (4, "회수·보호 장치", "최소 1명 유지·본인 차단·담당 최소 1곳"),
    (5, "담당 관계사 편집", "추가/제거"),
], page_no=1, page_total=2, subtitle="권한", rule_box=(
    ["보호 장치 3종은 서버에서도 동일 검증(0.6)"],
    _adm08_be,
))

screen(prs, ("사용자·권한·로그 관리", "사용자 관리", "ADM-08", "/admin/users  (admin 전용)"), draw_adm08_p2, [
    (6, "그룹 전체보기 탭", "부여 목록·사유 필수·확인 절차·회수"),
    (7, "등록자 관리 탭", "등록 이력 사용자 테이블·더보기"),
    (8, "활동 로그 탭", "카테고리 필터·검색·테이블·더보기"),
], page_no=2, page_total=2, subtitle="기타 탭", rule_box=(
    ["그룹 전체보기 = 비노출 관계사 카드 열람 예외 권한 — 부여 근거 기록",
     "활동 로그 소급 수정 금지",
     "탭 2·3·4는 배타 전환 — 본 도면은 합성 표기"],
    _adm08_be,
))

# ============================================================
# ADM-09 공지·업데이트 관리
# ============================================================
def_slide(
    prs, "ADM-09", "공지·업데이트 관리 (Notices)",
    tree=[
        (0, "공지 관리 (/admin/notices)"),
        (1, "좌 소식 목록 (작성·종류 필터)"),
        (1, "우 내용 편집·노출 설정·저장/삭제"),
    ],
    flow=["작성/선택", "편집(종류·제목·본문·게시일)", "노출·고정 설정", "저장"],
    flow_branch=[(0, "companyAdmin 진입 → 전사 전용 안내"), (3, "삭제 → 노출 끄기 권장 안내")],
    flow_note=[
        "소식은 전사 공지 성격이라 라우트+화면 이중 방어로 전사 관리자 전용을 지킨다.",
        "삭제 대신 노출 끄기를 권장해 이력 유실을 막는다.",
    ],
    sections=[
        ("정의·역할", ["접근: admin 전용 (라우트는 companyAdmin 통과·화면에서 전사 전용 안내)",
                    "공지사항·업데이트의 작성·수정·삭제·고정·노출 관리"]),
        ("목적", ["랜딩 최신소식·소식 화면의 콘텐츠 운영"]),
        ("기획 의도", ["소식은 전사 공지 성격 — 전사 관리자 전용(라우트+화면 이중 방어)",
                    "삭제 대신 노출 끄기 권장 — 이력 유실 방지",
                    "소식은 알림 미발생(0.10) — 알림은 본인 신청·활동 통지로 한정해 피로도 관리"]),
        ("지켜야 할 룰", ["게시일 YYYY.MM.DD 형식",
                     "고정 소식 상단 우선",
                     "노출 꺼진 소식은 사용자 미표시·데이터 유지"]),
        ("개발 연동 노트", ["getAdminNotices(비노출 포함). 공지 CRUD·고정/노출 토글 API, 소식 ID 서버 발급",
                      "공개/관리 조회의 노출 필터 차이 구분"]),
    ],
)


def draw_adm09(s, R, ctx):
    """LAYOUT ADM-09 (마스터·디테일 단일 페이지)
    좌 300: ①헤더(소식 N+작성) → 종류 필터 3pill → 소식 행 4 |
    우: ②내용 카드 → ③노출 설정 카드 → ④헤더 우측 저장·삭제 → ⑤ID 표기 줄(우측 상단 메타)"""
    C = chrome(s, R)
    x, y = C["x"], C["y"]
    mw, dx, dw = split(C)

    # ① 좌 헤더 → 종류 필터 → 소식 행 4
    hline(s, x, y + 0.12, mw * 0.40, ctx.on(1), 1.8)
    sil_button(s, x + mw - 0.52, y, 0.52, 0.24, ctx.on(1))
    fw = (mw - 2 * 0.05) / 3
    for i in range(3):
        sil_pill(s, x + i * (fw + 0.05), y + 0.34, fw, 0.18, ctx.on(1))
    for i in range(4):
        ry = y + 0.62 + i * 0.62
        sil_box(s, x, ry, mw, 0.56, ctx.on(1), lw=1.2)
        sil_pill(s, x + 0.05, ry + 0.06, 0.26, 0.12, ctx.on(1))
        sil_pill(s, x + 0.34, ry + 0.06, 0.22, 0.12, ctx.on(1))
        hline(s, x + 0.05, ry + 0.30, mw - 0.16, ctx.on(1))
        hline(s, x + 0.05, ry + 0.44, mw * 0.44, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, y - 0.02)

    # ⑤ ID 표기 줄 (우측 상단 메타)
    idw = 1.10
    hline(s, dx + dw - idw, y + 0.10, idw, ctx.on(5))
    ctx.mk(s, 5, dx + dw - idw - 0.30, y - 0.02)

    # ④ 헤더 우측 저장·삭제
    hr = y + 0.34
    hline(s, dx, hr + 0.14, dw * 0.28, True, 1.8)
    sil_button(s, dx + dw - 1.24, hr, 0.60, 0.26, ctx.on(4))
    sil_button(s, dx + dw - 0.60, hr, 0.60, 0.26, ctx.on(4))
    ctx.mk(s, 4, dx + dw - 1.26, hr - 0.02)

    # ② 내용 카드 (종류 세그먼트·제목·본문 영역·게시일)
    a, ah = y + 0.72, 2.60
    sil_box(s, dx, a, dw, ah, ctx.on(2), lw=1.3)
    for i in range(2):
        sil_pill(s, dx + PAD + i * 0.64, a + 0.14, 0.60, 0.22, ctx.on(2))
    sil_input(s, dx + PAD, a + 0.48, dw - 2 * PAD, 0.22, ctx.on(2))
    sil_box(s, dx + PAD, a + 0.80, dw - 2 * PAD, 1.34, ctx.on(2), lw=1.1, fill=GF7)
    sil_lines(s, dx + PAD + 0.10, a + 0.94, dw - 2 * PAD - 0.20, ctx.on(2), n=6, gap=0.18)
    sil_input(s, dx + PAD, a + 2.26, dw * 0.42, 0.20, ctx.on(2))
    ctx.mk(s, 2, dx - 0.02, a - 0.02)

    # ③ 노출 설정 카드 (고정 토글 행 · 노출 토글 행)
    b = a + ah + 0.12
    sil_box(s, dx, b, dw, 0.94, ctx.on(3), lw=1.3, fill=GF7)
    hline(s, dx + PAD, b + 0.16, dw * 0.24, ctx.on(3), 1.6)
    for i in range(2):
        ry = b + 0.34 + i * 0.28
        hline(s, dx + PAD, ry + 0.12, dw * 0.34, ctx.on(3))
        toggle(s, dx + dw - PAD - 0.40, ry + 0.02, ctx.on(3))
    ctx.mk(s, 3, dx - 0.02, b - 0.02)


screen(prs, ("공지·업데이트 관리", "공지 관리", "ADM-09",
             "/admin/notices  (admin 전용 · 라우트는 companyAdmin 통과)"), draw_adm09, [
    (1, "소식 목록", "작성 버튼·종류 필터[전체/공지사항/업데이트]·행: 종류 뱃지·고정/숨김 뱃지·제목·날짜·더보기"),
    (2, "내용 편집", "종류 선택·제목·본문·게시일[형식 검증]"),
    (3, "노출 설정", "고정/일반·노출/숨김 토글[조회 모드 즉시 반영]"),
    (4, "저장·삭제", "확인 절차·\"노출 끄기 권장\" 안내"),
    (5, "소식 ID", "신규 저장 시 NOTICE-{연도}-{순번} 발급"),
], rule_box=(
    ["companyAdmin 진입 시 \"전사 관리자 전용\" 안내 렌더",
     "소식은 알림을 발생시키지 않음(0.10)"],
    "getAdminNotices(비노출 포함). 공지 CRUD·고정/노출 토글 API, 소식 ID 서버 발급, 공개/관리 조회의 노출 필터 차이 구분.",
))

# ============================================================
out = os.path.join(os.path.dirname(__file__), "admin-screens.pptx")
prs.save(out)
print("SAVED", out, "slides=", len(prs.slides._sldIdLst))
