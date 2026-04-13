import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

// Lazy-loaded pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CustomerListPage = lazy(() => import('../pages/customers/CustomerListPage'));
const CustomerCreatePage = lazy(() => import('../pages/customers/CustomerCreatePage'));
const CustomerDetailPage = lazy(() => import('../pages/customers/CustomerDetailPage'));
const QuoteListPage = lazy(() => import('../pages/quotes/QuoteListPage'));
const QuoteCreatePage = lazy(() => import('../pages/quotes/QuoteCreatePage'));
const QuoteDetailPage = lazy(() => import('../pages/quotes/QuoteDetailPage'));
const CustomerEditPage = lazy(() => import('../pages/customers/CustomerEditPage'));
const QuoteEditPage = lazy(() => import('../pages/quotes/QuoteEditPage'));
const UserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'));
const LookupManagementPage = lazy(() => import('../pages/admin/LookupManagementPage'));
const AuditLogPage = lazy(() => import('../pages/admin/AuditLogPage'));
const TransferPage = lazy(() => import('../pages/admin/TransferPage'));
const ReportsPage = lazy(() => import('../pages/admin/ReportsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Lazy-loaded layout
const AppLayout = lazy(() => import('../components/layout/AppLayout'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/',
    element: (
      <SuspenseWrapper>
        <ProtectedRoute />
      </SuspenseWrapper>
    ),
    children: [
      {
        element: (
          <SuspenseWrapper>
            <AppLayout />
          </SuspenseWrapper>
        ),
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <DashboardPage />
              </SuspenseWrapper>
            ),
          },
          // Musteriler
          {
            path: 'musteriler',
            element: (
              <SuspenseWrapper>
                <CustomerListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'musteriler/yeni',
            element: (
              <SuspenseWrapper>
                <CustomerCreatePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'musteriler/:id',
            element: (
              <SuspenseWrapper>
                <CustomerDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'musteriler/:id/duzenle',
            element: (
              <SuspenseWrapper>
                <CustomerEditPage />
              </SuspenseWrapper>
            ),
          },
          // Teklifler
          {
            path: 'teklifler',
            element: (
              <SuspenseWrapper>
                <QuoteListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'teklifler/yeni',
            element: (
              <SuspenseWrapper>
                <QuoteCreatePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'teklifler/:id',
            element: (
              <SuspenseWrapper>
                <QuoteDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'teklifler/:id/duzenle',
            element: (
              <SuspenseWrapper>
                <QuoteEditPage />
              </SuspenseWrapper>
            ),
          },
          // Admin routes
          {
            element: <AdminRoute />,
            children: [
              {
                path: 'kullanicilar',
                element: (
                  <SuspenseWrapper>
                    <UserManagementPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'liste-yonetimi',
                element: (
                  <SuspenseWrapper>
                    <LookupManagementPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'loglar',
                element: (
                  <SuspenseWrapper>
                    <AuditLogPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'devir',
                element: (
                  <SuspenseWrapper>
                    <TransferPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'raporlar',
                element: (
                  <SuspenseWrapper>
                    <ReportsPage />
                  </SuspenseWrapper>
                ),
              },
            ],
          },
          // Profil
          {
            path: 'profil',
            element: (
              <SuspenseWrapper>
                <ProfilePage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
    ],
  },
  // 404
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },
]);
