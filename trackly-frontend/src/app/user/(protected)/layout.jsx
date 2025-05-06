import Sidebar from '../../../../components/SideBar';
import AuthGuard from '../../../../components/AuthGuard';
import { SocketProvider } from '../../../../src/contexts/SocketContext';
import { Toaster } from 'react-hot-toast';

export default function UserLayout({ children }) {
  return (
    <AuthGuard allowedRoles={['User']}>
      <SocketProvider>
        <div className="h-screen flex overflow-hidden bg-gray-50">
          <Sidebar role="user" />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <Toaster />
        </div>
      </SocketProvider>
    </AuthGuard>
  );
}
