import { Outlet, useLocation } from 'react-router-dom';
import { BottomTab } from './BottomTab';
import { TopMenu } from './TopMenu';

const hideTabBarPaths = ['/login', '/signup', '/chat/'];
const hideTopMenuPaths = ['/login', '/signup'];

export function Layout() {
  const location = useLocation();
  const path = location.pathname;

  const shouldHideTabBar = hideTabBarPaths.some(p => path.startsWith(p));
  const shouldHideTopMenu = hideTopMenuPaths.some(p => path.startsWith(p));

  return (
    <div className="h-full flex flex-col bg-background w-full">
      {!shouldHideTopMenu && <TopMenu />}
      <main className="flex-1 overflow-y-auto no-scrollbar w-full">
        <Outlet />
      </main>
      {!shouldHideTabBar && <BottomTab />}
    </div>
  );
}