import React from 'react';

interface AdContainerProps {
  children: React.ReactNode;
  position: 'header' | 'footer' | 'sidebar' | 'content' | 'mobile';
  className?: string;
}

export const AdContainer: React.FC<AdContainerProps> = ({
  children,
  position,
  className = ''
}) => {
  const getContainerClasses = () => {
    const baseClasses = 'ad-container';
    
    switch (position) {
      case 'header':
        return `${baseClasses} w-full py-2 border-b border-gray-100 bg-gray-50/50 max-h-[90px] overflow-hidden`;
      case 'footer':
        return `${baseClasses} w-full py-4 border-t border-gray-100 bg-gray-50/50`;
      case 'sidebar':
        return `${baseClasses} sticky top-20 space-y-4`;
      case 'content':
        return `${baseClasses} my-8 py-4 border-y border-gray-100`;
      case 'mobile':
        return `${baseClasses} block md:hidden py-3`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className={`${getContainerClasses()} ${className}`}>
      <div className="text-xs text-gray-400 text-center mb-2 uppercase tracking-wide">
        Advertisement
      </div>
      {children}
    </div>
  );
};