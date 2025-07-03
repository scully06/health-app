// src/ui/ReminderSettings.tsx

import React, { useState, useEffect } from 'react';
// import type { ReminderManager, ReminderSettings } from '../core/services/ReminderManager'; // 変更前
import type { ReminderManager, ReminderSettings as ReminderSettingsType } from '../core/services/ReminderManager'; // 変更後

interface ReminderSettingsProps {
  reminderManager: ReminderManager;
}

export const ReminderSettings: React.FC<ReminderSettingsProps> = ({ reminderManager }) => {
  // const [settings, setSettings] = useState<ReminderSettings>(reminderManager.getSettings()); // 変更前
  const [settings, setSettings] = useState<ReminderSettingsType>(reminderManager.getSettings()); // 変更後

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = { ...settings, isEnabled: e.target.checked };
    setSettings(newSettings);
    reminderManager.saveSettings(newSettings);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = { ...settings, time: e.target.value };
    setSettings(newSettings);
    reminderManager.saveSettings(newSettings);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', marginTop: '24px' }}>
      <h4>リマインダー設定</h4>
      <div>
        <label>
          <input 
            type="checkbox"
            checked={settings.isEnabled}
            onChange={handleToggle}
          />
          リマインダーを有効にする
        </label>
      </div>
      {settings.isEnabled && (
        <div style={{ marginTop: '8px' }}>
          <label>
            通知時間: 
            <input 
              type="time"
              value={settings.time}
              onChange={handleTimeChange}
            />
          </label>
        </div>
      )}
      <p style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>
        現在の通知権限: {Notification.permission}
      </p>
    </div>
  );
};