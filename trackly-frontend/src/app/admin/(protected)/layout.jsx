import Sidebar from '../../../../components/Sidebar';
import AuthGuard from '../../../../components/AuthGuard';

export default function AdminLayout({ children }) {
  return (
    <AuthGuard allowedRoles={['Admin']}>
      <div style={{ display: 'flex' }}>
        <Sidebar role="admin" />
        <main style={{ flexGrow: 1, padding: '20px' }}>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
