# -*- coding: utf-8 -*-
"""V4 / SPEC-RENDER v2 — 사용자 영역 화면정의서 → user-screens.pptx
확정 템플릿: 무언어 실루엣 와이어프레임 + 우측 Description + 하단 '화면 룰·기획 근거' 박스.
p0 = 좌[구조 트리 / 사용자 흐름 + 설계 근거 주석] · 우[정의·역할/목적/기획 의도/룰/개발 연동 노트 5단].

렌더 규약(v2)
 1) 실루엣 배치는 LAYOUT 정본을 그대로 옮긴다 — 자동 구성 금지.
 2) 텍스트(마커 라벨·설명·rule_box)는 payload 정본 — 변형 금지.
    LAYOUT의 [rule_box 추가] 표기만 해당 rule_box에 문장으로 덧붙인다.
 3) 마커 지름: 1자리 0.26in / 2자리 0.30in (spec_common.marker 자동 처리).
 4) 마커는 대상 실루엣의 좌상단에 인접 배치 — 행 끝 배치 금지.
 5) LAYOUT의 들여쓰기(└)는 컨테이너 '내부'를 뜻한다 — 소속 관계를 도형으로 지킨다.

공통 서두(PAYLOAD-META)
 · 화면에 표기된 카테고리·업무 도메인 등 분류 개수는 마스터 데이터에서
   파생되는 현재값이며, 고정 상수가 아니다(0.9).

수록 화면: USR-00 랜딩 · 01 로그인 · 03 목록 · 04 상세 · 05 등록 · 06 수정 요청 ·
          07 내 현황 · 08 공통 내비 · 09 이용 가이드 · 10 소식 · 11 설정
USR-02(소개)는 결번 — 콘텐츠가 USR-09 이용 가이드로 흡수되어 슬라이드를 생성하지 않는다."""
import os
import spec_common
from spec_common import (
    new_deck, def_slide, screen, rect, sil_box, sil_button, sil_input, sil_lines,
    sil_grid, sil_pill, sil_circle, tiny, seg,
    G33, G66, G99, GCC, GDD, GEE, GF7, WHITE,
)

spec_common.AUTHOR = "배상혁"
spec_common.DEF_NOTE = ("화면에 표기된 카테고리·업무 도메인 등 분류 개수는 "
                        "마스터 데이터에서 파생되는 현재값이며, 고정 상수가 아니다(0.9).")
prs = new_deck()


# ---- 공용 실루엣 조각 ----
def hline(s, x, y, w, active, weight=1.1):
    """단일 가로 텍스트 라인 실루엣."""
    seg(s, x, y, x + w, y, color=(G66 if active else GDD), w=weight)


def clines(s, cx, y, widths, active, gap=0.16, weight=1.1):
    """중앙 정렬 라인 스택 — cx를 중심으로 widths 순서대로 쌓는다."""
    for i, ww in enumerate(widths):
        hline(s, cx - ww / 2, y + i * gap, ww, active, weight)


def dashed_box(s, x, y, w, h, active):
    """점선 안내 박스."""
    from pptx.enum.dml import MSO_LINE_DASH_STYLE
    sp = rect(s, x, y, w, h, fill=WHITE, line=(G99 if active else GDD), line_w=1.1)
    sp.line.dash_style = MSO_LINE_DASH_STYLE.DASH
    return sp


def nav(s, R, ctx, n):
    """상단 공통 Navbar. n=0으로 부르면 마커 없이 톤다운 배경으로만 그린다."""
    x, y, w = R["x"], R["y"], R["w"]
    sil_box(s, x, y, w, 0.34, ctx.on(n), lw=1.3)
    sil_pill(s, x + 0.08, y + 0.09, 0.7, 0.16, ctx.on(n))               # 브랜드
    for i in range(3):
        sil_pill(s, x + 1.05 + i * 0.62, y + 0.1, 0.5, 0.14, ctx.on(n))  # 메뉴 3종
    sil_circle(s, x + w - 0.66, y + 0.06, 0.22, ctx.on(n))              # 알림 벨
    sil_circle(s, x + w - 0.32, y + 0.06, 0.22, ctx.on(n))              # 아바타
    ctx.mk(s, n, x - 0.02, y - 0.02)
    return y + 0.34 + 0.14


def footer(s, R, ctx, n):
    x, w = R["x"], R["w"]
    fy = R["y"] + R["h"] - 0.26
    sil_box(s, x, fy, w, 0.26, ctx.on(n), lw=1.3, fill=GF7)
    ctx.mk(s, n, x - 0.02, fy - 0.02)


# ============================================================
# USR-00 랜딩
# ============================================================
def_slide(
    prs, "USR-00", "랜딩 (Landing)",
    tree=[
        (0, "랜딩 (/)"),
        (1, "① 프로모션 배너 · 개인화 패널 · 퀵메뉴"),
        (1, "② 히어로 (검색 · 카테고리 7타일)"),
        (1, "③ 플랫폼 현황 (총 카드 수 · 카테고리 막대)"),
        (1, "④ 인기 카드 (좋아요 상위 6)"),
        (1, "⑤ 최신소식 · 실시간 인기 카드"),
        (1, "⑥ 업무별 카드 (도메인 필터)"),
        (1, "⑦ CTA 4종"),
    ],
    flow=["방문", "개인화 확인", "탐색(검색·타일)", "목록·상세 이동"],
    flow_branch=(1, "미로그인 = 열람만"),
    flow_note=[
        "개인화 패널을 최상단에 둬 재방문자가 스크랩·추천·알림으로 이전 맥락을 먼저 잇게 한다.",
        "관심사 미설정 시 임의 추천 대신 설정 안내를 노출해 추천의 신뢰를 지킨다.",
    ],
    sections=[
        ("정의·역할", ["접근: 공개 — 비로그인도 열람 가능",
                    "플랫폼 진입 첫 화면 — 카탈로그 탐색 시작점 + 개인화 요약 허브"]),
        ("목적", ["보유 자산을 즉시 보여주고 탐색·등록·가이드로 연결",
                "'지금 우리 그룹에 무엇이 있는지'를 한 화면에서 파악"]),
        ("기획 의도", ["개인화 패널 최상단 배치로 재방문 맥락을 이어보게 함",
                    "관심사 미설정 시 임의 추천 대신 설정 안내 — 추천 신뢰 유지"]),
        ("지켜야 할 룰", ["관계사 귀속 미표시(0.5)",
                     "절감 수치 미노출(0.8)",
                     "총 카드 수는 SSOT 파생 총량과 일치(0.9)"]),
        ("개발 연동 노트", ["getAssetItems·getNotices·getMonthlyNewCount, 훅 useScraps·useInterests·useNotifications",
                      "추천은 서버 API 대체 후보, 조회수 서버 집계 전환, PartnerMarquee 별도 담당 복원 예정"]),
    ],
)


def draw_usr00_top(s, R, ctx):
    """LAYOUT USR-00 p1
    행1 전폭 Navbar / 행2 2열(71:27) ①배너 | ②패널└③퀵메뉴 /
    행3 전폭 ④히어로 / 행4 2열(60:40) ⑤카운터 | 카테고리 막대 7줄(마커 ⑤ 1개)"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — Navbar
    cy = nav(s, R, ctx, 0)

    # 행2 — 2열(71:27)
    r2, r2h = cy, 1.44
    lw2 = w * 0.71
    px, pw = x + w * 0.73, w * 0.27
    # ① 프로모션 배너 (큰 박스 + 하단 도트)
    sil_box(s, x, r2, lw2, r2h, ctx.on(1), lw=1.4, fill=GF7)
    clines(s, x + lw2 / 2, r2 + 0.46, [lw2 * 0.60, lw2 * 0.40], ctx.on(1), gap=0.22)
    for i in range(3):
        sil_circle(s, x + lw2 / 2 - 0.21 + i * 0.17, r2 + r2h - 0.24, 0.10, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, r2 - 0.02)
    # ② 개인화 패널 (인사말 · 스크랩행 · 추천행 · 알림 3행)
    sil_box(s, px, r2, pw, r2h, ctx.on(2), lw=1.4)
    hline(s, px + 0.10, r2 + 0.17, pw * 0.62, ctx.on(2))
    sil_box(s, px + 0.10, r2 + 0.26, pw - 0.20, 0.20, ctx.on(2), lw=1.0, fill=GF7)
    sil_box(s, px + 0.10, r2 + 0.50, pw - 0.20, 0.20, ctx.on(2), lw=1.0, fill=GF7)
    for i in range(3):
        hline(s, px + 0.12, r2 + 0.78 + i * 0.11, pw - 0.30, ctx.on(2))
    ctx.mk(s, 2, px - 0.02, r2 - 0.02)
    # └③ 퀵메뉴 — 패널 내부 최하단(상단 구분선 + 가로 4버튼 그리드)
    qy = r2 + 1.12
    seg(s, px + 0.08, qy - 0.06, px + pw - 0.08, qy - 0.06, color=GCC, w=1.0)
    qbw = (pw - 0.20 - 3 * 0.03) / 4
    for i in range(4):
        sil_button(s, px + 0.10 + i * (qbw + 0.03), qy, qbw, 0.24, ctx.on(3))
    ctx.mk(s, 3, px + 0.06, qy - 0.02)

    # 행3 — ④ 히어로 (중앙 헤드라인 · 중앙 검색 바 · 하단 타일 7)
    r3, r3h = r2 + r2h + 0.12, 1.30
    sil_box(s, x, r3, w, r3h, ctx.on(4), lw=1.5, fill=GF7)
    clines(s, x + w / 2, r3 + 0.20, [w * 0.56, w * 0.36], ctx.on(4), gap=0.20)
    sil_input(s, x + w * 0.17, r3 + 0.64, w * 0.66, 0.26, ctx.on(4))
    tiny(s, x + w * 0.17, r3 + 0.64, w * 0.66, "검색", ctx.on(4))
    tw = (w - 0.24 - 6 * 0.05) / 7
    for i in range(7):
        sil_box(s, x + 0.12 + i * (tw + 0.05), r3 + 0.98, tw, 0.26, ctx.on(4), lw=1.1, round=True)
    ctx.mk(s, 4, x - 0.02, r3 - 0.02)

    # 행4 — 2열(60:40) ⑤ 카운터 + [전체 카드 보기] | 카테고리 가로 막대 7줄
    r4 = r3 + r3h + 0.12
    r4h = R["y"] + h - r4
    lw4 = w * 0.60 - 0.07
    bx4, bw4 = x + w * 0.60 + 0.07, w * 0.40 - 0.07
    sil_box(s, x, r4, lw4, r4h, ctx.on(5), lw=1.4)
    sil_box(s, x + 0.16, r4 + 0.18, 1.30, 0.54, ctx.on(5), lw=1.2, fill=GF7)     # 큰 숫자
    hline(s, x + 0.16, r4 + 0.86, 1.10, ctx.on(5))
    sil_button(s, x + 0.16, r4 + r4h - 0.44, 1.40, 0.30, ctx.on(5))              # 전체 카드 보기
    fr = [0.95, 0.80, 0.68, 0.56, 0.45, 0.33, 0.22]
    for i in range(7):
        yy = r4 + 0.05 + i * 0.20
        hline(s, bx4, yy + 0.07, 0.46, ctx.on(5))
        rect(s, bx4 + 0.54, yy, (bw4 - 0.54) * fr[i], 0.13,
             fill=(GCC if ctx.on(5) else GEE), line=(G66 if ctx.on(5) else GDD), line_w=0.75)
    ctx.mk(s, 5, x - 0.02, r4 - 0.02)


screen(prs, ("랜딩", "AX Platform 홈", "USR-00", "/  (공개)"), draw_usr00_top, [
    (1, "프로모션 배너", "5초 자동 전환 · 클릭 시 해당 카테고리 목록으로 이동"),
    (2, "개인화 패널", "스크랩 N개 → 스크랩 필터 목록 · 맞춤 추천 · 알림 최근 3건", "관심사 미설정 시 추천 대신 설정 안내"),
    (3, "퀵메뉴", "등록 현황 · 설정 · 카드 등록 · 로그아웃"),
    (4, "히어로", "회전 헤드라인 + 검색(→ ?q=) + 카테고리 7타일"),
    (5, "플랫폼 현황", "총 카드 수 카운터 + 카테고리별 막대 + [전체 카드 보기]"),
], page_no=1, page_total=2, subtitle="상단·개인화", rule_box=(
    ["관계사 귀속은 사용자 화면에 표시하지 않는다(0.5).",
     "총 카드 수 = 목록·통계와 항상 동수 — SSOT 파생 총량이 단일 기준(0.9).",
     "비로그인도 열람 가능 — 로그인 여부의 차이는 인사말뿐이다."],
    "getAssetItems·getMonthlyNewCount 집계, 개인화는 useScraps·useInterests·useNotifications 훅 경유.",
))


def draw_usr00_body(s, R, ctx):
    """LAYOUT USR-00 p2
    행1 ⑥인기 카드 / 행2 2열(50:50) ⑦최신소식(└탭 컬럼|리스트) | ⑧실시간 인기 /
    행3 ⑨업무별 카드 / 행4 ⑩CTA 4박스 / 행5 Footer"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — ⑥ 인기 카드 (칩 8 → 카드 3×2 → 하단 우측 더보기)
    r1, r1h = y, 1.44
    chw = (w - 7 * 0.05) / 8
    for i in range(8):
        sil_pill(s, x + i * (chw + 0.05), r1, chw, 0.18, ctx.on(6))
    sil_grid(s, x, r1 + 0.28, w, 0.92, ctx.on(6), 3, 2)
    hline(s, x + w - 0.80, r1 + 1.32, 0.80, ctx.on(6))
    ctx.mk(s, 6, x - 0.02, r1 - 0.02)

    # 행2 — 2열(50:50)
    r2, r2h = r1 + r1h + 0.12, 1.12
    cw2 = w * 0.5 - 0.06
    x2 = x + w * 0.5 + 0.06
    # ⑦ 최신소식 — 카드 헤더(우상단 더보기) + 내부 2열[탭 컬럼 | 리스트 4행]
    sil_box(s, x, r2, cw2, r2h, ctx.on(7), lw=1.4)
    hline(s, x + 0.12, r2 + 0.18, 1.00, ctx.on(7), 1.6)
    hline(s, x + cw2 - 0.74, r2 + 0.18, 0.62, ctx.on(7))
    seg(s, x + 0.10, r2 + 0.30, x + cw2 - 0.10, r2 + 0.30, color=GEE, w=1.0)
    for i in range(2):
        sil_button(s, x + 0.12, r2 + 0.40 + i * 0.30, 0.58, 0.26, ctx.on(7))
    lx = x + 0.82
    for i in range(4):
        hline(s, lx, r2 + 0.46 + i * 0.16, cw2 - 0.94, ctx.on(7))
    ctx.mk(s, 7, x - 0.02, r2 - 0.02)
    # ⑧ 실시간 인기 카드 (순위 5행)
    sil_box(s, x2, r2, cw2, r2h, ctx.on(8), lw=1.4, fill=GF7)
    hline(s, x2 + 0.12, r2 + 0.18, 1.10, ctx.on(8), 1.6)
    for i in range(5):
        yy = r2 + 0.36 + i * 0.145
        sil_pill(s, x2 + 0.12, yy, 0.14, 0.12, ctx.on(8))
        hline(s, x2 + 0.34, yy + 0.07, cw2 - 0.56, ctx.on(8))
    ctx.mk(s, 8, x2 - 0.02, r2 - 0.02)

    # 행3 — ⑨ 업무별 카드 (칩 줄 → 카드 3×2 → 더보기)
    r3, r3h = r2 + r2h + 0.12, 1.22
    for i in range(6):
        sil_pill(s, x + i * 0.60, r3, 0.54, 0.17, ctx.on(9))
    sil_grid(s, x, r3 + 0.26, w, 0.74, ctx.on(9), 3, 2)
    hline(s, x + w - 0.80, r3 + 1.10, 0.80, ctx.on(9))
    ctx.mk(s, 9, x - 0.02, r3 - 0.02)

    # 행4 — ⑩ CTA 가로 4박스
    r4, r4h = r3 + r3h + 0.10, 0.44
    cbw = (w - 3 * 0.10) / 4
    for i in range(4):
        sil_box(s, x + i * (cbw + 0.10), r4, cbw, r4h, ctx.on(10), lw=1.3, fill=GF7, round=True)
    ctx.mk(s, 10, x - 0.02, r4 - 0.02)

    # 행5 — Footer 스트립
    footer(s, R, ctx, 0)


