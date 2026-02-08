import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import FloatingPlayer from './FloatingPlayer';

const Layout = () => {
    return (
        <div className="min-h-screen bg-[#121212] text-white flex">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 shrink-0">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <main className="flex-1 w-full max-w-5xl mx-auto pb-40 md:pb-32">
                    <Outlet />
                </main>

                <FloatingPlayer />

                {/* Mobile Bottom Nav */}
                <div className="md:hidden">
                    <BottomNav />
                </div>
            </div>
        </div>
    );
};

export default Layout;
