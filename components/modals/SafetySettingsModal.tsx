import React, { useState, useEffect, memo, useCallback } from 'react';
import { SafetySetting, HarmCategory, HarmBlockThreshold } from '../../types.ts';
import { DEFAULT_SAFETY_SETTINGS, HARM_CATEGORY_LABELS } from '../../constants.ts';
import { CloseIcon, ShieldCheckIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { Button } from '../ui/Button.tsx';

interface SafetySettingsModalProps {
  isOpen: boolean;
  currentSafetySettings: SafetySetting[];
  onClose: () => void;
  onApply: (newSafetySettings: SafetySetting[]) => void;
}

const sliderLevels: (HarmBlockThreshold | 'OFF')[] = [
  'OFF',
  HarmBlockThreshold.BLOCK_NONE,
  HarmBlockThreshold.BLOCK_ONLY_HIGH,
  HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
];

const allCategories = Object.values(HarmCategory).filter(cat => cat !== HarmCategory.HARM_CATEGORY_UNSPECIFIED);

const SafetySettingsModal: React.FC<SafetySettingsModalProps> = memo(({ isOpen, currentSafetySettings, onClose, onApply }) => {
  const { t } = useTranslation();
  const [localSettingsMap, setLocalSettingsMap] = useState<Record<HarmCategory, HarmBlockThreshold | 'OFF'>>({} as any);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);

  // Translation mappings
  const sliderLabels: Record<string, string> = {
    'OFF': t.off,
    [HarmBlockThreshold.BLOCK_NONE]: t.blockNone,
    [HarmBlockThreshold.BLOCK_ONLY_HIGH]: t.blockFew,
    [HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE]: t.blockSome,
    [HarmBlockThreshold.BLOCK_LOW_AND_ABOVE]: t.blockMost,
  };

  useEffect(() => {
    if (isOpen) {
      setAreButtonsDisabled(true);
      const timerId = setTimeout(() => {
        setAreButtonsDisabled(false);
      }, 500);

      const initialMap: Record<HarmCategory, HarmBlockThreshold | 'OFF'> = {} as any;
      allCategories.forEach(category => {
        const existingSetting = currentSafetySettings.find(s => s.category === category);
        initialMap[category] = existingSetting ? existingSetting.threshold : 'OFF';
      });
      setLocalSettingsMap(initialMap);

      return () => clearTimeout(timerId);
    }
  }, [isOpen, currentSafetySettings]);

  const handleSliderChange = useCallback((category: HarmCategory, value: number) => {
    const newThreshold = sliderLevels[value];
    setLocalSettingsMap(prev => ({ ...prev, [category]: newThreshold }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    const defaultMap = Object.fromEntries(
      DEFAULT_SAFETY_SETTINGS.map(s => [s.category, s.threshold])
    ) as Record<HarmCategory, HarmBlockThreshold>;
    setLocalSettingsMap(defaultMap);
  }, []);

  const handleSubmit = useCallback(() => {
    const newSafetySettings: SafetySetting[] = Object.entries(localSettingsMap)
      .filter(([, threshold]) => threshold !== 'OFF')
      .map(([category, threshold]) => ({
        category: category as HarmCategory,
        threshold: threshold as HarmBlockThreshold,
      }));
    onApply(newSafetySettings);
    onClose();
  }, [onApply, localSettingsMap, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 dark:bg-black/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white/70 dark:bg-zinc-900 backdrop-blur-xl dark:backdrop-blur-none border border-white/40 dark:border-white/10 p-0 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col text-gray-900 dark:text-gray-200 relative overflow-hidden animate-modal-open" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-5 flex justify-between items-center border-b border-teal-500/20 dark:border-white/10">
            <h2 className="text-xl font-semibold text-teal-900 dark:text-gray-100 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-3 text-red-500 dark:text-red-400" />
                {t.runSafetySettings}
            </h2>
            <Button
                variant="ghost"
                onClick={onClose}
                disabled={areButtonsDisabled}
                className="p-1.5 rounded-full text-teal-700 hover:text-teal-900 dark:text-gray-400 dark:hover:text-white"
                aria-label={t.close}
            >
                <CloseIcon className="w-6 h-6" />
            </Button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-5 space-y-4 custom-scrollbar">
            <p className="text-sm text-teal-800 dark:text-gray-400 mb-2">
                {t.safetySettingsDesc}
            </p>

            <div className="space-y-3">
                {allCategories.map(category => {
                    const currentThreshold = localSettingsMap[category] || 'OFF';
                    const sliderValue = sliderLevels.indexOf(currentThreshold);
                    return (
                    <div key={category} className="relative p-4 rounded-r-xl rounded-l-md border border-red-500/20 dark:border-white/10 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 dark:from-red-500/5 to-transparent shadow-sm dark:shadow-none backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-3">
                            <label htmlFor={`safety-slider-${category}`} className="text-sm font-semibold text-red-900 dark:text-gray-200">
                                {HARM_CATEGORY_LABELS[category]}
                            </label>
                            <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-100/50 dark:bg-red-500/10 px-2 py-1 rounded border border-red-200/50 dark:border-red-500/20">
                                {sliderLabels[currentThreshold]}
                            </span>
                        </div>
                        <input
                            type="range"
                            id={`safety-slider-${category}`}
                            min="0"
                            max={sliderLevels.length - 1}
                            step="1"
                            value={sliderValue}
                            onChange={(e) => handleSliderChange(category, parseInt(e.target.value, 10))}
                            disabled={areButtonsDisabled}
                            className="w-full h-1.5 bg-red-200/50 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600 dark:accent-red-500"
                        />
                    </div>
                    );
                })}
            </div>
            
            <p className="text-[10px] text-teal-700/70 dark:text-gray-500 mt-2">
                {t.safetyTerms}
            </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-teal-500/20 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <Button
                variant="ghost"
                onClick={handleResetDefaults}
                type="button"
                disabled={areButtonsDisabled}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-white/50 dark:bg-transparent hover:bg-white/80 dark:hover:bg-white/5"
            >
                {t.resetDefaults}
            </Button>
            <div className="flex space-x-3 w-full sm:w-auto">
                <Button
                    variant="secondary"
                    onClick={onClose}
                    type="button"
                    disabled={areButtonsDisabled}
                    className="flex-1 sm:flex-none bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/5 text-teal-800 dark:text-gray-300"
                >
                    {t.cancel}
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    type="button"
                    disabled={areButtonsDisabled}
                    className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 text-white shadow-[0_4px_12px_rgba(13,148,136,0.3)] dark:shadow-none"
                >
                    {t.apply}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
});

export default SafetySettingsModal;