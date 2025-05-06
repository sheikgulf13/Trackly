import Sidebar from '../../../../components/SideBar';
import AuthGuard from '../../../../components/AuthGuard';

export default function UserLayout({ children }) {
  return (
    <AuthGuard allowedRoles={['User']}>
      <div style={{ display: 'flex' }}>
        <Sidebar role="user" />
        <main style={{ flexGrow: 1, padding: '20px' }}>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
