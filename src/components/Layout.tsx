import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Topbar from './Topbar';
import FloatingPlayer from './FloatingPlayer';

const Layout = () => {
    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col">
            {/* Desktop Topbar */}
            <div className="hidden md:block">
                <Topbar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 pt-0 md:pt-16 relative">
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