screen(prs, ("랜딩", "AX Platform 홈", "USR-00", "/  (공개)"), draw_usr00_body, [
    (6, "인기 카드", "카테고리 필터 + 좋아요 상위 6 · 카드에 스크랩 토글과 카드 ID 표기"),
    (7, "최신소식", "종류 탭(공지사항·업데이트) + [더보기] → /notices"),
    (8, "실시간 인기 카드", "조회수 상위 5"),
    (9, "업무별 카드", "업무 도메인 필터로 전환되는 카드 묶음"),
    (10, "CTA 4종", "둘러보기 · AI Model · 이용 가이드 · 문의 채널(Teams 새 창)"),
], page_no=2, page_total=2, subtitle="콘텐츠·CTA", rule_box=(
    ["절감 수치는 사용자 화면에 노출하지 않는다(0.8).",
     "소식은 공지 SSOT 단일 소스 — 소식 화면(USR-10)과 항상 일치한다.",
     "인기·실시간 인기는 좋아요·조회수라는 객관 지표만으로 정렬한다."],
    "추천은 서버 API 대체 후보, 조회수는 서버 집계로 전환, PartnerMarquee는 별도 담당 복원 예정.",
))

# ============================================================
# USR-01 로그인
# ============================================================
def_slide(
    prs, "USR-01", "로그인 (Login)",
    tree=[
        (0, "로그인 (/login)"),
        (1, "브랜드 (KOLMAR / AX Platform)"),
        (1, "SSO 로그인 버튼 (Microsoft)"),
        (1, "데모 계정 접이식"),
        (2, "admin · user 3종 · companyAdmin 2종"),
        (1, "지원 링크 (문의 메일)"),
        (1, "하단 고지 (사내 전용 · 외부 접근 불가)"),
    ],
    flow=["로그인 진입", "SSO 인증", "역할 판별", "역할별 이동"],
    flow_branch=(2, "admin → /admin"),
    flow_note=[
        "SSO를 상시 기본 동선으로 두고 데모 계정은 접이식 보조로 숨겨, 실서비스 전환 시 구조 변경을 최소화한다.",
        "companyAdmin을 단일·복수 담당 2종으로 준비해 가시성 필터 동작을 시연 단계에서 검증한다.",
    ],
    sections=[
        ("정의·역할", ["접근: 공개",
                    "그룹 SSO 진입점 — 데모 단계는 데모 계정을 병행"]),
        ("목적", ["실서비스 SSO 단일 동선 확보",
                "데모 권한 시나리오(전사·관계사·일반) 시연"]),
        ("기획 의도", ["SSO 상시 기본 · 데모는 접이식 보조 — 전환 시 구조 변경 최소화",
                    "companyAdmin 2종(단일·복수 담당)으로 가시성 필터 대비 시연"]),
        ("지켜야 할 룰", ["'실제 배포 시 제거' 고지 유지",
                     "소속 표시는 0.5 허용 범위",
                     "'사내 전용 플랫폼' 고지 유지"]),
        ("개발 연동 노트", ["getManagedCompanies(email) → GET /auth/me 로 대체",
                      "Azure AD OIDC → JWT(0.6). demo_user 세션키는 SSO 전환 시 제거"]),
    ],
)


