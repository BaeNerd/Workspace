// ============================================================
// 관계사 관리자(CompanyAdmin) 지정 공유 목업 (DEMO 전용)
// ------------------------------------------------------------
// AdminUsers(관리자 권한 탭 = 유일한 편집 지점)·AdminOrg 섹션 3(읽기 전용 투영)·
// LoginPage 데모 계정이 모두 이 단일 데이터를 참조한다.
//
// 실제 연동 시 데이터 흐름
//   관리자 지정 DB → GET /api/v1/auth/me 의 managedCompanies → AuthContext
// 를 데모 계층에서 모사하는 구조.
//
// ⚠️ TODO: 실제 연동 시 이 모듈을 폐기하고 GET/PUT /api/v1/admin/company-admins 및
//          GET /api/v1/auth/me 응답으로 교체.
// (statsMockData.ts와 무관한 별도 신규 모듈)
// ============================================================

export type CompanyAdminUser = { email: string; name: string; dept?: string; managedCompanies: string[] };

// 김관리는 role admin(전사 관리자)이므로 이 목록에 포함하지 않는다.
export const INITIAL_COMPANY_ADMINS: CompanyAdminUser[] = [
  { email: "cadmin.choi@kolmar.co.kr", name: "최관리", dept: "IT인프라팀", managedCompanies: ["KKM"] },
  { email: "cadmin.jung@kolmar.co.kr", name: "정담당", dept: "경영지원팀", managedCompanies: ["KBH", "HC"] },
];

// 이메일로 담당 관계사 코드 목록 조회 (LoginPage 데모 계정 → AuthContext managedCompanies 모사)
export const managedCompaniesOf = (email: string): string[] =>
  INITIAL_COMPANY_ADMINS.find(a => a.email.toLowerCase() === email.toLowerCase())?.managedCompanies ?? [];
