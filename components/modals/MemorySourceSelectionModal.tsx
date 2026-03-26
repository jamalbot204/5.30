import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts'; 
import { useChatListStore } from '../../store/useChatListStore.ts';
import { useActiveChatStore } from '../../store/useActiveChatStore.ts';
import { useDataStore } from '../../store/useDataStore.ts';
import { CloseIcon, CheckIcon, ClipboardDocumentListIcon, UsersIcon, CogIcon, InfoIcon, FlowRightIcon, UserIcon, ArrowPathIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { MEMORY_STRATEGIES } from '../../constants.ts';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Select } from '../ui/Select.tsx';

const MemorySourceSelectionModal: React.FC = memo(() => {
  const { isMemorySourceModalOpen, closeMemorySourceModal, openCustomStrategyModal } = useSettingsUI(); 
  const { chatHistory, loadAllChatsForModals } = useChatListStore();
  const { currentChatSession, updateCurrentChatSession } = useActiveChatStore();
  const { updateSettings, customMemoryStrategies, updateChatPartnerRole } = useDataStore();
  const { t } = useTranslation();

  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);
  const [isPreparingData, setIsPreparingData] = useState(false);
  
  // Advanced Settings State
  const [maxResults, setMaxResults] = useState<number>(15);
  const [minRelevance, setMinRelevance] = useState<number>(0.35);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('companion');
  const [showAdvancedHelp, setShowAdvancedHelp] = useState<string | null>(null);

  // Local state for partner roles to avoid excessive re-renders/DB writes on typing
  const [partnerRoles, setPartnerRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isMemorySourceModalOpen && currentChatSession) {
        const initData = async () => {
            setIsPreparingData(true);
            await loadAllChatsForModals();
            setIsPreparingData(false);
            
            // After loading, initialize selection and roles
            const history = useChatListStore.getState().chatHistory;
            const currentSettings = currentChatSession.settings;
            if (currentSettings.memorySourceChatIds === undefined) {
                setSelectedChatIds(history.map(chat => chat.id));
            } else {
                setSelectedChatIds(currentSettings.memorySourceChatIds);
            }

            const roleMap: Record<string, string> = {};
            history.forEach(c => {
                roleMap[c.id] = c.partnerRole || '';
            });
            setPartnerRoles(roleMap);
        };

        setAreButtonsDisabled(true);
        const timerId = setTimeout(() => {
            setAreButtonsDisabled(false);
        }, 500);

        const currentSettings = currentChatSession.settings;
        setMaxResults(currentSettings.memoryMaxResults ?? 15);
        setMinRelevance(currentSettings.memoryMinRelevance ?? 0.35);
        setSelectedStrategy(currentSettings.memoryQueryStrategy || 'companion');

        initData();

        setSearchTerm('');
        setShowAdvancedHelp(null);
        return () => clearTimeout(timerId);
    }
  }, [isMemorySourceModalOpen, currentChatSession, loadAllChatsForModals]);

  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) return chatHistory;
    return chatHistory.filter(chat => 
        chat.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chatHistory, searchTerm]);

  const handleToggleChat = useCallback((chatId: string) => {
    setSelectedChatIds(prev => 
        prev.includes(chatId) 
            ? prev.filter(id => id !== chatId) 
            : [...prev, chatId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const visibleIds = filteredChats.map(c => c.id);
    setSelectedChatIds(prev => {
        const newSet = new Set([...prev, ...visibleIds]);
        return Array.from(newSet);
    });
  }, [filteredChats]);

  const handleDeselectAll = useCallback(() => {
    const visibleIds = new Set(filteredChats.map(c => c.id));
    setSelectedChatIds(prev => prev.filter(id => !visibleIds.has(id)));
  }, [filteredChats]);

  const handleSave = useCallback(async () => {
    if (!currentChatSession) return;

    const newSettings = {
        ...currentChatSession.settings,
        memorySourceChatIds: selectedChatIds,
        memoryMaxResults: maxResults,
        memoryMinRelevance: minRelevance,
        memoryQueryStrategy: selectedStrategy
    };

    await updateCurrentChatSession(s => s ? ({ ...s, settings: newSettings }) : null);
    
    await updateSettings(currentChatSession.id, newSettings);

    closeMemorySourceModal();
  }, [currentChatSession, selectedChatIds, maxResults, minRelevance, selectedStrategy, updateCurrentChatSession, updateSettings, closeMemorySourceModal]);

  const toggleHelp = (key: string) => {
      setShowAdvancedHelp(prev => prev === key ? null : key);
  };

  const handleMaxResultsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val > 0) {
          setMaxResults(val);
      }
  }, []);

  const handleStrategyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === '__create_new__') {
          openCustomStrategyModal();
          // Keep the current selection until a new one is created and selected later
      } else {
          setSelectedStrategy(val);
      }
  }, [openCustomStrategyModal]);

  const handleRoleChange = useCallback((chatId: string, newValue: string) => {
      setPartnerRoles(prev => ({ ...prev, [chatId]: newValue }));
  }, []);

  const handleRoleBlur = useCallback((chatId: string, newValue: string) => {
      // Find original role to check if changed
      const original = chatHistory.find(c => c.id === chatId)?.partnerRole || '';
      if (newValue.trim() !== original) {
          updateChatPartnerRole(chatId, newValue.trim());
      }
  }, [chatHistory, updateChatPartnerRole]);

  if (!isMemorySourceModalOpen) return null;

  const currentDesc = MEMORY_STRATEGIES[selectedStrategy]?.description || customMemoryStrategies.find(s => s.id === selectedStrategy)?.description;

  return (
    <div 
        className="fixed inset-0 bg-white/30 dark:bg-black/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-source-modal-title"
        onClick={closeMemorySourceModal}
    >
      <div 
        className="bg-white/70 dark:bg-zinc-900 backdrop-blur-xl dark:backdrop-blur-none border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-2xl w-full sm:max-w-xl max-h-[90vh] flex flex-col text-gray-900 dark:text-gray-200 animate-modal-open"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 id="memory-source-modal-title" className="text-xl font-semibold text-teal-900 dark:text-gray-100 flex items-center">
            <ClipboardDocumentListIcon className="w-5 h-5 mr-3 text-teal-600 dark:text-emerald-500" />
            {t.memoryScopeTitle}
          </h2>
          <Button
            variant="ghost"
            onClick={closeMemorySourceModal}
            disabled={areButtonsDisabled}
            className="p-1 rounded-full text-teal-700/70 hover:text-teal-900 dark:text-gray-400 dark:hover:text-white bg-white/50 hover:bg-white/80 dark:bg-transparent dark:hover:bg-white/10"
            aria-label={t.close}
          >
            <CloseIcon className="w-6 h-6" />
          </Button>
        </div>

        <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
            {t.memoryScopeDesc}
        </p>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3 flex-shrink-0">
            <Input 
                type="text" 
                placeholder="Search chats..." 
                className="flex-grow bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 focus:border-teal-500 focus:ring-teal-500/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">
                <Button 
                    variant="primary"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={areButtonsDisabled}
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-[0_4px_12px_rgba(13,148,136,0.3)] dark:shadow-none"
                >
                    {t.selectAll}
                </Button>
                <Button 
                    variant="secondary"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={areButtonsDisabled}
                    className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/5 text-teal-800 dark:text-gray-300"
                >
                    {t.deselectAll}
                </Button>
            </div>
        </div>

        {/* Chat List */}
        <div className="flex-grow min-h-0 overflow-y-auto border border-teal-500/20 dark:border-white/10 rounded-xl bg-white/40 dark:bg-black/20 p-1 custom-scrollbar mb-4 backdrop-blur-sm shadow-inner dark:shadow-none">
            {isPreparingData ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <ArrowPathIcon className="w-8 h-8 text-teal-500 dark:text-emerald-500 animate-spin" />
                    <p className="text-sm text-teal-600 dark:text-emerald-400 font-medium animate-pulse">Loading full history...</p>
                </div>
            ) : filteredChats.length === 0 ? (
                <p className="text-center text-teal-700/70 dark:text-gray-500 py-8 italic">{t.noChatsFound}</p>
            ) : (
                <div className="space-y-1">
                    {filteredChats.map(chat => {
                        const isSelected = selectedChatIds.includes(chat.id);
                        const isCurrent = currentChatSession?.id === chat.id;
                        return (
                            <div 
                                key={chat.id} 
                                className={`flex items-center p-2 rounded-lg transition-colors group ${isSelected ? 'bg-teal-50/80 dark:bg-emerald-900/20 hover:bg-teal-100/80 dark:hover:bg-emerald-900/30' : 'hover:bg-white/60 dark:hover:bg-white/5'}`}
                            >
                                <div className="flex items-center flex-grow min-w-0 cursor-pointer" onClick={() => !areButtonsDisabled && handleToggleChat(chat.id)}>
                                    <div className={`w-5 h-5 flex items-center justify-center border rounded mr-3 flex-shrink-0 transition-colors ${isSelected ? 'bg-teal-600 border-teal-500 dark:bg-emerald-600 dark:border-emerald-500' : 'border-slate-300 dark:border-gray-600 bg-white/50 dark:bg-transparent'}`}>
                                        {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center">
                                            <p className={`text-sm truncate font-medium ${isSelected ? 'text-teal-800 dark:text-emerald-200' : 'text-slate-700 dark:text-gray-300'}`}>
                                                {chat.title}
                                            </p>
                                            {chat.isCharacterModeActive && <UsersIcon className="w-3.5 h-3.5 ml-2 text-teal-500 dark:text-emerald-500 flex-shrink-0" />}
                                            {isCurrent && <span className="ml-2 text-[10px] bg-teal-100 dark:bg-emerald-900/50 text-teal-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-teal-200 dark:border-emerald-500/30 uppercase tracking-wider font-bold">{t.current}</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-gray-500 truncate">
                                            {new Date(chat.lastUpdatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Partner Role Input - Only visible if selected */}
                                {isSelected && (
                                    <div className="flex items-center ml-2 flex-shrink-0 bg-white/60 dark:bg-black/40 rounded-lg p-1 border border-teal-500/20 dark:border-purple-500/30 backdrop-blur-sm">
                                        <UserIcon className="w-3 h-3 text-teal-600 dark:text-purple-400 mr-1.5" />
                                        <input
                                            type="text"
                                            value={partnerRoles[chat.id] || ''}
                                            onChange={(e) => handleRoleChange(chat.id, e.target.value)}
                                            onBlur={(e) => handleRoleBlur(chat.id, e.target.value)}
                                            placeholder="Role (e.g. Boss)"
                                            className="w-24 bg-transparent text-xs text-teal-800 dark:text-emerald-200 placeholder-teal-600/50 dark:placeholder-emerald-500/50 focus:outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Strategy Selection (Steerable RAG) */}
        <div className="pt-4 border-t border-teal-500/20 dark:border-white/10 flex-shrink-0 mb-4">
            <h3 className="text-sm font-semibold text-teal-900 dark:text-gray-300 mb-2 flex items-center">
                <FlowRightIcon className="w-4 h-4 mr-2 text-teal-600/60 dark:text-gray-400" />
                {t.memoryStrategy}
            </h3>
            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-teal-500/20 dark:border-white/5 backdrop-blur-sm shadow-sm dark:shadow-none">
                <Select
                    value={selectedStrategy}
                    onChange={handleStrategyChange}
                    className="mb-2 bg-white/60 dark:bg-transparent border-teal-500/20 dark:border-white/10 focus:border-teal-500 focus:ring-teal-500/50"
                >
                    <optgroup label="Built-in Strategies">
                        {Object.entries(MEMORY_STRATEGIES).map(([key, strategy]) => (
                            <option key={key} value={key}>{strategy.label}</option>
                        ))}
                    </optgroup>
                    
                    {customMemoryStrategies.length > 0 && (
                        <optgroup label="Custom Strategies">
                            {customMemoryStrategies.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </optgroup>
                    )}

                    <option value="__create_new__" className="font-bold text-teal-600 dark:text-emerald-400">+ Create Custom...</option>
                </Select>
                <p className="text-xs text-teal-700/80 dark:text-emerald-300 italic">
                    {currentDesc}
                </p>
            </div>
        </div>

        {/* Advanced Settings Section */}
        <div className="pt-2 border-t border-teal-500/20 dark:border-white/10 flex-shrink-0">
            <h3 className="text-sm font-semibold text-teal-900 dark:text-gray-300 mb-3 flex items-center">
                <CogIcon className="w-4 h-4 mr-2 text-teal-600/60 dark:text-gray-400" />
                {t.advancedSearchSettings}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Result Count Input */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-slate-600 dark:text-gray-400 flex items-center">
                            {t.maxResults}
                            <Button variant="ghost" onClick={() => toggleHelp('count')} className="ml-1 p-0.5 h-auto w-auto text-teal-600/60 hover:text-teal-800 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none bg-white/50 hover:bg-white/80 dark:bg-transparent dark:hover:bg-white/5">
                                <InfoIcon className="w-3.5 h-3.5" />
                            </Button>
                        </label>
                    </div>
                    {showAdvancedHelp === 'count' && <p className="text-[10px] text-slate-500 dark:text-gray-500 mb-2 bg-white/60 dark:bg-black/20 p-1.5 rounded-lg border border-slate-500/20 dark:border-white/5 backdrop-blur-sm">{t.maxResultsDesc}</p>}
                    <Input 
                        type="number" 
                        min={1} 
                        step={1}
                        value={maxResults}
                        onChange={handleMaxResultsChange}
                        placeholder="e.g., 50"
                        className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 focus:border-teal-500 focus:ring-teal-500/50"
                    />
                </div>

                {/* Relevance Threshold Slider */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-slate-600 dark:text-gray-400 flex items-center">
                            {t.minRelevance}
                            <Button variant="ghost" onClick={() => toggleHelp('relevance')} className="ml-1 p-0.5 h-auto w-auto text-teal-600/60 hover:text-teal-800 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none bg-white/50 hover:bg-white/80 dark:bg-transparent dark:hover:bg-white/5">
                                <InfoIcon className="w-3.5 h-3.5" />
                            </Button>
                        </label>
                        <span className="text-xs font-bold text-teal-600 dark:text-emerald-300">{minRelevance.toFixed(2)}</span>
                    </div>
                    {showAdvancedHelp === 'relevance' && <p className="text-[10px] text-slate-500 dark:text-gray-500 mb-2 bg-white/60 dark:bg-black/20 p-1.5 rounded-lg border border-slate-500/20 dark:border-white/5 backdrop-blur-sm">{t.minRelevanceDesc}</p>}
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05"
                        value={minRelevance}
                        onChange={(e) => setMinRelevance(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500 dark:accent-emerald-500"
                    />
                </div>
            </div>
        </div>

        <div className="mt-6 flex justify-between items-center flex-shrink-0">
            <span className="text-xs text-slate-500 dark:text-gray-400">
                {selectedChatIds.length} {t.chatsSelected}
            </span>
            <div className="flex gap-3">
                <Button 
                    variant="secondary"
                    onClick={closeMemorySourceModal}
                    disabled={areButtonsDisabled || isPreparingData}
                    className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/5 text-teal-800 dark:text-gray-300"
                >
                    {t.cancel}
                </Button>
                <Button 
                    variant="primary"
                    onClick={handleSave}
                    disabled={areButtonsDisabled || isPreparingData}
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-[0_4px_12px_rgba(13,148,136,0.3)] dark:shadow-none"
                >
                    {t.save}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
});

export default MemorySourceSelectionModal;