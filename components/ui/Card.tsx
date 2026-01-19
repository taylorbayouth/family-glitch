'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glass' | 'void';
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, className, variant = 'default', hoverable = false, ...props },
    ref
  ) => {
    const variants = {
      default:
        'bg-void-light border-2 border-steel-800 shadow-void',
      glass:
        'glass border-steel-700',
      void: 'bg-void border border-steel-900',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-card p-6',
          variants[variant],
          hoverable &&
            'transition-all hover:border-glitch hover:shadow-glow cursor-pointer',
          className
        )}
        whileHover={
          hoverable
            ? {
                scale: 1.02,
                transition: {
                  type: 'spring',
                  stiffness: 400,
                  damping: 17,
                },
              }
            : undefined
        }
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
