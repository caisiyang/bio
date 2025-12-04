import React from 'react';

interface NeuCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const NeuCard: React.FC<NeuCardProps> = ({ children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`bg-[rgba(255,253,251,0.4)] backdrop-blur-xl border border-white/40 shadow-neu rounded-3xl relative ${className}`}
        >
            <div className="absolute inset-0 rounded-3xl pointer-events-none shadow-neu-border opacity-50"></div>
            <div className="relative z-10">{children}</div>
        </div>
    );
};
export default NeuCard;
