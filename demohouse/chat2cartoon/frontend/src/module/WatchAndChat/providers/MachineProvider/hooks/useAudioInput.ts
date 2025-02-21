import { useContext } from 'react';

import { useAudioRecorder } from '@/hooks/useAudioRecorder';

import { WatchAndChatContext } from '../../WatchAndChatProvider/context';

export const useAudioInput = () => {
  const { streamRef, setUserAudioWaveHeights } = useContext(WatchAndChatContext);
  const { stopRecording, recognizeUserAudioText } = useAudioRecorder(setUserAudioWaveHeights, streamRef);

  return {
    recognizeUserAudioText,
    stopRecord: stopRecording,
  };
};