def draw_usr01(s, R, ctx):
    """LAYOUT USR-01 — 중앙 단일 카드(inner 폭 ~40%, 세로 중앙) 내부 세로 스택.
    ①로고2행+제목+설명 → ②SSO → ③데모 접이식 → ④구분선+지원 → ⑤고지 (전부 카드 내부)"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cw = w * 0.40
    cx = x + (w - cw) / 2
    ch = 4.10
    cy = y + (h - ch) / 2
    sil_box(s, cx, cy, cw, ch, False, lw=1.6)

    # ① 로고 2행 + 제목 + 설명 (3블록 묶음)
    sil_pill(s, cx + cw / 2 - 0.46, cy + 0.16, 0.92, 0.22, ctx.on(1))
    sil_pill(s, cx + cw / 2 - 0.33, cy + 0.44, 0.66, 0.18, ctx.on(1))
    clines(s, cx + cw / 2, cy + 0.74, [cw * 0.60], ctx.on(1), weight=1.6)
    clines(s, cx + cw / 2, cy + 0.88, [cw * 0.82], ctx.on(1))
    ctx.mk(s, 1, cx - 0.02, cy + 0.14)
    # ② SSO 버튼
    sil_button(s, cx + 0.18, cy + 1.06, cw - 0.36, 0.32, ctx.on(2))
    ctx.mk(s, 2, cx - 0.02, cy + 1.04)
    # ③ 데모 계정 접이식 (6계정 행 + '제거' 안내)
    sil_button(s, cx + 0.18, cy + 1.54, cw - 0.36, 0.26, ctx.on(3))
    for i in range(6):
        sil_box(s, cx + 0.18, cy + 1.88 + i * 0.22, cw - 0.36, 0.19, ctx.on(3), lw=1.0)
    hline(s, cx + 0.24, cy + 3.28, cw - 0.48, ctx.on(3))
    ctx.mk(s, 3, cx - 0.02, cy + 1.52)
    # ④ 구분선 + 지원 문의
    seg(s, cx + 0.18, cy + 3.46, cx + cw - 0.18, cy + 3.46, color=GCC, w=1.0)
    clines(s, cx + cw / 2, cy + 3.58, [cw * 0.66], ctx.on(4))
    ctx.mk(s, 4, cx - 0.02, cy + 3.40)
    # ⑤ 하단 고지 (카드 내부)
    clines(s, cx + cw / 2, cy + 3.78, [cw * 0.78, cw * 0.54], ctx.on(5), gap=0.14)
    ctx.mk(s, 5, cx - 0.02, cy + 3.72)


screen(prs, ("로그인", "그룹 SSO 로그인", "USR-01", "/login  (공개)"), draw_usr01, [
    (1, "브랜드 영역", "KOLMAR / AX Platform 워드마크와 안내 문구"),
    (2, "SSO 로그인 버튼", "Microsoft 계정 로그인 — 상시 기본 동선"),
    (3, "데모 계정 접이식", "6종(admin · user 3종 · companyAdmin 2종) — 역할·소속·담당 표시", "'실제 배포 시 제거' 안내 유지"),
    (4, "지원 링크", "로그인 문의 메일 링크"),
    (5, "하단 고지", "'사내 전용 플랫폼 · 외부 접근 불가'"),
], rule_box=(
    ["SSO를 상시 기본으로 노출하고 데모 계정 6종은 접이식으로 감춰 실서비스 전환 시 구조 변경을 없앤다.",
     "데모 영역에는 '실제 배포 시 제거' 안내를 반드시 유지한다.",
     "관리자 역할(admin·companyAdmin)은 로그인 후 /admin으로, 일반 사용자는 원래 목적지로 이동한다."],
    "getManagedCompanies(email)를 GET /auth/me로 대체, Azure AD OIDC→JWT(0.6), demo_user 세션키는 전환 시 제거.",
))

# ============================================================
# USR-03 카탈로그 목록
# ============================================================
def_slide(
    prs, "USR-03", "카탈로그 목록 (Catalog)",
    tree=[
        (0, "카탈로그 목록 (/projects)"),
        (1, "헤더 (타이틀 · 검색)"),
        (1, "고정 필터 2행"),
        (2, "카테고리(전체+7) · 도메인"),
        (2, "인기 태그 6 · 스크랩 N · 초기화"),
        (1, "결과 수 · 정렬 3종"),
        (1, "카드 그리드"),
        (1, "더보기 (24개 단위)"),
    ],
    flow=["진입(파라미터 수신)", "필터·검색 조합", "카드 선택", "카드 상세"],
    flow_branch=(1, "스크랩 토글 필터"),
    flow_note=[
        "필터를 sticky로 고정해 스크롤 중에도 조건이 눈에 남게 하고, 스크랩은 별도 화면 대신 필터 토글로 흡수했다.",
        "초기화는 클릭형 필터만 해제하고 검색어·정렬은 보존한다 — 의도된 동작이다.",
    ],
    sections=[
        ("정의·역할", ["접근: 로그인 필요",
                    "전체 카드의 탐색·필터 화면 — 플랫폼 중심 동선"]),
        ("목적", ["카테고리·도메인·태그·검색·스크랩 축을 조합한 탐색",
                "중복 개발 방지와 재사용 유도"]),
        ("기획 의도", ["필터 sticky 고정으로 스크롤 중 조건 유지",
                    "스크랩은 별도 화면 대신 필터 토글",
                    "초기화는 클릭형 필터만 해제(검색·정렬 보존)"]),
        ("지켜야 할 룰", ["관계사 귀속 미표시",
                     "company는 목록 게이팅 전용",
                     "카드 ID 상시 표시(0.3)"]),
        ("개발 연동 노트", ["getAssetItems·getOrgCompanies",
                      "연동 시 필터·정렬·페이지 서버 처리(GET /assets), 게이팅·그룹뷰어 서버 재검증(0.6)"]),
    ],
)


def draw_usr03(s, R, ctx):
    """LAYOUT USR-03
    행1 Navbar / 행2 2열[제목·뱃지 | ①검색] / 행3 필터 박스(sticky)[행a ②세그먼트 2블록 / 행b ③태그·스크랩·초기화]
    행4 ④결과 수|정렬 / 행5 ⑤카드 4열×2행 / 행6 ⑥더보기 중앙 / 행7 Footer"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — Navbar
    cy = nav(s, R, ctx, 0)

    # 행2 — 좌 제목·뱃지 | 우 ① 검색 박스
    r2, r2h = cy, 0.40
    hline(s, x, r2 + 0.12, 1.30, False, 1.6)
    sil_pill(s, x + 1.44, r2 + 0.06, 0.62, 0.18, False)
    sw = 2.10
    sil_input(s, x + w - sw, r2 + 0.06, sw, 0.26, ctx.on(1))
    tiny(s, x + w - sw, r2 + 0.06, sw, "검색", ctx.on(1))
    ctx.mk(s, 1, x + w - sw - 0.02, r2 + 0.04)

    # 행3 — 고정 필터 박스
    r3, r3h = r2 + r2h + 0.10, 0.84
    sil_box(s, x, r3, w, r3h, ctx.on(2) or ctx.on(3), lw=1.3, fill=GF7)
    # 행a — [카테고리 세그먼트 | 도메인 세그먼트]
    ay = r3 + 0.10
    catw, domw = 2.90, 1.70
    sil_box(s, x + 0.10, ay, catw, 0.28, ctx.on(2), lw=1.1)
    pw = (catw - 0.08) / 8
    for i in range(8):
        sil_pill(s, x + 0.14 + i * pw, ay + 0.04, pw - 0.03, 0.20, ctx.on(2))
    dxs = x + 0.10 + catw + 0.12
    sil_box(s, dxs, ay, domw, 0.28, ctx.on(2), lw=1.1)
    pw2 = (domw - 0.08) / 6
    for i in range(6):
        sil_pill(s, dxs + 0.04 + i * pw2, ay + 0.04, pw2 - 0.03, 0.20, ctx.on(2))
    ctx.mk(s, 2, x + 0.08, ay - 0.02)
    # sticky 표기
    sil_pill(s, x + w - 0.46, ay + 0.03, 0.44, 0.22, False)
    tiny(s, x + w - 0.46, ay + 0.03, 0.44, "고정", False, size=8)
    # 행b — [②인기태그(넓게) | 스크랩 토글 | ③초기화]
    by = r3 + 0.48
    tagw = 3.10
    for i in range(6):
        sil_pill(s, x + 0.10 + i * (tagw / 6), by, tagw / 6 - 0.06, 0.22, ctx.on(3))
    sil_pill(s, x + 0.10 + tagw + 0.14, by, 0.86, 0.22, ctx.on(3))
    sil_button(s, x + 0.10 + tagw + 1.10, by, 0.72, 0.22, ctx.on(3))
    ctx.mk(s, 3, x + 0.08, by - 0.02)

    # 행4 — ④ 결과 수 | 정렬 3버튼
    r4, r4h = r3 + r3h + 0.10, 0.26
    hline(s, x, r4 + 0.14, 0.95, ctx.on(4), 1.6)
    for i in range(3):
        sil_button(s, x + w - 1.90 + i * 0.64, r4, 0.58, 0.24, ctx.on(4))
    ctx.mk(s, 4, x - 0.02, r4 - 0.02)

    # 행7 Footer → 행6 더보기 → 행5 그리드 (하단 기준 역산)
    footer(s, R, ctx, 0)
    r6 = R["y"] + h - 0.26 - 0.12 - 0.28
    r5 = r4 + r4h + 0.10
    r5h = r6 - 0.12 - r5
    sil_grid(s, x, r5, w, r5h, ctx.on(5), 4, 2)
    ctx.mk(s, 5, x - 0.02, r5 - 0.02)
    sil_button(s, x + w / 2 - 0.70, r6, 1.40, 0.28, ctx.on(6))
    ctx.mk(s, 6, x + w / 2 - 0.72, r6 - 0.02)


screen(prs, ("카탈로그 목록", "AX 카드 탐색", "USR-03", "/projects  (로그인 필요)"), draw_usr03, [
    (1, "헤더 검색", "카드명·부서 검색 → ?q="),
    (2, "필터 1행", "카테고리 세그먼트(전체+7) · 업무 도메인"),
    (3, "필터 2행", "인기 태그 상위 6 토글 · [스크랩 N] 토글 · [초기화]"),
    (4, "결과 수·정렬", "'N개 카드' + 정렬 3종(최신 / 인기 / 이름)"),
    (5, "카드", "카테고리 pill · 제목 · 요약 · 카드 ID+부서 · 조회수 · 좋아요 · 스크랩 토글", "AI Model은 강점 3 + 비용 뱃지"),
    (6, "더보기", "24개 단위 증분 로드"),
], rule_box=(
    ["초기화는 클릭형 필터만 해제하고 검색어·정렬은 보존한다(의도된 동작).",
     "URL 파라미터 q·platform·domain·scrap을 수신해 진입 시점의 조건을 복원한다.",
     "그룹 전체보기 권한자는 비노출 관계사 카드까지 열람하며 안내 뱃지를 함께 본다."],
    "getAssetItems·getOrgCompanies → GET /assets 서버 필터·정렬·페이지, 게이팅·그룹뷰어는 서버 재검증(0.6).",
))

# ============================================================
# USR-04 카드 상세
# ============================================================
def_slide(
    prs, "USR-04", "카드 상세 (Item Detail)",
    tree=[
        (0, "카드 상세 (/{카테고리}/:itemId)"),
        (1, "위치 경로 · 헤더(액션)"),
        (1, "메타 행 (카드 ID · 부서 · 수정일)"),
        (1, "탭 4종"),
        (2, "개요 (이미지·설명·활용 후기)"),
        (2, "유형별 상세 (라벨 5종)"),
        (2, "담당자"),
        (2, "업데이트&논의"),
    ],
    flow=["카드 진입", "개요 확인", "상세·담당자·논의", "수정 요청·모델 접속"],
    flow_branch=(2, "Vibe·AI PJ = 상세 탭 없음"),
    flow_note=[
        "7유형의 정보 구조 차이를 유형별 상세 탭으로 수용한다(상세 동작/플로우 정보/비서 구성/모델 사양/모델 정보).",
        "액션을 헤더에 모아 '확인 → 행동' 동선을 짧게 유지한다.",
    ],
    sections=[
        ("정의·역할", ["접근: 로그인 필요",
                    "카드 1건의 상세 정보·소통(후기·게시판·담당자) 화면"]),
        ("목적", ["활용 가능 여부·사용 방법·문의처를 한 화면에서 확인",
                "담당자 연결과 후기 축적으로 재사용을 실제로 일으킴"]),
        ("기획 의도", ["유형별 탭으로 7유형의 정보 구조 차이를 수용",
                    "액션을 헤더에 모아 확인 → 행동 동선 단축"]),
        ("지켜야 할 룰", ["관계사 귀속 미표시(ownerCompany는 API 제공·미렌더)",
                     "수정요청은게시카드에대해누구나가능—단AI Model 카드는관리자전용(0.6)",
                     "모델 접속 URL은 0.5의 유일한 예외"]),
        ("개발 연동 노트", ["getAssetItem·getReviewsByItem·getPostsByItem·getFallbackN8nWorkflowJson",
                      "좋아요 PUT/DELETE 멱등 · 후기/게시글 POST · 조회수 서버 집계 · 후기 알림 서버 발송(0.10)"]),
    ],
)


