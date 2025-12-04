import React, { useState, useEffect } from 'react';
import { ProfileData, GistConfig } from './types';
import { DEFAULT_PROFILE } from './constants';
import NeuCard from './components/ui/NeuCard';
import NeuButton from './components/ui/NeuButton';
import IconDisplay from './components/ui/IconDisplay';
import SettingsModal from './components/SettingsModal';
import { FaCog } from 'react-icons/fa';

const App: React.FC = () => {
    const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [gistConfig, setGistConfig] = useState<GistConfig>({ token: '', gistId: '' });

    useEffect(() => {
        const savedConfig = localStorage.getItem('neu_gist_config');
        if (savedConfig) setGistConfig(JSON.parse(savedConfig));
    }, []);

    useEffect(() => {
        localStorage.setItem('neu_gist_config', JSON.stringify(gistConfig));
    }, [gistConfig]);

    return (
        <div className="min-h-screen w-full flex flex-col items-center py-10 px-4 sm:px-0 font-sans text-text-main relative">
            <div className="w-full max-w-sm flex flex-col items-center">
                <NeuCard className="w-full p-6 flex flex-col items-center text-center mb-8">
                    <div className="flex items-center w-full gap-5 mb-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/50 shadow-inner">
                                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="flex flex-col items-start">
                            <h1 className="text-xl font-bold text-text-main leading-tight">{profile.name}</h1>
                            <p className="text-sm text-text-sub mt-1">{profile.title}</p>
                        </div>
                    </div>
                    <a href={profile.contactUrl} className="w-full block">
                        <NeuButton className="w-full py-4 text-text-main font-bold text-sm tracking-wide">{profile.contactText}</NeuButton>
                    </a>
                </NeuCard>

                <div className="grid grid-cols-4 gap-4 w-full mb-10">
                    {profile.socials.map((social) => (
                        <a key={social.id} href={social.url} target="_blank" rel="noopener noreferrer">
                            <NeuButton className="w-full aspect-square rounded-2xl text-xl text-text-main hover:text-gray-800"><IconDisplay type={social.platform} /></NeuButton>
                        </a>
                    ))}
                </div>

                <div className="w-full mb-10">
                    <h2 className="text-lg font-bold text-text-main mb-5 pl-1">Recent Projects</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {profile.projects.map((project) => (
                            <a key={project.id} href={project.link || '#'} target="_blank" rel="noopener noreferrer" className="block">
                                <NeuCard className="p-3 h-full flex flex-col transition-transform hover:-translate-y-1">
                                    <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-gray-200">
                                        <img src={project.image} alt={project.title} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <h3 className="font-semibold text-xs text-text-main leading-tight mt-auto">{project.title}</h3>
                                </NeuCard>
                            </a>
                        ))}
                    </div>
                </div>

                <footer className="w-full mt-auto mb-8 flex flex-col items-center">
                    <p className="text-xs text-text-sub">© {new Date().getFullYear()} {profile.name}</p>
                    <div className="w-32 h-1.5 bg-text-main/10 rounded-full mt-6"></div>
                </footer>
            </div>

            <div className="fixed bottom-6 right-6 z-40">
                <NeuButton onClick={() => setIsSettingsOpen(true)} className="w-12 h-12 rounded-full flex items-center justify-center text-text-sub hover:text-text-main"><FaCog size={20} /></NeuButton>
            </div>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} profileData={profile} setProfileData={setProfile} gistConfig={gistConfig} setGistConfig={setGistConfig} />
        </div>
    );
};
export default App;
