import React, { useState, useEffect, memo, useCallback } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore.ts';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { useActiveChatStore } from '../../store/useActiveChatStore.ts';
import { AICharacter } from '../../types.ts';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Textarea } from '../ui/Textarea.tsx';
import { CloseIcon, PencilIcon, TrashIcon, InfoIcon, UsersIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';

const CharacterManagementModal: React.FC = memo(() => {
  const { currentChatSession } = useActiveChatStore();
  const { addCharacter, editCharacter, deleteCharacter } = useCharacterStore();
  const { isCharacterManagementModalOpen, closeCharacterManagementModal, openCharacterContextualInfoModal } = useSettingsUI();
  const { t } = useTranslation();

  const [editingCharacter, setEditingCharacter] = useState<AICharacter | null>(null);
  const [newCharName, setNewCharName] = useState('');
  const [newCharInstruction, setNewCharInstruction] = useState('');
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);

  const characters = currentChatSession?.aiCharacters || [];

  useEffect(() => {
    if (isCharacterManagementModalOpen) {
      setAreButtonsDisabled(true);
      const timerId = setTimeout(() => {
          setAreButtonsDisabled(false);
      }, 500);

      setEditingCharacter(null);
      setNewCharName('');
      setNewCharInstruction('');
      return () => clearTimeout(timerId);
    }
  }, [isCharacterManagementModalOpen]);

  const handleSave = useCallback(() => {
    if (editingCharacter) {
      editCharacter(editingCharacter.id, newCharName, newCharInstruction);
    } else {
      addCharacter(newCharName, newCharInstruction);
    }
    setNewCharName('');
    setNewCharInstruction('');
    setEditingCharacter(null);
  }, [editingCharacter, newCharName, newCharInstruction, editCharacter, addCharacter]);
  
  const startEdit = useCallback((char: AICharacter) => {
    setEditingCharacter(char);
    setNewCharName(char.name);
    setNewCharInstruction(char.systemInstruction);
  }, []);

  if (!isCharacterManagementModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 dark:bg-black/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={closeCharacterManagementModal}>
      <div className="bg-white/70 dark:bg-zinc-900 backdrop-blur-xl dark:backdrop-blur-none border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col text-gray-900 dark:text-gray-200 overflow-hidden animate-modal-open" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-semibold flex items-center text-teal-900 dark:text-gray-100">
            <UsersIcon className="w-6 h-6 mr-3 text-teal-600 dark:text-fuchsia-400" />
            {t.manageCharacters}
          </h2>
          <Button variant="ghost" onClick={closeCharacterManagementModal} disabled={areButtonsDisabled} className="p-1 rounded-full h-auto text-teal-700/70 hover:text-teal-900 dark:text-gray-400 dark:hover:text-white bg-white/50 hover:bg-white/80 dark:bg-transparent dark:hover:bg-white/10" aria-label={t.close} icon={<CloseIcon />} />
        </div>

        <div className="flex-grow min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-4">
            {characters.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-teal-600/20 dark:border-gray-700 rounded-xl bg-white/40 dark:bg-transparent backdrop-blur-sm">
                    <p className="text-teal-700/70 dark:text-gray-400 italic">{t.noCharacters}</p>
                </div>
            )}
            {characters.map(char => (
                <div key={char.id} className="relative p-3 rounded-r-xl rounded-l-md border border-slate-500/20 dark:border-white/10 border-l-4 border-l-slate-500 bg-gradient-to-r from-slate-50/50 dark:from-fuchsia-500/5 to-transparent flex justify-between items-center group transition hover:bg-white/60 dark:hover:bg-white/5 backdrop-blur-sm shadow-sm dark:shadow-none">
                    <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-800 dark:text-fuchsia-200">{char.name}</p>
                        <p className="text-xs text-slate-600 dark:text-gray-400 truncate" title={char.systemInstruction}>{char.systemInstruction}</p>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0">
                        <Button variant="ghost" disabled={areButtonsDisabled} onClick={() => openCharacterContextualInfoModal(char)} className="p-1.5 text-teal-700/70 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-300 bg-white/50 dark:bg-black/20 hover:bg-sky-50 dark:hover:bg-sky-500/20 h-auto shadow-sm dark:shadow-none" title={t.contextualInfoFor} icon={<InfoIcon className="w-4 h-4"/>} />
                        <Button variant="ghost" disabled={areButtonsDisabled} onClick={() => startEdit(char)} className="p-1.5 text-teal-700/70 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300 bg-white/50 dark:bg-black/20 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 h-auto shadow-sm dark:shadow-none" title={t.edit} icon={<PencilIcon className="w-4 h-4"/>} />
                        <Button variant="ghost" disabled={areButtonsDisabled} onClick={() => deleteCharacter(char.id)} className="p-1.5 text-teal-700/70 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-300 bg-white/50 dark:bg-black/20 hover:bg-red-50 dark:hover:bg-red-500/20 h-auto shadow-sm dark:shadow-none" title={t.delete} icon={<TrashIcon className="w-4 h-4"/>} />
                    </div>
                </div>
            ))}
        </div>
        
        <div className="border-t border-teal-500/20 dark:border-white/10 pt-4 flex-shrink-0 bg-white/40 dark:bg-[rgba(13,15,24,0.3)] -mx-6 px-6 pb-4 backdrop-blur-md">
          <h3 className="text-md font-semibold text-teal-900 dark:text-gray-300 mb-3 flex items-center">
             <PencilIcon className="w-4 h-4 mr-2 text-teal-600 dark:text-fuchsia-400" />
             {editingCharacter ? t.editCharacter : t.addNewCharacter}
          </h3>
          
          <div className="space-y-3">
            <div>
                <Input 
                    type="text" 
                    disabled={areButtonsDisabled}
                    placeholder={t.characterName}
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    aria-label={t.characterName}
                    className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 focus:border-teal-500 focus:ring-teal-500/50"
                />
            </div>
            <div>
                <Textarea 
                    disabled={areButtonsDisabled}
                    placeholder={t.characterInstruction}
                    value={newCharInstruction}
                    onChange={(e) => setNewCharInstruction(e.target.value)}
                    rows={3}
                    aria-label={t.characterInstruction}
                    className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 focus:border-teal-500 focus:ring-teal-500/50"
                />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            {editingCharacter && <Button variant="secondary" disabled={areButtonsDisabled} onClick={() => { setEditingCharacter(null); setNewCharName(''); setNewCharInstruction('');}} className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/5 text-teal-800 dark:text-gray-300">{t.cancelEdit}</Button>}
            <Button 
                variant="primary"
                onClick={handleSave} 
                disabled={areButtonsDisabled || !newCharName.trim() || !newCharInstruction.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-[0_4px_12px_rgba(13,148,136,0.3)] dark:shadow-none"
            >
                {editingCharacter ? t.saveChanges : t.addCharacter}
            </Button>
          </div>
        </div>

        <div className="flex justify-end flex-shrink-0 border-t border-teal-500/20 dark:border-white/10 pt-4 mt-0">
          <Button variant="secondary" onClick={closeCharacterManagementModal} disabled={areButtonsDisabled} className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/5 text-teal-800 dark:text-gray-300">{t.close}</Button>
        </div>
      </div>
    </div>
  );
});

export default CharacterManagementModal;