// src/ui/ReminderSettings.tsx

import React, { useState, useEffect } from 'react';
import type { ReminderManager, ReminderSettings as ReminderSettingsType } from '../core/services/ReminderManager';

interface ReminderSettingsProps {
  reminderManager: ReminderManager;
}

export const ReminderSettings: React.FC<ReminderSettingsProps> = ({ reminderManager }) => {
  const [settings, setSettings] = useState<ReminderSettingsType>(reminderManager.getSettings());
  // 通知権限の状態を安全に管理するためのstate
  const [notificationPermission, setNotificationPermission] = useState<string>('unavailable');

  useEffect(() => {
    // このeffectはブラウザでのみ実行される
    // Notification APIが利用可能かを確認してから使用する
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // 現在の通知権限をstateにセット
      setNotificationPermission(Notification.permission);

      // 権限がまだ要求されていない場合のみ、許可を求める
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    } else {
      console.warn("Notification API is not available in this environment.");
    }
  }, []);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    // リマインダーを有効にする際に、通知が許可されているか確認
    if (e.target.checked && notificationPermission !== 'granted') {
      alert('リマインダーを有効にするには、ブラウザの通知を許可してください。');
      // 再度、権限の許可を求める
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        // 許可された場合のみ設定を有効にする
        if (permission === 'granted') {
          const newSettings = { ...settings, isEnabled: true };
          setSettings(newSettings);
          reminderManager.saveSettings(newSettings);
        }
      });
      return;
    }

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
        現在の通知権限: {notificationPermission}
      </p>
    </div>
  );
};
