import { AudioData } from '../types/asr';

/**
 * 处理 asr 响应
 * @description 每轮 asr 需要重连
 * @param res
 * @param onDefinite
 */
export const handleAsrResp = (res: AudioData, onDefinite: (text: string) => void) => {
  const utterances = res.result?.utterances;
  if (!utterances) {
    return;
  }
  const currentUtterance = utterances[0];

  const isDefinite = currentUtterance.definite;
  if (isDefinite) {
    onDefinite(currentUtterance.text);
  }
};