def draw_usr04_top(s, R, ctx):
    """LAYOUT USR-04 p1
    행1 ①위치 경로 / 행2 2열[②헤더 | ③액션] / 행3 ④메타 행 / 행4 탭바 /
    행5 2열[⑤개요(캐러셀→설명→출처→후기+입력폼) | 사이드바(모델 접속·태그)]"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — ① 위치 경로
    hline(s, x, y + 0.10, 2.40, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, y - 0.02)

    # 행2 — 좌 ② 헤더 | 우 ③ 액션 버튼군
    r2, r2h = y + 0.28, 0.78
    aw = 2.10
    lw2 = w - aw - 0.14
    ax = x + lw2 + 0.14
    sil_pill(s, x, r2, 0.66, 0.18, ctx.on(2))
    sil_pill(s, x + 0.72, r2, 0.54, 0.18, ctx.on(2))
    sil_pill(s, x + 1.32, r2, 0.60, 0.18, ctx.on(2))
    hline(s, x, r2 + 0.38, lw2 * 0.72, ctx.on(2), 1.8)
    hline(s, x, r2 + 0.58, lw2 * 0.92, ctx.on(2))
    hline(s, x, r2 + 0.72, lw2 * 0.66, ctx.on(2))
    ctx.mk(s, 2, x - 0.02, r2 - 0.02)
    for i in range(3):
        sil_button(s, ax + i * 0.73, r2, 0.64, 0.26, ctx.on(3))
    for i in range(2):
        sil_button(s, ax + i * 0.73, r2 + 0.32, 0.64, 0.26, ctx.on(3))
    ctx.mk(s, 3, ax - 0.02, r2 - 0.02)

    # 행3 — ④ 메타 행 (카드 ID 최선두)
    r3 = r2 + r2h + 0.10
    sil_pill(s, x, r3, 0.92, 0.20, ctx.on(4))
    hline(s, x + 1.04, r3 + 0.12, 1.30, ctx.on(4))
    hline(s, x + 2.50, r3 + 0.12, 1.10, ctx.on(4))
    ctx.mk(s, 4, x - 0.02, r3 - 0.02)

    # 행4 — 탭바
    r4 = r3 + 0.34
    for i in range(4):
        sil_pill(s, x + i * 1.04, r4, 0.94, 0.24, i == 0)
    seg(s, x, r4 + 0.26, x + w, r4 + 0.26, color=GCC, w=1.2)

    # 행5 — 2열 [⑤ 개요 | 사이드바 280px 상당]
    r5 = r4 + 0.38
    sbw = 1.18
    mw = w - sbw - 0.14
    sx = x + mw + 0.14
    sil_box(s, x, r5, mw, 0.82, ctx.on(5), lw=1.3, fill=GF7)            # 이미지 캐러셀
    sil_lines(s, x + 0.06, r5 + 0.94, mw - 0.12, ctx.on(5), n=3)        # 상세 설명
    sil_box(s, x, r5 + 1.40, mw, 0.30, ctx.on(5), lw=1.1)               # 출처 카드
    sil_box(s, x, r5 + 1.82, mw, 0.66, ctx.on(5), lw=1.2)               # 활용 후기 목록
    sil_lines(s, x + 0.12, r5 + 1.96, mw - 0.40, ctx.on(5), n=2)
    sil_box(s, x, r5 + 2.58, mw, 0.44, ctx.on(5), lw=1.2, fill=GF7)     # 후기 입력폼
    sil_input(s, x + 0.10, r5 + 2.68, mw - 1.30, 0.20, ctx.on(5))
    sil_button(s, x + mw - 1.06, r5 + 2.68, 0.96, 0.22, ctx.on(5))      # 등록 버튼
    ctx.mk(s, 5, x - 0.02, r5 - 0.02)
    sil_box(s, sx, r5, sbw, 0.72, False, lw=1.3)                        # 모델 접속 카드
    sil_box(s, sx, r5 + 0.84, sbw, 0.92, False, lw=1.3)                 # 태그 카드


screen(prs, ("카드 상세", "카드 상세", "USR-04", "/{카테고리}/:itemId  (로그인 필요)"), draw_usr04_top, [
    (1, "위치 경로", "AX Platform > 카테고리 > 제목"),
    (2, "헤더", "카테고리 pill · [AI Model] 가용 뱃지 · 제공사 · 제목 · 요약"),
    (3, "액션", "좋아요 · 스크랩 · 담당자 연락 · 수정 요청 · [AI Model] 모델 접속"),
    (4, "메타 행", "카드 ID 최선두 · 등록 부서 · 최종 수정일"),
    (5, "개요 탭", "이미지 캐러셀 + 상세 설명 + 활용 후기(등록 가능)"),
], page_no=1, page_total=2, subtitle="헤더·개요", rule_box=(
    ["카드 ID는 메타 행 최선두에 배치한다(0.3).",
     "수정요청은게시카드에대해누구나가능—단AI Model 카드는관리자전용(0.6)",
     "관계사 귀속은 API가 내려주더라도 화면에 렌더하지 않는다."],
    "getAssetItem·getReviewsByItem, 좋아요 PUT/DELETE 멱등, 후기 POST·후기 알림은 서버 발송(0.10).",
))


def draw_usr04_tabs(s, R, ctx):
    """LAYOUT USR-04 p2
    행1 톤다운 헤더·탭바 / 행2 ⑥유형별 상세 / 행3 2열[⑦담당자 | 이메일 버튼]
    행4 ⑧논의(안내 배너→글 목록→더보기→글 작성 카드└태그4+입력+등록)"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — 톤다운 헤더 + 탭바
    sil_box(s, x, y, w, 0.50, False, lw=1.3)
    tb = y + 0.60
    for i in range(4):
        sil_pill(s, x + i * 1.04, tb, 0.94, 0.24, i == 1)
    seg(s, x, tb + 0.26, x + w, tb + 0.26, color=GCC, w=1.2)

    # 행2 — ⑥ 유형별 상세 박스
    r2, r2h = tb + 0.38, 1.10
    sil_box(s, x, r2, w, r2h, ctx.on(6), lw=1.4, fill=GF7)
    sil_box(s, x + 0.14, r2 + 0.14, w - 0.28, 0.60, ctx.on(6), lw=1.1)
    sil_button(s, x + 0.14, r2 + 0.82, 1.30, 0.22, ctx.on(6))
    ctx.mk(s, 6, x - 0.02, r2 - 0.02)

    # 행3 — 2열 [⑦ 담당자 | 이메일 버튼]
    r3, r3h = r2 + r2h + 0.12, 0.60
    cw3 = w - 1.40 - 0.14
    sil_box(s, x, r3, cw3, r3h, ctx.on(7), lw=1.4)
    sil_circle(s, x + 0.14, r3 + 0.14, 0.32, ctx.on(7))
    hline(s, x + 0.56, r3 + 0.24, 1.30, ctx.on(7), 1.6)
    hline(s, x + 0.56, r3 + 0.40, 1.80, ctx.on(7))
    ctx.mk(s, 7, x - 0.02, r3 - 0.02)
    sil_button(s, x + cw3 + 0.14, r3 + 0.16, 1.40, 0.28, ctx.on(7))

    # 행4 — ⑧ 업데이트&논의
    r4 = r3 + r3h + 0.12
    r4h = R["y"] + h - r4
    sil_box(s, x, r4, w, 0.26, ctx.on(8), lw=1.1, fill=GF7)              # 안내 배너
    sil_box(s, x, r4 + 0.34, w, 0.72, ctx.on(8), lw=1.2)                 # 글 목록
    sil_lines(s, x + 0.12, r4 + 0.48, w - 0.40, ctx.on(8), n=3)
    sil_button(s, x + w / 2 - 0.60, r4 + 1.12, 1.20, 0.22, ctx.on(8))    # 더보기
    wy = r4 + 1.42
    sil_box(s, x, wy, w, r4h - 1.42, ctx.on(8), lw=1.3)                  # 글 작성 카드
    for i in range(4):
        sil_pill(s, x + 0.12 + i * 0.74, wy + 0.08, 0.68, 0.16, ctx.on(8))   # └태그 4pill
    sil_box(s, x + 0.12, wy + 0.30, w - 1.44, 0.20, ctx.on(8), lw=1.0, fill=GF7)  # └입력영역
    sil_button(s, x + w - 1.22, wy + 0.30, 1.10, 0.20, ctx.on(8))        # └등록 버튼
    ctx.mk(s, 8, x - 0.02, r4 - 0.02)


screen(prs, ("카드 상세", "카드 상세", "USR-04", "/{카테고리}/:itemId  (로그인 필요)"), draw_usr04_tabs, [
    (6, "유형별 상세 탭", "n8n=상세 동작(워크플로우 미리보기·JSON 다운로드) / PA=플로우 정보 / 비서=비서 구성(프롬프트 복사) / AI Model=모델 사양 / ML=모델 정보"),
    (7, "담당자 탭", "담당자 정보 + 메일 연락"),
    (8, "업데이트&논의 탭", "게시글 태그 4종(공지·Q&A·이슈제보·건의) · 좋아요 · 작성 · 더보기 증분"),
], page_no=2, page_total=2, subtitle="탭 상세", rule_box=(
    ["Vibe·AI 프로젝트는 상세 탭 없이 개요에 통합한다.",
     "방문 시 최근 조회 기록(상위 10)을 남겨 재방문 동선을 잇는다.",
     "유형별 탭 라벨은 유형마다 다르게 쓰되 탭 위치·순서는 고정한다.",
     "탭은 배타 전환 — 본 도면은 3개 탭을 합성 표기."],
    "getPostsByItem·getFallbackN8nWorkflowJson, 게시글 POST와 조회수 서버 집계로 전환.",
))

# ============================================================
# USR-05 신규 등록 신청
# ============================================================
def_slide(
    prs, "USR-05", "신규 등록 신청 (3단계)",
    tree=[
        (0, "신규 등록 신청 (/projects/new)"),
        (1, "단계 표시 (3단계)"),
        (1, "Step 0 유형 선택 (7종)"),
        (1, "Step 1 정보 입력"),
        (2, "공통(사진·제목·요약·설명·도메인·태그)"),
        (2, "유형별 섹션 · 예상 절감 시간"),
        (2, "담당자(복수 등록)"),
        (1, "Step 2 확인 · 제출"),
    ],
    flow=["유형 선택", "정보 입력", "확인·제출", "내 현황"],
    flow_branch=(0, "비관리자 = AI Model 미노출"),
    flow_note=[
        "3단계로 진입 장벽을 줄이고, 유형별 입력은 실제로 쓰이는 축만 받는다(난이도·비용/컨텍스트·모델 유형).",
        "AI Model 등록을 관리자 전용으로 둔 이유는 모델 카탈로그가 운영이 선별하는 영역이기 때문이다.",
    ],
    sections=[
        ("정의·역할", ["접근: 로그인 필요",
                    "카드 등록 신청 3단계 폼"]),
        ("목적", ["등록 부담 최소화",
                "승인 검토에 필요한 정보를 유형별로 최소 수집"]),
        ("기획 의도", ["3단계로 진입 장벽 축소",
                    "유형별 입력은 실제 사용하는 축만(n8n=난이도 · AI Model=비용/컨텍스트 · ML=모델 유형)",
                    "AI Model 등록은 관리자 전용 — 모델 카탈로그는 운영 선별 영역"]),
        ("지켜야 할 룰", ["노출 범위 입력 없음(신규=전사 공용, 0.9)",
                     "절감 시간 표준 직렬화(0.8)",
                     "자유 태그 허용(표준화는 ADM-05)"]),
        ("개발 연동 노트", ["공용 ImageCarouselInput·TimeSavedInput·ChipInput·ML_TYPES",
                      "등록 신청 POST · 카드 ID 서버 원자 발급(0.3) · 접수 알림 서버 발송. 이미지 스토리지 선정 대기(부록 B)"]),
    ],
)


def _stepper(s, R, ctx, n, y):
    x, w = R["x"], R["w"]
    for i in range(3):
        cx = x + i * (w / 3)
        sil_circle(s, cx + 0.10, y, 0.24, ctx.on(n))
        sil_pill(s, cx + 0.42, y + 0.03, (w / 3) - 0.70, 0.18, ctx.on(n))
        if i < 2:
            seg(s, cx + 0.36, y + 0.12, cx + (w / 3), y + 0.12, color=(GCC if ctx.on(n) else GDD), w=1.2)
    ctx.mk(s, n, x - 0.02, y - 0.02)


