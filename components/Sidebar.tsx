/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// FIX: Added missing React imports.
import React, { useEffect, useMemo, useState } from 'react';
import { useSettings, useUI, useLogStore, useTools, personas } from '@/lib/state';
import { useLobby } from '@/lib/stores/lobby-store';
import { useTrip } from '@/lib/stores/trip-store';
import { openModal } from '@/lib/modal-store';
import LobbyChat from './LobbyChat';
import c from 'classnames';
import {
  AVAILABLE_VOICES_FULL,
  AVAILABLE_VOICES_LIMITED,
  MODELS_WITH_LIMITED_VOICES,
  DEFAULT_VOICE,
} from '@/lib/constants';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';

const AVAILABLE_MODELS = [
  'gemini-2.5-flash-native-audio-preview-09-2025',
  'gemini-2.5-flash-preview-native-audio-dialog',
  'gemini-2.5-flash-exp-native-audio-thinking-dialog',
  'gemini-live-2.5-flash-preview',
  'gemini-2.0-flash-live-001'
];

export default function Sidebar() {
  const {
    isSidebarOpen,
    toggleSidebar,
    showSystemMessages,
    toggleShowSystemMessages,
  } = useUI();
  const {
    systemPrompt,
    model,
    voice,
    setSystemPrompt,
    setModel,
    setVoice,
    isEasterEggMode,
    activePersona,
    setPersona,
  } = useSettings();
  const { connected } = useLiveAPIContext();
  const { currentLobby, leaveLobby } = useLobby();
  const { currentTrip } = useTrip();
  const [activeTab, setActiveTab] = useState<'settings' | 'chat'>('settings');

  const availableVoices = useMemo(() => {
    return MODELS_WITH_LIMITED_VOICES.includes(model)
      ? AVAILABLE_VOICES_LIMITED
      : AVAILABLE_VOICES_FULL;
  }, [model]);

  useEffect(() => {
    if (!availableVoices.some(v => v.name === voice)) {
      setVoice(DEFAULT_VOICE);
    }
  }, [availableVoices, voice, setVoice]);

  const handleExportLogs = () => {
    const { systemPrompt, model } = useSettings.getState();
    const { tools } = useTools.getState();
    const { turns } = useLogStore.getState();

    const logData = {
      configuration: {
        model,
        systemPrompt,
      },
      tools,
      conversation: turns.map(turn => ({
        ...turn,
        // Convert Date object to ISO string for JSON serialization
        timestamp: turn.timestamp.toISOString(),
      })),
    };

    const jsonString = JSON.stringify(logData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `live-api-logs-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <aside className={c('sidebar', { open: isSidebarOpen })}>
        <div className="sidebar-header">
          <h3>{activeTab === 'settings' ? 'Settings' : 'Lobby Chat'}</h3>
          <button onClick={toggleSidebar} className="close-button">
            <span className="icon">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #374151' }}>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === 'settings' ? '#1f2937' : 'transparent',
              color: activeTab === 'settings' ? '#fff' : '#9ca3af',
              border: 'none',
              borderBottom: activeTab === 'settings' ? '2px solid #10b981' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'settings' ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === 'chat' ? '#1f2937' : 'transparent',
              color: activeTab === 'chat' ? '#fff' : '#9ca3af',
              border: 'none',
              borderBottom: activeTab === 'chat' ? '2px solid #10b981' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'chat' ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            Chat {currentLobby && '💬'}
          </button>
        </div>

        <div className="sidebar-content" style={{ height: activeTab === 'chat' ? 'calc(100% - 120px)' : 'auto' }}>
          {activeTab === 'chat' ? (
            <LobbyChat />
          ) : (
            <div>
              {/* Lobby & Trip Info Section */}
              <div className="sidebar-section">
            <h4>Trip Planning</h4>
            {currentLobby ? (
              <div style={{marginBottom: '1rem', padding: '0.75rem', background: '#1f2937', borderRadius: '0.5rem', color: '#fff'}}>
                <div style={{marginBottom: '0.5rem'}}>
                  <strong>Lobby:</strong> {currentLobby.name}
                </div>
                <div style={{marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af'}}>
                  Invite Code: <code style={{background: '#374151', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', color: '#fff'}}>{currentLobby.invite_code}</code>
                </div>
                {currentTrip && (
                  <div style={{marginBottom: '0.5rem'}}>
                    <strong>Active Trip:</strong> {currentTrip.name}
                  </div>
                )}
                <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.75rem'}}>
                  {currentTrip && (
                    <button
                      onClick={() => openModal('trip-overview')}
                      style={{flex: 1, padding: '0.5rem', fontSize: '0.875rem'}}
                    >
                      View Trip
                    </button>
                  )}
                  <button
                    onClick={leaveLobby}
                    style={{padding: '0.5rem', fontSize: '0.875rem', background: '#ef4444', color: 'white'}}
                  >
                    Leave
                  </button>
                </div>
              </div>
            ) : (
              <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
                <button
                  onClick={() => openModal('lobby-create')}
                  style={{flex: 1, padding: '0.5rem'}}
                >
                  Create Lobby
                </button>
                <button
                  onClick={() => openModal('lobby-join')}
                  style={{flex: 1, padding: '0.5rem'}}
                >
                  Join Lobby
                </button>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h4>AI Settings</h4>
            <fieldset disabled={connected}>
              {isEasterEggMode && (
                <label>
                  Persona
                  <select
                    value={activePersona}
                    onChange={e => setPersona(e.target.value)}
                  >
                    {Object.keys(personas).map(personaName => (
                      <option key={personaName} value={personaName}>
                        {personaName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                System Prompt
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  rows={10}
                  placeholder="Describe the role and personality of the AI..."
                  disabled={isEasterEggMode}
                />
              </label>
              <label>
                Model
                <select value={model} onChange={e => setModel(e.target.value)} disabled>
                  {/* This is an experimental model name that should not be removed from the options. */}
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Voice
                <select
                  value={voice}
                  onChange={e => setVoice(e.target.value)}
                  disabled={isEasterEggMode}
                >
                  {availableVoices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.description})
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
            <div className="settings-toggle-item">
              <label className="tool-checkbox-wrapper">
                <input
                  type="checkbox"
                  id="system-message-toggle"
                  checked={showSystemMessages}
                  onChange={toggleShowSystemMessages}
                />
                <span className="checkbox-visual"></span>
              </label>
              <label
                htmlFor="system-message-toggle"
                className="settings-toggle-label"
              >
                Show system messages
              </label>
            </div>
          </div>
            <div className="sidebar-actions">
              <button onClick={handleExportLogs} title="Export session logs">
                <span className="icon">download</span>
                Export Logs
              </button>
              <button
                onClick={useLogStore.getState().clearTurns}
                title="Reset session logs"
              >
                <span className="icon">refresh</span>
                Reset Session
              </button>
            </div>
          </div>
        )}
        </div>
      </aside>
    </>
  );
}