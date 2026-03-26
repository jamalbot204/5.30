import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { CheckIcon, CloseIcon as CancelIcon, ArrowDownTrayIcon, PencilIcon } from '../common/Icons.tsx';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';

interface FilenameInputModalProps {
  isOpen: boolean;
  title: string;
  defaultFilename: string;
  promptMessage: string;
  onSubmit: (filename: string) => void;
  onClose: () => void;
}

const FilenameInputModal: React.FC<FilenameInputModalProps> = memo(({
  isOpen,
  title,
  defaultFilename,
  promptMessage,
  onSubmit,
  onClose,
}) => {
  const [currentFilename, setCurrentFilename] = useState(defaultFilename);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAreButtonsDisabled(true);
      const timerId = setTimeout(() => {
        setAreButtonsDisabled(false);
      }, 500);

      setCurrentFilename(defaultFilename);
      setTimeout(() => inputRef.current?.focus(), 100);

      return () => clearTimeout(timerId);
    }
  }, [isOpen, defaultFilename]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(currentFilename.trim() || defaultFilename);
  }, [onSubmit, currentFilename, defaultFilename]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFilename(e.target.value);
  }, []);

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-white/30 dark:bg-black/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filename-input-modal-title"
        onClick={onClose}
    >
      <div 
        className="bg-white/70 dark:bg-zinc-900 backdrop-blur-xl dark:backdrop-blur-none border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col text-gray-900 dark:text-gray-200 animate-modal-open"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="filename-input-modal-title" className="text-lg font-semibold text-teal-900 dark:text-gray-100 flex items-center">
            <ArrowDownTrayIcon className="w-5 h-5 mr-3 text-sky-600 dark:text-sky-400" />
            {title}
          </h2>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={areButtonsDisabled}
            className="p-1 rounded-full text-teal-700/70 hover:text-teal-900 dark:text-gray-400 dark:hover:text-white bg-white/50 hover:bg-white/80 dark:bg-transparent dark:hover:bg-white/10"
            aria-label="Close filename input"
          >
            <CancelIcon className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
            {/* Input Card - Sky Blue */}
            <div className="relative p-4 mb-6 rounded-r-xl rounded-l-md border border-sky-500/20 dark:border-white/10 border-l-4 border-l-sky-500 bg-gradient-to-r from-sky-50/50 dark:from-sky-500/5 to-transparent backdrop-blur-sm shadow-sm dark:shadow-none">
                <label htmlFor="filename-input" className="block text-sm font-medium text-sky-800 dark:text-gray-300 mb-2 flex items-center">
                    <PencilIcon className="w-3.5 h-3.5 mr-2 text-sky-600 dark:text-sky-400" />
                    {promptMessage}
                </label>
                <Input
                    ref={inputRef}
                    id="filename-input"
                    type="text"
                    value={currentFilename}
                    onChange={handleInputChange}
                    aria-label={title}
                    placeholder="Enter filename"
                    className="bg-white/50 dark:bg-transparent border-sky-500/20 dark:border-white/10 focus:border-sky-500 focus:ring-sky-500/50"
                />
            </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={areButtonsDisabled}
              icon={<CancelIcon className="w-4 h-4" />}
              className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/5 text-teal-800 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={areButtonsDisabled || !currentFilename.trim()}
              icon={<CheckIcon className="w-4 h-4" />}
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-[0_4px_12px_rgba(13,148,136,0.3)] dark:shadow-none"
            >
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default FilenameInputModal;