# -*- coding: utf-8 -*-
"""V4 — 사용자 영역 화면정의서 → user-screens.pptx
확정 템플릿: 무언어 실루엣 와이어프레임 + 우측 Description + 하단 '화면 룰·기획 근거' 박스.
p0 = 좌[구조 트리 / 사용자 흐름 + 설계 근거 주석] · 우[정의·역할/목적/기획 의도/룰/개발 연동 노트 5단].

수록 화면: USR-00 랜딩 · 01 로그인 · 03 목록 · 04 상세 · 05 등록 · 06 수정 요청 ·
          07 내 현황 · 08 공통 내비 · 09 이용 가이드 · 10 소식 · 11 설정
USR-02(소개)는 결번 — 콘텐츠가 USR-09 이용 가이드로 흡수되어 슬라이드를 생성하지 않는다."""
import os
import spec_common
from spec_common import (
    new_deck, def_slide, screen, sil_box, sil_button, sil_input, sil_lines,
    sil_grid, sil_bars, sil_pill, sil_circle, tiny, seg,
    G66, G99, GCC, GDD, GF7,
)

spec_common.AUTHOR = "배상혁"
prs = new_deck()


# ---- 공용 실루엣 조각 ----
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
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = nav(s, R, ctx, 0)
    # (1) 프로모션 배너
    sil_box(s, x, cy, w, 0.46, ctx.on(1), lw=1.4, fill=GF7)
    sil_lines(s, x + 0.16, cy + 0.1, w * 0.5, ctx.on(1), n=2, gap=0.14, fracs=[1.0, 0.6])
    for i in range(3):
        sil_circle(s, x + w / 2 - 0.18 + i * 0.16, cy + 0.34, 0.08, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, cy - 0.02)
    cy += 0.58
    # (2) 개인화 패널
    pw = w * 0.63
    sil_box(s, x, cy, pw, 1.02, ctx.on(2), lw=1.4)
    sil_lines(s, x + 0.1, cy + 0.08, 1.2, ctx.on(2), n=1)
    bw = (pw - 0.32) / 3
    for i in range(3):
        bx = x + 0.1 + i * (bw + 0.06)
        sil_box(s, bx, cy + 0.28, bw, 0.62, ctx.on(2), lw=1.1, fill=GF7)
        sil_lines(s, bx + 0.08, cy + 0.4, bw - 0.16, ctx.on(2), n=2, gap=0.14)
    ctx.mk(s, 2, x - 0.02, cy - 0.02)
    # (3) 퀵메뉴
    qx = x + pw + 0.14
    qw = w - pw - 0.14
    sil_box(s, qx, cy, qw, 1.02, ctx.on(3), lw=1.4, fill=GF7)
    for i in range(4):
        sil_pill(s, qx + 0.1, cy + 0.12 + i * 0.22, qw - 0.2, 0.16, ctx.on(3))
    ctx.mk(s, 3, qx - 0.02, cy - 0.02)
    cy += 1.14
    # (4) 히어로
    sil_box(s, x, cy, w, 1.24, ctx.on(4), lw=1.5, fill=GF7)
    sil_lines(s, x + w * 0.18, cy + 0.12, w * 0.64, ctx.on(4), n=2, gap=0.16, fracs=[1.0, 0.66])
    sil_input(s, x + w * 0.14, cy + 0.5, w * 0.72, 0.24, ctx.on(4))
    tiny(s, x + w * 0.14, cy + 0.5, w * 0.72, "검색", ctx.on(4))
    tw = (w - 0.32) / 7
    for i in range(7):
        sil_box(s, x + 0.1 + i * (tw + 0.03), cy + 0.86, tw, 0.3, ctx.on(4), lw=1.1, round=True)
    ctx.mk(s, 4, x - 0.02, cy - 0.02)
    cy += 1.36
    # (5) 플랫폼 현황
    bh = R["y"] + h - cy - 0.02
    sil_box(s, x, cy, w, bh, ctx.on(5), lw=1.4)
    sil_lines(s, x + 0.12, cy + 0.1, 1.4, ctx.on(5), n=1)
    sil_bars(s, x + 0.12, cy + 0.4, w - 1.5, bh - 0.6, ctx.on(5))
    sil_button(s, x + w - 1.2, cy + bh - 0.4, 1.05, 0.26, ctx.on(5))
    ctx.mk(s, 5, x - 0.02, cy - 0.02)


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
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = y
    # (6) 인기 카드
    for i in range(4):
        sil_pill(s, x + i * 0.62, cy, 0.56, 0.16, ctx.on(6))
    sil_grid(s, x, cy + 0.24, w, 1.02, ctx.on(6), 3, 2)
    ctx.mk(s, 6, x - 0.02, cy - 0.02)
    cy += 1.4
    # (7) 최신소식
    nw = w * 0.6
    sil_box(s, x, cy, nw, 1.16, ctx.on(7), lw=1.4)
    for i in range(2):
        sil_pill(s, x + 0.1 + i * 0.6, cy + 0.08, 0.54, 0.15, ctx.on(7))
    for i in range(3):
        yy = cy + 0.44 + i * 0.2
        seg(s, x + 0.1, yy, x + nw - 0.1, yy, color=G66 if ctx.on(7) else GDD, w=1.1)
    sil_button(s, x + nw - 0.88, cy + 0.86, 0.76, 0.22, ctx.on(7))
    ctx.mk(s, 7, x - 0.02, cy - 0.02)
    # (8) 실시간 인기 카드
    rx = x + nw + 0.14
    rw = w - nw - 0.14
    sil_box(s, rx, cy, rw, 1.16, ctx.on(8), lw=1.4, fill=GF7)
    sil_lines(s, rx + 0.1, cy + 0.08, rw - 0.6, ctx.on(8), n=1)
    for i in range(5):
        sil_pill(s, rx + 0.1, cy + 0.34 + i * 0.16, rw - 0.2, 0.13, ctx.on(8))
    ctx.mk(s, 8, rx - 0.02, cy - 0.02)
    cy += 1.3
    # (9) 업무별 카드
    for i in range(6):
        sil_pill(s, x + i * 0.5, cy, 0.44, 0.15, ctx.on(9))
    sil_grid(s, x, cy + 0.22, w, 0.66, ctx.on(9), 3, 1)
    ctx.mk(s, 9, x - 0.02, cy - 0.02)
    cy += 1.0
    # (10) CTA 4종
    ch = R["y"] + h - cy - 0.34
    for i in range(4):
        sil_box(s, x + i * (w / 4), cy, w / 4 - 0.1, ch, ctx.on(10), lw=1.3, fill=GF7, round=True)
    ctx.mk(s, 10, x - 0.02, cy - 0.02)
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
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cw = 2.9
    cx = x + (w - cw) / 2
    cy = y + 0.3
    sil_box(s, cx, cy, cw, h - 0.75, False, lw=1.6)
    # (1) 브랜드
    sil_pill(s, cx + cw / 2 - 0.6, cy + 0.24, 1.2, 0.22, ctx.on(1))
    sil_lines(s, cx + 0.55, cy + 0.62, cw - 1.1, ctx.on(1), n=1)
    ctx.mk(s, 1, cx - 0.02, cy + 0.2)
    # (2) SSO 버튼
    sil_button(s, cx + 0.3, cy + 1.0, cw - 0.6, 0.32, ctx.on(2))
    ctx.mk(s, 2, cx - 0.02, cy + 0.96)
    # (3) 데모 계정 접이식
    sil_button(s, cx + 0.3, cy + 1.46, cw - 0.6, 0.26, ctx.on(3))
    for i in range(6):
        sil_box(s, cx + 0.3, cy + 1.8 + i * 0.26, cw - 0.6, 0.22, ctx.on(3), lw=1.0)
    ctx.mk(s, 3, cx - 0.02, cy + 1.42)
    # (4) 지원 링크
    sil_lines(s, cx + 0.55, cy + 3.44, cw - 1.1, ctx.on(4), n=1)
    ctx.mk(s, 4, cx - 0.02, cy + 3.38)
    # (5) 하단 고지
    sil_lines(s, cx + 0.4, R["y"] + h - 0.34, cw - 0.8, ctx.on(5), n=2, gap=0.14, fracs=[1.0, 0.7])
    ctx.mk(s, 5, cx - 0.02, R["y"] + h - 0.4)


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
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = nav(s, R, ctx, 0)
    # (1) 헤더·검색
    sil_box(s, x, cy, w, 0.46, ctx.on(1), lw=1.4, fill=GF7)
    sil_lines(s, x + 0.12, cy + 0.1, 1.5, ctx.on(1), n=2, gap=0.15, fracs=[1.0, 0.62])
    sil_input(s, x + w - 2.0, cy + 0.13, 1.9, 0.22, ctx.on(1))
    tiny(s, x + w - 2.0, cy + 0.13, 1.9, "검색", ctx.on(1))
    ctx.mk(s, 1, x - 0.02, cy - 0.02)
    cy += 0.58
    # (2)(3) 고정 필터 2행
    fh = 0.76
    sil_box(s, x, cy, w, fh, ctx.on(2) or ctx.on(3), lw=1.3, fill=GF7)
    for i in range(8):
        sil_pill(s, x + 0.1 + i * 0.5, cy + 0.09, 0.44, 0.16, ctx.on(2))
    for i in range(6):
        sil_pill(s, x + 0.1 + i * 0.5, cy + 0.3, 0.44, 0.15, ctx.on(2))
    ctx.mk(s, 2, x - 0.02, cy - 0.02)
    for i in range(6):
        sil_pill(s, x + 0.1 + i * 0.45, cy + 0.52, 0.4, 0.15, ctx.on(3))
    sil_pill(s, x + w - 1.5, cy + 0.52, 0.66, 0.15, ctx.on(3))
    sil_pill(s, x + w - 0.76, cy + 0.52, 0.62, 0.15, ctx.on(3))
    ctx.mk(s, 3, x + w - 0.3, cy + 0.48)
    cy += fh + 0.12
    # (4) 결과 수·정렬
    sil_lines(s, x + 0.02, cy + 0.06, 0.9, ctx.on(4), n=1)
    for i in range(3):
        sil_button(s, x + w - 1.72 + i * 0.58, cy, 0.52, 0.22, ctx.on(4))
    ctx.mk(s, 4, x - 0.02, cy - 0.04)
    cy += 0.34
    # (5) 카드 그리드
    gh = R["y"] + h - cy - 0.46
    sil_grid(s, x, cy, w, gh, ctx.on(5), 3, 3)
    ctx.mk(s, 5, x - 0.02, cy - 0.02)
    # (6) 더보기
    sil_button(s, x + w / 2 - 0.6, R["y"] + h - 0.34, 1.2, 0.26, ctx.on(6))
    ctx.mk(s, 6, x + w / 2 - 0.62, R["y"] + h - 0.38)


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
                     "수정 요청은 게시 카드에 대해 누구나 가능",
                     "모델 접속 URL은 0.5의 유일한 예외"]),
        ("개발 연동 노트", ["getAssetItem·getReviewsByItem·getPostsByItem·getFallbackN8nWorkflowJson",
                      "좋아요 PUT/DELETE 멱등 · 후기/게시글 POST · 조회수 서버 집계 · 후기 알림 서버 발송(0.10)"]),
    ],
)


