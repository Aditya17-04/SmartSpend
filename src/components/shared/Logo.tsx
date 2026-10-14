import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 36, className = '' }: LogoProps) {
  const cornerRadius = Math.max(8, Math.round(size * 0.28));
  const fontSize = Math.round(size * 0.58);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: cornerRadius,
      }}
      className={`bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 flex items-center justify-center font-black text-white shadow-lg shadow-violet-500/25 flex-shrink-0 select-none ${className}`}
    >
      <span
        style={{
          fontSize,
          lineHeight: 1,
          fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
        }}
        className="font-extrabold tracking-tight"
      >
        S
      </span>
    </div>
  );
}

export default Logo;
