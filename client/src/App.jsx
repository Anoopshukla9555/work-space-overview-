import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './auth';

import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import Purpose from './pages/Purpose';
import Dashboard from './pages/Dashboard';
import ContentPage from './pages/ContentPage';


// ============================================================
// PRIVATE ROUTE
// ============================================================

function Private({ children, needOnboarded = true }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (needOnboarded && !user.onboarded) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
}


// ============================================================
// APP
// ============================================================

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>

      {/* ======================================================
          HOME
      ======================================================= */}

      <Route
        path="/"
        element={
          user
            ? <Navigate to="/app" replace />
            : <Landing />
        }
      />


      {/* ======================================================
          AUTH
      ======================================================= */}

      {[
        'login',
        'signup',
        'forgot',
        'reset',
        'verify',
      ].map((mode) => (
        <Route
          key={mode}
          path={`/${mode}`}
          element={<AuthPage mode={mode} />}
        />
      ))}


      {/* ======================================================
          PURPOSE / ONBOARDING
      ======================================================= */}

      <Route
        path="/welcome"
        element={
          <Private needOnboarded={false}>
            <Purpose />
          </Private>
        }
      />


      {/* ======================================================
          MAIN DASHBOARD
      ======================================================= */}

      <Route
        path="/app"
        element={
          <Private>
            <Dashboard />
          </Private>
        }
      />


      {/* ======================================================
          DOCUMENTS
      ======================================================= */}

      <Route
        path="/app/documents"
        element={
          <Private>
            <ContentPage />
          </Private>
        }
      />


      {/* ======================================================
          PHOTOS
      ======================================================= */}

      <Route
        path="/app/photos"
        element={
          <Private>
            <ContentPage />
          </Private>
        }
      />


      {/* ======================================================
          SHAYARI
      ======================================================= */}

      <Route
        path="/app/shayari"
        element={
          <Private>
            <ContentPage />
          </Private>
        }
      />


      {/* ======================================================
          NOTES
      ======================================================= */}

      <Route
        path="/app/notes"
        element={
          <Private>
            <ContentPage />
          </Private>
        }
      />


      {/* ======================================================
          IMPORTANT NOTES ALIAS
      ======================================================= */}

      <Route
        path="/app/important-notes"
        element={
          <Private>
            <ContentPage />
          </Private>
        }
      />


      {/* ======================================================
          FALLBACK
      ======================================================= */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}