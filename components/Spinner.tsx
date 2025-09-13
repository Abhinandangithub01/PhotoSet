
import React from 'react';

const Spinner: React.FC = () => {
  // FIX: Reduced spinner size and border to fit better in buttons and placeholders.
  return (
    <div className="border-2 border-gray-600 border-t-blue-500 rounded-full w-6 h-6 animate-spin"></div>
  );
};

export default Spinner;