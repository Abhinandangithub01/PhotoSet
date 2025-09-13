import React, { useState } from 'react';
import Header from './components/Header';
import { CameraIcon, MegaphoneIcon } from './components/Icons';
import PhotoShootPage from './pages/PhotoShootPage';
import MarketingPage from './pages/MarketingPage';

type Page = 'photoshoot' | 'marketing';

function App() {
  const [activePage, setActivePage] = useState<Page>('photoshoot');

  const NavItem = ({ page, label, icon }: { page: Page; label: string; icon: React.ReactNode }) => {
    const isActive = activePage === page;
    return (
    <li>
      <button
        onClick={() => setActivePage(page)}
        className={`flex flex-col items-center justify-center space-y-2 p-3 w-full rounded-lg transition-colors duration-200 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 group ${
          isActive ? 'text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <div className={`p-2 rounded-lg transition-colors duration-200 ${isActive ? 'bg-fuchsia-500/90' : 'bg-gray-800/80 group-hover:bg-gray-700/80'}`}>
         {icon}
        </div>
        <span className="font-semibold">{label}</span>
      </button>
    </li>
  )};

  return (
    <div className="min-h-screen font-sans">
      <Header />
      <div className="flex max-w-screen-2xl mx-auto">
        <nav className="w-28 p-4 pt-6 space-y-4">
          <ul>
            <NavItem
              page="photoshoot"
              label="Photo Shoot"
              icon={<CameraIcon className="w-6 h-6" />}
            />
            <NavItem
              page="marketing"
              label="Marketing"
              icon={<MegaphoneIcon className="w-6 h-6" />}
            />
          </ul>
        </nav>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {activePage === 'photoshoot' && <PhotoShootPage />}
          {activePage === 'marketing' && <MarketingPage />}
        </main>
      </div>
    </div>
  );
}

export default App;