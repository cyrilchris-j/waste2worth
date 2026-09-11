import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LayoutDashboard, Package, ArrowLeftRight, FileText, User, ArrowLeft } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/recycler/dashboard',    label: 'Dashboard', icon: LayoutDashboard },
  { path: '/recycler/lots',         label: 'Lots',      icon: Package },
  { path: '/recycler/transactions', label: 'Trades',    icon: ArrowLeftRight },
  { path: '/recycler/reports',      label: 'Reports',   icon: FileText },
  { path: '/recycler/profile',      label: 'Profile',   icon: User },
];

interface RecyclerLayoutProps {
  children: React.ReactNode;
  title?: string;
  backPath?: string;
}

export function RecyclerLayout({ children, title, backPath }: RecyclerLayoutProps) {
  const { userProfile } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center px-4 h-14 gap-3">
          {backPath && (
            <Link to={backPath} className="p-1 -ml-1 text-gray-600 hover:text-gray-900 transition-colors" aria-label="Back">
              <ArrowLeft size={20} />
            </Link>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">
              {title ?? 'Waste2Worth'}
            </h1>
            {userProfile && (
              <p className="text-xs text-gray-500 truncate">{userProfile.name}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 px-2 py-1 rounded-lg hover:bg-gray-100 shrink-0"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Page content — padded above bottom nav */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-30">
        <ul className="flex">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <li key={item.path} className="flex-1">
                <Link
                  to={item.path}
                  className={[
                    'flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors',
                    active ? 'text-brand-700' : 'text-gray-400',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
