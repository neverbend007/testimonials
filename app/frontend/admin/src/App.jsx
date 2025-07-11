import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Testimonials from './pages/Testimonials';
import Users from './pages/Users';
import { Widgets } from './pages/Widgets';
import ApiKeys from './pages/ApiKeys';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/testimonials" replace />} />
          <Route
            path="/testimonials"
            element={
              <ProtectedRoute>
                <Layout>
                  <Testimonials />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/widgets"
            element={
              <ProtectedRoute>
                <Layout>
                  <Widgets />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-keys"
            element={
              <ProtectedRoute>
                <Layout>
                  <ApiKeys />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;