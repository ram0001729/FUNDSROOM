import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = '', size = 'md', to = '/' }) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const iconSize = isSmall ? 'w-7 h-7 text-sm' : isLarge ? 'w-11 h-11 text-2xl' : 'w-9 h-9 text-lg';
  const titleSize = isSmall ? 'text-lg' : isLarge ? 'text-2xl' : 'text-xl';
  const subSize = isSmall ? 'text-[8px] tracking-[0.15em]' : isLarge ? 'text-[10px] tracking-[0.2em]' : 'text-[9px] tracking-[0.18em]';

  const logoContent = (
    <div className={`flex items-center gap-2.5 font-['Plus_Jakarta_Sans',sans-serif] select-none ${className}`}>
      {/* Branded Icon Mark */}
      <div className={`${iconSize} rounded-xl bg-gradient-to-tr from-[#1B512D] via-[#166534] to-[#e34234] flex items-center justify-center text-white font-black shadow-md shadow-emerald-900/15 group-hover:scale-105 transition-transform`}>
        D
      </div>
      
      {/* Typography Logo */}
      <div className="flex flex-col text-left">
        <span className={`${titleSize} font-black tracking-tight leading-none`}>
          <span className="text-[#e34234]">Distribu</span>
          <span className="text-[#1B512D]">Core</span>
        </span>
        <span className={`${subSize} font-extrabold uppercase text-[#1B512D]/80 block mt-0.5`}>
          Business Platform
        </span>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block group">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default Logo;
