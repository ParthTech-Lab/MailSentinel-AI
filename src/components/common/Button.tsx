import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const base = "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-teal-500 hover:bg-teal-600 text-navy-950 font-semibold shadow-lg shadow-teal-500/20 active:scale-[0.98]",
    secondary: "bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 dark:border-navy-600",
    outline: "border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800",
    danger: "bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-2.5 text-base gap-2.5",
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

