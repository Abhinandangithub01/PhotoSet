
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './Icons';

interface SelectorProps {
  label: string;
  options: string[];
  selectedOption: string;
  onSelectOption: (option: string) => void;
}

const Selector: React.FC<SelectorProps> = ({ label, options, selectedOption, onSelectOption }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: string) => {
    onSelectOption(option);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center bg-gray-700 border border-gray-600 rounded-md shadow-sm px-4 py-2 text-left text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
      >
        <span>{selectedOption}</span>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {options.map((option) => (
            <li
              key={option}
              onClick={() => handleSelect(option)}
              className="text-gray-200 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-700"
            >
              <span className="font-normal block truncate">{option}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Selector;
