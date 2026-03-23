import { Toaster as ToasterUI } from "@/components/ui/toaster"
import { Toaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const PUBLIC_PAGES = ['Home', 'FindProperties', 'Login', 'ResetPassword', 'PropertyDetails'];

// Pages that require verification (logged-in but unverified → redirect to verification)
const VERIFIED_PAGES = [
  'HostDashboard', 'GuestDashboard', 'HostProfile', 'GuestProfile', 'ReferralDashboard',
];

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, isVerified, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // For public pages, we might want to still show the page but keep the error state
      // However, usually we just want to ensure the specific route logic handles it.
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Pages.Login />} />
      <Route path="/reset-password" element={<Pages.ResetPassword />} />
      
      {/* Home Route */}
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />

      {/* Dynamic Routes */}
      {Object.entries(Pages).filter(([path]) => path !== 'Login' && path !== 'ResetPassword').map(([path, Page]) => {
        const isPublic = PUBLIC_PAGES.includes(path);
        const requiresVerification = VERIFIED_PAGES.includes(path);
        
        let element;
        if (isPublic || isAuthenticated) {
          if (isAuthenticated && requiresVerification && !isVerified) {
            // Logged in but not verified — redirect to verification tab in settings
            element = <Navigate to="/Settings?tab=verification" replace />;
          } else {
            element = (
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            );
          }
        } else {
          element = <Navigate to="/login" replace />;
        }

        return (
          <Route
            key={path}
            path={`/${path}`}
            element={element}
          />
        );
      })}
      
      <Route path="/oauth-callback" element={<Pages.OAuthCallback />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};



function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <ToasterUI />
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
