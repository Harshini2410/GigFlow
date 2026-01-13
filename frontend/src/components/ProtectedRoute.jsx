import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from './Loading';

// ProtectedRoute MUST behave EXACTLY like this:
// - If authLoading → render loader (wait for auth check)
// - If !authLoading && !isAuthenticated → redirect to /login
// - Otherwise → render children
// NO shortcuts. NO assumptions.
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useSelector((state) => state.auth);

  // Wait for auth check to complete before making decisions
  // This prevents redirect loops and ensures we have accurate auth state
  if (authLoading) {
    return <Loading />;
  }

  // Only redirect if auth check is complete AND user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
