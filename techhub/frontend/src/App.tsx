import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireAuth, RequireAdmin } from "./components/Guards";
import LoginPage from "./pages/LoginPage";
import EditRequestPage from "./pages/EditRequestPage";
import LandingPage from "./pages/LandingPage";
import ProjectListPage from "./pages/ProjectListPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectRegisterPage from "./pages/ProjectRegisterPage";
import MyStatusPage from "./pages/MyStatusPage";
import AboutPage from "./pages/AboutPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReview from "./pages/admin/AdminReview";
import AdminProjectManage from "./pages/admin/AdminProjectManage";
import AdminTaxonomy from "./pages/admin/AdminTaxonomy";
import AdminOrg from "./pages/admin/AdminOrg";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStatistics from "./pages/admin/AdminStatistics";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 공개 */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* 로그인 필요 */}
          <Route path="/projects/new" element={<RequireAuth><ProjectRegisterPage /></RequireAuth>} />
          <Route path="/projects/:id/edit-request" element={<RequireAuth><EditRequestPage /></RequireAuth>} />
          <Route path="/my-status" element={<RequireAuth><MyStatusPage /></RequireAuth>} />

          {/* 관리자 전용 */}
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/review" element={<RequireAdmin><AdminReview /></RequireAdmin>} />
          <Route path="/admin/projects" element={<RequireAdmin><AdminProjectManage /></RequireAdmin>} />
          <Route path="/admin/taxonomy" element={<RequireAdmin><AdminTaxonomy /></RequireAdmin>} />
          <Route path="/admin/org" element={<RequireAdmin><AdminOrg /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
          <Route path="/admin/statistics" element={<RequireAdmin><AdminStatistics /></RequireAdmin>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}