import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * ProtectedRoute
 * - Redirects unauthenticated users to /login
 * - If adminOnly=true, redirects non-admins to /dashboard
 */
export default function ProtectedRoute({ adminOnly = false }) {
  const { currentUser, isAdmin } = useAuth()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
