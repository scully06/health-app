// src/ui/AnalysisResult.tsx

import React from 'react';
import { buttonStyle } from './styles';

// 【修正】onAnalyzeClickとisAnalyzingをpropsの型定義に追加
interface AnalysisResultProps {
  analysisText: string;
  onAnalyzeClick: () => void;
  isAnalyzing: boolean;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysisText, onAnalyzeClick, isAnalyzing }) => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ marginTop: 0 }}>AIからのアドバイス</h3>
      <div style={{ minHeight: '100px', padding: '16px', backgroundColor: '#f0f8ff', borderRadius: '8px', marginBottom: '16px', flexGrow: 1 }}>
        {analysisText.split('\n').map((line, index) => (
          <p key={index} style={{ margin: '4px 0' }}>{line}</p>
        ))}
      </div>
      <button 
        onClick={onAnalyzeClick} 
        disabled={isAnalyzing} 
        style={{...buttonStyle, width: '100%', marginTop: 'auto'}}
      >
        {isAnalyzing ? '分析中...' : '最新の状態でAI分析を依頼'}
      </button>
    </div>
  );
};
