import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// 공개 페이지
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";

// 로그인 필요 페이지
import ProjectListPage from "./pages/ProjectListPage";
import ProjectRegisterPage from "./pages/ProjectRegisterPage";
import MyStatusPage from "./pages/MyStatusPage";
import EditRequestPage from "./pages/EditRequestPage";
import PlatformItemDetailPage from "./pages/PlatformItemDetailPage";

// 관리자 전용 페이지
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReview from "./pages/admin/AdminReview";
import AdminProjectManage from "./pages/admin/AdminProjectManage";
import AdminTaxonomy from "./pages/admin/AdminTaxonomy";
import AdminOrg from "./pages/admin/AdminOrg";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStatistics from "./pages/admin/AdminStatistics";
import AdminPlatforms from "./pages/admin/AdminPlatforms";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>

          {/* ===== 공개 (비로그인 접근 가능) ===== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ===== 로그인 필요 ===== */}
          <Route path="/projects" element={<ProtectedRoute><ProjectListPage /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><ProjectRegisterPage /></ProtectedRoute>} />
          <Route path="/my-status" element={<ProtectedRoute><MyStatusPage /></ProtectedRoute>} />
          <Route path="/edit-request/:id" element={<ProtectedRoute><EditRequestPage /></ProtectedRoute>} />

          {/* AX 플랫폼 항목 상세 — 6개 플랫폼 타입별 경로 */}
          <Route path="/n8n/:itemId" element={<ProtectedRoute><PlatformItemDetailPage /></ProtectedRoute>} />
          <Route path="/pa/:itemId" element={<ProtectedRoute><PlatformItemDetailPage /></ProtectedRoute>} />
          <Route path="/assistant/:itemId" element={<ProtectedRoute><PlatformItemDetailPage /></ProtectedRoute>} />
          <Route path="/ai-orchestration/:itemId" element={<ProtectedRoute><PlatformItemDetailPage /></ProtectedRoute>} />
          <Route path="/ml/:itemId" element={<ProtectedRoute><PlatformItemDetailPage /></ProtectedRoute>} />
          <Route path="/vibe/:itemId" element={<ProtectedRoute><PlatformItemDetailPage /></ProtectedRoute>} />

          {/* ===== 관리자 전용 ===== */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/review" element={<ProtectedRoute requireAdmin allowCompanyAdmin><AdminReview /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute requireAdmin allowCompanyAdmin><AdminProjectManage /></ProtectedRoute>} />
          <Route path="/admin/taxonomy" element={<ProtectedRoute requireAdmin><AdminTaxonomy /></ProtectedRoute>} />
          <Route path="/admin/org" element={<ProtectedRoute requireAdmin><AdminOrg /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/statistics" element={<ProtectedRoute requireAdmin><AdminStatistics /></ProtectedRoute>} />
          <Route path="/admin/platforms" element={<ProtectedRoute requireAdmin><AdminPlatforms /></ProtectedRoute>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
