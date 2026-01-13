import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from './Loading';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitialized, isLoading } = useSelector((state) => state.auth);

  // Wait for auth check to complete before redirecting
  // This prevents redirect loops and ensures we have accurate auth state
  if (!isInitialized || isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
