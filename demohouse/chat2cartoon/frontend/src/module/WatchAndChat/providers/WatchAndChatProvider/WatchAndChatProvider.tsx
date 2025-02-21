import { FC, PropsWithChildren, useRef, useState } from 'react';

import { defaultBarsData } from '@/hooks/useTrackUserSpeakWave';

import { WatchAndChatContext } from './context';

export const WatchAndChatProvider: FC<PropsWithChildren> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const chatConfigRef = useRef({
    videoUrl: '',
    confirmation: '',
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const streamRef = useRef<MediaStream>(null);
  const [userAudioWaveHeights, setUserAudioWaveHeights] = useState<{
    bar1: number;
    bar2: number;
    bar3: number;
  }>(defaultBarsData);

  return (
    <WatchAndChatContext.Provider
      value={{
        //
        chatConfigRef,
        visible,
        setVisible,
        audioContextRef,
        analyserRef,
        //
        setUserAudioWaveHeights,
        userAudioWaveHeights,
        //
        streamRef,
        canvasRef,
        videoRef,
        bgVideoRef,
        //
      }}
    >
      {children}
    </WatchAndChatContext.Provider>
  );
};
