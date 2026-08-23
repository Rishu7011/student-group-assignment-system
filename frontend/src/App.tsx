import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import GroupManagement from './pages/student/GroupManagement'
import AssignmentList from './pages/student/AssignmentList'
import AssignmentDetail from './pages/student/AssignmentDetail'
import ManageAssignments from './pages/admin/ManageAssignments'
import SubmissionTracker from './pages/admin/SubmissionTracker'
import AdminGroups from './pages/admin/AdminGroups'
import NotFound from './pages/NotFound'

// Root redirect: authenticated users go to their dashboard, others go to login
function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return null // ProtectedRoute handles the spinner

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }

  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected: student only */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/groups" element={<GroupManagement />} />
        <Route path="/student/assignments" element={<AssignmentList />} />
        <Route path="/student/assignments/:id" element={<AssignmentDetail />} />
      </Route>

      {/* Protected: admin only */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/assignments" element={<ManageAssignments />} />
        <Route path="/admin/submissions" element={<SubmissionTracker />} />
        <Route path="/admin/groups" element={<AdminGroups />} />
      </Route>

      {/* Root → smart redirect */}
      <Route path="/" element={<RootRedirect />} />
      {/* 404 — any unknown route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
