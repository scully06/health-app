// src/ui/AnalysisResult.tsx

import React from 'react';

interface AnalysisResultProps {
  analysisText: string;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysisText }) => {
  return (
    <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
      <h3 style={{ marginTop: 0 }}>AIからのアドバイス</h3>
      {/* 改行文字(\n)を<br />タグに変換して表示 */}
      {analysisText.split('\n').map((line, index) => (
        <p key={index} style={{ margin: '4px 0' }}>{line}</p>
      ))}
    </div>
  );
};