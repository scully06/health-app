// src/ui/Tutorial.tsx
import React, { useEffect } from 'react';
import { TourProvider, useTour } from '@reactour/tour';
import type { StepType } from '@reactour/tour';

// ツアーの実行を制御する内部コンポーネント
const TourController: React.FC<{ run: boolean; onFinish: () => void }> = ({ run, onFinish }) => {
  const { setIsOpen, isOpen, setSteps } = useTour();

  // runプロパティがtrueになったらツアーを開始する
  useEffect(() => {
    if (run && !isOpen) {
      setIsOpen(true);
    }
  }, [run, isOpen, setIsOpen]);

  return null; // このコンポーネント自体は何も表示しない
};

// ユーザーが手動でチュートリアルを開始するためのボタン
export const TutorialTrigger: React.FC = () => {
    const { setIsOpen } = useTour();
    return (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#3498db',
            textDecoration: 'underline',
            padding: '0',
            fontSize: '14px'
          }}
        >
          チュートリアルをもう一度見る
        </button>
    );
};

// アプリ全体をラップするメインのラッパーコンポーネント
interface TutorialWrapperProps {
  children: React.ReactNode;
  steps: StepType[];
  run: boolean;
  onTutorialFinish: () => void;
}

export const TutorialWrapper: React.FC<TutorialWrapperProps> = ({ children, steps, run, onTutorialFinish }) => {
  
  const handleBeforeClose = () => {
    document.body.style.overflow = 'auto'; // スクロールを元に戻す
    onTutorialFinish();
  };

  const handleAfterOpen = () => {
    document.body.style.overflow = 'hidden'; // ツアー中は背景のスクロールを禁止
  };

  return (
    <TourProvider
      steps={steps}
      beforeClose={handleBeforeClose}
      afterOpen={handleAfterOpen}
      styles={{
        popover: (base) => ({
          ...base,
          borderRadius: '12px',
          padding: '1.5rem',
        }),
      }}
    >
      <TourController run={run} onFinish={onTutorialFinish} />
      {children}
    </TourProvider>
  );
};
