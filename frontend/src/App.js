import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChoreList from './pages/ChoreList';
import ChoreDetail from './pages/ChoreDetail';
import CreateChore from './pages/CreateChore';
import UserProfile from './pages/UserProfile';
import Notifications from './pages/Notifications';
import InternetControl from './pages/InternetControl';

// Components
import Layout from './components/Layout';

// Context
import { useAuth } from './contexts/AuthContext';

// PrivateRoute component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// ParentRoute component - only accessible to parents
const ParentRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (user?.role !== 'parent') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/chores" element={
            <PrivateRoute>
              <Layout>
                <ChoreList />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/chores/:id" element={
            <PrivateRoute>
              <Layout>
                <ChoreDetail />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/create-chore" element={
            <ParentRoute>
              <Layout>
                <CreateChore />
              </Layout>
            </ParentRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Layout>
                <UserProfile />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute>
              <Layout>
                <Notifications />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/internet-control" element={
            <ParentRoute>
              <Layout>
                <InternetControl />
              </Layout>
            </ParentRoute>
          } />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;