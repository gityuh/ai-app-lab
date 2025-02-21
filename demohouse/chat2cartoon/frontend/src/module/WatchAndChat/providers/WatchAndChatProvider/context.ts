import { createContext, MutableRefObject } from 'react';

interface IChatContext {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  chatConfigRef: MutableRefObject<{
    videoUrl: string;
    confirmation: string;
  }>;
  //
  setUserAudioWaveHeights: (data: { bar1: number; bar2: number; bar3: number }) => void;
  userAudioWaveHeights: { bar1: number; bar2: number; bar3: number };
  //
  audioContextRef: MutableRefObject<AudioContext | null>;
  analyserRef: MutableRefObject<AnalyserNode | null>;
  //
  streamRef: MutableRefObject<MediaStream | null>;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  bgVideoRef: MutableRefObject<HTMLVideoElement | null>;
}

export const WatchAndChatContext = createContext<IChatContext>({} as unknown as never);
