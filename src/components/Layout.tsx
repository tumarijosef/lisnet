import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import FloatingPlayer from './FloatingPlayer';

const Layout = () => {
    return (
        <div className="min-h-screen pb-40 bg-[#121212] text-white">
            <main>
                <Outlet />
            </main>
            <FloatingPlayer />
            <BottomNav />
        </div>
    );
};

export default Layout;
