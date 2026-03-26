import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', icon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>}
      <input
        ref={ref}
        className={`w-full bg-[rgba(255,255,240,0.7)] backdrop-blur-md dark:bg-zinc-800/50 border border-[rgba(38,166,154,0.15)] dark:border-white/10 text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 rounded-3xl focus:ring-2 focus:ring-[#26A69A]/50 focus:border-[#26A69A] dark:focus:ring-emerald-500/50 dark:focus:border-emerald-500 outline-none transition-all text-sm disabled:opacity-50 shadow-[0_8px_32px_rgba(0,0,0,0.02)] dark:shadow-none ${icon ? 'pl-10' : 'p-2.5'} ${className}`}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';
