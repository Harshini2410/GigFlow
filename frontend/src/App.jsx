import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './store/slices/authSlice';
import { addNotification } from './store/slices/notificationSlice';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import socket from './utils/socket';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GigFeed from './pages/GigFeed';
import GigDetails from './pages/GigDetails';
import CreateGig from './pages/CreateGig';
import Dashboard from './pages/Dashboard';

function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isInitialized } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is authenticated on mount (auth rehydration)
    // This runs on every page refresh to restore auth state from HttpOnly cookie
    // A 401 response is expected if no valid cookie exists - this is normal
    dispatch(getCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Join user's personal room for notifications
      socket.emit('join', `user_${user._id}`);

      // Listen for hire notifications
      socket.on('hired', (data) => {
        dispatch(
          addNotification({
            message: data.message,
            gigId: data.gigId,
            gigTitle: data.gigTitle,
          })
        );
      });

      return () => {
        socket.off('hired');
        socket.emit('leave', `user_${user._id}`);
      };
    }
  }, [isAuthenticated, user, dispatch]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/gigs" /> : <Login />} 
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/gigs" /> : <Register />}
        />
        <Route path="/gigs" element={<GigFeed />} />
        <Route path="/gigs/:id" element={<GigDetails />} />
        <Route
          path="/gigs/create"
          element={
            <ProtectedRoute>
              <CreateGig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
