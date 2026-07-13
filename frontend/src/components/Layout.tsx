import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { 
  LayoutDashboard, 
  History, 
  Terminal, 
  LogOut, 
  Bell, 
  Shield, 
  User as UserIcon,
  CircleAlert
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch recent notifications via React Query
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    enabled: !!user,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Historial (Event Store)', path: '/events', icon: History },
    { name: 'Simulador', path: '/simulator', icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col justify-between p-4">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-4 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                EventBoard
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                Event Bus Monitor
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-400 border-l-2 border-indigo-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-indigo-400' : 'text-slate-400'
                  }`} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-3 h-2 w-2 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        {user && (
          <div className="border-t border-slate-800 pt-4 mt-auto">
            <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-900/30 mb-2">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <UserIcon className="h-5 w-5 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs text-slate-200 truncate">{user.name}</h4>
                <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 font-semibold text-xs"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-8 z-30">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <span>Sistema</span>
            <span>/</span>
            <span className="text-slate-200 capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Connection Status Badge */}
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CloudAMQP Conectado
            </div>

            {/* Notifications Alert Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  refetch();
                }}
                className={`p-2.5 rounded-xl border transition-all duration-200 relative ${
                  showNotifications
                    ? 'bg-slate-800 border-indigo-500 text-indigo-400'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-rose-500 rounded-full border-2 border-slate-950 text-[10px] font-extrabold flex items-center justify-center text-white animate-bounce">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown menu */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-3 w-96 max-h-[480px] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h3 className="font-bold text-sm text-slate-200">Alertas Recientes</h3>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase">
                        {notifications.length} Activas
                      </span>
                    </div>

                    <div className="space-y-2 divide-y divide-slate-800/40">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6">No hay alertas críticas reportadas.</p>
                      ) : (
                        notifications.map((notif: any) => (
                          <div key={notif.id} className="pt-2 flex gap-3 first:pt-0">
                            <CircleAlert className={`h-5 w-5 shrink-0 ${
                              notif.eventLog?.severity === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-300 leading-tight">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-slate-500 mt-1 block font-medium">
                                {new Date(notif.createdAt).toLocaleTimeString()} - Módulo: {notif.eventLog?.sourceModule}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto animate-slide-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
