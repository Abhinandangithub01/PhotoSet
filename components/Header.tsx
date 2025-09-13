import React from 'react';
import { SparklesIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="flex items-center space-x-3 p-4 bg-black/10">
      <SparklesIcon className="w-8 h-8 text-fuchsia-400" />
      <h1 className="text-2xl font-bold tracking-tight text-white">BrandSpark</h1>
    </header>
  );
};

export default Header;