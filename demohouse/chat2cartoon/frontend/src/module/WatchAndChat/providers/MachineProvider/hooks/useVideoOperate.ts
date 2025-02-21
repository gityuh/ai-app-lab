import { useContext } from 'react';

import { WatchAndChatContext } from '../../WatchAndChatProvider/context';

export const useVideoOperate = () => {
  const { videoRef, bgVideoRef, chatConfigRef } = useContext(WatchAndChatContext);

  return {
    loadVideo: () => {
      const video = videoRef.current;
      const bgVideo = bgVideoRef.current;
      if (!video || !bgVideo) {
        throw new Error('video not found');
      }

      video.src = chatConfigRef.current.videoUrl;
      bgVideo.src = chatConfigRef.current.videoUrl;
      video.load();
      video.pause();
      video.currentTime = 0;
      console.log('##loadVideo', chatConfigRef.current.videoUrl);
    },
    pauseVideo: () => {
      const video = videoRef.current;
      const bgVideo = bgVideoRef.current;
      if (!video || !bgVideo) {
        throw new Error('video not found');
      }

      video.pause();
      bgVideo.pause();
    },
    playVideo: () => {
      const video = videoRef.current;
      const bgVideo = bgVideoRef.current;
      if (!video || !bgVideo) {
        throw new Error('video not found');
      }
      video.play();
      bgVideo.play();
      console.log('##playVideo');
    },
  };
};
