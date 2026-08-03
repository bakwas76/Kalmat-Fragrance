import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

const FULL_BLEED = ['/', '/collections'];

export default function SiteLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const fullBleed = FULL_BLEED.some((p) => p === pathname || (p !== '/' && pathname.startsWith(p)));

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <SiteHeader />
      <main className={`flex-1 ${fullBleed ? '' : 'pt-16 lg:pt-[72px]'}`}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
