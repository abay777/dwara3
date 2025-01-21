import React from 'react';

export const Checkbox = ({ 
  checked, 
  onChange,
  className = "",
  ...props 
}) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`h-4 w-4 rounded border-blue-100 text-blue-600 
        focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 
        transition-colors cursor-pointer
        ${className}`}
      {...props}
    />
  );
};