def draw_usr04_top(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # (1) 위치 경로
    seg(s, x, y + 0.12, x + 2.4, y + 0.12, color=G66 if ctx.on(1) else GDD, w=1.1)
    ctx.mk(s, 1, x - 0.02, y - 0.02)
    # (2) 헤더
    hy = y + 0.26
    sil_box(s, x, hy, w, 0.84, ctx.on(2), lw=1.4, fill=GF7)
    sil_pill(s, x + 0.1, hy + 0.1, 0.62, 0.15, ctx.on(2))
    sil_pill(s, x + 0.78, hy + 0.1, 0.5, 0.15, ctx.on(2))
    sil_pill(s, x + 1.34, hy + 0.1, 0.6, 0.15, ctx.on(2))
    sil_lines(s, x + 0.1, hy + 0.36, w - 0.4, ctx.on(2), n=2, gap=0.18, fracs=[0.72, 0.94])
    ctx.mk(s, 2, x - 0.02, hy - 0.02)
    # (3) 액션
    ay = hy + 0.9
    for i in range(5):
        sil_button(s, x + i * 1.02, ay, 0.94, 0.26, ctx.on(3))
    ctx.mk(s, 3, x - 0.02, ay - 0.02)
    # (4) 메타 행
    my = ay + 0.36
    sil_pill(s, x, my, 0.9, 0.16, ctx.on(4))
    sil_lines(s, x + 1.0, my + 0.07, 2.2, ctx.on(4), n=1)
    ctx.mk(s, 4, x - 0.02, my - 0.05)
    # 탭 바 + (5) 개요 탭
    ty = my + 0.3
    for i in range(4):
        sil_pill(s, x + i * 1.0, ty, 0.9, 0.2, ctx.on(5) and i == 0)
    seg(s, x, ty + 0.22, x + w, ty + 0.22, color=GCC, w=1.2)
    by = ty + 0.34
    sil_box(s, x, by, w, 0.72, ctx.on(5), lw=1.3, fill=GF7)          # 이미지 캐러셀
    sil_lines(s, x + 0.1, by + 0.86, w - 0.2, ctx.on(5), n=3)         # 상세 설명
    ry = by + 1.36
    sil_box(s, x, ry, w, R["y"] + h - ry - 0.02, ctx.on(5), lw=1.2)   # 활용 후기
    sil_lines(s, x + 0.12, ry + 0.16, w - 0.4, ctx.on(5), n=2)
    ctx.mk(s, 5, x - 0.02, by - 0.02)


screen(prs, ("카드 상세", "카드 상세", "USR-04", "/{카테고리}/:itemId  (로그인 필요)"), draw_usr04_top, [
    (1, "위치 경로", "AX Platform > 카테고리 > 제목"),
    (2, "헤더", "카테고리 pill · [AI Model] 가용 뱃지 · 제공사 · 제목 · 요약"),
    (3, "액션", "좋아요 · 스크랩 · 담당자 연락 · 수정 요청 · [AI Model] 모델 접속"),
    (4, "메타 행", "카드 ID 최선두 · 등록 부서 · 최종 수정일"),
    (5, "개요 탭", "이미지 캐러셀 + 상세 설명 + 활용 후기(등록 가능)"),
], page_no=1, page_total=2, subtitle="헤더·개요", rule_box=(
    ["카드 ID는 메타 행 최선두에 배치한다(0.3).",
     "수정 요청 진입은 게시 카드에 대해 누구나 가능하다.",
     "관계사 귀속은 API가 내려주더라도 화면에 렌더하지 않는다."],
    "getAssetItem·getReviewsByItem, 좋아요 PUT/DELETE 멱등, 후기 POST·후기 알림은 서버 발송(0.10).",
))


def draw_usr04_tabs(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    sil_box(s, x, y, w, 0.5, False, lw=1.3)                            # 헤더(톤다운)
    ty = y + 0.6
    for i in range(4):
        sil_pill(s, x + i * 1.0, ty, 0.9, 0.2, ctx.on(6) and i == 1)
    seg(s, x, ty + 0.22, x + w, ty + 0.22, color=GCC, w=1.2)
    ctx.mk(s, 6, x + 0.98, ty - 0.02)
    # (6) 유형별 상세
    by = ty + 0.34
    sil_box(s, x, by, w, 1.24, ctx.on(6), lw=1.4, fill=GF7)
    sil_grid(s, x + 0.12, by + 0.12, w - 0.24, 0.68, ctx.on(6), 3, 2)
    sil_button(s, x + 0.12, by + 0.9, 1.2, 0.24, ctx.on(6))
    # (7) 담당자 탭
    cy = by + 1.38
    sil_box(s, x, cy, w, 0.68, ctx.on(7), lw=1.4)
    sil_circle(s, x + 0.12, cy + 0.14, 0.36, ctx.on(7))
    sil_lines(s, x + 0.6, cy + 0.2, 1.9, ctx.on(7), n=2)
    sil_button(s, x + w - 1.0, cy + 0.22, 0.86, 0.24, ctx.on(7))
    ctx.mk(s, 7, x - 0.02, cy - 0.02)
    # (8) 업데이트&논의 탭
    py = cy + 0.82
    for i in range(4):
        sil_pill(s, x + i * 0.8, py, 0.72, 0.16, ctx.on(8))
    sil_box(s, x, py + 0.24, w, R["y"] + h - (py + 0.24) - 0.32, ctx.on(8), lw=1.2)
    sil_button(s, x + w - 1.0, R["y"] + h - 0.26, 0.9, 0.24, ctx.on(8))
    ctx.mk(s, 8, x - 0.02, py - 0.02)


screen(prs, ("카드 상세", "카드 상세", "USR-04", "/{카테고리}/:itemId  (로그인 필요)"), draw_usr04_tabs, [
    (6, "유형별 상세 탭", "n8n=상세 동작(워크플로우 미리보기·JSON 다운로드) / PA=플로우 정보 / 비서=비서 구성(프롬프트 복사) / AI Model=모델 사양 / ML=모델 정보"),
    (7, "담당자 탭", "담당자 정보 + 메일 연락"),
    (8, "업데이트&논의 탭", "게시글 태그 4종(공지·Q&A·이슈제보·건의) · 좋아요 · 작성 · 더보기 증분"),
], page_no=2, page_total=2, subtitle="탭 상세", rule_box=(
    ["Vibe·AI 프로젝트는 상세 탭 없이 개요에 통합한다.",
     "방문 시 최근 조회 기록(상위 10)을 남겨 재방문 동선을 잇는다.",
     "유형별 탭 라벨은 유형마다 다르게 쓰되 탭 위치·순서는 고정한다."],
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


def _stepper(s, R, ctx, n):
    x, y, w = R["x"], R["y"], R["w"]
    for i in range(3):
        cx = x + i * (w / 3)
        sil_circle(s, cx + 0.1, y, 0.24, ctx.on(n))
        sil_pill(s, cx + 0.42, y + 0.03, (w / 3) - 0.7, 0.16, ctx.on(n))
        if i < 2:
            seg(s, cx + 0.36, y + 0.12, cx + (w / 3), y + 0.12, color=GCC if ctx.on(n) else GDD, w=1.2)
    ctx.mk(s, n, x - 0.02, y - 0.02)
    return y + 0.42


def draw_usr05_a(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = _stepper(s, R, ctx, 1)
    # (2) Step 0 유형 카드 7종
    sil_grid(s, x, cy + 0.06, w, 0.94, ctx.on(2), 4, 2)
    ctx.mk(s, 2, x - 0.02, cy + 0.02)
    cy += 1.12
    seg(s, x, cy, x + w, cy, color=GCC, w=1.0)
    cy += 0.1
    # (3) 기본 정보
    sil_box(s, x, cy, w, 1.16, ctx.on(3), lw=1.4)
    sil_box(s, x + 0.12, cy + 0.12, w - 0.24, 0.4, ctx.on(3), lw=1.1, fill=GF7)   # 사진
    sil_input(s, x + 0.12, cy + 0.6, w - 0.24, 0.18, ctx.on(3))                   # 제목
    sil_input(s, x + 0.12, cy + 0.88, w - 0.24, 0.18, ctx.on(3))                  # 요약
    ctx.mk(s, 3, x - 0.02, cy - 0.02)
    cy += 1.28
    # (4) 유형별 섹션
    sil_box(s, x, cy, w, 0.66, ctx.on(4), lw=1.4, fill=GF7)
    sil_lines(s, x + 0.12, cy + 0.14, w - 0.24, ctx.on(4), n=3)
    ctx.mk(s, 4, x - 0.02, cy - 0.02)
    cy += 0.78
    # (5) 예상 절감 시간
    sil_input(s, x, cy, w * 0.36, 0.2, ctx.on(5))
    for i in range(4):
        sil_pill(s, x + w * 0.42 + i * 0.42, cy + 0.02, 0.36, 0.16, ctx.on(5))
    ctx.mk(s, 5, x - 0.02, cy - 0.04)
    cy += 0.34
    # (6) 담당자
    bh = R["y"] + h - cy - 0.02
    sil_box(s, x, cy, w, bh, ctx.on(6), lw=1.4)
    for i in range(4):
        sil_input(s, x + 0.12 + i * ((w - 0.24) / 4), cy + 0.14, (w - 0.42) / 4, 0.18, ctx.on(6))
    sil_button(s, x + 0.12, cy + 0.44, 1.1, 0.2, ctx.on(6))
    ctx.mk(s, 6, x - 0.02, cy - 0.02)


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
     "태그는 자유 입력을 허용하고 표준화는 관리자 화면(ADM-05)에서 처리한다."],
    "공용 ImageCarouselInput·TimeSavedInput·ChipInput·ML_TYPES 사용, 이미지 스토리지 선정 대기(부록 B).",
))


def draw_usr05_b(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = _stepper(s, R, ctx, 0)
    # (7) 입력 요약
    sil_box(s, x, cy + 0.08, w, 0.3, ctx.on(7), lw=1.2, fill=GF7)
    ry = cy + 0.56
    for i in range(9):
        yy = ry + i * 0.3
        seg(s, x, yy, x + 1.3, yy, color=G99 if ctx.on(7) else GDD, w=1.0)
        seg(s, x + 1.5, yy, x + w - 0.1, yy, color=G66 if ctx.on(7) else GDD, w=1.0)
    ctx.mk(s, 7, x - 0.02, cy + 0.04)
    # (8) ID 발급 안내
    iy = ry + 9 * 0.3 + 0.06
    sil_box(s, x, iy, w, 0.32, ctx.on(8), lw=1.1, fill=GF7)
    sil_lines(s, x + 0.12, iy + 0.12, w - 0.6, ctx.on(8), n=1)
    ctx.mk(s, 8, x - 0.02, iy - 0.02)
    # (9) 제출
    sil_button(s, x, R["y"] + h - 0.3, 1.0, 0.26, ctx.on(9))
    sil_button(s, x + w - 1.2, R["y"] + h - 0.3, 1.2, 0.26, ctx.on(9))
    ctx.mk(s, 9, x + w - 1.22, R["y"] + h - 0.34)


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
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    seg(s, x, y + 0.12, x + 2.2, y + 0.12, color=GDD, w=1.1)              # 위치 경로(톤다운)
    # (1) 대상 배너
    by = y + 0.26
    sil_box(s, x, by, w, 0.42, ctx.on(1), lw=1.3, fill=GF7)
    sil_pill(s, x + 0.1, by + 0.12, 0.8, 0.16, ctx.on(1))
    sil_pill(s, x + 0.98, by + 0.12, 0.6, 0.16, ctx.on(1))
    sil_lines(s, x + 1.7, by + 0.18, 2.0, ctx.on(1), n=1)
    ctx.mk(s, 1, x - 0.02, by - 0.02)
    # (2) 편집 폼
    cy = by + 0.56
    sil_box(s, x, cy, w, 1.9, ctx.on(2), lw=1.4)
    sil_box(s, x + 0.12, cy + 0.12, w - 0.24, 0.42, ctx.on(2), lw=1.1, fill=GF7)
    sil_input(s, x + 0.12, cy + 0.64, w - 0.24, 0.18, ctx.on(2))
    sil_input(s, x + 0.12, cy + 0.92, w - 0.24, 0.18, ctx.on(2))
    sil_box(s, x + 0.12, cy + 1.2, w - 0.24, 0.56, ctx.on(2), lw=1.1)
    ctx.mk(s, 2, x - 0.02, cy - 0.02)
    # (3) 담당자 편집
    cy += 2.02
    sil_box(s, x, cy, w, 0.6, ctx.on(3), lw=1.4)
    for i in range(4):
        sil_input(s, x + 0.12 + i * ((w - 0.24) / 4), cy + 0.14, (w - 0.42) / 4, 0.18, ctx.on(3))
    sil_button(s, x + 0.12, cy + 0.4, 1.0, 0.16, ctx.on(3))
    ctx.mk(s, 3, x - 0.02, cy - 0.02)
    # (4) 수정 사유
    cy += 0.72
    sil_box(s, x, cy, w, R["y"] + h - cy - 0.4, ctx.on(4), lw=1.4)
    sil_lines(s, x + 0.12, cy + 0.14, w - 0.4, ctx.on(4), n=2)
    ctx.mk(s, 4, x - 0.02, cy - 0.02)
    # (5) 취소·제출
    sil_button(s, x + w - 2.2, R["y"] + h - 0.3, 1.0, 0.26, ctx.on(5))
    sil_button(s, x + w - 1.1, R["y"] + h - 0.3, 1.1, 0.26, ctx.on(5))
    ctx.mk(s, 5, x + w - 2.22, R["y"] + h - 0.34)


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
                     "삭제는 반려 건 한정 + 복구 불가 고지",
                     "관계사 귀속 미표시"]),
        ("개발 연동 노트", ["getMyApplications·getMyReviews·deriveStage",
                      "본인 소유 필터·상태 전이 검증은 서버 책임(0.7)"]),
    ],
)


