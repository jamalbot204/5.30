import React, { useState, useEffect, memo, useCallback } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore.ts';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { CloseIcon, InfoIcon } from '../common/Icons.tsx';
import useAutoResizeTextarea from '../../hooks/useAutoResizeTextarea.ts';
import { Button } from '../ui/Button.tsx';
import { Textarea } from '../ui/Textarea.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';

const CharacterContextualInfoModal: React.FC = memo(() => {
  const { saveContextualInfo } = useCharacterStore();
  const { isContextualInfoModalOpen, editingCharacterForContextualInfo, closeCharacterContextualInfoModal } = useSettingsUI();
  const { t } = useTranslation();
  
  const [infoText, setInfoText] = useState('');
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);
  const textareaRef = useAutoResizeTextarea<HTMLTextAreaElement>(infoText, 250);

  useEffect(() => {
    if (isContextualInfoModalOpen) {
        setAreButtonsDisabled(true);
        const timerId = setTimeout(() => {
            setAreButtonsDisabled(false);
        }, 500);

        if (editingCharacterForContextualInfo) {
            setInfoText(editingCharacterForContextualInfo.contextualInfo || '');
        }
        return () => clearTimeout(timerId);
    }
  }, [isContextualInfoModalOpen, editingCharacterForContextualInfo]);

  useEffect(() => {
    if (isContextualInfoModalOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isContextualInfoModalOpen, textareaRef]);

  const handleSave = useCallback(() => {
    if (!editingCharacterForContextualInfo) return;
    saveContextualInfo(editingCharacterForContextualInfo.id, infoText);
    closeCharacterContextualInfoModal();
  }, [editingCharacterForContextualInfo, saveContextualInfo, infoText, closeCharacterContextualInfoModal]);
  
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInfoText(e.target.value);
  }, []);

  if (!isContextualInfoModalOpen || !editingCharacterForContextualInfo) return null;

  return (
    <div className="fixed inset-0 bg-white/30 dark:bg-black/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contextual-info-modal-title"
        onClick={closeCharacterContextualInfoModal}
    >
      <div className="bg-white/70 dark:bg-zinc-900 backdrop-blur-xl dark:backdrop-blur-none border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col text-gray-900 dark:text-gray-200 animate-modal-open" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 id="contextual-info-modal-title" className="text-xl font-semibold flex items-center text-teal-900 dark:text-gray-100">
            <InfoIcon className="w-5 h-5 mr-3 text-teal-600 dark:text-emerald-500" />
            {t.contextualInfoFor} <span className="text-teal-700 dark:text-emerald-400 ml-2">{editingCharacterForContextualInfo.name}</span>
          </h2>
          <Button variant="ghost" onClick={closeCharacterContextualInfoModal} disabled={areButtonsDisabled} className="p-1 rounded-full text-teal-700/70 hover:text-teal-900 dark:text-gray-400 dark:hover:text-white bg-white/50 hover:bg-white/80 dark:bg-transparent dark:hover:bg-white/10" aria-label={t.close}><CloseIcon /></Button>
        </div>
        
        {/* Editor Card */}
        <div className="relative p-4 rounded-r-xl rounded-l-md border border-slate-500/20 dark:border-white/10 border-l-4 border-l-slate-500 bg-gradient-to-r from-slate-50/50 dark:from-emerald-500/5 to-transparent flex-grow flex flex-col min-h-0 mb-4 backdrop-blur-sm shadow-sm dark:shadow-none">
            <p className="text-xs text-slate-700 dark:text-gray-400 mb-3">
                {t.contextualInfoDesc}
            </p>
            <Textarea
                ref={textareaRef}
                placeholder={t.contextualPromptPlaceholder}
                value={infoText}
                onChange={handleTextChange}
                rows={8}
                className="hide-scrollbar resize-y flex-grow bg-white/50 dark:bg-transparent border-slate-500/20 dark:border-white/10 focus:border-slate-500 focus:ring-slate-500/50"
                style={{ minHeight: '150px' }}
                aria-label={`Contextual information for ${editingCharacterForContextualInfo.name}`}
            />
        </div>

        <div className="flex justify-end space-x-3 flex-shrink-0">
          <Button variant="secondary" onClick={closeCharacterContextualInfoModal} disabled={areButtonsDisabled} className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/5 text-teal-800 dark:text-gray-300">{t.cancel}</Button>
          <Button variant="primary" onClick={handleSave} disabled={areButtonsDisabled} className="bg-teal-600 hover:bg-teal-700 text-white shadow-[0_4px_12px_rgba(13,148,136,0.3)] dark:shadow-none">
            {t.saveInfo}
          </Button>
        </div>
      </div>
    </div>
  );
});

export default CharacterContextualInfoModal;