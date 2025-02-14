import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({ children, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md border shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value || 'Select an option'}
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-fit mt-1 bg-white rounded-md border border-blue-100 shadow-lg py-1">
          {React.Children.map(children, (child) => 
            React.cloneElement(child, { onSelect: (val) => { onChange(val); setIsOpen(false); } })
          )}
        </div>
      )}
    </div>
  );
};

export const SelectItem = ({ children, value, onSelect }) => {
  return (
    <div 
      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
      onClick={() => onSelect(value)}
    >
      {children}
    </div>
  );
};
