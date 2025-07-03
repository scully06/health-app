// src/ui/Tutorial.tsx
import React from 'react';
import { TourProvider, useTour } from '@reactour/tour';
import type { StepType } from '@reactour/tour';

// ツアーを開始するためのボタン（後でApp.tsxから使う）
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

// ツアーの見た目や内容を定義するラッパーコンポーネント
interface TutorialWrapperProps {
  children: React.ReactNode;
  steps: StepType[];
  run: boolean;
  onTutorialFinish: () => void;
}

export const TutorialWrapper: React.FC<TutorialWrapperProps> = ({ children, steps, run, onTutorialFinish }) => {
  const { setIsOpen, isOpen } = useTour();

  React.useEffect(() => {
    if (run && !isOpen) {
      setIsOpen(true);
    }
  }, [run, isOpen, setIsOpen]);

  const handleAfterOpen = () => {
    document.body.style.overflow = 'hidden';
  };

  const handleBeforeClose = () => {
    document.body.style.overflow = 'auto';
    onTutorialFinish();
  };

  return (
    <TourProvider
      steps={steps}
      afterOpen={handleAfterOpen}
      beforeClose={handleBeforeClose}
      styles={{
        popover: (base) => ({
          ...base,
          borderRadius: '12px',
          padding: '1.5rem',
        }),
      }}
      // 【修正】サポートされなくなった locale プロパティを削除
    >
      {children}
    </TourProvider>
  );
};
