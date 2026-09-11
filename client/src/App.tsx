import { Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Sparkles } from 'lucide-react';

/**
 * Landing router: sends each role to its home workspace.
 * Customers → dashboard, agents/admins → agent dashboard.
 */
export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-canvas">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brass-400">
            <Sparkles size={14} className="text-paper" />
          </div>
          <div className="h-3 w-3 animate-pulse-soft rounded-full bg-brass-400" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'CUSTOMER' ? '/dashboard' : '/agent-dashboard'} replace />;
}