def draw_usr05_a(s, R, ctx):
    """LAYOUT USR-05 p1
    행1 ①스테퍼 / 행2 ②Step0 카드 2열×4행 + 안내 박스 2 / 행3 ③기본 정보 /
    행4 ④유형별 섹션└⑤절감 시간(박스 안) / 행5 ⑥담당자 5열 / 행6 [이전][다음]"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — ① 스테퍼
    _stepper(s, R, ctx, 1, y)

    # 행2 — ② Step 0 유형 카드 2열×4행 + 안내 박스 2
    r2 = y + 0.40
    sil_grid(s, x, r2, w, 0.86, ctx.on(2), 2, 4)
    n1 = r2 + 0.94
    sil_box(s, x, n1, w, 0.17, ctx.on(2), lw=1.0, fill=GF7)
    sil_box(s, x, n1 + 0.21, w, 0.17, ctx.on(2), lw=1.0, fill=GF7)
    ctx.mk(s, 2, x - 0.02, r2 - 0.02)

    # 행3 — ③ 기본 정보
    r3, r3h = n1 + 0.50, 1.50
    sil_box(s, x, r3, w, r3h, ctx.on(3), lw=1.4)
    sil_box(s, x + 0.12, r3 + 0.08, w - 0.24, 0.28, ctx.on(3), lw=1.1, fill=GF7)   # 사진
    sil_input(s, x + 0.12, r3 + 0.42, w - 0.24, 0.15, ctx.on(3))                   # 제목
    sil_input(s, x + 0.12, r3 + 0.62, w - 0.24, 0.15, ctx.on(3))                   # 한 줄 요약
    sil_box(s, x + 0.12, r3 + 0.82, w - 0.24, 0.26, ctx.on(3), lw=1.0)             # 상세 설명
    for i in range(6):
        sil_pill(s, x + 0.12 + i * 0.66, r3 + 1.13, 0.60, 0.14, ctx.on(3))         # 업무 도메인
    for i in range(4):
        sil_pill(s, x + 0.12 + i * 0.72, r3 + 1.31, 0.66, 0.14, ctx.on(3))         # 태그
    ctx.mk(s, 3, x - 0.02, r3 - 0.02)

    # 행4 — ④ 유형별 섹션 박스 └ ⑤ 예상 절감 시간 (섹션 내부)
    r4, r4h = r3 + r3h + 0.12, 0.68
    sil_box(s, x, r4, w, r4h, ctx.on(4), lw=1.4, fill=GF7)
    sil_input(s, x + 0.12, r4 + 0.10, (w - 0.36) / 2, 0.17, ctx.on(4))
    sil_input(s, x + 0.24 + (w - 0.36) / 2, r4 + 0.10, (w - 0.36) / 2, 0.17, ctx.on(4))
    sil_input(s, x + 0.40, r4 + 0.40, 1.10, 0.18, ctx.on(5))
    for i in range(4):
        sil_pill(s, x + 1.62 + i * 0.50, r4 + 0.41, 0.44, 0.16, ctx.on(5))
    ctx.mk(s, 5, x + 0.10, r4 + 0.38)
    ctx.mk(s, 4, x - 0.02, r4 - 0.02)

    # 행5 — ⑥ 담당자 행 5열(입력 4 + 삭제) / 행6 — 하단 [이전][다음]
    r6 = R["y"] + h - 0.28
    r5 = r6 - 0.10 - 0.28
    iw = (w - 0.70 - 4 * 0.06) / 4
    for i in range(4):
        sil_input(s, x + i * (iw + 0.06), r5 + 0.05, iw, 0.18, ctx.on(6))
    sil_button(s, x + w - 0.64, r5, 0.64, 0.28, ctx.on(6))
    ctx.mk(s, 6, x - 0.02, r5 - 0.02)
    sil_button(s, x, r6, 1.20, 0.28, False)
    sil_button(s, x + w - 1.30, r6, 1.30, 0.28, False)


screen(prs, ("신규 등록 신청", "AX 카드 등록 신청", "USR-05", "/projects/new  (로그인 필요)"), draw_usr05_a, [
    (1, "단계 표시", "유형 선택 → 정보 입력 → 최종 확인"),
    (2, "Step 0 유형 카드", "7종 유형 선택 — 비관리자에게 AI Model 미노출"),
    (3, "기본 정보", "사진 최대 10장 · 제목 · 한 줄 요약 · 상세 설명 · 업무 도메인 · 태그"),
    (4, "유형별 섹션", "n8n JSON 업로드·미리보기 / 난이도 · 비용 · 컨텍스트 · 모델 유형 등 유형별 입력"),
    (5, "예상 절감 시간", "수치 + 주기(일/주/월/년) 선택"),
    (6, "담당자", "복수 등록 가능"),
], page_no=1, page_total=2, subtitle="Step 0·1", rule_box=(
    ["노출 범위 입력 항목을 두지 않는다 — 신규 카드는 전사 공용으로 생성된다(0.9).",
     "절감 시간은 '<주기> N시간' 형식으로 표준 직렬화한다(0.8).",
     "태그는 자유 입력을 허용하고 표준화는 관리자 화면(ADM-05)에서 처리한다.",
     "Step 0·1은 배타 전환 — 본 도면은 합성 표기."],
    "공용 ImageCarouselInput·TimeSavedInput·ChipInput·ML_TYPES 사용, 이미지 스토리지 선정 대기(부록 B).",
))


def draw_usr05_b(s, R, ctx):
    """LAYOUT USR-05 p2 — 행1 유형 배너 / 행2 ⑦요약 행들(좁은 라벨|값) /
    행3 ⑧ID 안내 + 절차 안내 2박스 / 행4 ⑨[이전][제출]"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — 유형 배너
    sil_box(s, x, y, w, 0.40, False, lw=1.3, fill=GF7)
    sil_pill(s, x + 0.12, y + 0.11, 0.80, 0.18, False)
    hline(s, x + 1.02, y + 0.20, 2.20, False)

    # 행2 — ⑦ 입력 요약 행들
    r2 = y + 0.52
    fr = [0.92, 0.62, 0.84, 0.50, 0.94, 0.70, 0.44, 0.88, 0.58, 0.76]
    for i in range(10):
        yy = r2 + i * 0.28
        sil_box(s, x, yy, 1.20, 0.20, ctx.on(7), lw=1.0, fill=GF7)
        hline(s, x + 1.34, yy + 0.13, (w - 1.34) * fr[i], ctx.on(7))
        seg(s, x, yy + 0.24, x + w, yy + 0.24, color=GEE, w=0.75)
    ctx.mk(s, 7, x - 0.02, r2 - 0.02)

    # 행3 — ⑧ ID 발급 안내 + 절차 안내 2박스
    r3 = r2 + 10 * 0.28 + 0.12
    sil_box(s, x, r3, w, 0.34, ctx.on(8), lw=1.2, fill=GF7)
    hline(s, x + 0.14, r3 + 0.18, w - 0.60, ctx.on(8))
    sil_box(s, x, r3 + 0.42, w, 0.34, ctx.on(8), lw=1.2, fill=GF7)
    hline(s, x + 0.14, r3 + 0.60, w - 0.90, ctx.on(8))
    ctx.mk(s, 8, x - 0.02, r3 - 0.02)

    # 행4 — ⑨ [이전][제출]
    r4 = R["y"] + h - 0.28
    sil_button(s, x, r4, 1.20, 0.28, ctx.on(9))
    sil_button(s, x + w - 1.40, r4, 1.40, 0.28, ctx.on(9))
    ctx.mk(s, 9, x - 0.02, r4 - 0.02)


screen(prs, ("신규 등록 신청", "AX 카드 등록 신청", "USR-05", "/projects/new  (로그인 필요)"), draw_usr05_b, [
    (7, "입력 요약", "제출 전 전체 입력값 확인(라벨-값 리스트)"),
    (8, "ID 발급 안내", "'접수 시 {PREFIX}-{연도}-순번 형식의 고유 ID 발급'"),
    (9, "제출", "제출 완료 후 내 현황으로 이동"),
], page_no=2, page_total=2, subtitle="Step 2", rule_box=(
    ["카드 ID는 서버가 원자적으로 발급하고 승인 전후로 불변이다(0.3).",
     "제출 결과는 내 현황(USR-07)의 승인 인디케이터로 이어져 진행 상황이 끊기지 않는다.",
     "접수 알림은 서버가 발송한다 — 클라이언트에서 생성하지 않는다."],
    "등록 신청 POST + 카드 ID 서버 원자 발급(0.3), 접수 알림 서버 발송.",
))

# ============================================================
# USR-06 수정 요청
# ============================================================
def_slide(
    prs, "USR-06", "수정 요청 (Edit Request)",
    tree=[
        (0, "수정 요청 (/edit-request/:id)"),
        (1, "위치 경로 · 대상 배너"),
        (1, "편집 폼 (공통 + 유형별)"),
        (1, "담당자 편집 (추가 · 삭제)"),
        (1, "수정 사유* (필수)"),
        (1, "취소 · 제출"),
    ],
    flow=["진입(상세·내 현황)", "현재 값 표시", "편집·사유 입력", "제출 → 내 현황"],
    flow_branch=(0, "없는 ID = 안내"),
    flow_note=[
        "게시본은 공유 자산이므로 직접 수정 대신 요청-검토를 거친다.",
        "신청 자격을 한정하지 않는다 — 오류를 발견하는 쪽이 제3자인 경우가 많기 때문.",
    ],
    sections=[
        ("정의·역할", ["접근: 로그인 필요",
                    "게시 카드 수정 신청 단일 폼 — 현재 값 자동 표시 기반"]),
        ("목적", ["게시 이후 변경 사항을 검토를 거쳐 반영",
                "게시본의 정보 최신성 유지"]),
        ("기획 의도", ["게시본은 공유 자산이라 직접 수정 대신 요청-검토",
                    "신청 자격 비한정(제3자 발견 사유가 다수)",
                    "폼은 등록 폼과 동일한 편집 셋 + 사유만 추가"]),
        ("지켜야 할 룰", ["AI Model 수정은 관리자 전용(0.6)",
                     "수정 사유 필수",
                     "company 미포함(0.9)"]),
        ("개발 연동 노트", ["getAssetItem(:id) 프리필",
                      "POST /edit-requests(사유 포함) · 처리 알림 서버 발송. 관리자 처리 큐 화면 미구현 — API 계약 선확보(부록 B)"]),
    ],
)


