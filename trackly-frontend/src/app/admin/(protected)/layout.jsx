import Sidebar from '../../../../components/Sidebar';
import AuthGuard from '../../../../components/AuthGuard';

export default function AdminLayout({ children }) {
  return (
    <AuthGuard allowedRoles={['Admin']}>
      <div className="h-screen flex overflow-hidden bg-gray-50">
        <Sidebar role="admin" />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
