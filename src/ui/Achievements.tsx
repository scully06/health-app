// src/ui/Achievements.tsx
import React from 'react';
import type { Achievement } from '../core/services/AchievementManager';
import { cardStyle } from './styles';

interface AchievementsProps {
  unlockedAchievements: Achievement[];
}

export const Achievements: React.FC<AchievementsProps> = ({ unlockedAchievements }) => {
  return (
    <div style={{ ...cardStyle, marginTop: '32px' }}>
      <h2 style={{ marginTop: 0 }}>実績</h2>
      {unlockedAchievements.length === 0 ? (
        <p style={{ color: '#7f8c8d' }}>まだ解除した実績はありません。記録を続けてみましょう！</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {unlockedAchievements.map(ach => (
            <div key={ach.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', textAlign: 'center', backgroundColor: '#fafafa' }}>
              <span style={{ fontSize: '2.5rem' }}>{ach.icon}</span>
              <h4 style={{ margin: '8px 0 4px' }}>{ach.title}</h4>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{ach.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
