import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '@/App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import Portfolio from '@/pages/Portfolio';
import AddProject from '@/pages/AddProject';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminLogin from '@/pages/AdminLogin';
import { clearAdminPassword, getAdminPassword, hasAdminPassword, setupAdminAxiosInterceptor } from '@/lib/adminAuth';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'https://ahance.onrender.com').replace(/\/$/, '');
const API = `${BACKEND_URL}/api`;

function ProtectedAdminRoute({ isAuthenticated, children }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <AdminLogin redirectPath={location.pathname} />;
  }

  return children;
}

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(hasAdminPassword());

  useEffect(() => {
    const syncAuthState = () => setIsAdminAuthenticated(hasAdminPassword());

    const validateStoredSession = async () => {
      if (!hasAdminPassword()) {
        syncAuthState();
        return;
      }

      try {
        await axios.get(`${API}/admin/auth-check`, {
          headers: {
            'x-admin-password': getAdminPassword(),
          },
        });
        syncAuthState();
      } catch {
        clearAdminPassword();
        syncAuthState();
      }
    };

    setupAdminAxiosInterceptor({
      onUnauthorized: () => {
        syncAuthState();
        toast.error('Acesso administrativo expirou. Faça login novamente.');
      }
    });

    window.addEventListener('admin-auth-changed', syncAuthState);
    window.addEventListener('storage', syncAuthState);
    validateStoredSession();

    return () => {
      window.removeEventListener('admin-auth-changed', syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute isAuthenticated={isAdminAuthenticated}>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/add-project"
            element={
              <ProtectedAdminRoute isAuthenticated={isAdminAuthenticated}>
                <AddProject />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/edit-project/:id"
            element={
              <ProtectedAdminRoute isAuthenticated={isAdminAuthenticated}>
                <AddProject />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        richColors
        toastOptions={{
          style: {
            background: '#fffeec',
            color: '#000',
            border: '1px solid #e38e4d'
          }
        }}
      />
    </div>
  );
}

export default App;