def draw_usr06(s, R, ctx):
    """LAYOUT USR-06
    행1 위치 경로 / 행2 페이지 헤더 / 행3 ①대상 배너 / 행4 ②기본 정보 Section /
    행5 유형별 Section(별도 카드) / 행6 ③담당자 5열 / 행7 ④수정 사유+안내 / 행8 ⑤우측 [취소][제출]"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — 위치 경로
    hline(s, x, y + 0.10, 2.20, False)
    # 행2 — 페이지 헤더(제목 + 설명)
    r2 = y + 0.24
    hline(s, x, r2 + 0.10, 2.00, False, 1.8)
    hline(s, x, r2 + 0.28, 3.20, False)

    # 행3 — ① 대상 배너
    r3, r3h = y + 0.68, 0.42
    sil_box(s, x, r3, w, r3h, ctx.on(1), lw=1.3, fill=GF7)
    sil_pill(s, x + 0.12, r3 + 0.12, 0.86, 0.18, ctx.on(1))
    sil_pill(s, x + 1.06, r3 + 0.12, 0.62, 0.18, ctx.on(1))
    hline(s, x + 1.80, r3 + 0.22, 2.20, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, r3 - 0.02)

    # 행4 — ② 기본 정보 Section
    r4, r4h = r3 + r3h + 0.12, 1.20
    sil_box(s, x, r4, w, r4h, ctx.on(2), lw=1.4)
    sil_box(s, x + 0.12, r4 + 0.10, w - 0.24, 0.30, ctx.on(2), lw=1.1, fill=GF7)
    sil_input(s, x + 0.12, r4 + 0.48, w - 0.24, 0.16, ctx.on(2))
    sil_input(s, x + 0.12, r4 + 0.70, w - 0.24, 0.16, ctx.on(2))
    sil_box(s, x + 0.12, r4 + 0.92, w - 0.24, 0.20, ctx.on(2), lw=1.0)
    ctx.mk(s, 2, x - 0.02, r4 - 0.02)

    # 행5 — 유형별 Section (별도 카드)
    r5, r5h = r4 + r4h + 0.12, 0.56
    sil_box(s, x, r5, w, r5h, ctx.on(2), lw=1.4, fill=GF7)
    sil_input(s, x + 0.12, r5 + 0.12, (w - 0.36) / 2, 0.17, ctx.on(2))
    sil_input(s, x + 0.24 + (w - 0.36) / 2, r5 + 0.12, (w - 0.36) / 2, 0.17, ctx.on(2))
    hline(s, x + 0.12, r5 + 0.46, w - 0.60, ctx.on(2))

    # 행6 — ③ 담당자 5열(입력 4 + 삭제)
    r6, r6h = r5 + r5h + 0.12, 0.32
    iw = (w - 0.70 - 4 * 0.06) / 4
    for i in range(4):
        sil_input(s, x + i * (iw + 0.06), r6 + 0.07, iw, 0.18, ctx.on(3))
    sil_button(s, x + w - 0.64, r6, 0.64, 0.30, ctx.on(3))
    ctx.mk(s, 3, x - 0.02, r6 - 0.02)

    # 행7 — ④ 수정 사유 + 안내 박스
    r7 = r6 + r6h + 0.12
    sil_box(s, x, r7, w, 0.56, ctx.on(4), lw=1.4)
    sil_lines(s, x + 0.12, r7 + 0.16, w - 0.40, ctx.on(4), n=2)
    sil_box(s, x, r7 + 0.62, w, 0.24, ctx.on(4), lw=1.0, fill=GF7)
    ctx.mk(s, 4, x - 0.02, r7 - 0.02)

    # 행8 — ⑤ 우측 정렬 [취소][제출]
    r8 = R["y"] + h - 0.28
    sil_button(s, x + w - 2.60, r8, 1.20, 0.28, ctx.on(5))
    sil_button(s, x + w - 1.30, r8, 1.30, 0.28, ctx.on(5))
    ctx.mk(s, 5, x + w - 2.62, r8 - 0.02)


screen(prs, ("수정 요청", "게시 카드 수정 요청", "USR-06", "/edit-request/:id  (로그인 필요)"), draw_usr06, [
    (1, "대상 배너", "카드 ID · 유형 · 제목 — '카드를 수정합니다'"),
    (2, "편집 폼", "전 필드 현재 값 자동 표시 · 등록 폼과 동일 구성(유형별 섹션은 대상 카드 유형)"),
    (3, "담당자 편집", "담당자 행 추가 · 삭제"),
    (4, "수정 사유", "필수 — '무엇을 왜 바꾸는지'"),
    (5, "취소 · 제출", "취소 → 목록 / 제출 → 내 현황"),
], rule_box=(
    ["AI Model 카드 + 비관리자 조합에서는 폼 대신 관리자 전용 안내를 렌더한다(0.6).",
     "존재하지 않는 ID로 진입하면 폼 대신 안내 문구를 표시한다.",
     "진입점은 상세 헤더와 내 현황의 게시됨 카드 2곳이다."],
    "getAssetItem(:id) 프리필 → POST /edit-requests(사유 포함), 관리자 처리 큐 화면은 미구현·API 계약 선확보(부록 B).",
))

# ============================================================
# USR-07 내 현황
# ============================================================
def_slide(
    prs, "USR-07", "내 현황 (My Status)",
    tree=[
        (0, "내 현황 (/my-status)"),
        (1, "5탭 KPI"),
        (1, "신청 카드 목록 (+더보기)"),
        (2, "카드 (ID · 제목 · 단계 뱃지)"),
        (2, "병렬 승인 인디케이터"),
        (2, "반려 사유 박스"),
        (2, "카드 액션 (취소 · 수정 요청 · 삭제)"),
        (1, "내가 남긴 후기"),
    ],
    flow=["진입", "탭 필터", "카드 확인", "액션"],
    flow_branch=(2, "반려 → 사유·삭제"),
    flow_note=[
        "병렬 2-슬롯 승인 구조를 인디케이터로 그대로 시각화해 진행 상황을 투명하게 공개한다.",
        "반려 사유를 원문 그대로 노출해 신청자가 결과를 이해하고 다음 행동을 고를 수 있게 한다.",
    ],
    sections=[
        ("정의·역할", ["접근: 로그인 필요",
                    "본인 신청의 승인 진행 상황 + 본인 후기 확인 화면"]),
        ("목적", ["신청 건이 지금 어느 단계인지 명확히 표시",
                "문의 부담을 화면으로 흡수"]),
        ("기획 의도", ["병렬 2-슬롯 구조를 인디케이터로 그대로 시각화",
                    "투명한 진행 공개로 문의 부담 축소, 반려 사유 원문 표시로 결과 이해"]),
        ("지켜야 할 룰", ["단계 명칭 0.7 표준",
                     "전체탭집계에는중지단계가포함된다(0.7) —중지는별도탭을두지않는다.",
                     "삭제는 반려 건 한정 + 복구 불가 고지",
                     "관계사 귀속 미표시"]),
        ("개발 연동 노트", ["getMyApplications·getMyReviews·deriveStage",
                      "본인 소유 필터·상태 전이 검증은 서버 책임(0.7)"]),
    ],
)


def draw_usr07(s, R, ctx):
    """LAYOUT USR-07
    행1 ①KPI 5열 / 행2 신청 카드[상단 2열 ②본문|단계 뱃지+날짜 → ③인디케이터 → ④반려 사유 → ⑤액션 행]
    행3 더보기 / 행4 ⑥내가 남긴 후기 — ②③④⑤는 모두 같은 카드 내부"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — ① 5탭 KPI
    r1, r1h = y + 0.04, 0.54
    kw = (w - 4 * 0.08) / 5
    for i in range(5):
        sil_box(s, x + i * (kw + 0.08), r1, kw, r1h, ctx.on(1), lw=1.3, fill=GF7)
    ctx.mk(s, 1, x - 0.02, r1 - 0.02)

    # 행2 — 신청 카드 (컨테이너)
    r2, r2h = r1 + r1h + 0.16, 2.50
    sil_box(s, x, r2, w, r2h, True, lw=1.5)
    tx0 = x + 0.14
    tw0 = w - 1.60 - 0.28
    # 상단 2열 — 좌 ② (ID·pill / 제목 / 요약 / 칩)
    sil_pill(s, tx0, r2 + 0.14, 0.90, 0.18, ctx.on(2))
    sil_pill(s, tx0 + 0.98, r2 + 0.14, 0.62, 0.18, ctx.on(2))
    hline(s, tx0, r2 + 0.48, tw0 * 0.70, ctx.on(2), 1.8)
    hline(s, tx0, r2 + 0.66, tw0 * 0.92, ctx.on(2))
    hline(s, tx0, r2 + 0.80, tw0 * 0.62, ctx.on(2))
    for i in range(3):
        sil_pill(s, tx0 + i * 0.56, r2 + 0.90, 0.50, 0.15, ctx.on(2))
    ctx.mk(s, 2, x - 0.02, r2 + 0.12)
    # 상단 2열 — 우 단계 뱃지 + 날짜 2행(세로·우측 정렬)
    sil_pill(s, x + w - 1.14, r2 + 0.14, 1.00, 0.20, ctx.on(2))
    hline(s, x + w - 1.14, r2 + 0.48, 1.00, ctx.on(2))
    hline(s, x + w - 1.14, r2 + 0.62, 1.00, ctx.on(2))
    # ③ 병렬 승인 인디케이터 (○—슬롯 2칩—○)
    iy = r2 + 1.20
    sil_circle(s, tx0, iy, 0.22, ctx.on(3))
    seg(s, tx0 + 0.24, iy + 0.11, tx0 + 0.42, iy + 0.11, color=(G99 if ctx.on(3) else GDD), w=1.3)
    sil_pill(s, tx0 + 0.44, iy + 0.02, 1.10, 0.18, ctx.on(3))
    sil_pill(s, tx0 + 1.60, iy + 0.02, 1.10, 0.18, ctx.on(3))
    seg(s, tx0 + 2.72, iy + 0.11, tx0 + 2.90, iy + 0.11, color=(G99 if ctx.on(3) else GDD), w=1.3)
    sil_circle(s, tx0 + 2.92, iy, 0.22, ctx.on(3))
    ctx.mk(s, 3, x - 0.02, iy - 0.02)
    # ④ 반려 사유 (같은 카드 내부)
    ry = r2 + 1.62
    sil_box(s, tx0, ry, w - 0.28, 0.54, ctx.on(4), lw=1.2, fill=GF7)
    sil_lines(s, tx0 + 0.12, ry + 0.14, w - 0.62, ctx.on(4), n=2, gap=0.16)
    ctx.mk(s, 4, x - 0.02, ry - 0.02)
    # ⑤ 액션 행 (반려 건: 재제출·삭제 포함)
    ay = r2 + 2.24
    for i in range(4):
        sil_button(s, tx0 + i * 0.92, ay, 0.86, 0.22, ctx.on(5))
    ctx.mk(s, 5, x - 0.02, ay - 0.02)

    # 행3 — 더보기
    r3 = r2 + r2h + 0.14
    sil_button(s, x + w / 2 - 0.70, r3, 0.26 + 1.14, 0.26, False)

    # 행4 — ⑥ 내가 남긴 후기
    r4 = r3 + 0.40
    hline(s, x, r4 + 0.08, 1.40, ctx.on(6), 1.8)
    sil_box(s, x, r4 + 0.22, w, R["y"] + h - (r4 + 0.22), ctx.on(6), lw=1.3)
    sil_lines(s, x + 0.14, r4 + 0.40, w - 0.44, ctx.on(6), n=3)
    ctx.mk(s, 6, x - 0.02, r4 - 0.02)


screen(prs, ("내 현황", "내 등록 현황", "USR-07", "/my-status  (로그인 필요)"), draw_usr07, [
    (1, "5탭 KPI", "전체 · 승인 대기 · 부분 승인 · 게시됨 · 반려"),
    (2, "신청 카드", "카드 ID 최선두 · 카테고리 pill · 제목 · 요약 · 단계 뱃지 · 신청/처리일"),
    (3, "병렬 승인 인디케이터", "신청 완료 → 관계사/전사 승인 → 게시 완료"),
    (4, "반려 사유 박스", "검토자가 작성한 사유 원문"),
    (5, "카드 액션", "내용 확인/접기 · 신청 취소(대기) · 수정 요청(게시됨) · 삭제(반려·확인 절차)"),
    (6, "내가 남긴 후기", "본인이 작성한 후기 목록"),
], rule_box=(
    ["단계 명칭은 승인 대기 / 부분 승인 / 게시됨 / 반려 / 중지 표준을 따른다(0.7).",
     "전체탭집계에는중지단계가포함된다(0.7) —중지는별도탭을두지않는다.",
     "게시됨 카드를 클릭하면 카드 상세로 이동한다.",
     "삭제는 반려 건에 한정하고 복구 불가를 고지한 뒤 실행한다."],
    "getMyApplications·getMyReviews·deriveStage, 본인 소유 필터와 상태 전이 검증은 서버 책임(0.7).",
))

# ============================================================
# USR-08 공통 내비게이션
# ============================================================
def_slide(
    prs, "USR-08", "공통 내비게이션 (Navigation)",
    tree=[
        (0, "공통 내비게이션 (전 화면)"),
        (1, "Navbar"),
        (2, "브랜드 · 메뉴 3종"),
        (2, "관리자 진입(역할 한정)"),
        (2, "알림 벨 (NotificationBell)"),
        (2, "역할 pill · 아바타 드롭다운"),
        (1, "AdminNavbar (벨 동일 배치)"),
        (1, "Footer"),
    ],
    flow=["화면 진입", "상단 상주", "메뉴·알림 이동"],
    flow_branch=(1, "공유 모드 = 벨 미노출"),
    flow_note=[
        "메뉴를 3개로 최소화하고, 벨은 사용자·관리자 내비 양쪽에 동일하게 배치해 알림 접근점을 하나로 유지한다.",
        "아바타에 소속 관계사를 표시해(0.5 허용) 다관계사 환경에서 계정 확인 지점을 만든다.",
    ],
    sections=[
        ("정의·역할", ["접근: 전 화면 상주 (역할별 항목 차등)",
                    "전 화면 공통 이동·알림·계정 영역"]),
        ("목적", ["어느 화면에서든 일관된 접근 경로 제공",
                "알림·계정 상태를 항상 같은 자리에서 확인"]),
        ("기획 의도", ["메뉴 3개 최소 구성",
                    "벨은 사용자·관리자 내비 양쪽 동일 배치",
                    "아바타에 소속 관계사 표시(0.5 허용) — 다관계사 환경의 계정 확인 지점"]),
        ("지켜야 할 룰", ["알림 이동은 카드 ID 접두어에서 파생한 경로",
                     "공유 모드에서는 벨 미노출"]),
        ("개발 연동 노트", ["useNotifications·orgCompanyName·detailPathForItemId",
                      "알림 GET/PATCH(0.10). accessUrl 소비 UI 미구현 — 백로그"]),
    ],
)


