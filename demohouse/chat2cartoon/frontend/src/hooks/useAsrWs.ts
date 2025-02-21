import { useRef } from 'react';

import type { ASRResponseData } from './LabASR';
import { encodeAudioOnlyRequest, encodeFullClientRequest, parseResponse } from './LabASR/utils';

const url = `wss://openspeech.bytedance.com/api/v3/sauc/bigmodel?api_access_key=iXGLq7xBbRypJ9xTuHtKGq8zJYhp2r9k&api_app_key=6294607933&api_resource_id=volc.bigasr.sauc.duration`;

export const useAsrWs = ({ onAsrResp }: { onAsrResp: (res_json: any) => void }) => {
  const wsRef = useRef<WebSocket>();
  const connect = () =>
    new Promise((resolve, reject) => {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        console.log('socket connected');
        const build = encodeFullClientRequest({
          user: {
            uid: 'Portal Experience Center',
          },
          audio: {
            format: 'pcm',
            rate: 16e3,
            bits: 16,
            channel: 1,
          },
          request: {
            // @ts-expect-error
            model_name: 'bigmodel',
            result_type: 'single',
            show_utterances: true,
            // vad_segment_duration 失效
            // 强制判停时间
            end_window_size: 600,
            // 强制语音时间
            force_to_speech_time: 1500,
          },
        });
        socket.send(build);
        resolve(socket);
      };

      socket.onmessage = async e => {
        try {
          const res_json: ASRResponseData = await parseResponse(e.data);
          onAsrResp?.(res_json);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      };

      socket.onerror = error => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      wsRef.current = socket;
    });
  return {
    readyState: wsRef.current?.readyState,
    sendAudio: (pcm: Blob) => {
      const data = encodeAudioOnlyRequest(pcm);
      wsRef.current?.send(data);
    },
    connect,
    close: () => {
      wsRef.current?.close();
      wsRef.current = undefined;
    },
  };
};
