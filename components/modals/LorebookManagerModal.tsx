import React, { useState, useEffect } from 'react';
import BaseModal from '../common/BaseModal.tsx';
import { useSettingsUI } from '../../store/ui/useSettingsUI';
import { useActiveChatStore } from '../../store/useActiveChatStore';
import * as dbService from '../../services/dbService';
import { LorebookEntry } from '../../types/settings';
import { BookOpenIcon, PlusIcon, TrashIcon, PencilIcon } from '../common/Icons.tsx';

export const LorebookManagerModal: React.FC = () => {
    const { isLorebookModalOpen, closeLorebookModal } = useSettingsUI();
    const { currentChatSession, updateCurrentChatSession } = useActiveChatStore();

    const [entries, setEntries] = useState<LorebookEntry[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [keysInput, setKeysInput] = useState('');
    const [contextInput, setContextInput] = useState('');

    useEffect(() => {
        if (isLorebookModalOpen && currentChatSession) {
            setEntries(currentChatSession.settings.lorebookEntries || []);
            resetForm();
        }
    }, [isLorebookModalOpen, currentChatSession]);

    const resetForm = () => {
        setEditingId(null);
        setKeysInput('');
        setContextInput('');
    };

    const handleSave = async () => {
        if (!currentChatSession) return;

        const keys = keysInput.split(',').map(k => k.trim()).filter(k => k);
        if (keys.length === 0 || !contextInput.trim()) return;

        let newEntries: LorebookEntry[];
        if (editingId) {
            newEntries = entries.map(e => 
                e.id === editingId ? { ...e, keys, context: contextInput.trim() } : e
            );
        } else {
            const newEntry: LorebookEntry = {
                id: crypto.randomUUID(),
                keys,
                context: contextInput.trim()
            };
            newEntries = [...entries, newEntry];
        }

        setEntries(newEntries);
        
        const updatedSession = {
            ...currentChatSession,
            settings: {
                ...currentChatSession.settings,
                lorebookEntries: newEntries
            }
        };

        updateCurrentChatSession(() => updatedSession);
        await dbService.addOrUpdateChatSession(updatedSession);
        
        resetForm();
    };

    const handleEdit = (entry: LorebookEntry) => {
        setEditingId(entry.id);
        setKeysInput(entry.keys.join(', '));
        setContextInput(entry.context);
    };

    const handleDelete = async (id: string) => {
        if (!currentChatSession) return;

        const newEntries = entries.filter(e => e.id !== id);
        setEntries(newEntries);

        const updatedSession = {
            ...currentChatSession,
            settings: {
                ...currentChatSession.settings,
                lorebookEntries: newEntries
            }
        };

        updateCurrentChatSession(() => updatedSession);
        await dbService.addOrUpdateChatSession(updatedSession);
    };

    if (!isLorebookModalOpen) return null;

    return (
        <BaseModal
            isOpen={isLorebookModalOpen}
            onClose={closeLorebookModal}
            title="Lorebook Manager"
            headerIcon={<BookOpenIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-500" />}
            maxWidth="max-w-3xl"
        >
            <div className="space-y-6">
                <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/10 dark:border-white/10 shadow-sm dark:shadow-none">
                    <h3 className="text-sm font-medium text-indigo-900 dark:text-gray-100 mb-4 flex items-center">
                        {editingId ? <><PencilIcon className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" /> Edit Entry</> : <><PlusIcon className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" /> Add New Entry</>}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-indigo-800 dark:text-gray-300 mb-1">
                                Keywords / Triggers (comma separated)
                            </label>
                            <input
                                type="text"
                                value={keysInput}
                                onChange={(e) => setKeysInput(e.target.value)}
                                placeholder="e.g., The Citadel, magic sword, John Doe"
                                className="w-full px-3 py-2 bg-white/50 dark:bg-transparent border border-indigo-500/20 dark:border-white/10 rounded-md text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder-indigo-400/70 dark:placeholder-gray-500 text-indigo-900 dark:text-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-indigo-800 dark:text-gray-300 mb-1">
                                Context / Definition
                            </label>
                            <textarea
                                value={contextInput}
                                onChange={(e) => setContextInput(e.target.value)}
                                placeholder="Define the lore, background, or facts about these keywords..."
                                rows={4}
                                className="w-full px-3 py-2 bg-white/50 dark:bg-transparent border border-indigo-500/20 dark:border-white/10 rounded-md text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all resize-y placeholder-indigo-400/70 dark:placeholder-gray-500 text-indigo-900 dark:text-gray-200 custom-scrollbar"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingId && (
                                <button
                                    onClick={resetForm}
                                    className="px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-white/5 rounded-md transition-colors bg-white/50 dark:bg-transparent border border-indigo-500/10 dark:border-transparent"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={!keysInput.trim() || !contextInput.trim()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(79,70,229,0.3)] dark:shadow-none"
                            >
                                {editingId ? 'Save Changes' : <><PlusIcon className="w-3.5 h-3.5" /> Add Entry</>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-indigo-900 dark:text-gray-100">
                        Existing Entries ({entries.length})
                    </h3>
                    {entries.length === 0 ? (
                        <p className="text-sm text-indigo-600/70 dark:text-gray-400 text-center py-8 italic">
                            No lorebook entries yet. Add one above!
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {entries.map(entry => (
                                <div key={entry.id} className="bg-white/40 dark:bg-black/20 backdrop-blur-sm p-3 rounded-xl border border-indigo-500/10 dark:border-white/10 flex flex-col gap-2 group shadow-sm dark:shadow-none hover:bg-white/60 dark:hover:bg-black/40 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {entry.keys.map((key, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-indigo-100/50 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 text-xs font-medium rounded-full border border-indigo-200/50 dark:border-indigo-500/20">
                                                    {key}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                className="p-1.5 text-indigo-600/70 hover:text-indigo-700 dark:text-gray-400 dark:hover:text-indigo-400 rounded-md hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                                                title="Edit entry"
                                            >
                                                <PencilIcon className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="p-1.5 text-red-500/70 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-md hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                                                title="Delete entry"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-indigo-900/80 dark:text-gray-300 line-clamp-3">
                                        {entry.context}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    );
};
