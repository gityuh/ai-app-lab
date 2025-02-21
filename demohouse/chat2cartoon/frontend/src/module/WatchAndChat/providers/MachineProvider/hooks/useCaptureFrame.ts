import { useContext } from 'react';

import { captureVideoFrame } from '@/utils/captureVideoFrame';

import { IWatchAndChatContext } from '../../../machines/types';
import { WatchAndChatContext } from '../../WatchAndChatProvider/context';

export const useCaptureFrame = () => {
  const { canvasRef, videoRef, streamRef } = useContext(WatchAndChatContext);
  return (ctx: IWatchAndChatContext) => {
    if (canvasRef.current && videoRef.current && streamRef.current) {
      ctx.imgB64 = captureVideoFrame(canvasRef.current, videoRef.current) || '';
    }
  };
};
