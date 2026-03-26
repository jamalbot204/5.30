import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils.ts';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'none';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  className, variant = 'secondary', size = 'md', icon, isLoading, children, disabled, ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-95";
  
  const variants = {
    primary: "bg-[#26A69A] hover:bg-[#208d82] text-white shadow-[0_8px_32px_rgba(38,166,154,0.2)] hover:shadow-[0_8px_32px_rgba(38,166,154,0.4)] dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-sm dark:hover:shadow-md dark:hover:shadow-emerald-500/20",
    secondary: "bg-[rgba(255,255,240,0.7)] backdrop-blur-md border border-[rgba(38,166,154,0.15)] text-slate-800 hover:bg-[rgba(255,255,240,0.85)] shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:border-white/5 dark:shadow-none",
    danger: "bg-red-50/80 backdrop-blur-md text-red-700 hover:bg-red-100/80 border border-red-200/50 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 dark:border-red-500/20",
    ghost: "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-[rgba(38,166,154,0.1)] dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10",
    outline: "bg-transparent border border-[rgba(38,166,154,0.3)] text-slate-700 hover:bg-[rgba(38,166,154,0.05)] dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5",
    destructive: "bg-red-500 hover:bg-red-600 text-white shadow-[0_8px_32px_rgba(239,68,68,0.2)] dark:bg-red-600 dark:hover:bg-red-500 dark:shadow-sm",
    link: "bg-transparent text-[#26A69A] dark:text-emerald-400 hover:underline p-0 h-auto"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-full",
    md: "px-4 py-2 text-sm rounded-full",
    lg: "px-5 py-2.5 text-base rounded-full",
    icon: "w-9 h-9 flex items-center justify-center rounded-full p-0",
    none: ""
  };

  return (
    <button ref={ref} disabled={disabled || isLoading} className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      ) : icon ? (
        <span className={children ? "mr-2" : ""}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
});
Button.displayName = 'Button';
