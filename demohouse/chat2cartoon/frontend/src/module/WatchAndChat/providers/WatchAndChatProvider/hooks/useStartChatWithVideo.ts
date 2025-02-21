import { useContext } from 'react';

import { WatchAndChatContext } from '../context';

export const useStartChatWithVideo = () => {
  const { chatConfigRef, setVisible, visible } = useContext(WatchAndChatContext);
  const startChatWithVideo = ({ videoUrl, confirmation }: { videoUrl: string; confirmation: string }) => {
    chatConfigRef.current = {
      videoUrl,
      confirmation,
    };
    setVisible(true);
    console.log('startChatWithVideo');
  };
  const stopChatWithVideo = () => {
    setVisible(false);
    chatConfigRef.current = {
      videoUrl: '',
      confirmation: '',
    };
  };
  return {
    visible,
    startChatWithVideo,
    stopChatWithVideo,
  };
};
