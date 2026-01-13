import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import Button from './Button';

const Layout = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <nav className="border-b border-dark-800 bg-dark-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-accent-teal to-accent-cyan bg-clip-text text-transparent">
                GigFlow
              </span>
            </Link>

            <div className="flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/gigs"
                    className="text-gray-300 hover:text-accent-teal transition-colors"
                  >
                    Browse Gigs
                  </Link>
                  <Link
                    to="/dashboard"
                    className="text-gray-300 hover:text-accent-teal transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/gigs/create"
                    className="text-gray-300 hover:text-accent-teal transition-colors"
                  >
                    Post Gig
                  </Link>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400 text-sm">{user?.name}</span>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
};

export default Layout;
