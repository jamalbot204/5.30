
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditorUI } from '../../store/ui/useEditorUI.ts';
import { useActiveChatStore } from '../../store/useActiveChatStore.ts';
import { useGeminiApiStore } from '../../store/useGeminiApiStore.ts';
import { useFileHandler } from '../../hooks/useFileHandler.ts';
import useAutoResizeTextarea from '../../hooks/useAutoResizeTextarea.ts';
import { XCircleIcon, ArrowPathIcon, UserIcon, MicrophoneIcon, StopCircleIcon, PaperClipIcon, DocumentIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { useTranscribe } from '../../hooks/useTranscribe.ts';
import AttachmentZone from '../chat/input/AttachmentZone.tsx';
import { Button } from '../ui/Button.tsx';
import { Textarea } from '../ui/Textarea.tsx';

const InjectedMessageEditModal: React.FC = () => {
  const { 
    isInjectedMessageEditModalOpen, 
    closeInjectedMessageEditModal, 
    injectedMessageEditTarget 
  } = useEditorUI();
  
  const { updateCurrentChatSession, currentChatSession } = useActiveChatStore();
  const { handleRegenerateResponseForUserMessage } = useGeminiApiStore.getState();
  const isLoading = useGeminiApiStore(s => s.isLoading);
  const { t } = useTranslation();

  const [inputValue, setInputValue] = useState('');
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const textareaRef = useAutoResizeTextarea<HTMLTextAreaElement>(inputValue);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Handler Hook
  const {
      files,
      handleFileSelection,
      handlePaste,
      removeFile,
      resetFiles,
      getValidFiles,
      isAnyFileStillProcessing
  } = useFileHandler();

  const originalMessage = currentChatSession?.messages.find(m => m.id === injectedMessageEditTarget?.messageId);

  const onTranscriptionComplete = useCallback((text: string) => {
    setInputValue(prev => prev ? `${prev} ${text}` : text);
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
        }
    }, 50);
  }, [textareaRef]);

  const { isRecording, isTranscribing, startRecording, stopRecording } = useTranscribe(onTranscriptionComplete);

  useEffect(() => {
    if (isInjectedMessageEditModalOpen) {
      setAreButtonsDisabled(true);
      const timerId = setTimeout(() => {
        setAreButtonsDisabled(false);
      }, 500);

      if (originalMessage) {
        setInputValue(originalMessage.content);
        resetFiles(); // New attachments only, simplistic approach for injected modal
      }
      return () => clearTimeout(timerId);
    }
  }, [isInjectedMessageEditModalOpen, originalMessage, resetFiles]);

  const handleSaveAndRegenerate = useCallback(async () => {
    if (!injectedMessageEditTarget || !originalMessage) return;

    // 1. Update the user message content & attachments
    await updateCurrentChatSession(session => {
      if (!session) return null;
      const messageIndex = session.messages.findIndex(m => m.id === injectedMessageEditTarget.messageId);
      if (messageIndex === -1) return session;

      const updatedMessages = [...session.messages];
      
      // Combine original attachments + new files
      const newAttachments = getValidFiles();
      const existingAttachments = originalMessage.attachments || [];
      const combinedAttachments = [...existingAttachments, ...newAttachments];

      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: inputValue,
        attachments: combinedAttachments
      };
      return { ...session, messages: updatedMessages };
    });

    // 2. Trigger regeneration
    handleRegenerateResponseForUserMessage(injectedMessageEditTarget.messageId);

    closeInjectedMessageEditModal();
  }, [injectedMessageEditTarget, inputValue, originalMessage, updateCurrentChatSession, handleRegenerateResponseForUserMessage, closeInjectedMessageEditModal, getValidFiles]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveAndRegenerate();
    }
  };
  
  const handleClose = () => {
    if (isRecording) stopRecording();
    closeInjectedMessageEditModal();
  };

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const handleAttachClick = () => fileInputRef.current?.click();

  // Drag & Drop Handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileSelection(e.dataTransfer.files);
      }
  }, [handleFileSelection]);

  if (!isInjectedMessageEditModalOpen || !injectedMessageEditTarget) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-white/30 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="injected-edit-modal-title"
    >
      <div 
        className={`bg-white/70 dark:bg-zinc-900 backdrop-blur-xl dark:backdrop-blur-none border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-2xl w-full max-w-2xl flex flex-col relative transition text-gray-900 dark:text-gray-200 animate-modal-open ${isDragging ? 'ring-2 ring-teal-500 dark:ring-emerald-500 bg-white/90 dark:bg-black/40' : ''}`}
        onClick={e => e.stopPropagation()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm pointer-events-none rounded-2xl">
                <div className="text-teal-700 dark:text-white font-bold text-lg flex items-center animate-bounce">
                    <DocumentIcon className="w-8 h-8 mr-3 text-teal-600 dark:text-emerald-500" />
                    <span>Drop files to attach</span>
                </div>
            </div>
        )}

        <header className="flex items-center justify-between mb-6">
          <h2 id="injected-edit-modal-title" className="text-lg font-semibold text-teal-900 dark:text-gray-100 flex items-center">
            <UserIcon className="w-5 h-5 mr-3 text-teal-600 dark:text-emerald-500" />
            {t.editUserMessageInjected}
          </h2>
          <Button
            variant="ghost"
            onClick={handleClose} 
            disabled={areButtonsDisabled}
            className="p-1.5 rounded-full text-teal-700/70 hover:text-teal-900 dark:text-gray-400 dark:hover:text-white bg-white/50 hover:bg-white/80 dark:bg-transparent dark:hover:bg-white/10"
            aria-label={t.close}
          >
            <XCircleIcon className="w-6 h-6" />
          </Button>
        </header>

        {/* Card - Emerald */}
        <div className="relative p-4 rounded-r-xl rounded-l-md border border-slate-500/20 dark:border-white/10 border-l-4 border-l-teal-500 dark:border-l-emerald-500 bg-gradient-to-r from-slate-50/50 dark:from-emerald-500/10 to-transparent flex-grow mb-6 flex flex-col gap-3 backdrop-blur-sm shadow-sm dark:shadow-none">
            
            {/* Attachments Area */}
            <AttachmentZone files={files} onRemove={removeFile} />

            <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onPaste={handlePaste}
                className="h-48 resize-none border-teal-500/30 dark:border-emerald-500/30 focus:ring-teal-500 dark:focus:ring-emerald-500 bg-white/50 dark:bg-transparent"
                placeholder={t.typeUserMessage}
                aria-label="User message text"
            />
        </div>

        <footer className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
             {/* File Input */}
             <input 
                type="file" 
                multiple 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => handleFileSelection(e.target.files)}
             />
             <Button
                variant="ghost"
                onClick={handleAttachClick}
                disabled={areButtonsDisabled || isAnyFileStillProcessing}
                className="p-2 text-teal-700/70 hover:text-teal-900 dark:text-gray-400 dark:hover:text-white bg-white/50 hover:bg-white/80 dark:bg-transparent dark:hover:bg-white/5"
                title={t.addFiles}
             >
                <PaperClipIcon className="w-5 h-5" />
             </Button>

             {/* Microphone */}
             <Button
                variant={isRecording ? "danger" : "ghost"}
                onClick={toggleRecording}
                disabled={areButtonsDisabled || isTranscribing}
                className={`p-2 border ${isRecording ? 'border-red-200 dark:border-red-500/40 shadow-sm dark:shadow-[0_0_10px_rgba(239,68,68,0.3)] bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'border-transparent dark:border-white/5 text-teal-700/70 hover:text-teal-900 dark:text-gray-400 dark:hover:text-white bg-white/50 hover:bg-white/80 dark:bg-transparent dark:hover:bg-white/5'}`}
                title={isRecording ? "Stop Recording" : "Voice Input"}
              >
                {isTranscribing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-500 dark:border-emerald-500 border-t-transparent"></div>
                ) : isRecording ? (
                    <StopCircleIcon className="w-5 h-5 animate-pulse" />
                ) : (
                    <MicrophoneIcon className="w-5 h-5" />
                )}
              </Button>
          </div>

          <div className="flex space-x-3">
            <Button 
                variant="secondary"
                onClick={handleClose}
                disabled={areButtonsDisabled}
                className="bg-white/50 dark:bg-transparent border-teal-500/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/5 text-teal-800 dark:text-gray-300"
            >
                {t.cancel}
            </Button>
            <Button
                variant="primary"
                onClick={handleSaveAndRegenerate}
                disabled={areButtonsDisabled || isLoading || (inputValue.trim() === '' && files.length === 0) || isAnyFileStillProcessing}
                icon={<ArrowPathIcon className="w-5 h-5" />}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-[0_4px_12px_rgba(13,148,136,0.3)] dark:shadow-none"
            >
                {isLoading ? t.regenerating : t.regenerateAiResponse}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InjectedMessageEditModal;
