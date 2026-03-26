import React, { useState, useEffect, useCallback, memo } from 'react';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { useActiveChatStore } from '../../store/useActiveChatStore.ts';
import { useSettingsPersistence } from '../../hooks/useSettingsPersistence.ts';
import { ShieldCheckIcon, CheckIcon, ClipboardDocumentListIcon, UserIcon } from '../common/Icons.tsx';
import BaseModal from '../common/BaseModal.tsx';
import { Button } from '../ui/Button.tsx';
import { Switch } from '../ui/Switch.tsx';
import { Textarea } from '../ui/Textarea.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';

const StrategySetupModal: React.FC = memo(() => {
    const { isStrategySetupModalOpen, closeStrategySetupModal } = useSettingsUI();
    const { currentChatSession } = useActiveChatStore();
    const { saveSessionSettings } = useSettingsPersistence();
    const { t } = useTranslation();

    const [isEnabled, setIsEnabled] = useState(false);
    const [strategyContent, setStrategyContent] = useState('');
    const [ghostResponse, setGhostResponse] = useState('');

    useEffect(() => {
        if (isStrategySetupModalOpen && currentChatSession) {
            setIsEnabled(currentChatSession.settings.isStrategyToolEnabled ?? false);
            setStrategyContent(currentChatSession.settings.strategyContent ?? "Execute protocol: [Your detailed instructions here]");
            setGhostResponse(currentChatSession.settings.strategyGhostResponse ?? "");
        }
    }, [isStrategySetupModalOpen, currentChatSession]);

    const handleSave = useCallback(async () => {
        if (!currentChatSession) return;
        
        await saveSessionSettings({
            ...currentChatSession.settings,
            isStrategyToolEnabled: isEnabled,
            strategyContent: strategyContent,
            strategyGhostResponse: ghostResponse
        }, "Strategic Protocol settings saved.");

        closeStrategySetupModal();
    }, [currentChatSession, isEnabled, strategyContent, ghostResponse, saveSessionSettings, closeStrategySetupModal]);

    const footerButtons = (
        <>
            <Button variant="secondary" onClick={closeStrategySetupModal} className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/5 text-teal-800 dark:text-gray-300">{t.cancel}</Button>
            <Button variant="primary" onClick={handleSave} icon={<CheckIcon className="w-4 h-4" />} className="bg-teal-600 hover:bg-teal-700 text-white shadow-[0_4px_12px_rgba(13,148,136,0.3)] dark:shadow-none">
                {t.save}
            </Button>
        </>
    );

    return (
        <BaseModal
            isOpen={isStrategySetupModalOpen}
            onClose={closeStrategySetupModal}
            title="Strategic Protocol (On-Demand Injection)"
            headerIcon={<ClipboardDocumentListIcon className="w-5 h-5 text-teal-600 dark:text-amber-400" />}
            footer={footerButtons}
            maxWidth="sm:max-w-2xl"
        >
            <div className="space-y-5">
                {/* Enable Switch */}
                <div className="flex items-center justify-between bg-white/40 dark:bg-black/20 p-3 rounded-xl border border-teal-500/20 dark:border-white/5 shadow-sm dark:shadow-none backdrop-blur-sm">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-teal-900 dark:text-gray-200">Enable Forced Protocol</span>
                        <span className="text-xs text-teal-700/70 dark:text-gray-400">Forces the model to execute a special tool to retrieve your instructions before responding.</span>
                    </div>
                    <div className="flex items-center">
                        <Switch
                            checked={isEnabled}
                            onChange={(e) => setIsEnabled(e.target.checked)}
                            className="text-teal-600 dark:text-amber-500 focus:ring-teal-500 dark:focus:ring-amber-500"
                        />
                    </div>
                </div>

                {/* Content Editor */}
                <div className={isEnabled ? '' : 'opacity-50 pointer-events-none'}>
                    <label className="block text-xs font-bold text-teal-700 dark:text-amber-300 mb-1 uppercase tracking-wider flex items-center">
                        <ShieldCheckIcon className="w-3 h-3 mr-1.5" />
                        Protocol Instructions (Hidden)
                    </label>
                    <p className="text-[10px] text-teal-700/70 dark:text-gray-500 mb-2">
                        These instructions are hidden inside a tool. The model MUST call the tool to read them. This bypasses context drift and ensures adherence.
                    </p>
                    <Textarea
                        value={strategyContent}
                        onChange={(e) => setStrategyContent(e.target.value)}
                        className="h-64 resize-y font-mono border-teal-500/30 dark:border-amber-500/30 focus:border-teal-500 dark:focus:border-amber-500 focus:ring-teal-500/50 dark:focus:ring-amber-500/50 bg-white/50 dark:bg-transparent backdrop-blur-sm"
                        placeholder="Enter your strict operating protocol here..."
                    />
                </div>

                {/* Ghost Response Editor */}
                <div className={isEnabled ? '' : 'opacity-50 pointer-events-none'}>
                    <label className="block text-xs font-bold text-teal-700 dark:text-amber-300 mb-1 uppercase tracking-wider flex items-center">
                        <UserIcon className="w-3 h-3 mr-1.5" />
                        Ghost Response (AI Confirmation)
                    </label>
                    <p className="text-[10px] text-teal-700/70 dark:text-gray-500 mb-2">
                        Customize how the AI "acknowledges" the protocol in the hidden history. Leave empty for default.
                    </p>
                    <Textarea
                        value={ghostResponse}
                        onChange={(e) => setGhostResponse(e.target.value)}
                        className="h-20 resize-y font-mono border-teal-500/30 dark:border-amber-500/30 focus:border-teal-500 dark:focus:border-amber-500 focus:ring-teal-500/50 dark:focus:ring-amber-500/50 bg-white/50 dark:bg-transparent backdrop-blur-sm"
                        placeholder="Default: OK I UNDERSTAND AND I WILL FOLLOW THEM STEP BY STEP"
                    />
                </div>
            </div>
        </BaseModal>
    );
});

export default StrategySetupModal;