def draw_usr07(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    sil_lines(s, x, y + 0.02, 1.4, False, n=1)
    # (1) 5탭 KPI
    ky = y + 0.26
    for i in range(5):
        sil_box(s, x + i * (w / 5), ky, (w / 5) - 0.1, 0.5, ctx.on(1), lw=1.3, fill=GF7)
    ctx.mk(s, 1, x - 0.02, ky - 0.02)
    # (2)(3)(5) 신청 카드 — 진행 중
    cy = ky + 0.64
    sil_box(s, x, cy, w, 1.3, ctx.on(2), lw=1.4)
    sil_pill(s, x + 0.12, cy + 0.1, 0.6, 0.15, ctx.on(2))
    sil_pill(s, x + 0.78, cy + 0.1, 0.55, 0.15, ctx.on(2))
    sil_lines(s, x + 0.12, cy + 0.34, w - 2.0, ctx.on(2), n=2)
    sil_pill(s, x + w - 1.0, cy + 0.1, 0.85, 0.16, ctx.on(2))
    ctx.mk(s, 2, x - 0.02, cy - 0.02)
    iy = cy + 0.7
    sil_circle(s, x + 0.14, iy, 0.2, ctx.on(3))
    sil_pill(s, x + 0.52, iy - 0.06, 1.1, 0.16, ctx.on(3))
    sil_pill(s, x + 0.52, iy + 0.14, 1.1, 0.16, ctx.on(3))
    sil_circle(s, x + 1.86, iy, 0.2, ctx.on(3))
    ctx.mk(s, 3, x + 0.42, iy - 0.1)
    for i in range(3):
        sil_button(s, x + 0.12 + i * 0.9, cy + 1.06, 0.84, 0.18, ctx.on(5))
    ctx.mk(s, 5, x - 0.02, cy + 1.02)
    # (4) 반려 카드
    cy += 1.42
    sil_box(s, x, cy, w, 0.94, ctx.on(4), lw=1.4)
    sil_pill(s, x + 0.12, cy + 0.1, 0.6, 0.15, ctx.on(4))
    sil_pill(s, x + w - 1.0, cy + 0.1, 0.85, 0.16, ctx.on(4))
    sil_box(s, x + 0.12, cy + 0.36, w - 0.24, 0.44, ctx.on(4), lw=1.2, fill=GF7)
    sil_lines(s, x + 0.24, cy + 0.46, w - 0.5, ctx.on(4), n=2, gap=0.14)
    ctx.mk(s, 4, x - 0.02, cy - 0.02)
    # (6) 내가 남긴 후기
    cy += 1.06
    sil_lines(s, x, cy, 1.5, ctx.on(6), n=1)
    sil_box(s, x, cy + 0.2, w, R["y"] + h - (cy + 0.2) - 0.02, ctx.on(6), lw=1.3)
    ctx.mk(s, 6, x - 0.02, cy - 0.04)


screen(prs, ("내 현황", "내 등록 현황", "USR-07", "/my-status  (로그인 필요)"), draw_usr07, [
    (1, "5탭 KPI", "전체 · 승인 대기 · 부분 승인 · 게시됨 · 반려"),
    (2, "신청 카드", "카드 ID 최선두 · 카테고리 pill · 제목 · 요약 · 단계 뱃지 · 신청/처리일"),
    (3, "병렬 승인 인디케이터", "신청 완료 → 관계사/전사 승인 → 게시 완료"),
    (4, "반려 사유 박스", "검토자가 작성한 사유 원문"),
    (5, "카드 액션", "내용 확인/접기 · 신청 취소(대기) · 수정 요청(게시됨) · 삭제(반려·확인 절차)"),
    (6, "내가 남긴 후기", "본인이 작성한 후기 목록"),
], rule_box=(
    ["단계 명칭은 승인 대기 / 부분 승인 / 게시됨 / 반려 / 중지 표준을 따른다(0.7).",
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
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    ny = y + 0.16
    sil_box(s, x, ny, w, 0.44, True, lw=1.6)
    # (1) 브랜드
    sil_pill(s, x + 0.1, ny + 0.13, 0.8, 0.18, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, ny - 0.02)
    # (2) 메뉴 3종
    for i in range(3):
        sil_pill(s, x + 1.1 + i * 0.68, ny + 0.14, 0.6, 0.16, ctx.on(2))
    ctx.mk(s, 2, x + 1.08, ny - 0.02)
    # (3) 관리자 진입
    sil_pill(s, x + 3.2, ny + 0.14, 0.6, 0.16, ctx.on(3))
    ctx.mk(s, 3, x + 3.18, ny - 0.02)
    # (4) 알림 벨
    sil_circle(s, x + w - 1.16, ny + 0.1, 0.24, ctx.on(4))
    sil_circle(s, x + w - 1.0, ny + 0.06, 0.12, ctx.on(4))     # 미읽음 뱃지
    # (5) 역할 pill · 아바타
    sil_pill(s, x + w - 0.86, ny + 0.14, 0.5, 0.16, ctx.on(5))
    sil_circle(s, x + w - 0.3, ny + 0.1, 0.26, ctx.on(5))
    # 벨 드롭다운
    dy = ny + 0.62
    sil_box(s, x + 2.4, dy, 1.8, 0.94, ctx.on(4), lw=1.3)
    for i in range(4):
        sil_pill(s, x + 2.5, dy + 0.12 + i * 0.2, 1.6, 0.14, ctx.on(4))
    ctx.mk(s, 4, x + 2.38, dy - 0.02)
    # 아바타 드롭다운
    ay = dy + 1.06
    sil_box(s, x + w - 1.85, ay, 1.85, 0.92, ctx.on(5), lw=1.3)
    for i in range(4):
        sil_pill(s, x + w - 1.75, ay + 0.12 + i * 0.2, 1.65, 0.14, ctx.on(5))
    ctx.mk(s, 5, x + w - 1.87, ay - 0.02)
    # AdminNavbar (벨 동일 배치)
    my = ay + 1.04
    sil_box(s, x, my, w, 0.36, False, lw=1.3, fill=GF7)
    sil_pill(s, x + 0.1, my + 0.1, 0.7, 0.16, False)
    sil_circle(s, x + w - 0.62, my + 0.06, 0.22, ctx.on(4))
    sil_circle(s, x + w - 0.3, my + 0.06, 0.22, False)
    for i in range(4):
        sil_pill(s, x + 1.0 + i * 0.5, my + 0.11, 0.42, 0.14, False)
    # (6) Footer
    footer(s, R, ctx, 6)


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
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = nav(s, R, ctx, 0)
    # (1) 히어로
    sil_box(s, x, cy, w, 0.7, ctx.on(1), lw=1.5, fill=GF7)
    sil_lines(s, x + w * 0.16, cy + 0.1, w * 0.68, ctx.on(1), n=2, gap=0.15, fracs=[1.0, 0.64])
    sil_button(s, x + w / 2 - 1.0, cy + 0.44, 0.94, 0.2, ctx.on(1))
    sil_button(s, x + w / 2 + 0.06, cy + 0.44, 0.94, 0.2, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, cy - 0.02)
    cy += 0.82
    # (2) 왜 AX Platform
    sil_lines(s, x, cy, w * 0.7, ctx.on(2), n=1)
    sil_grid(s, x, cy + 0.16, w, 0.44, ctx.on(2), 4, 1)
    ctx.mk(s, 2, x - 0.02, cy - 0.04)
    cy += 0.74
    # (3) 01 시작하기
    for i in range(4):
        sil_circle(s, x + 0.2 + i * ((w - 0.6) / 3), cy, 0.24, ctx.on(3))
    seg(s, x + 0.32, cy + 0.12, x + w - 0.3, cy + 0.12, color=GCC if ctx.on(3) else GDD, w=1.1)
    for i in range(4):
        sil_lines(s, x + 0.06 + i * ((w - 0.6) / 3), cy + 0.3, 0.62, ctx.on(3), n=1)
    ctx.mk(s, 3, x - 0.02, cy - 0.02)
    cy += 0.6
    # (4) 02 등록 안내
    sil_box(s, x, cy, w, 0.66, ctx.on(4), lw=1.4)
    for i in range(3):
        sil_box(s, x + 0.12 + i * ((w - 0.24) / 3), cy + 0.1, (w - 0.4) / 3, 0.24, ctx.on(4), lw=1.1, round=True)
    for i in range(7):
        sil_pill(s, x + 0.12 + i * 0.73, cy + 0.42, 0.66, 0.15, ctx.on(4))
    ctx.mk(s, 4, x - 0.02, cy - 0.02)
    cy += 0.78
    # (5) 03 승인 안내 (2-슬롯)
    sil_box(s, x, cy, 1.2, 0.44, ctx.on(5), lw=1.3, round=True)
    sil_box(s, x + 1.5, cy - 0.04, 1.5, 0.22, ctx.on(5), lw=1.1, round=True)
    sil_box(s, x + 1.5, cy + 0.26, 1.5, 0.22, ctx.on(5), lw=1.1, round=True)
    seg(s, x + 1.35, cy + 0.07, x + 1.35, cy + 0.37, color=G99 if ctx.on(5) else GDD, w=1.2)
    seg(s, x + 1.2, cy + 0.22, x + 1.35, cy + 0.22, color=G99 if ctx.on(5) else GDD, w=1.2)
    seg(s, x + 1.35, cy + 0.07, x + 1.5, cy + 0.07, color=G99 if ctx.on(5) else GDD, w=1.2)
    seg(s, x + 1.35, cy + 0.37, x + 1.5, cy + 0.37, color=G99 if ctx.on(5) else GDD, w=1.2)
    seg(s, x + 3.0, cy + 0.07, x + 3.2, cy + 0.07, color=G99 if ctx.on(5) else GDD, w=1.2)
    seg(s, x + 3.0, cy + 0.37, x + 3.2, cy + 0.37, color=G99 if ctx.on(5) else GDD, w=1.2)
    seg(s, x + 3.2, cy + 0.07, x + 3.2, cy + 0.37, color=G99 if ctx.on(5) else GDD, w=1.2)
    seg(s, x + 3.2, cy + 0.22, x + 3.35, cy + 0.22, color=G99 if ctx.on(5) else GDD, w=1.2)
    sil_box(s, x + 3.35, cy, 1.2, 0.44, ctx.on(5), lw=1.3, round=True)
    ctx.mk(s, 5, x - 0.02, cy - 0.02)
    cy += 0.58
    # (6) 04 FAQ
    fh = R["y"] + h - cy - 0.02
    rows = 5
    for i in range(rows):
        sil_box(s, x, cy + i * (fh / rows), w, (fh / rows) - 0.05, ctx.on(6), lw=1.1)
    ctx.mk(s, 6, x - 0.02, cy - 0.02)


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
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = nav(s, R, ctx, 0)
    sil_lines(s, x, cy, 1.4, False, n=1)
    cy += 0.3
    # (1) 종류 탭
    for i in range(2):
        sil_pill(s, x + i * 1.1, cy, 1.0, 0.24, ctx.on(1))
    seg(s, x, cy + 0.28, x + w, cy + 0.28, color=GCC, w=1.2)
    ctx.mk(s, 1, x - 0.02, cy - 0.02)
    cy += 0.44
    # (2) 소식 행 + (3) 펼침 본문
    rh = 0.36
    for i in range(2):
        yy = cy + i * (rh + 0.08)
        sil_box(s, x, yy, w, rh, ctx.on(2), lw=1.2)
        sil_pill(s, x + 0.12, yy + 0.1, 0.6, 0.16, ctx.on(2))
        sil_pill(s, x + 0.78, yy + 0.1, 0.42, 0.16, ctx.on(2))
        sil_lines(s, x + 1.3, yy + 0.16, 2.0, ctx.on(2), n=1)
        sil_lines(s, x + w - 0.8, yy + 0.16, 0.7, ctx.on(2), n=1)
    ctx.mk(s, 2, x - 0.02, cy - 0.02)
    by = cy + 2 * (rh + 0.08)
    sil_box(s, x, by, w, 0.86, ctx.on(3), lw=1.3, fill=GF7)
    sil_lines(s, x + 0.14, by + 0.14, w - 0.3, ctx.on(3), n=4, gap=0.16)
    ctx.mk(s, 3, x - 0.02, by - 0.02)
    ly = by + 0.98
    for i in range(3):
        yy = ly + i * (rh + 0.08)
        sil_box(s, x, yy, w, rh, ctx.on(2), lw=1.2)
        sil_pill(s, x + 0.12, yy + 0.1, 0.6, 0.16, ctx.on(2))
        sil_lines(s, x + 0.84, yy + 0.16, 2.2, ctx.on(2), n=1)
    # (4) 더보기
    sil_button(s, x + w / 2 - 0.6, R["y"] + h - 0.34, 1.2, 0.26, ctx.on(4))
    ctx.mk(s, 4, x + w / 2 - 0.62, R["y"] + h - 0.38)


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
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = nav(s, R, ctx, 0)
    sil_lines(s, x, cy, 1.4, False, n=1)
    cy += 0.34
    # (1) 관심 카테고리
    sil_box(s, x, cy, w, 1.0, ctx.on(1), lw=1.4)
    sil_lines(s, x + 0.12, cy + 0.1, 1.5, ctx.on(1), n=1)
    for i in range(4):
        sil_pill(s, x + 0.12 + i * 1.3, cy + 0.4, 1.2, 0.22, ctx.on(1))
    for i in range(3):
        sil_pill(s, x + 0.12 + i * 1.3, cy + 0.7, 1.2, 0.22, ctx.on(1))
    ctx.mk(s, 1, x - 0.02, cy - 0.02)
    cy += 1.14
    # (2) 관심 업무 도메인
    sil_box(s, x, cy, w, 0.86, ctx.on(2), lw=1.4)
    sil_lines(s, x + 0.12, cy + 0.1, 1.6, ctx.on(2), n=1)
    for i in range(3):
        sil_pill(s, x + 0.12 + i * 1.3, cy + 0.36, 1.2, 0.2, ctx.on(2))
    for i in range(3):
        sil_pill(s, x + 0.12 + i * 1.3, cy + 0.62, 1.2, 0.2, ctx.on(2))
    ctx.mk(s, 2, x - 0.02, cy - 0.02)
    cy += 1.0
    # (3) 확장 안내
    sil_box(s, x, cy, w, 0.36, ctx.on(3), lw=1.1, fill=GF7)
    sil_lines(s, x + 0.14, cy + 0.14, w - 0.6, ctx.on(3), n=1)
    ctx.mk(s, 3, x - 0.02, cy - 0.02)
    cy += 0.52
    # (4) 저장
    sil_button(s, x, cy, 1.3, 0.3, ctx.on(4))
    sil_box(s, x + 1.45, cy + 0.02, 2.2, 0.26, ctx.on(4), lw=1.1, fill=GF7)
    ctx.mk(s, 4, x - 0.02, cy - 0.02)
    # (5) 홈으로
    sil_button(s, x + w - 1.2, cy, 1.2, 0.3, ctx.on(5))
    ctx.mk(s, 5, x + w - 1.22, cy - 0.02)


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