def draw_usr08(s, R, ctx):
    """LAYOUT USR-08
    행1 Navbar[좌 ①브랜드|②메뉴3|③관리자 … 우 ④벨|⑤역할 pill+아바타] + ④드롭다운(벨 아래 우변 맞춤)
    행2 AdminNavbar[좌 브랜드만 | 우 벨·pill·아바타·로그아웃] / 행3 ⑥Footer(어두운 스트립 2열)"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — Navbar
    ny, nh = y + 0.34, 0.46
    sil_box(s, x, ny, w, nh, True, lw=1.6)
    sil_pill(s, x + 0.12, ny + 0.14, 0.84, 0.18, ctx.on(1))
    ctx.mk(s, 1, x + 0.10, ny - 0.06)
    for i in range(3):
        sil_pill(s, x + 1.16 + i * 0.70, ny + 0.15, 0.62, 0.16, ctx.on(2))
    ctx.mk(s, 2, x + 1.14, ny - 0.05)
    sil_pill(s, x + 3.36, ny + 0.15, 0.66, 0.16, ctx.on(3))
    ctx.mk(s, 3, x + 3.34, ny - 0.05)
    bx = x + w - 1.32
    sil_circle(s, bx, ny + 0.11, 0.24, ctx.on(4))
    sil_circle(s, bx + 0.16, ny + 0.06, 0.13, ctx.on(4))           # 미읽음 뱃지
    ctx.mk(s, 4, bx - 0.02, ny - 0.09)
    sil_pill(s, x + w - 0.92, ny + 0.15, 0.54, 0.16, ctx.on(5))
    sil_circle(s, x + w - 0.32, ny + 0.10, 0.28, ctx.on(5))
    ctx.mk(s, 5, x + w - 0.94, ny - 0.05)
    # ④ 벨 드롭다운 — 벨 아래, 우변 맞춤
    dy, dw, dh = ny + nh + 0.12, 1.90, 1.60
    sil_box(s, x + w - dw, dy, dw, dh, ctx.on(4), lw=1.3)
    hline(s, x + w - dw + 0.12, dy + 0.16, 0.80, ctx.on(4), 1.6)
    hline(s, x + w - 0.72, dy + 0.16, 0.60, ctx.on(4))             # 전체 읽음
    seg(s, x + w - dw + 0.10, dy + 0.26, x + w - 0.10, dy + 0.26, color=GEE, w=1.0)
    for i in range(5):
        sil_pill(s, x + w - dw + 0.12, dy + 0.34 + i * 0.21, dw - 0.24, 0.17, ctx.on(4))

    # 행2 — AdminNavbar (메뉴 pill 없음)
    my, mh = dy + dh + 0.70, 0.44
    sil_box(s, x, my, w, mh, False, lw=1.3, fill=GF7)
    sil_pill(s, x + 0.12, my + 0.14, 0.78, 0.16, False)
    sil_circle(s, x + w - 1.86, my + 0.10, 0.24, ctx.on(4))        # 벨 동일 배치
    sil_pill(s, x + w - 1.50, my + 0.14, 0.54, 0.16, False)
    sil_circle(s, x + w - 0.86, my + 0.09, 0.26, False)
    sil_button(s, x + w - 0.54, my + 0.12, 0.54, 0.20, False)

    # 행3 — ⑥ Footer (어두운 스트립, 2열)
    fy, fh = my + mh + 0.70, 0.54
    rect(s, x, fy, w, fh, fill=G66, line=G66, line_w=1.0)
    rect(s, x + 0.16, fy + 0.18, 0.90, 0.18, fill=WHITE, line=None, line_w=0)
    seg(s, x + w - 2.30, fy + 0.22, x + w - 0.16, fy + 0.22, color=GEE, w=1.1)
    seg(s, x + w - 1.70, fy + 0.36, x + w - 0.16, fy + 0.36, color=GEE, w=1.1)
    ctx.mk(s, 6, x - 0.02, fy - 0.02)


screen(prs, ("공통 내비게이션", "Navbar · 알림 벨 · Footer", "USR-08", "(전 화면) components/Navbar·AdminNavbar·Footer"), draw_usr08, [
    (1, "브랜드", "KOLMAR / AX Platform — 클릭 시 랜딩 이동"),
    (2, "메뉴 3종", "이용 가이드 · AX 플랫폼 · AX 카드 등록"),
    (3, "관리자 진입", "admin · companyAdmin 에게만 노출"),
    (4, "알림 벨", "미읽음 뱃지(9+) · 드롭다운 최근 5 · 전체 읽음 · 클릭 시 카드 이동", "AdminNavbar에도 동일 배치"),
    (5, "역할 pill · 아바타", "소속 관계사[담당 병기] · 내 등록 현황 · 설정 · 관리자 페이지 · 로그아웃"),
    (6, "Footer", "브랜드 + '사내 전용 플랫폼 · 외부 접근 불가' (링크 없음)"),
], rule_box=(
    ["벨은 사용자 Navbar와 AdminNavbar에 동일하게 배치해 알림 접근점을 하나로 유지한다.",
     "알림 클릭 이동 경로는 카드 ID 접두어에서 파생하며 특정 목업에 의존하지 않는다.",
     "공유 모드에서는 벨을 노출하지 않는다."],
    "useNotifications·orgCompanyName·detailPathForItemId, 알림 GET/PATCH(0.10), accessUrl 소비 UI는 백로그.",
))

# ============================================================
# USR-09 이용 가이드
# ============================================================
def_slide(
    prs, "USR-09", "이용 가이드 (Guide)",
    tree=[
        (0, "이용 가이드 (/guide)"),
        (1, "히어로 (CTA 2종)"),
        (1, "왜 AX Platform (4카드)"),
        (1, "01 시작하기 (4단)"),
        (1, "02 등록 안내 (3단계 + 유형별 팁 7종)"),
        (1, "03 승인 안내 (2-슬롯)"),
        (1, "04 FAQ (5문항 아코디언)"),
    ],
    flow=["진입", "동기(왜)", "방법(시작·등록·승인)", "FAQ"],
    flow_branch=(0, "CTA → 둘러보기·등록"),
    flow_note=[
        "소개와 가이드를 통합해 학습 동선을 하나로 만들었다(USR-02 결번의 사유).",
        "도입부가 '왜'를, 단계 안내가 '어떻게'를 담당하도록 역할을 나눴다.",
    ],
    sections=[
        ("정의·역할", ["접근: 공개",
                    "플랫폼 소개 + 이용 안내 통합 가이드(구 소개 콘텐츠 흡수)"]),
        ("목적", ["취지부터 등록·승인 절차까지 한 화면에서 안내",
                "등록 신청의 심리적 장벽 제거"]),
        ("기획 의도", ["소개·가이드 통합으로 학습 동선 단일화",
                    "도입부가 동기, 단계 안내가 방법 담당",
                    "부제는 확정 문안을 그대로 사용"]),
        ("지켜야 할 룰", ["승인 안내는 0.7 정합 유지(정책 변경 시 동기화 대상)",
                     "정적 콘텐츠 — 개인화·권한 분기 없음"]),
        ("개발 연동 노트", ["정적(모듈 레벨) — 서버 연동 불필요",
                      "콘텐츠 개정은 코드 배포를 수반"]),
    ],
)


def draw_usr09(s, R, ctx):
    """LAYOUT USR-09
    행1 ①히어로 / 행2 ②왜 AX 2열×2행 / 행3 ③시작하기 4열 그리드(타임라인 아님) /
    행4 ④등록 3열 + 팁 카드└2열×4행 / 행5 ⑤승인 슬롯 카드 2열 + 점선 안내(다이어그램 금지) /
    행6 ⑥FAQ 단일 카드└5행 아코디언"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — ① 히어로
    r1, r1h = y, 0.56
    sil_box(s, x, r1, w, r1h, ctx.on(1), lw=1.5, fill=GF7)
    clines(s, x + w / 2, r1 + 0.12, [w * 0.56, w * 0.34], ctx.on(1), gap=0.14)
    sil_button(s, x + w / 2 - 1.02, r1 + 0.32, 0.96, 0.20, ctx.on(1))
    sil_button(s, x + w / 2 + 0.06, r1 + 0.32, 0.96, 0.20, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, r1 - 0.02)

    # 행2 — ② 왜 AX Platform (2열×2행)
    r2, r2h = y + 0.66, 0.62
    sil_grid(s, x, r2, w, r2h, ctx.on(2), 2, 2)
    ctx.mk(s, 2, x - 0.02, r2 - 0.02)

    # 행3 — ③ 01 시작하기 (카드 4열 그리드)
    r3, r3h = y + 1.38, 0.46
    sil_grid(s, x, r3, w, r3h, ctx.on(3), 4, 1)
    ctx.mk(s, 3, x - 0.02, r3 - 0.02)

    # 행4 — ④ 02 등록 안내 (카드 3열 + 별도 팁 카드 └ 2열×4행)
    r4 = y + 1.94
    sil_grid(s, x, r4, w, 0.36, ctx.on(4), 3, 1)
    ty, th = r4 + 0.42, 0.72
    sil_box(s, x, ty, w, th, ctx.on(4), lw=1.3)
    hline(s, x + 0.12, ty + 0.12, 1.20, ctx.on(4), 1.6)
    cw9 = (w - 0.30) / 2
    for r in range(4):
        for c in range(2):
            sil_pill(s, x + 0.12 + c * (cw9 + 0.06), ty + 0.20 + r * 0.13, cw9, 0.11, ctx.on(4))
    ctx.mk(s, 4, x - 0.02, r4 - 0.02)

    # 행5 — ⑤ 03 승인 안내 (슬롯 카드 2열 + 점선 안내 박스)
    r5 = y + 3.20
    sw5 = (w - 0.14) / 2
    sil_box(s, x, r5, sw5, 0.38, ctx.on(5), lw=1.3, round=True)
    sil_box(s, x + sw5 + 0.14, r5, sw5, 0.38, ctx.on(5), lw=1.3, round=True)
    dashed_box(s, x, r5 + 0.46, w, 0.22, ctx.on(5))
    ctx.mk(s, 5, x - 0.02, r5 - 0.02)

    # 행6 — ⑥ 04 FAQ (단일 카드 └ 5행 아코디언)
    r6 = y + 3.98
    r6h = R["y"] + h - r6
    sil_box(s, x, r6, w, r6h, ctx.on(6), lw=1.4)
    for i in range(5):
        yy = r6 + 0.08 + i * 0.17
        hline(s, x + 0.14, yy + 0.08, w - 0.62, ctx.on(6))
        sil_circle(s, x + w - 0.32, yy + 0.01, 0.14, ctx.on(6))
        if i < 4:
            seg(s, x + 0.10, yy + 0.17, x + w - 0.10, yy + 0.17, color=GEE, w=0.75)
    ctx.mk(s, 6, x - 0.02, r6 - 0.02)


