import React from 'react';
import { Construction } from 'lucide-react';

const Placeholder = ({ title }) => {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Construction size={40} />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        {title || 'Under Construction'}
      </h1>
      <p className="text-gray-500 max-w-md">
        This module is currently being built. Check back soon for updates to the {title ? title.toLowerCase() : 'this'} section.
      </p>
    </div>
  );
};

export default Placeholder;
