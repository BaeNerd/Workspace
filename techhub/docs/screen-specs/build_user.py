# -*- coding: utf-8 -*-
"""PHASE 1 v2 — 사용자 영역 화면정의서 → user-screens.pptx (LandingPage 제외)
무언어 실루엣 와이어프레임 + 우측 Description. p0 = 구조 트리 + 흐름."""
import os
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from spec_common import (
    new_deck, def_slide, screen, sil_box, sil_button, sil_input, sil_lines,
    sil_grid, sil_bars, sil_linechart, sil_pill, sil_circle, tiny, seg,
    G33, G66, G99, GCC, GDD, GEE, GF7, WHITE, INK,
)

prs = new_deck()


# ---- 공용 실루엣 조각 ----
def nav(s, R, ctx, n):
    x, y, w = R["x"], R["y"], R["w"]
    sil_box(s, x, y, w, 0.34, ctx.on(n), lw=1.3)
    sil_pill(s, x + 0.08, y + 0.09, 0.7, 0.16, ctx.on(n))          # 로고
    for i in range(3):
        sil_pill(s, x + 1.05 + i * 0.62, y + 0.1, 0.5, 0.14, ctx.on(n))  # 링크
    sil_circle(s, x + w - 0.32, y + 0.06, 0.22, ctx.on(n))          # 아바타
    ctx.mk(s, n, x - 0.02, y - 0.02)
    return y + 0.34 + 0.14


def footer(s, R, ctx, n):
    x, w = R["x"], R["w"]
    fy = R["y"] + R["h"] - 0.26
    sil_box(s, x, fy, w, 0.26, ctx.on(n), lw=1.3, fill=GF7)
    ctx.mk(s, n, x - 0.02, fy - 0.02)


# ============================================================
# USR-01 로그인
# ============================================================
def_slide(
    prs, "USR-01", "로그인 (Login)",
    tree=[
        (0, "로그인 (/login)"),
        (1, "로그인 카드 (max 380)"),
        (2, "브랜드 로고 · 안내 문구"),
        (2, "SSO 로그인 버튼"),
        (2, "데모 계정 토글 → 6종"),
        (2, "문의 · 외부 접근 고지"),
    ],
    flow=["/login 진입", "SSO 로그인", "인증 성공", "역할 판별", "홈·복귀 이동"],
    flow_branch=(3, "admin·관계사→/admin"),
    sections=[
        ("정의", ["Microsoft SSO 기반 사내 로그인. ?redirect=로 복귀 경로 수신",
                "데모 계정 프리셋 6종(admin1·user3·companyAdmin2)"]),
        ("목적", ["폐쇄형 플랫폼의 단일 진입점", "데모에서 역할별 화면 즉시 체험"]),
        ("룰", ["SSO 버튼은 데모 스텁(실 연동 시 백엔드 교체)",
               "admin·companyAdmin→/admin, 그 외→redirectTo",
               "문의 tech-hub@kolmar.co.kr · 외부 접근 불가"]),
        ("기획 의도", ["중앙 단일 카드로 시선 집중", "데모 계정은 접이식으로 숨겨 실 SSO 우선"]),
    ],
)


