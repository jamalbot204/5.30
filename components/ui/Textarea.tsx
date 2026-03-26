import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full p-3 bg-[rgba(255,255,240,0.7)] backdrop-blur-md dark:bg-zinc-800/50 border border-[rgba(38,166,154,0.15)] dark:border-white/10 text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 rounded-3xl focus:ring-2 focus:ring-[#26A69A]/50 focus:border-[#26A69A] dark:focus:ring-emerald-500/50 dark:focus:border-emerald-500 outline-none transition-all text-sm resize-y shadow-[0_8px_32px_rgba(0,0,0,0.02)] dark:shadow-none ${className}`}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
