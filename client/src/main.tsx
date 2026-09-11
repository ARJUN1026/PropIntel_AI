import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { AppShell } from './components/AppShell';
import { ToastHost } from './components/ui';
import './index.css';

import { LoginPage, RegisterPage } from './pages/Auth';
import { BrowsePage } from './pages/Browse';
import { PropertyDetailPage } from './pages/PropertyDetail';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { SavedPage } from './pages/Saved';
import { VisitsPage } from './pages/Visits';
import { AssistantPage } from './pages/Assistant';
import { AgentDashboard } from './pages/AgentDashboard';
import { LeadsPage } from './pages/Leads';
import { LeadDetailPage } from './pages/LeadDetail';
import { ConversationsPage } from './pages/Conversations';
import { AnalyticsPage } from './pages/Analytics';
import { AdminPropertiesPage } from './pages/AdminProperties';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="flex min-h-[100dvh] items-center justify-center bg-canvas">
                <div className="h-8 w-8 animate-pulse-soft rounded-full bg-brass-400" />
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<AppShell />}>
                <Route path="/" element={<App />} />

                {/* Customer */}
                <Route path="/dashboard" element={<RequireAuth><CustomerDashboard /></RequireAuth>} />
                <Route path="/browse" element={<RequireAuth><BrowsePage /></RequireAuth>} />
                <Route path="/property/:id" element={<RequireAuth><PropertyDetailPage /></RequireAuth>} />
                <Route path="/saved" element={<RequireAuth><SavedPage /></RequireAuth>} />
                <Route path="/visits" element={<RequireAuth><VisitsPage /></RequireAuth>} />
                <Route path="/assistant" element={<RequireAuth><AssistantPage /></RequireAuth>} />

                {/* Admin workspace */}
                <Route path="/leads" element={<RequireAuth roles={['ADMIN']}><LeadsPage /></RequireAuth>} />
                <Route path="/leads/:id" element={<RequireAuth roles={['ADMIN']}><LeadDetailPage /></RequireAuth>} />
                <Route path="/conversations" element={<RequireAuth roles={['ADMIN']}><ConversationsPage /></RequireAuth>} />
                <Route path="/analytics" element={<RequireAuth roles={['ADMIN']}><AnalyticsPage /></RequireAuth>} />
                <Route path="/agent-dashboard" element={<RequireAuth roles={['ADMIN']}><AgentDashboard /></RequireAuth>} />

                {/* Admin */}
                <Route path="/properties-admin" element={<RequireAuth roles={['ADMIN']}><AdminPropertiesPage /></RequireAuth>} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <ToastHost />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