def draw_usr01(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cw = 2.6; cx = x + (w - cw) / 2; cy = y + 0.35
    sil_box(s, cx, cy, cw, h - 0.9, True if ctx.on(1) else False, lw=1.6)  # 카드
    sil_pill(s, cx + cw / 2 - 0.55, cy + 0.22, 1.1, 0.22, ctx.on(1)); ctx.mk(s, 1, cx - 0.02, cy + 0.18)
    sil_lines(s, cx + 0.5, cy + 0.66, cw - 1.0, ctx.on(2), n=2, gap=0.14); ctx.mk(s, 2, cx - 0.02, cy + 0.6)
    sil_button(s, cx + 0.3, cy + 1.1, cw - 0.6, 0.3, ctx.on(3)); ctx.mk(s, 3, cx - 0.02, cy + 1.06)
    sil_button(s, cx + 0.3, cy + 1.55, cw - 0.6, 0.26, ctx.on(4))
    for i in range(3):
        sil_box(s, cx + 0.3, cy + 1.9 + i * 0.34, cw - 0.6, 0.28, ctx.on(4), lw=1.1)
    ctx.mk(s, 4, cx - 0.02, cy + 1.85)
    sil_lines(s, cx + 0.4, cy + h - 1.4, cw - 0.8, ctx.on(5), n=2, gap=0.13, fracs=[1.0, 0.7]); ctx.mk(s, 5, cx - 0.02, cy + h - 1.45)


screen(prs, ("로그인 (Login)", "로그인", "USR-01", "/login"), draw_usr01, [
    (1, "브랜드 로고", "KOLMAR + AX Platform 워드마크, 카드 상단 중앙 · 타이틀 'Kolmar AX Platform'"),
    (2, "안내 문구", "'사내 계정으로 로그인하세요' 서브 문구"),
    (3, "SSO 로그인 버튼", "'Microsoft 계정으로 로그인' → 로딩 후 데모 관리자 로그인·redirectTo 이동", "실 연동 시 백엔드 로그인으로 교체"),
    (4, "데모 계정 토글·리스트", "'데모 계정으로 로그인 ▾' 펼침 시 6종 노출, 클릭 시 역할별 이동", "데모 전용 · 실 배포 시 제거"),
    (5, "문의·보안 고지", "'로그인 문제 문의 tech-hub@kolmar.co.kr' + '사내 전용 플랫폼 · 외부 접근 불가'"),
])

# ============================================================
# USR-02 소개 (About)
# ============================================================
def_slide(
    prs, "USR-02", "소개 (About)",
    tree=[
        (0, "소개 (/about)"),
        (1, "HERO (뱃지·타이틀·CTA 2·팩트)"),
        (1, "01 왜 AX Platform (문제→해법 ×4)"),
        (1, "02 무엇을 다루나 (카테고리 ×7)"),
        (1, "03 질문에서 출발 (콘셉트 ×3)"),
        (1, "04 이용 흐름 (4-step)"),
        (1, "05 FAQ (아코디언)"),
        (1, "CTA 배너"),
    ],
    flow=["탐색", "확인", "등록", "공유"],
    sections=[
        ("정의", ["플랫폼 취지·대상·이용법 정적 소개 페이지",
                "01 Why→02 What→03 질문→04 흐름→05 FAQ→CTA"]),
        ("목적", ["'무엇을·왜·어떻게' 한 페이지로 설명", "탐색·등록 신청으로 유도(CTA)"]),
        ("룰", ["다루지 않는 것 명시: 일반 IT·시스템 구축(MES·SRM·ERP)·인프라·BI",
               "7유형은 '카테고리'로 표기", "AI Agent는 관리자가 카탈로그로 관리"]),
        ("기획 의도", ["'질문에서 출발' 콘셉트로 콘텐츠 성격 각인",
                    "로드맵(AX 검색 AI) 문구는 CTA 배너에 통합"]),
    ],
)


def draw_usr02(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = nav(s, R, ctx, 1)
    sil_box(s, x, cy, w, 0.72, ctx.on(2), lw=1.5, fill=GF7)                     # hero
    sil_pill(s, x + w / 2 - 0.4, cy + 0.08, 0.8, 0.14, ctx.on(2))
    sil_lines(s, x + 0.7, cy + 0.3, w - 1.4, ctx.on(2), n=2, gap=0.13, fracs=[1.0, 0.7])
    sil_button(s, x + w / 2 - 0.95, cy + 0.56, 0.9, 0.14, ctx.on(2)); sil_button(s, x + w / 2 + 0.05, cy + 0.56, 0.9, 0.14, ctx.on(2))
    ctx.mk(s, 2, x - 0.02, cy - 0.02)
    cy += 0.84
    sil_grid(s, x, cy, w, 0.62, ctx.on(3), 2, 2); ctx.mk(s, 3, x - 0.02, cy - 0.02); cy += 0.74
    sil_grid(s, x, cy, w, 0.6, ctx.on(4), 4, 2); ctx.mk(s, 4, x - 0.02, cy - 0.02); cy += 0.72
    sil_grid(s, x, cy, w, 0.44, ctx.on(5), 3, 1); ctx.mk(s, 5, x - 0.02, cy - 0.02); cy += 0.56
    for i in range(4):
        sil_circle(s, x + 0.2 + i * (w - 0.6) / 3, cy + 0.02, 0.22, ctx.on(6))
    seg(s, x + 0.3, cy + 0.13, x + w - 0.3, cy + 0.13, color=GEE if ctx.on(6) else GDD, w=1.0)
    ctx.mk(s, 6, x - 0.02, cy - 0.02); cy += 0.4
    for i in range(2):
        sil_box(s, x, cy + i * 0.22, w, 0.18, ctx.on(7), lw=1.0)
    ctx.mk(s, 7, x - 0.02, cy - 0.02); cy += 0.5
    sil_box(s, x, cy, w, R["y"] + h - cy - 0.02, ctx.on(8), lw=1.4, fill=GF7); ctx.mk(s, 8, x - 0.02, cy - 0.02)


screen(prs, ("소개 (About)", "소개", "USR-02", "/about"), draw_usr02, [
    (1, "공통 Navbar", "전 페이지 상단 고정 내비게이션 (USR-08)"),
    (2, "HERO", "'Kolmar Group' 뱃지 + 타이틀 '그룹의 자동화·AI 자산, AX Platform에서 만나세요' + CTA [자산 탐색하기]/[내 자산 등록하기] + 팩트(29개 관계사·7가지 자산 유형)"),
    (3, "01 왜 AX Platform", "문제→해법 카드 4종: 흩어진 자산 / 중복 개발 / 무엇을 쓸지 모름 / 사례 단절"),
    (4, "02 무엇을 다루나", "카테고리 카드 7종(클릭 시 /projects?platform=<id>)", "다루지 않는 것: 일반 IT·시스템 구축·인프라·BI"),
    (5, "03 질문에서 출발", "질문형 콘셉트 카드 3종(AI Agent·나만의 비서·Vibe Coding)"),
    (6, "04 어떻게 이용하나", "탐색→확인→등록→공유 4-step + 'AI Agent는 관리자가 카탈로그로 관리' 안내"),
    (7, "05 FAQ", "접이식 4문항(대상·평가 미반영·등록 대상·문의 경로)"),
    (8, "CTA 배너", "탐색 유도 + 'AX 검색 AI' 로드맵 예고 문구"),
])

# ============================================================
# USR-03 카탈로그 목록
# ============================================================
def_slide(
    prs, "USR-03", "카탈로그 목록 (AX 플랫폼 탐색)",
    tree=[
        (0, "카탈로그 (/projects)"),
        (1, "페이지 헤더 (타이틀·검색·그룹뷰어 배지)"),
        (1, "sticky 필터 바"),
        (2, "카테고리 필터 (7종)"),
        (2, "도메인 필터 (6종)"),
        (2, "인기 태그 · 초기화"),
        (1, "정렬 · 결과 카운트"),
        (1, "항목 카드 그리드 (더 보기 24씩)"),
    ],
    flow=["검색·필터 입력", "목록 즉시 갱신", "카드 선택", "항목 상세 이동"],
    sections=[
        ("정의", ["게시된 AX 항목 탐색 목록. sticky 2행 필터 바 + 카드 그리드",
                "URL 파라미터 ?q= ?platform= ?domain= 만 사용"]),
        ("목적", ["7개 카테고리 전 자산을 한 지도에서 탐색", "중복 개발 방지·재사용 유도"]),
        ("룰", ["운영 상태/관계사/usage 필터 없음",
               "company는 비노출 관계사 접근 게이팅용(표시 필터 아님)",
               "isGroupViewer는 비노출 관계사도 조회"]),
        ("기획 의도", ["사이드바 대신 sticky 필터로 본문 폭 확보",
                    "AI Agent 카드는 강점 칩+비용 배지로 비교 축 표면화"]),
    ],
)


def draw_usr03(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    # 헤더
    sil_box(s, x, y, w, 0.5, ctx.on(1), lw=1.4, fill=GF7)
    sil_lines(s, x + 0.1, y + 0.1, 1.4, ctx.on(1), n=1)
    sil_input(s, x + w - 1.9, y + 0.14, 1.8, 0.22, ctx.on(1)); tiny(s, x + w - 1.9, y + 0.14, 1.8, "검색", ctx.on(1))
    ctx.mk(s, 1, x - 0.02, y - 0.02)
    cy = y + 0.6
    # 필터바
    sil_box(s, x, cy, w, 0.66, ctx.on(2) or ctx.on(3) or ctx.on(4) or ctx.on(5), lw=1.3, fill=GF7)
    for i in range(8):
        sil_pill(s, x + 0.12 + i * 0.56, cy + 0.08, 0.46, 0.16, ctx.on(3))
    ctx.mk(s, 3, x - 0.02, cy + 0.04)
    for i in range(7):
        sil_pill(s, x + 0.12 + i * 0.62, cy + 0.3, 0.5, 0.16, ctx.on(4))
    ctx.mk(s, 4, x + w - 0.28, cy + 0.26)
    for i in range(6):
        sil_pill(s, x + 0.12 + i * 0.5, cy + 0.5, 0.42, 0.12, ctx.on(5))
    ctx.mk(s, 5, x - 0.02, cy + 0.46)
    cy += 0.76
    # 정렬/카운트
    sil_lines(s, x + 0.05, cy + 0.06, 0.9, ctx.on(6), n=1)
    for i in range(3):
        sil_button(s, x + w - 1.6 + i * 0.52, cy, 0.46, 0.2, ctx.on(6))
    ctx.mk(s, 6, x - 0.02, cy - 0.02)
    cy += 0.34
    # 카드 그리드
    sil_grid(s, x, cy, w, R["y"] + h - cy - 0.02, ctx.on(7), 3, 3)
    ctx.mk(s, 7, x - 0.02, cy - 0.02)


screen(prs, ("카탈로그 목록", "AX 플랫폼 탐색", "USR-03", "/projects"), draw_usr03, [
    (1, "헤더·검색 바", "타이틀 'AX 플랫폼 탐색' + 검색(제목·요약·태그·부서, ?q= 동기화)", "isGroupViewer는 '그룹 관리자 권한으로 모든 관계사 조회 중' 배지"),
    (2, "sticky 필터 바", "스크롤 시 상단 고정 2행 필터 바(좌측 사이드바 아님)"),
    (3, "카테고리 필터", "전체+7종 칩(n8n·PA·나만의 비서·AI Agent·ML·Vibe·AI 프로젝트), 선택 시 목록 즉시 갱신"),
    (4, "도메인 필터", "전체+6종(영업·생산·연구·재무·HR·IT) 칩 필터"),
    (5, "인기 태그·초기화", "빈도 상위 6개 태그(검색어 토글) + [초기화](카테고리·도메인 리셋)"),
    (6, "정렬·카운트", "'N개 항목' + 정렬 3종(최신순/인기순/이름순)"),
    (7, "항목 카드 그리드", "카드=카테고리·도메인 배지·좋아요·제목(2줄)·요약(2줄)·태그 3(또는 AI Agent 강점 칩+비용 배지)·업데이트·부서. 하단 [더 보기]·빈 상태 '검색 결과가 없습니다.'"),
])

# ============================================================
# USR-04 항목 상세 — 공통/개요 + 유형별 상세 + 담당자/논의
# ============================================================
def_slide(
    prs, "USR-04", "항목 상세 (Item Detail)",
    tree=[
        (0, "항목 상세 (/{platform}/:itemId)"),
        (1, "Breadcrumb"),
        (1, "헤더 (배지·제목·요약·액션)"),
        (1, "탭 바"),
        (2, "개요 (이미지·설명·출처·후기)"),
        (2, "상세 (유형별)"),
        (2, "담당자"),
        (2, "업데이트·논의"),
        (1, "사이드바 (모델 접속·태그)"),
    ],
    flow=["항목 진입", "개요 확인", "유형별 상세", "담당자·논의", "후기·좋아요"],
    sections=[
        ("정의", ["AX 항목 상세(7경로). 탭=개요/상세/담당자/업데이트·논의",
                "vibe·etc는 상세 탭 숨김→개요 통합"]),
        ("목적", ["사용법·구성·담당자·논의를 한 곳에서 확인·재사용"]),
        ("룰", ["상태·실행 버튼·관계사 표시 제거(예외: AI Agent 가용 배지·모델 접속)",
               "후기는 개요 탭 내부 섹션에서 등록",
               "AI Agent 제목은 모델명 단독, 방문 시 최근 본 항목 저장(최대 10)"]),
        ("기획 의도", ["유형별 상세 라벨·구성 차등(모델 사양/비서 구성/플로우/모델 정보…)",
                    "AI Agent는 강점 서술을 최상단에 우선 노출"]),
    ],
)


def draw_usr04(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    seg(s, x, y + 0.14, x + 2.2, y + 0.14, color=G66 if ctx.on(1) else GDD, w=1.0); ctx.mk(s, 1, x - 0.02, y - 0.02)
    hy = y + 0.28
    sil_box(s, x, hy, w, 0.72, ctx.on(2), lw=1.4, fill=GF7)
    sil_pill(s, x + 0.1, hy + 0.08, 0.7, 0.14, ctx.on(2)); sil_pill(s, x + 0.86, hy + 0.08, 0.6, 0.14, ctx.on(2))
    sil_lines(s, x + 0.1, hy + 0.32, w - 2.2, ctx.on(2), n=2, gap=0.13, fracs=[0.9, 0.6])
    sil_button(s, x + w - 1.9, hy + 0.32, 0.55, 0.2, ctx.on(2)); sil_button(s, x + w - 1.3, hy + 0.32, 0.6, 0.2, ctx.on(2)); sil_button(s, x + w - 0.66, hy + 0.32, 0.6, 0.2, ctx.on(2))
    ctx.mk(s, 2, x - 0.02, hy - 0.02)
    ty = hy + 0.82
    for i in range(4):
        sil_pill(s, x + i * 0.9, ty, 0.8, 0.18, ctx.on(3))
    seg(s, x, ty + 0.2, x + w, ty + 0.2, color=GCC if ctx.on(3) else GDD, w=1.2); ctx.mk(s, 3, x - 0.02, ty - 0.02)
    by = ty + 0.32
    mw = w * 0.66; sx = x + mw + 0.18; sw = w - mw - 0.18
    sil_box(s, x, by, mw, 0.6, ctx.on(4), lw=1.3, fill=GF7)                    # 이미지
    sil_lines(s, x + 0.1, by + 0.72, mw - 0.2, ctx.on(4), n=3)                 # 설명
    sil_box(s, x, by + 1.24, mw, 0.34, ctx.on(4), lw=1.1)                       # 출처
    sil_box(s, x, by + 1.66, mw, R["y"] + h - (by + 1.66) - 0.02, ctx.on(4), lw=1.2)  # 후기
    sil_lines(s, x + 0.1, by + 1.8, mw - 0.2, ctx.on(4), n=2)
    ctx.mk(s, 4, x - 0.02, by - 0.02)
    # 사이드바
    sil_box(s, sx, by, sw, 0.5, ctx.on(9), lw=1.2)
    sil_box(s, sx, by + 0.6, sw, 0.7, ctx.on(9), lw=1.2)
    for i in range(3):
        sil_pill(s, sx + 0.08, by + 0.72 + i * 0.18, sw - 0.16, 0.12, ctx.on(9))
    ctx.mk(s, 9, sx - 0.02, by - 0.02)
    # 상세/담당자/논의 마커는 탭 위치에 부착
    ctx.mk(s, 5, x + 0.9 - 0.02, ty - 0.02)
    ctx.mk(s, 6, x + 1.8 - 0.02, ty - 0.02)
    ctx.mk(s, 7, x + 2.7 - 0.02, ty - 0.02)


_usr04_desc = [
    (1, "Breadcrumb", "AX Platform / 카테고리명 / 항목 제목 경로"),
    (2, "헤더·액션", "카테고리 배지 +(AI Agent) 가용 배지·제공사 + 제목 + 요약 + [♥ 좋아요][담당자 연락][모델 접속→](AI Agent만) + 메타(부서·수정일·카테고리)"),
    (3, "탭 바", "개요 / 상세 / 담당자 / 업데이트·논의(글 수). 상세 탭은 vibe·etc 숨김"),
    (4, "개요 탭", "이미지 캐러셀 + 설명(줄바꿈 보존) + 출처(카테고리 배지+shortDesc) + 활용 후기 목록·등록", "빈 후기 '아직 등록된 후기가 없습니다.'"),
    (5, "상세 탭", "유형별 렌더 — 다음 슬라이드 참조(n8n·PA·비서·AI Agent·ML)"),
    (6, "담당자 탭", "담당자 카드(이름·부서·배지)+[이메일](mailto)+이메일 표기"),
    (7, "업데이트·논의 탭", "게시글 목록(작성자·부서·태그·좋아요)+글 작성(태그 4종:공지/Q&A/이슈제보/건의)", "빈 상태 '아직 등록된 글이 없습니다.'"),
    (9, "사이드바", "AI Agent 모델 접속 링크(specificUrl) + 태그 목록"),
]
screen(prs, ("항목 상세", "항목 상세 — 공통·개요", "USR-04", "/{platform}/:itemId"), draw_usr04,
       _usr04_desc, active={1, 2, 3, 4, 9}, page_no=1, page_total=5, subtitle="공통·개요")
screen(prs, ("항목 상세", "항목 상세 — 탭 안내", "USR-04", "/{platform}/:itemId"), draw_usr04,
       _usr04_desc, active={3, 5, 6, 7}, page_no=2, page_total=5, subtitle="탭 구성")


# 상세 탭 유형별 — 전체 상세 화면 반복, 상세 탭 영역만 강조
def draw_usr04_detail(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    seg(s, x, y + 0.14, x + 2.2, y + 0.14, color=GDD, w=1.0)
    hy = y + 0.28
    sil_box(s, x, hy, w, 0.6, False, lw=1.4)
    ty = hy + 0.7
    for i in range(4):
        act = (i == 1)  # '상세' 탭 강조
        sil_pill(s, x + i * 0.9, ty, 0.8, 0.18, act)
    seg(s, x, ty + 0.2, x + w, ty + 0.2, color=GCC, w=1.2)
    ctx.mk(s, 10, x + 0.9 - 0.02, ty - 0.02)   # 상세 탭 위치 마커
    by = ty + 0.34
    # 상세 콘텐츠 (유형별 블록들)
    sil_box(s, x, by, w, 0.9, ctx.on(1), lw=1.5, fill=GF7)
    ctx.mk(s, 1, x - 0.02, by - 0.02)
    sil_box(s, x, by + 1.0, w * 0.48, 0.6, ctx.on(2), lw=1.3); sil_box(s, x + w * 0.52, by + 1.0, w * 0.48, 0.6, ctx.on(3), lw=1.3)
    ctx.mk(s, 2, x - 0.02, by + 0.98); ctx.mk(s, 3, x + w * 0.52 - 0.02, by + 0.98)
    sil_box(s, x, by + 1.7, w, 0.55, ctx.on(4), lw=1.3)
    sil_lines(s, x + 0.1, by + 1.82, w - 0.2, ctx.on(4), n=3)
    ctx.mk(s, 4, x - 0.02, by + 1.68)
    sil_button(s, x, by + 2.35, 1.2, 0.24, ctx.on(5)); ctx.mk(s, 5, x - 0.02, by + 2.31)


screen(prs, ("항목 상세", "상세 탭 — n8n / PA", "USR-04", "/{platform}/:itemId"), draw_usr04_detail, [
    (10, "상세 탭 활성", "'상세' 탭 선택 상태 — 유형별 라벨(모델 사양/비서 구성/플로우 정보/모델 정보…)"),
    (1, "[n8n] 워크플로우 다이어그램", "N8nFlowPreview 시각화 + [JSON 다운로드]"),
    (2, "[n8n] 예상 효과", "예상 절감 시간 칩"),
    (3, "[n8n] 구성 난이도 / [PA] 예상 효과", "n8n 난이도 칩 · PA는 '플로우 정보—예상 효과'(없으면 폴백 문구)"),
    (4, "[n8n] 상세 설명", "다이어그램 하단 상세 설명 본문"),
    (5, "공통", "이미지·좋아요·담당자 연락은 공통 헤더/개요와 동일"),
], page_no=3, page_total=5, subtitle="상세 A")

screen(prs, ("항목 상세", "상세 탭 — 나만의 비서 / AI Agent / ML", "USR-04", "/{platform}/:itemId"), draw_usr04_detail, [
    (10, "상세 탭 활성", "유형별 상세 탭(비서 구성 / 모델 사양 / 모델 정보)"),
    (1, "[AI Agent] 강점 및 활용 방법", "상세 최상단 강조 서술 박스"),
    (2, "[AI Agent] 세부 모델명 / [비서] 기반 모델", "AI Agent 모델명·처리 가능 글 분량 · 비서 기반 모델"),
    (3, "[AI Agent] 비용 등급·[모델 접속→] / [비서] 공유 프롬프트·[복사]", "AI Agent 비용 배지+접속+비교 링크 · 비서 프롬프트 복사"),
    (4, "[ML] 모델 유형·개발 도구·학습 데이터 개요", "ML 모델 정보 카드"),
    (5, "[Vibe·AI 프로젝트]", "상세 탭 없음 → 개요에 블로그형 통합"),
], page_no=4, page_total=5, subtitle="상세 B")


# 담당자 · 논의
def draw_usr04_contact(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    seg(s, x, y + 0.14, x + 2.2, y + 0.14, color=GDD, w=1.0)
    hy = y + 0.28
    sil_box(s, x, hy, w, 0.6, False, lw=1.4)
    ty = hy + 0.7
    for i in range(4):
        sil_pill(s, x + i * 0.9, ty, 0.8, 0.18, i in (2, 3))
    seg(s, x, ty + 0.2, x + w, ty + 0.2, color=GCC, w=1.2)
    ctx.mk(s, 1, x + 1.8 - 0.02, ty - 0.02)
    by = ty + 0.34
    sil_box(s, x, by, w, 0.7, ctx.on(1), lw=1.3)
    sil_circle(s, x + 0.12, by + 0.14, 0.34, ctx.on(1)); sil_lines(s, x + 0.6, by + 0.18, 1.6, ctx.on(1), n=2)
    sil_button(s, x + w - 1.0, by + 0.2, 0.8, 0.22, ctx.on(1))
    by += 0.85
    sil_box(s, x, by, w, 0.3, ctx.on(2), lw=1.1, fill=GF7); ctx.mk(s, 2, x - 0.02, by - 0.02)
    ctx.mk(s, 1, x - 0.02, by - 0.85 - 0.02)
    for i in range(2):
        sil_box(s, x, by + 0.4 + i * 0.55, w, 0.5, ctx.on(3), lw=1.2)
        sil_circle(s, x + 0.1, by + 0.5 + i * 0.55, 0.26, ctx.on(3)); sil_lines(s, x + 0.5, by + 0.5 + i * 0.55, w - 1.0, ctx.on(3), n=2)
    ctx.mk(s, 3, x - 0.02, by + 0.36)
    wy = by + 1.55
    for i in range(4):
        sil_pill(s, x + i * 0.85, wy, 0.75, 0.16, ctx.on(4))
    sil_box(s, x, wy + 0.24, w, R["y"] + h - (wy + 0.24) - 0.02, ctx.on(4), lw=1.2)
    sil_button(s, x + w - 1.0, R["y"] + h - 0.3, 0.9, 0.22, ctx.on(4))
    ctx.mk(s, 4, x - 0.02, wy - 0.02)


screen(prs, ("항목 상세", "담당자 · 업데이트·논의", "USR-04", "/{platform}/:itemId"), draw_usr04_contact, [
    (1, "담당자 카드", "담당자 이름·부서·담당자 배지 + [이메일] 버튼(mailto) + 이메일 표기"),
    (2, "논의 안내 배너", "'공지·질문·이슈제보·건의를 남기는 공간. 담당자 직접 문의는 담당자 탭 이용.'"),
    (3, "게시글 목록", "글별 작성자·부서·태그 배지·좋아요", "빈 상태 '아직 등록된 글이 없습니다.'"),
    (4, "글 작성", "태그 4종(공지/Q&A/이슈제보/건의) 선택 + textarea + [등록]"),
], page_no=5, page_total=5, subtitle="담당자·논의")

# ============================================================
# USR-05 신규 등록 신청 (Step 0·1·2)
# ============================================================
def_slide(
    prs, "USR-05", "신규 항목 등록 신청 (3단계)",
    tree=[
        (0, "등록 신청 (/projects/new)"),
        (1, "스텝 인디케이터 (3단계)"),
        (1, "Step 0 유형 선택 (카드 ×7)"),
        (1, "Step 1 정보 입력"),
        (2, "공통(사진·제목·요약·상세·도메인·태그)"),
        (2, "유형별 세부"),
        (2, "담당자"),
        (1, "Step 2 최종 확인"),
    ],
    flow=["카테고리 선택", "내용 입력", "최종 확인", "신청 접수", "승인 대기"],
    sections=[
        ("정의", ["3단계 고정 스텝 폼. 유형 선택→정보 입력→최종 확인",
                "제출 시 서버가 항목 ID 발급"]),
        ("목적", ["누구나 자신의 자산을 표준 형식으로 등록 신청", "관리자 검토(병렬 2슬롯) 후 게시"]),
        ("룰", ["관계사 범위 입력 없음(전 항목 전사 공용 company:[])",
               "상태·실행 URL 없음(예외: AI Agent 가용 여부·모델 접속 URL)",
               "AI Agent 유형은 관리자 전용 등록",
               "ID {PREFIX}-{YYYY}-{순번}, 서버 발급·불변·결번 재사용 금지"]),
        ("기획 의도", ["필수/선택 클러스터 구분선으로 부담 완화",
                    "n8n은 JSON 업로드로 다이어그램 자동 생성"]),
    ],
)


def _stepper(s, R, ctx, active_step, n):
    x, y, w = R["x"], R["y"], R["w"]
    for i in range(3):
        cx = x + i * (w / 3)
        sil_circle(s, cx + 0.1, y, 0.24, ctx.on(n))
        sil_pill(s, cx + 0.42, y + 0.03, (w / 3) - 0.7, 0.16, ctx.on(n))
        if i < 2:
            seg(s, cx + 0.36, y + 0.12, cx + (w / 3), y + 0.12, color=GCC if ctx.on(n) else GDD, w=1.2)
    ctx.mk(s, n, x - 0.02, y - 0.02)
    return y + 0.42


def draw_usr05_step0(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = _stepper(s, R, ctx, 0, 1)
    sil_grid(s, x, cy + 0.1, w, 2.7, ctx.on(2), 2, 4); ctx.mk(s, 2, x - 0.02, cy + 0.06)
    sil_box(s, x, cy + 2.95, w, 0.3, ctx.on(3), lw=1.1, fill=GF7); ctx.mk(s, 3, x - 0.02, cy + 2.91)
    sil_box(s, x, cy + 3.32, w, 0.3, ctx.on(4), lw=1.1, fill=GF7); ctx.mk(s, 4, x - 0.02, cy + 3.28)
    sil_button(s, x + w - 1.0, R["y"] + h - 0.3, 0.9, 0.24, ctx.on(5)); ctx.mk(s, 5, x + w - 1.0 - 0.02, R["y"] + h - 0.34)


screen(prs, ("신규 등록 신청", "Step 0 — 유형 선택", "USR-05", "/projects/new"), draw_usr05_step0, [
    (1, "스텝 인디케이터", "1 유형 선택 · 2 정보 입력 · 3 최종 확인(완료 ✓·현재 강조)"),
    (2, "유형 선택 카드 ×7", "카테고리별 설명 카드 클릭 선택. 비관리자에게 AI Agent 미노출"),
    (3, "관리자 안내", "isAdmin 시 'AI Agent 유형은 관리자 전용 등록…' 안내"),
    (4, "공통 안내", "'어떤 유형을 선택해도 등록 신청→관리자 검토→승인 절차는 동일하게 적용됩니다.'"),
    (5, "다음", "유형 선택 시 활성화"),
], page_no=1, page_total=4, subtitle="Step 0")


def draw_usr05_step1(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = _stepper(s, R, ctx, 1, 9)
    # 공통 기본 정보 카드
    sil_box(s, x, cy + 0.06, w, 1.9, ctx.on(1), lw=1.4)
    sil_box(s, x + 0.12, cy + 0.2, w - 0.24, 0.55, ctx.on(1), lw=1.2, fill=GF7)   # 사진
    sil_input(s, x + 0.12, cy + 0.9, w - 0.24, 0.2, ctx.on(1))                     # 제목
    sil_input(s, x + 0.12, cy + 1.22, w - 0.24, 0.2, ctx.on(1))                    # 요약
    sil_box(s, x + 0.12, cy + 1.5, w - 0.24, 0.34, ctx.on(1), lw=1.1)              # 상세
    ctx.mk(s, 1, x - 0.02, cy + 0.02)
    # 유형별 세부
    sil_box(s, x, cy + 2.06, w, 1.0, ctx.on(2), lw=1.4, fill=GF7)
    sil_lines(s, x + 0.12, cy + 2.2, w - 0.24, ctx.on(2), n=4)
    ctx.mk(s, 2, x - 0.02, cy + 2.02)
    # 담당자
    sil_box(s, x, cy + 3.16, w, 0.6, ctx.on(3), lw=1.4)
    for i in range(4):
        sil_input(s, x + 0.12 + i * ((w - 0.24) / 4), cy + 3.3, (w - 0.4) / 4, 0.18, ctx.on(3))
    sil_button(s, x + 0.12, cy + 3.55, 1.1, 0.16, ctx.on(3))
    ctx.mk(s, 3, x - 0.02, cy + 3.12)


_usr05_step1_desc = [
    (9, "스텝 인디케이터", "현재 Step 1(정보 입력) 활성"),
    (1, "공통 기본 정보", "사진(캐러셀·최대 10장) + 제목*·한 줄 요약*·상세 설명* + 구분선 + 업무 도메인(선택)·태그(ChipInput)", "10장 초과 시 앞 10장만 반영 경고"),
    (2, "유형별 세부", "n8n=JSON 업로드→다이어그램·절감시간·난이도 / PA=절감시간 / 비서=공유 프롬프트*·기반 모델 / ML=모델 유형*·학습 데이터·개발 도구 / AI Agent(관리자 전용)=가용 여부*·강점*·모델 접속 URL*·세부 모델명·글 분량·비용 / Vibe·AI 프로젝트=공통만"),
    (3, "담당자", "이름·부서·이메일·역할(주/공동) + [+ 담당자 추가]. 첫 행 필수"),
]
screen(prs, ("신규 등록 신청", "Step 1 — 정보 입력(공통·담당자)", "USR-05", "/projects/new"), draw_usr05_step1,
       _usr05_step1_desc, active={9, 1, 3}, page_no=2, page_total=4, subtitle="Step 1 · 공통")
screen(prs, ("신규 등록 신청", "Step 1 — 유형별 세부", "USR-05", "/projects/new"), draw_usr05_step1,
       _usr05_step1_desc, active={9, 2}, page_no=3, page_total=4, subtitle="Step 1 · 유형별")


def draw_usr05_step2(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    cy = _stepper(s, R, ctx, 2, 5)
    sil_box(s, x, cy + 0.06, w, 0.3, ctx.on(1), lw=1.2, fill=GF7); ctx.mk(s, 1, x - 0.02, cy + 0.02)
    for i in range(7):
        seg(s, x, cy + 0.5 + i * 0.28, x + 1.4, cy + 0.5 + i * 0.28, color=G99 if ctx.on(2) else GDD, w=1.0)
        seg(s, x + 1.6, cy + 0.5 + i * 0.28, x + w - 0.1, cy + 0.5 + i * 0.28, color=G66 if ctx.on(2) else GDD, w=1.0)
    ctx.mk(s, 2, x - 0.02, cy + 0.44)
    sil_box(s, x, cy + 2.6, w, 0.28, ctx.on(3), lw=1.1, fill=GF7); ctx.mk(s, 3, x - 0.02, cy + 2.56)
    sil_box(s, x, cy + 2.94, w, 0.28, ctx.on(4), lw=1.1, fill=GF7); ctx.mk(s, 4, x - 0.02, cy + 2.9)
    sil_button(s, x, R["y"] + h - 0.3, 0.9, 0.24, ctx.on(6))
    sil_button(s, x + w - 1.0, R["y"] + h - 0.3, 0.9, 0.24, ctx.on(6)); ctx.mk(s, 6, x + w - 1.0 - 0.02, R["y"] + h - 0.34)


screen(prs, ("신규 등록 신청", "Step 2 — 최종 확인", "USR-05", "/projects/new"), draw_usr05_step2, [
    (5, "스텝 인디케이터", "현재 Step 2(최종 확인) 활성"),
    (1, "등록 카테고리 배너", "'<카테고리>으로 등록합니다' 확인 배너"),
    (2, "요약 행", "제목·요약·사진·도메인·태그·유형별·주담당자 라벨-값 리스트(160px 라벨)"),
    (3, "ID 발급 안내", "'{PREFIX}-{YYYY}-순번 형식의 고유 ID가 발급됩니다'"),
    (4, "승인 절차 안내", "'등록 신청→관리자 검토→승인 절차를 거쳐 게시. 결과는 이메일·Teams 알림.'"),
    (6, "이전 / 제출하기", "제출 완료 시 발급 ID 표시 후 /my-status 이동"),
], page_no=4, page_total=4, subtitle="Step 2")

# ============================================================
# USR-06 수정 요청
# ============================================================
def_slide(
    prs, "USR-06", "수정 요청 (Edit Request)",
    tree=[
        (0, "수정 요청 (/edit-request/:id)"),
        (1, "Breadcrumb · 헤더"),
        (1, "대상 항목 안내"),
        (1, "기본 정보 (프리필)"),
        (1, "유형별 세부 (프리필)"),
        (1, "담당자 (프리필)"),
        (1, "수정 사유*"),
        (1, "제출 (취소 / 수정 요청 제출)"),
    ],
    flow=["게시 항목 진입", "값 프리필", "변경·사유 입력", "제출", "관리자 검토·반영"],
    sections=[
        ("정의", ["게시된 항목 수정 신청. 등록 폼 Step 1과 1:1 대응 프리필",
                "변경 내용 + 수정 사유 제출"]),
        ("목적", ["게시본 정보 갱신을 관리자 검토로 반영", "이력이 남는 정식 수정 경로"]),
        ("룰", ["상태·관계사·실행 URL·삭제된 유형별 필드 수정 UI 없음",
               "변경 사유(reason) 필수",
               "사진은 등록 폼과 동일한 캐러셀 입력 공유"]),
        ("기획 의도", ["등록 폼과 동일 구조로 학습 비용 최소화",
                    "결과는 Teams·이메일로 안내"]),
    ],
)


def draw_usr06(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    seg(s, x, y + 0.14, x + 2.2, y + 0.14, color=G66 if ctx.on(1) else GDD, w=1.0)
    sil_box(s, x, y + 0.26, w, 0.4, ctx.on(1), lw=1.3, fill=GF7); ctx.mk(s, 1, x - 0.02, y - 0.02)
    sil_box(s, x, y + 0.74, w, 0.28, ctx.on(2), lw=1.1, fill=GF7); ctx.mk(s, 2, x - 0.02, y + 0.7)
    cy = y + 1.1
    sil_box(s, x, cy, w, 1.15, ctx.on(3), lw=1.4)
    sil_box(s, x + 0.12, cy + 0.12, w - 0.24, 0.4, ctx.on(3), lw=1.2, fill=GF7)
    sil_input(s, x + 0.12, cy + 0.62, w - 0.24, 0.18, ctx.on(3)); sil_input(s, x + 0.12, cy + 0.9, w - 0.24, 0.18, ctx.on(3))
    ctx.mk(s, 3, x - 0.02, cy - 0.02)
    cy += 1.28
    sil_box(s, x, cy, w, 0.7, ctx.on(4), lw=1.4, fill=GF7); sil_lines(s, x + 0.12, cy + 0.12, w - 0.24, ctx.on(4), n=3); ctx.mk(s, 4, x - 0.02, cy - 0.02)
    cy += 0.82
    sil_box(s, x, cy, w, 0.5, ctx.on(5), lw=1.3)
    for i in range(4):
        sil_input(s, x + 0.12 + i * ((w - 0.24) / 4), cy + 0.16, (w - 0.4) / 4, 0.18, ctx.on(5))
    ctx.mk(s, 5, x - 0.02, cy - 0.02)
    cy += 0.62
    sil_box(s, x, cy, w, R["y"] + h - cy - 0.4, ctx.on(6), lw=1.4); ctx.mk(s, 6, x - 0.02, cy - 0.02)
    sil_button(s, x + w - 2.0, R["y"] + h - 0.3, 0.9, 0.24, ctx.on(7)); sil_button(s, x + w - 1.0, R["y"] + h - 0.3, 0.9, 0.24, ctx.on(7)); ctx.mk(s, 7, x + w - 2.0 - 0.02, R["y"] + h - 0.34)


screen(prs, ("수정 요청", "게시 항목 수정 요청", "USR-06", "/edit-request/:id"), draw_usr06, [
    (1, "Breadcrumb·헤더", "AX 플랫폼 / 항목명 / 수정 요청 + '게시된 AX 항목 수정 요청' 헤더"),
    (2, "대상 항목 안내", "항목 ID·카테고리 배지 + '항목을 수정합니다'"),
    (3, "기본 정보(프리필)", "현재 값으로 채워진 사진·제목*·요약*·상세* + 도메인·태그"),
    (4, "유형별 세부(프리필)", "등록 폼 Step 1 유형별 필드 프리필(상태·관계사·실행 URL 제외)"),
    (5, "담당자(프리필)", "담당자 행 프리필 + 추가/삭제"),
    (6, "수정 사유*", "변경 사유 필수 입력(제출 활성 조건)", "'검토 후 반영, Teams·이메일 안내'"),
    (7, "취소 / 수정 요청 제출", "사유·필수값 충족 시 활성, 제출 후 /my-status 이동"),
])

# ============================================================
# USR-07 내 현황
# ============================================================
def_slide(
    prs, "USR-07", "내 현황 (My Status)",
    tree=[
        (0, "내 현황 (/my-status)"),
        (1, "헤더"),
        (1, "승인 단계 탭 KPI ×5"),
        (1, "신청 목록"),
        (2, "카드 (ID·배지·제목·유형 칩)"),
        (2, "병렬 2슬롯 인디케이터"),
        (2, "액션(확인·취소·재제출·삭제)"),
        (1, "내가 남긴 후기"),
    ],
    flow=["신청 완료", "관계사·전사 병렬 승인", "게시 완료"],
    flow_branch=(1, "반려 → 재제출/삭제"),
    sections=[
        ("정의", ["내 등록 신청의 승인 현황 조회. 병렬 2슬롯 기준 5탭",
                "병렬 승인 인디케이터 + '내가 남긴 후기'"]),
        ("목적", ["신청 건 승인 진행을 슬롯 단위로 투명 확인", "반려 재제출·취소·삭제 제공"]),
        ("룰", ["탭 5종: 전체/승인 대기/부분 승인/게시됨/반려 (중지는 탭에 없음)",
               "운영 상태 폐기·승인 수명주기만 유지",
               "게시됨 카드만 상세 이동, 대기·부분 승인은 신청 취소 가능"]),
        ("기획 의도", ["직렬 1차/2차 대신 병렬 슬롯 시각화(신청→관계사·전사→게시)",
                    "반려 사유를 카드 내 배너로 즉시 노출"]),
    ],
)


def draw_usr07(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    sil_lines(s, x, y + 0.05, 1.4, ctx.on(1), n=1); ctx.mk(s, 1, x - 0.02, y - 0.02)
    ky = y + 0.32
    for i in range(5):
        sil_box(s, x + i * (w / 5), ky, (w / 5) - 0.1, 0.5, ctx.on(2), lw=1.3, fill=GF7)
    ctx.mk(s, 2, x - 0.02, ky - 0.02)
    cy = ky + 0.64
    for k in range(2):
        cardy = cy + k * 1.35
        sil_box(s, x, cardy, w, 1.2, ctx.on(3), lw=1.4)
        sil_pill(s, x + 0.12, cardy + 0.1, 0.5, 0.14, ctx.on(3)); sil_pill(s, x + 0.68, cardy + 0.1, 0.6, 0.14, ctx.on(3))
        sil_lines(s, x + 0.12, cardy + 0.32, w - 2.0, ctx.on(3), n=2)
        sil_pill(s, x + w - 1.0, cardy + 0.1, 0.85, 0.16, ctx.on(3))
        # 인디케이터
        sil_circle(s, x + 0.12, cardy + 0.72, 0.2, ctx.on(4))
        sil_pill(s, x + 0.5, cardy + 0.66, 1.1, 0.16, ctx.on(4)); sil_pill(s, x + 0.5, cardy + 0.86, 1.1, 0.16, ctx.on(4))
        sil_circle(s, x + 1.85, cardy + 0.72, 0.2, ctx.on(4))
        ctx.mk(s, 4, x + 0.4, cardy + 0.62)
        for i in range(4):
            sil_button(s, x + 0.12 + i * 0.85, cardy + 1.0, 0.78, 0.16, ctx.on(5))
        ctx.mk(s, 5, x - 0.02, cardy + 0.96)
        ctx.mk(s, 3, x - 0.02, cardy - 0.02)
    ry = cy + 2.75
    if ry < R["y"] + h - 0.5:
        sil_lines(s, x, ry, 1.5, ctx.on(6), n=1)
        sil_box(s, x, ry + 0.2, w, R["y"] + h - (ry + 0.2) - 0.02, ctx.on(6), lw=1.3)
        ctx.mk(s, 6, x - 0.02, ry - 0.02)


screen(prs, ("내 현황", "내 등록 현황", "USR-07", "/my-status"), draw_usr07, [
    (1, "헤더", "'나의 등록 / 내 등록 현황' 타이틀"),
    (2, "단계 탭 KPI ×5", "전체·승인 대기·부분 승인·게시됨·반려 카운트 칩, 클릭 시 해당 단계 필터"),
    (3, "신청 카드", "항목 ID·카테고리 배지·제목·요약 + 유형별 요약 칩 + 단계 배지·신청/처리일"),
    (4, "병렬 2슬롯 인디케이터", "신청 완료 → 관계사 관리자 승인·전사 관리자 승인(병렬) → 게시 완료", "반려/중지는 컬러 배너로 대체"),
    (5, "액션", "내용 확인(확장) / 대기=신청 취소 / 반려=수정 후 재제출·신청 삭제(인라인 확인)"),
    (6, "내가 남긴 후기", "플랫폼 배지·제목·내용·날짜·'N명이 도움됨'", "빈 상태 '아직 남긴 후기가 없습니다.'"),
])

# ============================================================
# USR-08 공통 내비게이션
# ============================================================
def_slide(
    prs, "USR-08", "공통 내비게이션 (Navbar / Footer)",
    tree=[
        (0, "공통 컴포넌트"),
        (1, "Navbar (sticky, h56)"),
        (2, "로고"),
        (2, "링크 3종"),
        (2, "관리자 진입(★)"),
        (2, "역할 배지 + 아바타 드롭다운"),
        (2, "SSO 로그인 버튼(비로그인)"),
        (1, "Footer (하단 고정)"),
    ],
    flow=["페이지 진입", "내비 노출", "역할 인지", "메뉴 이동/로그아웃"],
    sections=[
        ("정의", ["전 사용자 페이지 상단 고정 Navbar + 하단 고정 Footer",
                "로고·링크·관리자 진입·역할 배지·프로필/SSO"]),
        ("목적", ["일관된 전역 내비게이션·역할 인지", "관리 콘솔 진입점 노출"]),
        ("룰", ["관리자 진입은 isAdmin || isCompanyAdmin",
               "역할 배지 2종(관리자 앰버·관계사 관리자 오렌지)",
               "동일 경로 재클릭 시 필터 리셋(_resetAt)",
               "공유 모드: SSO 버튼 숨김·배너 오프셋"]),
        ("기획 의도", ["역할별 배지·아바타 색 분기로 권한 인지",
                    "sticky·blur로 스크롤 중 접근성 유지"]),
    ],
)


def draw_usr08(s, R, ctx):
    x, y, w, h = R["x"], R["y"], R["w"], R["h"]
    ny = y + 0.2
    sil_box(s, x, ny, w, 0.4, True, lw=1.6)
    sil_pill(s, x + 0.1, ny + 0.12, 0.8, 0.16, ctx.on(1)); ctx.mk(s, 1, x - 0.02, ny - 0.02)
    for i in range(3):
        sil_pill(s, x + 1.1 + i * 0.7, ny + 0.13, 0.58, 0.14, ctx.on(2))
    ctx.mk(s, 2, x + 1.1 - 0.02, ny - 0.02)
    sil_pill(s, x + 3.3, ny + 0.13, 0.6, 0.14, ctx.on(3)); ctx.mk(s, 3, x + 3.3 - 0.02, ny - 0.02)
    sil_pill(s, x + w - 1.5, ny + 0.12, 0.6, 0.16, ctx.on(4)); sil_circle(s, x + w - 0.36, ny + 0.08, 0.24, ctx.on(4)); ctx.mk(s, 4, x + w - 1.5 - 0.02, ny - 0.02)
    sil_button(s, x + w - 1.1, ny + 0.55, 0.95, 0.24, ctx.on(5)); ctx.mk(s, 5, x + w - 1.1 - 0.02, ny + 0.51)
    # 드롭다운
    dy = ny + 0.55
    sil_box(s, x + w - 1.8, dy, 1.7, 1.0, ctx.on(4), lw=1.3)
    for i in range(3):
        sil_pill(s, x + w - 1.7, dy + 0.14 + i * 0.28, 1.5, 0.16, ctx.on(4))
    # Footer
    fy = y + h - 0.34
    sil_box(s, x, fy, w, 0.34, True, lw=1.6, fill=GF7); ctx.mk(s, 6, x - 0.02, fy - 0.02)


screen(prs, ("공통 내비게이션", "Navbar / Footer", "USR-08", "components/Navbar·Footer"), draw_usr08, [
    (1, "로고", "KOLMAR + AX Platform, 클릭 시 랜딩(/) 이동"),
    (2, "주요 링크", "소개 · AX 플랫폼 · AX 항목 등록, 현재 경로 강조 + 재클릭 필터 리셋"),
    (3, "관리자 진입(★)", "isAdmin/isCompanyAdmin일 때만 별 아이콘 '관리자' 노출"),
    (4, "역할 배지·아바타·드롭다운", "관리자(앰버)/관계사 관리자(오렌지) 배지 + 역할별 아바타 색 + 드롭다운(내 등록 현황·관리자 페이지·로그아웃)"),
    (5, "SSO 로그인 버튼", "비로그인 시 노출(공유 모드에선 숨김)"),
    (6, "Footer", "하단 고정, 'KOLMAR Tech Hub · 사내 전용 플랫폼 · 외부 접근 불가'"),
])

# ============================================================
out = os.path.join(os.path.dirname(__file__), "user-screens.pptx")
prs.save(out)
print("SAVED", out, "slides=", len(prs.slides._sldIdLst))
