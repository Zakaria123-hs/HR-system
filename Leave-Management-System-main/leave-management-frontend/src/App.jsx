import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./page/LoginPage";
import DashboardPage from "./page/DashboardPage";
import RequestDashboard from "./page/RequestDashboard";
import DocumentsPage from "./page/DocumentsPage";
import SupervisorDashboard from "./page/SupervisorDashboard";
import HrLeavePage from "./page/HrDashboard";
import HrDocumentsPage from "./page/HrDocumentsPage";
import HrEmployeesPage from "./page/HrEmployeesPage";
import CompanyHoliday from "./page/CompanyHoliday";
import TeamPage from "./page/TeamPage";

const All   = ['employee', 'supervisor', 'hr'];
const SupHr = ['supervisor', 'hr'];

const Guard = ({ roles, children }) => <ProtectedRoute role={roles}>{children}</ProtectedRoute>;

function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Shared */}
            <Route path="/dashboard"    element={<Guard roles={All}><DashboardPage /></Guard>} />
            <Route path="/team"         element={<Guard roles={All}><TeamPage /></Guard>} />
            <Route path="/holidays"     element={<Guard roles={All}><CompanyHoliday /></Guard>} />

            {/* Employee + Supervisor */}
            <Route path="/my-requests"  element={<Guard roles={All}><RequestDashboard /></Guard>} />
            <Route path="/my-documents" element={<Guard roles={All}><DocumentsPage /></Guard>} />

            {/* Supervisor */}
            <Route path="/supervisor"   element={<Guard roles={SupHr}><SupervisorDashboard /></Guard>} />

            {/* HR */}
            <Route path="/hr/leave"      element={<Guard roles={['hr']}><HrLeavePage /></Guard>} />
            <Route path="/hr/documents"  element={<Guard roles={['hr']}><HrDocumentsPage /></Guard>} />
            <Route path="/hr/employees"  element={<Guard roles={['hr']}><HrEmployeesPage /></Guard>} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
