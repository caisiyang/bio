import React from 'react';
import { FaInstagram, FaLinkedinIn, FaTwitter, FaEnvelope, FaGithub, FaYoutube, FaGlobe, FaMediumM } from 'react-icons/fa';
import { IconType } from '../../types';

interface IconDisplayProps { type: string; className?: string; }

const IconDisplay: React.FC<IconDisplayProps> = ({ type, className = '' }) => {
    switch (type.toLowerCase()) {
        case IconType.Instagram: return <FaInstagram className={className} />;
        case IconType.LinkedIn: return <FaLinkedinIn className={className} />;
        case IconType.Twitter: return <FaTwitter className={className} />;
        case IconType.Email: return <FaEnvelope className={className} />;
        case IconType.GitHub: return <FaGithub className={className} />;
        case IconType.YouTube: return <FaYoutube className={className} />;
        case IconType.Web: return <FaGlobe className={className} />;
        case IconType.Medium: return <FaMediumM className={className} />;
        default: return <FaGlobe className={className} />;
    }
};
export default IconDisplay;
