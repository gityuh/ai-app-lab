import { MutableRefObject, useRef } from 'react';

import { barHeightMapping, calculateBarHeights } from '@/utils/calcWaveBarHeight';

const barHeight = barHeightMapping.default;
export const defaultBarsData = {
  bar1: barHeight.min, // 低频
  bar2: barHeight.min, // 中频
  bar3: barHeight.min, // 高频
};

export const useTrackUserSpeakWave = (
  audioContextRef: MutableRefObject<AudioContext | undefined>,
  streamRef: MutableRefObject<MediaStream | null>,
  setUserAudioWaveHeights: (waveHeights: { bar1: number; bar2: number; bar3: number }) => void,
) => {
  const rafIdRef = useRef<number>();

  const resetUserAudioWaveHeights = () => {
    setUserAudioWaveHeights(defaultBarsData);
  };

  /**
   * 开始跟踪用户说话的音波
   */
  const startTrack = () => {
    if (!audioContextRef.current || !streamRef.current) {
      return;
    }
    const ctx = audioContextRef.current;

    const analyser = ctx.createAnalyser();
    const source = ctx.createMediaStreamSource(streamRef.current);

    source.connect(analyser);

    //
    const arr = new Uint8Array(analyser.frequencyBinCount);

    const getAudioData = () => {
      if (streamRef.current) {
        analyser.getByteFrequencyData(arr);
        const waveData = calculateBarHeights(arr);
        setUserAudioWaveHeights(waveData);
      }
      rafIdRef.current = requestAnimationFrame(getAudioData);
    };

    rafIdRef.current = requestAnimationFrame(getAudioData);
  };
  /**
   * 停止跟踪用户说话的音波
   */
  const stopTrack = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      resetUserAudioWaveHeights();
    }
  };

  return {
    stopTrack,
    startTrack,
  };
};
