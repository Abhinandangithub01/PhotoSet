
import React from 'react';
import { CameraIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="flex items-center space-x-3 p-4 border-b border-gray-700">
      <CameraIcon className="w-8 h-8 text-blue-400" />
      <h1 className="text-2xl font-bold tracking-tight text-white">PhotoSet Pro</h1>
    </header>
  );
};

export default Header;
