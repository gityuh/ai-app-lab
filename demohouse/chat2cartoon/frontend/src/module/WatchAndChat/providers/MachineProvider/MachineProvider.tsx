import { FC, PropsWithChildren } from 'react';

import { useMachine } from '@xstate/react';

import { watchAndChatMachine } from '../../machines/watchAndChatMachine';
import { MachineContext } from './context';
import { useAudioInput } from './hooks/useAudioInput';
import { useBotAudioOperate } from './hooks/useBotAudioOperate';
import { useBotChatCompletion } from './hooks/useBotChatCompletion';
import { useCaptureFrame } from './hooks/useCaptureFrame';
import { useGetUserMedia } from './hooks/useGetUserMedia';
import { usePlayBotOpeningRemark } from './hooks/usePlayBotOpeningRemark';
import { useVideoOperate } from './hooks/useVideoOperate';

export const MachineProvider: FC<PropsWithChildren<{ url: string }>> = ({ children, url }) => {
  const { getUserMedia, releaseMedia } = useGetUserMedia();
  const playBotOpeningRemark = usePlayBotOpeningRemark();
  const { loadVideo, playVideo, pauseVideo } = useVideoOperate();
  const { recognizeUserAudioText, stopRecord } = useAudioInput();
  const captureFrame = useCaptureFrame();
  const botChatCompletion = useBotChatCompletion(url);
  const { playBotAudio, stopBotAudio, updateAudioData, markAudioDataFinished } = useBotAudioOperate();
  const [state, send] = useMachine(watchAndChatMachine, {
    services: {
      getUserMedia,
      playBotOpeningRemark,
      recognizeUserAudioText,
      botChatCompletion,
      playBotAudio,
    },
    actions: {
      releaseMedia,
      loadVideo,
      playVideo,
      pauseVideo,
      captureFrame,
      stopRecord,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      updateAudioData,
      markAudioDataFinished,
      stopBotAudio,
    },
  });

  return (
    <MachineContext.Provider
      value={{
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        state,
        send,
        machine: watchAndChatMachine,
      }}
    >
      {children}
    </MachineContext.Provider>
  );
};
