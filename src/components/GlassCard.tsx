import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  glowColor?: 'cyan' | 'pink' | 'green' | 'amber' | 'purple' | 'none';
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  glowColor = 'none', 
  className = '', 
  onClick 
}) => {
  const glowClasses = {
    cyan: 'border-glow-cyan',
    pink: 'border-glow-pink',
    green: 'border-glow-green',
    amber: 'border-glow-amber',
    purple: 'border-glow-cyan', // Map to cyan or custom purple if declared
    none: ''
  };

  const activeGlow = glowClasses[glowColor] || '';

  return (
    <div 
      onClick={onClick}
      className={`glass-panel ${activeGlow} ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
