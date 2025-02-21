import { useContext, useRef } from 'react';

import { WatchAndChatContext } from '../../WatchAndChatProvider/context';

export const usePlayBotOpeningRemark = () => {
  const { audioContextRef, analyserRef } = useContext(WatchAndChatContext);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const OpeningRemarkVoice =
    'https://lf3-static.bytednsdoc.com/obj/eden-cn/LM-STH-hahK/ljhwZthlaukjlkulzlp/ark/bot/watch_and_chat_demo/opening_remark.mp3';
  return (): Promise<void> =>
    new Promise(resolve => {
      fetch(OpeningRemarkVoice)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContextRef.current?.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          if (audioContextRef.current && audioBuffer) {
            const source = audioContextRef.current.createBufferSource();
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            analyser.connect(audioContextRef.current.destination);
            analyserRef.current = analyser;

            source.addEventListener('ended', () => {
              sourceRef.current = null;
              resolve();
            });
            source.buffer = audioBuffer;
            sourceRef.current = source;
            sourceRef.current.start(0);
          } else {
            resolve();
          }
        })
        .catch(error => {
          console.error('Error loading audio:', error);
          resolve();
        });
    });
};