screen(prs, ("이용 가이드", "이용 가이드", "USR-09", "/guide  (공개)"), draw_usr09, [
    (1, "히어로", "CTA 2종 — 둘러보기 · 카드 등록"),
    (2, "왜 AX Platform", "문제·해결 4카드 — 부제 '현장의 문제를, 한곳에 모으고, 찾고, 질문에 답하고, 좋은 사례를 전파하여 해결합니다'"),
    (3, "01 시작하기", "이용 시작 안내 4단"),
    (4, "02 등록 안내", "3단계 + 유형별 팁 7종"),
    (5, "03 승인 안내", "2-슬롯 구조 · '두 승인이 모두 완료되면 게시'"),
    (6, "04 FAQ", "5문항 아코디언 · 문의처 포함"),
], rule_box=(
    ["승인 서술은 승인 정책(0.7)과 항상 일치시킨다 — 정책이 바뀌면 이 화면이 동기화 대상이다.",
     "개인화·권한 분기가 없는 정적 화면으로 유지한다.",
     "구 소개(USR-02) 콘텐츠를 흡수했으므로 소개 화면을 별도로 두지 않는다."],
    "정적(모듈 레벨) 콘텐츠로 서버 연동이 없다 — 콘텐츠 개정은 코드 배포를 수반한다.",
))

# ============================================================
# USR-10 소식
# ============================================================
def_slide(
    prs, "USR-10", "소식 (Notices)",
    tree=[
        (0, "소식 (/notices)"),
        (1, "종류 탭 (공지사항 · 업데이트)"),
        (1, "아코디언 목록"),
        (2, "행 (종류 pill · 고정 pill · 제목 · 날짜)"),
        (2, "펼침 본문"),
        (1, "더보기 (탭별 독립)"),
    ],
    flow=["진입(?kind= 수신)", "종류 탭", "행 펼침", "본문 확인"],
    flow_branch=(2, "탭별 더보기 독립"),
    flow_note=[
        "종류 2탭 + 고정 우선의 단순 구조로, 운영 공지를 로그인 없이 확인할 수 있게 한다.",
        "랜딩의 최신소식과 단일 소스를 공유해 두 화면이 항상 일치한다.",
    ],
    sections=[
        ("정의·역할", ["접근: 공개",
                    "공지사항·업데이트의 공개 열람 화면"]),
        ("목적", ["운영 공지·변경 사항을 로그인 없이 확인",
                "랜딩 최신소식의 전체 목록 역할"]),
        ("기획 의도", ["종류 2탭 + 고정 우선의 단순 구조",
                    "랜딩 최신소식과 단일 소스 — 두 화면 항상 일치"]),
        ("지켜야 할 룰", ["노출=ON인 소식만 표시",
                     "고정 우선 + 최신순 정렬",
                     "공지는 알림을 발생시키지 않는다(0.10)"]),
        ("개발 연동 노트", ["getNotices(kind)",
                      "공개 조회 API — 노출 필터는 서버에서 적용"]),
    ],
)


def draw_usr10(s, R, ctx):
    """LAYOUT USR-10
    행1 ①탭 pill 2(밑줄 바 없음) / 행2 목록 단일 카드└②소식 행들(내부 구분선으로만 구분)
    └③펼침 본문(같은 카드 안, 해당 행 바로 아래) / 행3 ④더보기"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 행1 — ① 종류 탭 pill 2
    r1 = y + 0.06
    for i in range(2):
        sil_pill(s, x + i * 1.16, r1, 1.06, 0.26, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, r1 - 0.02)

    # 행2 — 목록 단일 카드
    r2 = y + 0.50
    rows, rh, bodyh = 7, 0.40, 1.00
    cardh = 0.10 + rows * rh + bodyh + 0.06
    sil_box(s, x, r2, w, cardh, True, lw=1.5)
    cy = r2 + 0.10
    for i in range(rows):
        sil_pill(s, x + 0.14, cy + 0.11, 0.62, 0.18, ctx.on(2))                 # 종류 pill
        if i == 0:
            sil_pill(s, x + 0.82, cy + 0.11, 0.48, 0.18, ctx.on(2))            # 고정 pill
            hline(s, x + 1.38, cy + 0.21, 2.20, ctx.on(2))
        else:
            hline(s, x + 0.84, cy + 0.21, 2.40, ctx.on(2))
        hline(s, x + w - 0.92, cy + 0.21, 0.70, ctx.on(2))                     # 날짜
        cy += rh
        if i == 1:
            # └③ 펼침 본문 — 같은 카드 안, 해당 행 바로 아래
            rect(s, x + 0.14, cy + 0.02, w - 0.28, bodyh - 0.10, fill=GF7, line=GEE, line_w=1.0)
            sil_lines(s, x + 0.26, cy + 0.16, w - 0.56, ctx.on(3), n=4, gap=0.16)
            ctx.mk(s, 3, x - 0.02, cy + 0.00)
            cy += bodyh
        seg(s, x + 0.12, cy, x + w - 0.12, cy, color=GEE, w=0.9)               # 내부 구분선
    ctx.mk(s, 2, x - 0.02, r2 + 0.08)

    # 행3 — ④ 더보기
    r3 = R["y"] + h - 0.28
    sil_button(s, x + w / 2 - 0.70, r3, 1.40, 0.28, ctx.on(4))
    ctx.mk(s, 4, x + w / 2 - 0.72, r3 - 0.02)


screen(prs, ("소식", "공지사항 · 업데이트", "USR-10", "/notices  (공개)"), draw_usr10, [
    (1, "종류 탭", "공지사항 / 업데이트 — URL ?kind= 와 동기화"),
    (2, "소식 행", "종류 pill · 고정 pill · 제목 · 날짜"),
    (3, "펼침 본문", "아코디언으로 본문 표시"),
    (4, "더보기", "탭별 독립 증분"),
], rule_box=(
    ["노출이 꺼진 소식은 표시하지 않는다(서버 필터 적용).",
     "고정 소식을 상단 우선으로 두고 그 아래를 최신순으로 정렬한다.",
     "공지는 알림을 발생시키지 않는다(0.10)."],
    "getNotices(kind) → 공개 조회 API, 노출 필터는 서버에서 적용.",
))

# ============================================================
# USR-11 설정
# ============================================================
def_slide(
    prs, "USR-11", "설정 (Settings)",
    tree=[
        (0, "설정 (/settings)"),
        (1, "관심 카테고리 (7칩)"),
        (1, "관심 업무 도메인 (6칩)"),
        (1, "확장 안내"),
        (1, "저장 (반영 개수 피드백)"),
        (1, "홈으로"),
    ],
    flow=["진입", "칩 토글", "저장", "랜딩 추천 반영"],
    flow_branch=(1, "미저장 이탈 = 미반영"),
    flow_note=[
        "설정 항목을 관심사 2종으로 한정해 설정 부담을 줄였다.",
        "저장 피드백에 반영 개수를 병기해 '무엇이 적용됐는지'를 즉시 확인시킨다.",
    ],
    sections=[
        ("정의·역할", ["접근: 로그인 필요",
                    "개인화 설정 — 관심 카테고리·도메인 관리"]),
        ("목적", ["랜딩 맞춤 추천의 기준을 사용자가 직접 설정",
                "추천 결과에 대한 납득 가능성 확보"]),
        ("기획 의도", ["설정 항목을 관심사 2종으로 한정해 부담 축소",
                    "저장 피드백에 반영 개수 병기",
                    "확장 항목은 안내로 예고"]),
        ("지켜야 할 룰", ["미저장 이탈 시 변경 미반영",
                     "미설정 상태는 랜딩의 설정 안내와 연결"]),
        ("개발 연동 노트", ["useInterests().save → PUT /me/interests(0.10)",
                      "확장 필드 결정 대기(부록 B)"]),
    ],
)


def draw_usr11(s, R, ctx):
    """LAYOUT USR-11 — 본문 폭 좁게(inner의 ~60%):
    ①카테고리 카드(헤더 2행+칩 7) → ②도메인 카드(헤더 2행+칩 6) → ③안내 → 행[④저장·피드백 … ⑤홈으로]"""
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cw = w * 0.60
    cx = x + (w - cw) / 2
    total = 1.20 + 0.14 + 1.10 + 0.14 + 0.40 + 0.16 + 0.32
    top = y + (h - total) / 2

    # ① 관심 카테고리 카드 (헤더 2행 + 칩 7)
    sil_box(s, cx, top, cw, 1.20, ctx.on(1), lw=1.4)
    hline(s, cx + 0.14, top + 0.18, 1.40, ctx.on(1), 1.8)
    hline(s, cx + 0.14, top + 0.34, 2.20, ctx.on(1))
    chw = (cw - 0.28 - 3 * 0.08) / 4
    for i in range(4):
        sil_pill(s, cx + 0.14 + i * (chw + 0.08), top + 0.48, chw, 0.24, ctx.on(1))
    for i in range(3):
        sil_pill(s, cx + 0.14 + i * (chw + 0.08), top + 0.80, chw, 0.24, ctx.on(1))
    ctx.mk(s, 1, cx - 0.02, top - 0.02)

    # ② 관심 업무 도메인 카드 (헤더 2행 + 칩 6)
    t2 = top + 1.34
    sil_box(s, cx, t2, cw, 1.10, ctx.on(2), lw=1.4)
    hline(s, cx + 0.14, t2 + 0.18, 1.60, ctx.on(2), 1.8)
    hline(s, cx + 0.14, t2 + 0.34, 2.40, ctx.on(2))
    dhw = (cw - 0.28 - 2 * 0.08) / 3
    for r in range(2):
        for c in range(3):
            sil_pill(s, cx + 0.14 + c * (dhw + 0.08), t2 + 0.48 + r * 0.28, dhw, 0.22, ctx.on(2))
    ctx.mk(s, 2, cx - 0.02, t2 - 0.02)

    # ③ 확장 안내
    t3 = t2 + 1.24
    sil_box(s, cx, t3, cw, 0.40, ctx.on(3), lw=1.1, fill=GF7)
    hline(s, cx + 0.14, t3 + 0.16, cw - 0.60, ctx.on(3))
    hline(s, cx + 0.14, t3 + 0.28, cw - 1.20, ctx.on(3))
    ctx.mk(s, 3, cx - 0.02, t3 - 0.02)

    # 행 — ④ 저장·피드백 … ⑤ 홈으로(우측 끝)
    t4 = t3 + 0.56
    sil_button(s, cx, t4, 1.10, 0.32, ctx.on(4))
    sil_box(s, cx + 1.24, t4 + 0.04, 0.80, 0.24, ctx.on(4), lw=1.1, fill=GF7)
    ctx.mk(s, 4, cx - 0.02, t4 - 0.02)
    sil_button(s, cx + cw - 1.10, t4, 1.10, 0.32, ctx.on(5))
    ctx.mk(s, 5, cx + cw - 1.12, t4 - 0.02)


screen(prs, ("설정", "개인화 설정", "USR-11", "/settings  (로그인 필요)"), draw_usr11, [
    (1, "관심 카테고리", "7종 칩 다중 선택"),
    (2, "관심 업무 도메인", "6종 칩 다중 선택"),
    (3, "확장 안내", "'추후 개인 정보 항목 추가 예정(프로필 · 알림 수신 설정 등)'"),
    (4, "저장", "완료 피드백 '저장되었습니다 — 관심사 N개 반영'"),
    (5, "홈으로", "랜딩으로 이동"),
], rule_box=(
    ["저장 전 이탈 시 변경은 반영되지 않는다(별도 경고 없음).",
     "미설정 상태는 랜딩의 관심사 설정 안내와 연결된다.",
     "설정 항목은 관심사 2종으로 한정하고 확장 항목은 안내로만 예고한다."],
    "useInterests().save → PUT /me/interests(0.10), 확장 필드 결정 대기(부록 B).",
))

# ============================================================
out = os.path.join(os.path.dirname(__file__), "user-screens.pptx")
prs.save(out)
print("SAVED", out, "slides=", len(prs.slides._sldIdLst))
