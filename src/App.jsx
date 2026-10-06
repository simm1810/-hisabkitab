import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import JoinTrip from './pages/JoinTrip';
import TripDetail from './pages/TripDetail';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const { init, loading, initialized } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!initialized || loading) return <SplashScreen />;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#0f766e',
            color: '#fff',
            borderRadius: '12px',
            fontWeight: 500,
            lineHeight: 1.45,
            maxWidth: 'min(92vw, 420px)',
          },
          success: { iconTheme: { primary: '#fff', secondary: '#0f766e' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/join/:code" element={<JoinTrip />} />
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/create-trip"
          element={
            <ProtectedRoute>
              <CreateTrip />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip/:tripId"
          element={
            <ProtectedRoute>
              <TripDetail />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
