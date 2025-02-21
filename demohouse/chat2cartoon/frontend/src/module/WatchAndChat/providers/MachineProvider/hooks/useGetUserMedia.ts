import { useContext } from 'react';

import { WatchAndChatContext } from '../../WatchAndChatProvider/context';

export const useGetUserMedia = () => {
  const { streamRef } = useContext(WatchAndChatContext);
  const getUserMedia = (): Promise<void> =>
    new Promise(async (resolve, reject) => {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        resolve();
      } catch (e) {
        console.error('getMediaStream error', e);
        reject();
      }
    });
  const releaseMedia = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
  };
  return {
    getUserMedia,
    releaseMedia,
  };
};
