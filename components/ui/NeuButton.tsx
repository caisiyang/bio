import React from 'react';

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  className?: string;
}

const NeuButton: React.FC<NeuButtonProps> = ({ children, active, className = '', ...props }) => {
  return (
    <button
      className={`
        relative overflow-hidden
        transition-all duration-200 ease-in-out
        border border-white/40
        rounded-2xl
        ${active 
          ? 'shadow-neu-pressed bg-transparent transform scale-[0.98]' 
          : 'shadow-neu bg-[rgba(255,253,251,0.4)] hover:-translate-y-0.5'
        }
        ${className}
      `}
      {...props}
    >
      <div className={`relative z-10 flex items-center justify-center w-full h-full`}>
        {children}
      </div>
    </button>
  );
};

export default NeuButton;