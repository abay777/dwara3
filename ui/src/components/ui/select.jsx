import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({ children, value, onChange, defaultValue }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative" onClick={() => setIsOpen(!isOpen)}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { isOpen, setIsOpen, value, onChange })
      )}
    </div>
  );
};

export const SelectTrigger = ({ children, className = "", isOpen }) => {
  return (
    <button 
      className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md border shadow-sm
        focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300
        ${className}`}
    >
      {children}
      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
    </button>
  );
};

export const SelectContent = ({ children, isOpen, setIsOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute z-50 w-full mt-1 bg-white rounded-md border border-blue-100 shadow-lg py-1"
      onClick={() => setIsOpen(false)}
    >
      {children}
    </div>
  );
};

export const SelectItem = ({ children, value, onChange }) => {
  return (
    <div 
      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
      onClick={() => onChange?.(value)}
    >
      {children}
    </div>
  );
};

export const SelectValue = ({ children, placeholder }) => {
  return (
    <span className="text-sm text-gray-700">
      {children || placeholder}
    </span>
  );
};