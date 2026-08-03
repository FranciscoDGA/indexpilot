'use client';

import React from 'react';

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
  }
>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
      outline: 'border border-input bg-background hover:bg-accent text-foreground focus:ring-primary',
      ghost: 'hover:bg-accent text-foreground focus:ring-primary',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
