'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center gap-2 font-sans font-bold rounded-control transition-all outline-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden';

    const variants = {
      primary:
        'bg-glitch text-frost shadow-glow hover:shadow-glow-strong active:shadow-glow tap-shrink border-2 border-glitch-bright hover:border-frost',
      secondary:
        'bg-void-light text-frost border-2 border-steel-700 hover:border-glitch active:border-glitch-bright tap-shrink',
      ghost:
        'bg-transparent text-frost hover:bg-void-light active:bg-steel-900 tap-shrink',
      danger:
        'bg-alert text-frost shadow-[0_0_20px_rgba(255,59,92,0.3)] hover:shadow-[0_0_30px_rgba(255,59,92,0.5)] active:shadow-[0_0_20px_rgba(255,59,92,0.3)] tap-shrink border-2 border-alert-dim hover:border-alert',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm min-h-[40px]',
      md: 'px-6 py-3 text-base min-h-[52px]',
      lg: 'px-8 py-4 text-lg min-h-[64px]',
      xl: 'px-10 py-5 text-xl min-h-[76px]',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        whileTap={{ scale: 0.97 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
        {...props}
      >
        {/* Glitch effect overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-frost/10 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{
            x: '100%',
            transition: { duration: 0.6, ease: 'easeInOut' },
          }}
        />

        {/* Content */}
        <span className="relative flex items-center justify-center gap-2 z-10">
          {isLoading ? (
            <motion.div
              className="w-5 h-5 border-2 border-frost border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ) : (
            <>
              {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
              {children}
              {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
            </>
          )}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
