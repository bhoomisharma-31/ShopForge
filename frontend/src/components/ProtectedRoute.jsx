import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500">You need administrator privileges to view this page.</p>
        <a href="/" className="btn-primary">Go Home</a>
      </div>
    );
  }

  return children;
}
