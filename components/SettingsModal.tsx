import React, { useState } from 'react';
import { ProfileData, GistConfig, IconType } from '../types';
import { createGist, updateGistData, fetchGistData } from '../services/github';
import { generateBio } from '../services/gemini';
import NeuButton from './ui/NeuButton';
import { FaTimes, FaSave, FaGithub, FaMagic, FaPlus, FaTrash } from 'react-icons/fa';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  setProfileData: (data: ProfileData) => void;
  gistConfig: GistConfig;
  setGistConfig: (config: GistConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profileData,
  setProfileData,
  gistConfig,
  setGistConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'storage' | 'profile' | 'projects'>('storage');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [geminiKey, setGeminiKey] = useState(process.env.API_KEY || '');
  const [isGenerating, setIsGenerating] = useState(false);

  // Local state for editing form (to avoid constant re-renders on parent)
  const [formData, setFormData] = useState<ProfileData>(profileData);
  // Sync when opening
  React.useEffect(() => {
    if (isOpen) setFormData(profileData);
  }, [isOpen, profileData]);

  if (!isOpen) return null;

  const handleSaveToGist = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      if (!gistConfig.token) {
        throw new Error("GitHub Token is required");
      }

      let targetGistId = gistConfig.gistId;

      if (!targetGistId) {
        // Create new
        setStatusMsg('Creating new Gist...');
        targetGistId = await createGist(gistConfig.token, formData);
        setGistConfig({ ...gistConfig, gistId: targetGistId });
      } else {
        // Update existing
        setStatusMsg('Updating Gist...');
        await updateGistData(targetGistId, gistConfig.token, formData);
      }

      setProfileData(formData);
      setStatusMsg('Saved successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromGist = async () => {
     setLoading(true);
     setStatusMsg('Loading...');
     try {
       if(!gistConfig.token || !gistConfig.gistId) throw new Error("Token and Gist ID required");
       const data = await fetchGistData(gistConfig.gistId, gistConfig.token);
       if(data) {
         setFormData(data);
         setProfileData(data);
         setStatusMsg("Loaded!");
       } else {
         setStatusMsg("Could not find valid data in Gist");
       }
     } catch(err: any) {
        setStatusMsg(`Error: ${err.message}`);
     } finally {
        setLoading(false);
     }
  };

  const handleAiRewrite = async () => {
    setIsGenerating(true);
    try {
      if (!geminiKey) throw new Error("Enter Gemini API Key first");
      const newTitle = await generateBio(geminiKey, formData.title);
      setFormData(prev => ({ ...prev, title: newTitle }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSocial = () => {
    setFormData(prev => ({
      ...prev,
      socials: [...prev.socials, { id: Date.now().toString(), platform: IconType.Web, url: '' }]
    }));
  };

  const handleRemoveSocial = (id: string) => {
    setFormData(prev => ({
      ...prev,
      socials: prev.socials.filter(s => s.id !== id)
    }));
  };

  const handleAddProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { id: Date.now().toString(), title: 'New Project', image: 'https://picsum.photos/200', link: '' }]
    }));
  };

  const handleRemoveProject = (id: string) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-[#F5EFEA] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border border-white">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200/50">
          <h2 className="text-xl font-bold text-text-main">Settings</h2>
          <button onClick={onClose} className="p-2 text-text-sub hover:text-text-main transition">
            <FaTimes />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 px-6">
          {(['storage', 'profile', 'projects'] as const).map(tab => (
             <NeuButton
              key={tab}
              onClick={() => setActiveTab(tab)}
              active={activeTab === tab}
              className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab ? 'text-text-main' : 'text-text-sub'}`}
             >
               {tab}
             </NeuButton>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                <h3 className="font-semibold text-text-main mb-2 flex items-center gap-2">
                  <FaGithub /> GitHub Gist Storage
                </h3>
                <p className="text-xs text-text-sub mb-4">
                  To save your profile, create a "Classic" Personal Access Token on GitHub with <code>gist</code> scope.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-text-sub uppercase mb-1">GitHub Token</label>
                    <input 
                      type="password"
                      value={gistConfig.token}
                      onChange={(e) => setGistConfig({...gistConfig, token: e.target.value})}
                      className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                      placeholder="ghp_..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-sub uppercase mb-1">Gist ID (Optional if creating new)</label>
                    <input 
                      type="text"
                      value={gistConfig.gistId}
                      onChange={(e) => setGistConfig({...gistConfig, gistId: e.target.value})}
                      className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                      placeholder="Existing Gist ID..."
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <NeuButton onClick={handleSaveToGist} className="flex-1 py-2 text-sm font-semibold">
                      {loading ? 'Processing...' : 'Save / Create Gist'}
                    </NeuButton>
                    <NeuButton onClick={handleLoadFromGist} className="flex-1 py-2 text-sm font-semibold">
                      Load Data
                    </NeuButton>
                  </div>
                  {statusMsg && <p className="text-center text-xs font-medium text-text-main mt-2">{statusMsg}</p>}
                </div>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                <h3 className="font-semibold text-text-main mb-2 flex items-center gap-2">
                   ✨ Gemini AI (Optional)
                </h3>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">Gemini API Key</label>
                <input 
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="For AI rewriting..."
                />
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-text-sub uppercase mb-1">Display Name</label>
                  <input 
                    className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-text-sub uppercase mb-1">Avatar URL</label>
                  <input 
                    className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm"
                    value={formData.avatar}
                    onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-text-sub uppercase mb-1">Title / Bio</label>
                  <div className="flex gap-2">
                    <input 
                      className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                    <NeuButton 
                      className="w-10 flex items-center justify-center text-purple-500"
                      onClick={handleAiRewrite}
                      disabled={isGenerating}
                    >
                      {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div> : <FaMagic />}
                    </NeuButton>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-text-sub uppercase mb-1">Main Button Text</label>
                    <input 
                      className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm"
                      value={formData.contactText}
                      onChange={(e) => setFormData({...formData, contactText: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-text-sub uppercase mb-1">Main Button URL</label>
                    <input 
                      className="w-full bg-white/50 border border-white rounded-lg p-2 text-sm"
                      value={formData.contactUrl}
                      onChange={(e) => setFormData({...formData, contactUrl: e.target.value})}
                    />
                 </div>
               </div>

               <div className="pt-4 border-t border-gray-200/50">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-text-main text-sm">Social Icons</h3>
                    <NeuButton onClick={handleAddSocial} className="w-8 h-8 rounded-full text-xs"><FaPlus /></NeuButton>
                 </div>
                 <div className="grid gap-3">
                   {formData.socials.map((social) => (
                     <div key={social.id} className="flex gap-2 items-center">
                        <select 
                          className="bg-white/50 border border-white rounded-lg p-2 text-sm w-32"
                          value={social.platform}
                          onChange={(e) => {
                            const newSocials = formData.socials.map(s => s.id === social.id ? {...s, platform: e.target.value} : s);
                            setFormData({...formData, socials: newSocials});
                          }}
                        >
                          {Object.values(IconType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input 
                           className="flex-1 bg-white/50 border border-white rounded-lg p-2 text-sm"
                           value={social.url}
                           placeholder="URL"
                           onChange={(e) => {
                             const newSocials = formData.socials.map(s => s.id === social.id ? {...s, url: e.target.value} : s);
                             setFormData({...formData, socials: newSocials});
                           }}
                        />
                        <button onClick={() => handleRemoveSocial(social.id)} className="text-red-400 hover:text-red-600 p-2"><FaTrash size={12}/></button>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'projects' && (
             <div className="space-y-4">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-text-main text-sm">Projects</h3>
                  <NeuButton onClick={handleAddProject} className="px-3 py-1 text-xs font-bold">Add Project</NeuButton>
               </div>
               {formData.projects.map((proj) => (
                 <div key={proj.id} className="bg-white/40 p-3 rounded-xl border border-white/60 flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                      <img src={proj.image} alt="thumb" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input 
                        className="w-full bg-white/50 border border-white rounded-lg p-1 px-2 text-sm font-semibold"
                        value={proj.title}
                        onChange={(e) => {
                          const newProjs = formData.projects.map(p => p.id === proj.id ? {...p, title: e.target.value} : p);
                          setFormData({...formData, projects: newProjs});
                        }}
                        placeholder="Project Title"
                      />
                      <input 
                        className="w-full bg-white/50 border border-white rounded-lg p-1 px-2 text-xs"
                        value={proj.image}
                        onChange={(e) => {
                          const newProjs = formData.projects.map(p => p.id === proj.id ? {...p, image: e.target.value} : p);
                          setFormData({...formData, projects: newProjs});
                        }}
                        placeholder="Image URL"
                      />
                      <input 
                        className="w-full bg-white/50 border border-white rounded-lg p-1 px-2 text-xs"
                        value={proj.link}
                        onChange={(e) => {
                          const newProjs = formData.projects.map(p => p.id === proj.id ? {...p, link: e.target.value} : p);
                          setFormData({...formData, projects: newProjs});
                        }}
                        placeholder="Link URL"
                      />
                    </div>
                    <button onClick={() => handleRemoveProject(proj.id)} className="text-red-400 self-start p-1"><FaTrash size={12}/></button>
                 </div>
               ))}
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/50 flex justify-end gap-3">
          <NeuButton onClick={onClose} className="px-6 py-2 text-sm text-text-sub">Cancel</NeuButton>
          <NeuButton onClick={() => {
             setProfileData(formData);
             onClose();
          }} className="px-6 py-2 text-sm font-bold text-text-main">
             <span className="flex items-center gap-2"><FaSave /> Apply Local Changes</span>
          </NeuButton>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;