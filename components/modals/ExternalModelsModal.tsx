import React, { useState } from 'react';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import BaseModal from '../common/BaseModal.tsx';
import { ServerIcon, CheckIcon, PencilIcon, TrashIcon } from '../common/Icons.tsx';
import { useExternalModelsStore } from '../../store/useExternalModelsStore.ts';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { ExternalModel } from '../../types/settings.ts';

const ExternalModelsModal: React.FC = () => {
  const { t } = useTranslation();
  const { isExternalModelsModalOpen, closeExternalModelsModal } = useSettingsUI();
  const { models, activeModelId, addModel, updateModel, deleteModel, setActiveModel } = useExternalModelsStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [modelId, setModelId] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleEdit = (model: ExternalModel) => {
    setEditingId(model.id);
    setDisplayName(model.displayName);
    setModelId(model.modelId);
    setBaseUrl(model.baseUrl);
    setApiKey(model.apiKey);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDisplayName('');
    setModelId('');
    setBaseUrl('');
    setApiKey('');
  };

  const handleSave = async () => {
    if (!displayName || !modelId || !baseUrl) return;

    if (editingId) {
      await updateModel(editingId, { displayName, modelId, baseUrl, apiKey });
    } else {
      await addModel({
        id: crypto.randomUUID(),
        displayName,
        modelId,
        baseUrl,
        apiKey,
      });
    }
    handleCancelEdit();
  };

  return (
    <BaseModal
      isOpen={isExternalModelsModalOpen}
      onClose={closeExternalModelsModal}
      title={t.externalModels}
      headerIcon={<ServerIcon className="w-5 h-5 text-teal-600 dark:text-cyan-400" />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Top Section (List) */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {models.length === 0 ? (
            <div className="text-sm text-teal-600/70 dark:text-gray-400 italic text-center py-4">
              No external models configured.
            </div>
          ) : (
            models.map(model => (
              <div 
                key={model.id} 
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors backdrop-blur-sm ${
                  model.id === activeModelId 
                    ? 'border-teal-500/30 dark:border-cyan-500/50 bg-teal-50/50 dark:bg-cyan-500/10 shadow-[0_2px_8px_rgba(13,148,136,0.1)] dark:shadow-none' 
                    : 'border-teal-500/10 dark:border-white/10 bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/40 shadow-sm dark:shadow-none'
                }`}
              >
                <div>
                  <div className="font-medium text-teal-900 dark:text-gray-200 flex items-center gap-2">
                    {model.displayName}
                    {model.id === activeModelId && (
                      <span className="text-[10px] uppercase tracking-wider bg-teal-100/50 dark:bg-cyan-500/20 text-teal-700 dark:text-cyan-400 px-2 py-0.5 rounded-full border border-teal-500/20 dark:border-transparent">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-teal-600/70 dark:text-gray-500 mt-1 truncate max-w-[200px] sm:max-w-xs">
                    {model.baseUrl}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {model.id !== activeModelId && (
                    <Button 
                      variant="ghost"
                      onClick={() => setActiveModel(model.id)}
                      className="p-1.5 text-teal-600/70 dark:text-gray-400 hover:text-teal-700 dark:hover:text-cyan-400 hover:bg-teal-100/50 dark:hover:bg-cyan-400/10 h-auto bg-white/50 dark:bg-transparent"
                      title="Set Active"
                      icon={<CheckIcon className="w-4 h-4" />}
                    />
                  )}
                  <Button 
                    variant="ghost"
                    onClick={() => handleEdit(model)}
                    className="p-1.5 text-teal-600/70 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-400/10 h-auto bg-white/50 dark:bg-transparent"
                    title={t.edit}
                    icon={<PencilIcon className="w-4 h-4" />}
                  />
                  <Button 
                    variant="ghost"
                    onClick={() => deleteModel(model.id)}
                    className="p-1.5 text-teal-600/70 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-400/10 h-auto bg-white/50 dark:bg-transparent"
                    title={t.delete}
                    icon={<TrashIcon className="w-4 h-4" />}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="h-px bg-teal-500/10 dark:bg-white/10" />

        {/* Bottom Section (Form) */}
        <div className="space-y-4 bg-white/40 dark:bg-black/20 p-4 rounded-xl border border-teal-500/15 dark:border-white/5 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-none">
          <h3 className="text-sm font-medium text-teal-800 dark:text-gray-300">
            {editingId ? t.editModel : t.addModel}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-teal-700/70 dark:text-gray-400">{t.displayName}</label>
              <Input 
                type="text" 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g., Local LM Studio"
                className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 focus:border-teal-500 dark:focus:border-cyan-500 focus:ring-teal-500/50 dark:focus:ring-cyan-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-teal-700/70 dark:text-gray-400">{t.modelId}</label>
              <Input 
                type="text" 
                value={modelId}
                onChange={e => setModelId(e.target.value)}
                placeholder="e.g., llama-3-8b"
                className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 focus:border-teal-500 dark:focus:border-cyan-500 focus:ring-teal-500/50 dark:focus:ring-cyan-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-teal-700/70 dark:text-gray-400">{t.baseUrl}</label>
              <Input 
                type="text" 
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="e.g., http://localhost:1234/v1"
                className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 focus:border-teal-500 dark:focus:border-cyan-500 focus:ring-teal-500/50 dark:focus:ring-cyan-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-teal-700/70 dark:text-gray-400">{t.apiKey} (Optional)</label>
              <Input 
                type="password" 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 focus:border-teal-500 dark:focus:border-cyan-500 focus:ring-teal-500/50 dark:focus:ring-cyan-500/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {editingId && (
              <Button 
                variant="ghost"
                onClick={handleCancelEdit}
                className="bg-white/50 dark:bg-transparent hover:bg-white/80 dark:hover:bg-white/5 text-teal-700 dark:text-gray-300"
              >
                {t.cancelEdit}
              </Button>
            )}
            <Button 
              variant="secondary"
              onClick={handleSave}
              disabled={!displayName || !modelId || !baseUrl}
              className="bg-teal-50/50 dark:bg-cyan-500/20 text-teal-700 dark:text-cyan-400 border border-teal-500/20 dark:border-cyan-500/30 hover:bg-teal-100/50 dark:hover:bg-cyan-500/30 shadow-sm dark:shadow-none"
            >
              {t.save}
            </Button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default ExternalModelsModal;
