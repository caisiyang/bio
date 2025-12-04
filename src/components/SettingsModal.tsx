import React, { useState } from 'react';
import { ProfileData, GistConfig } from '../types';
import { createGist, updateGistData, fetchGistData } from '../services/github';
import NeuButton from './ui/NeuButton';
import { FaTimes, FaSave, FaGithub } from 'react-icons/fa';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    profileData: ProfileData;
    setProfileData: (data: ProfileData) => void;
    gistConfig: GistConfig;
    setGistConfig: (config: GistConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profileData, setProfileData, gistConfig, setGistConfig }) => {
    const [activeTab, setActiveTab] = useState<'storage' | 'profile' | 'projects'>('storage');
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [formData, setFormData] = useState<ProfileData>(profileData);

    React.useEffect(() => { if (isOpen) setFormData(profileData); }, [isOpen, profileData]);

    if (!isOpen) return null;

    const handleSaveToGist = async () => {
        setLoading(true); setStatusMsg('');
        try {
            if (!gistConfig.token) throw new Error("GitHub Token required");
            let targetGistId = gistConfig.gistId;
            if (!targetGistId) {
                setStatusMsg('Creating...'); targetGistId = await createGist(gistConfig.token, formData); setGistConfig({ ...gistConfig, gistId: targetGistId });
            } else {
                setStatusMsg('Updating...'); await updateGistData(targetGistId, gistConfig.token, formData);
            }
            setProfileData(formData); setStatusMsg('Saved!'); setTimeout(() => setStatusMsg(''), 3000);
        } catch (err: any) { setStatusMsg(`Error: ${err.message}`); } finally { setLoading(false); }
    };

    const handleLoadFromGist = async () => {
        setLoading(true); setStatusMsg('Loading...');
        try {
            if (!gistConfig.token || !gistConfig.gistId) throw new Error("Token & ID required");
            const data = await fetchGistData(gistConfig.gistId, gistConfig.token);
            if (data) { setFormData(data); setProfileData(data); setStatusMsg("Loaded!"); } else { setStatusMsg("No data found"); }
        } catch (err: any) { setStatusMsg(`Error: ${err.message}`); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <div className="bg-[#F5EFEA] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border border-white">
                <div className="flex justify-between items-center p-6 border-b border-gray-200/50">
                    <h2 className="text-xl font-bold text-text-main">Settings</h2>
                    <button onClick={onClose} className="p-2 text-text-sub hover:text-text-main"><FaTimes /></button>
                </div>
                <div className="flex gap-2 p-4 px-6">
                    {(['storage', 'profile', 'projects'] as const).map(tab => (
                        <NeuButton key={tab} onClick={() => setActiveTab(tab)} active={activeTab === tab} className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab ? 'text-text-main' : 'text-text-sub'}`}>{tab}</NeuButton>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'storage' && (
                        <div className="space-y-4">
                            <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                <h3 className="font-semibold text-text-main mb-2 flex items-center gap-2"><FaGithub /> GitHub Storage</h3>
                                <div className="space-y-3">
                                    <input type="password" value={gistConfig.token} onChange={(e) => setGistConfig({ ...gistConfig, token: e.target.value })} className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm" placeholder="GitHub Token" />
                                    <input type="text" value={gistConfig.gistId} onChange={(e) => setGistConfig({ ...gistConfig, gistId: e.target.value })} className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm" placeholder="Gist ID" />
                                    <div className="flex gap-3">
                                        <NeuButton onClick={handleSaveToGist} className="flex-1 py-2 text-sm font-semibold">{loading ? '...' : 'Save'}</NeuButton>
                                        <NeuButton onClick={handleLoadFromGist} className="flex-1 py-2 text-sm font-semibold">Load</NeuButton>
                                    </div>
                                    {statusMsg && <p className="text-center text-xs mt-2">{statusMsg}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            <input className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Name" />
                            <div className="flex gap-2">
                                <input className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Bio" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm" value={formData.contactText} onChange={(e) => setFormData({ ...formData, contactText: e.target.value })} placeholder="Btn Text" />
                                <input className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm" value={formData.contactUrl} onChange={(e) => setFormData({ ...formData, contactUrl: e.target.value })} placeholder="Btn URL" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-200/50 flex justify-end gap-3">
                    <NeuButton onClick={() => { setProfileData(formData); onClose(); }} className="px-6 py-2 text-sm font-bold text-text-main"><span className="flex items-center gap-2"><FaSave /> Apply</span></NeuButton>
                </div>
            </div>
        </div>
    );
};
export default SettingsModal;
