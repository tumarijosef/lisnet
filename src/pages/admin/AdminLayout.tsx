
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Home, Users, Music, DollarSign, Settings, LogOut, PanelLeft, ShieldCheck } from 'lucide-react';
import { cn } from '../../components/ui/button';
import { useState } from 'react';

const AdminLayout = () => {
    // Mock Admin Check
    const user = { role: 'admin' }; // In real app: useAuthStore()

    if (user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        { label: 'Overview', icon: Home, path: '/admin/overview' },
        { label: 'Users', icon: Users, path: '/admin/users' },
        { label: 'Applications', icon: ShieldCheck, path: '/admin/requests' },
        { label: 'Music Library', icon: Music, path: '/admin/library' },
        { label: 'Finance', icon: DollarSign, path: '/admin/finance' },
        { label: 'Settings', icon: Settings, path: '/admin/settings' },
    ];

    return (
        <div className="min-h-screen bg-tg-secondary-bg flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-tg-bg border-r border-tg-hint/10 transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 md:relative",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="p-6 flex items-center gap-3 border-b border-tg-hint/10 h-16">
                    <div className="w-8 h-8 rounded-lg bg-tg-button flex items-center justify-center text-white font-black">
                        L
                    </div>
                    {isSidebarOpen && (
                        <span className="font-bold text-lg tracking-tight animate-in fade-in">Admin Panel</span>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-tg-secondary-bg",
                                isActive ? "bg-tg-button/10 text-tg-button font-medium" : "text-tg-hint"
                            )}
                        >
                            <item.icon size={20} />
                            {isSidebarOpen && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-tg-hint/10">
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 w-full transition-colors">
                        <LogOut size={20} />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto h-screen relative">
                <header className="bg-tg-bg border-b border-tg-hint/10 h-16 px-6 flex items-center justify-between sticky top-0 z-40">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-tg-secondary-bg rounded-lg text-tg-hint transition-colors"
                    >
                        <PanelLeft size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold">Admin Josef</p>
                            <p className="text-xs text-tg-hint">Super Admin</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-tg-button/20"></div>
                    </div>
                </header>

                <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
