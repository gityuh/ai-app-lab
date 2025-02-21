import { useEffect, useState } from 'react';

import { useIndexedDB } from './useIndexedDB';

// 视频首帧图/音频背景图，在生成的时候记录
const useMediaRelevance = (storeUniqueId: string) => {
  const dbInstance = useIndexedDB(storeUniqueId);
  const [videoBackgroundImages, setVideoBackgroundImages] = useState<string[][]>([]);
  const [audioBackgroundImages, setAudioBackgroundImages] = useState<string[][]>([]);

  const updateAudioBackgroundImages = (params: ((prevData: string[][]) => string[][]) | string[][]) => {
    if (Array.isArray(params)) {
      setAudioBackgroundImages(params);
      if (dbInstance) {
        dbInstance.putItem({ audioBackgroundImages: params });
      }
      return;
    }

    // 传入函数
    setAudioBackgroundImages(prevData => {
      const newData = params(prevData);
      if (dbInstance) {
        dbInstance.putItem({ audioBackgroundImages: newData });
      }
      return newData;
    });
  };

  const updateVideoBackgroundImages = (params: ((prevData: string[][]) => string[][]) | string[][]) => {
    if (Array.isArray(params)) {
      setVideoBackgroundImages(params);
      if (dbInstance) {
        dbInstance.putItem({ videoBackgroundImages: params });
      }
      return;
    }

    // 传入函数
    setVideoBackgroundImages(prevData => {
      const newData = params(prevData);
      if (dbInstance) {
        dbInstance.putItem({ videoBackgroundImages: newData });
      }
      return newData;
    });
  };

  useEffect(() => {
    if (!dbInstance) {
      return;
    }
    (async () => {
      const data = await dbInstance.getItem();
      if (data) {
        setVideoBackgroundImages(data.videoBackgroundImages ?? []);
        setAudioBackgroundImages(data.audioBackgroundImages ?? []);
      }
    })();
  }, []);

  return {
    videoBackgroundImages,
    audioBackgroundImages,
    updateVideoBackgroundImages,
    updateAudioBackgroundImages,
  };
};

export default useMediaRelevance;
