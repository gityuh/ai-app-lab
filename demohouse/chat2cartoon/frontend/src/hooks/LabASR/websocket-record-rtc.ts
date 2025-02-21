import RecordRTC, { StereoAudioRecorder } from 'recordrtc';
// import VAD from 'voice-activity-detection';

import { encodeFullClientRequest, encodeAudioOnlyRequest, parseResponse } from './utils';
import { ASRResponseData, IClientRequestData } from './types';

interface WebsocketRecordRtcParams {
  onVadStop?: () => void;
  onStart?: () => void;
  onMessage?: (data: string, fullData: ASRResponseData) => void;
  onClose?: () => void;
  onError?: (errMsg: string) => void;
  onWSError?: (errMsg: Event) => void;
}

interface ConnectParams {
  url: string;
  config: IClientRequestData;
  debug?: boolean;
}

export function WebsocketRecordRtc(params: WebsocketRecordRtcParams = {}) {
  const context = {
    ...params,
    webSocket: undefined as WebSocket | undefined,
    mediaStream: undefined as MediaStream | undefined,
    recorder: undefined as RecordRTC | undefined,
    audioContext: undefined as AudioContext | undefined,
    vad: undefined as any | undefined,
  };
  /**
   *
   * @param url 服务端提供Socket服务的URL接口
   * @param postData Socket建立连接时发送到服务端的数据
   * @param onStart Socket连接建立成功时的回调函数
   * @param onMessage Socket包到达时的处理函数
   * @param onClose Socket连接关闭时的回调函数
   */
  function connect({ url, config, debug = false }: ConnectParams) {
    const { onStart, onMessage, onClose, onError, onWSError } = context;
    const socket = new WebSocket(url);
    context.webSocket = socket;

    socket.onopen = () => {
      debug && console.info('socket connected');
      const build = encodeFullClientRequest(config);
      socket.send(build);
      onStart?.();
    };

    socket.onmessage = async e => {
      try {
        const res_json: ASRResponseData = await parseResponse(e.data);
        console.log('#res_json,', res_json);
        const text = res_json?.result?.text ?? '';
        onMessage?.(text, res_json);
      } catch (error) {
        onError?.(JSON.stringify(error));
        console.error(error);
      }
    };

    socket.onclose = () => {
      debug && console.info('socket onclose disconnected');
      onClose?.();
    };

    socket.onerror = err => {
      debug && console.info('socket onerror disconnected');
      onWSError?.(err);
    };
  }

  async function startRecord(options?: RecordRTC.Options, handleRecordResult?: (RecordResult: Blob) => void) {
    const { onVadStop } = context;

    context.mediaStream = await window.navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    context.audioContext = new AudioContext();

    context.recorder = new RecordRTC(context.mediaStream, {
      type: 'audio',
      recorderType: StereoAudioRecorder,
      mimeType: 'audio/wav',
      numberOfAudioChannels: 1,
      desiredSampRate: 16000,
      disableLogs: true,
      timeSlice: 100,
      ...options,
      ondataavailable(recordResult: Blob) {
        const socket = context.webSocket;
        if (!socket) {
          return;
        }

        handleRecordResult?.(recordResult);

        const pcm = recordResult.slice(44);
        const data = encodeAudioOnlyRequest(pcm);
        if (socket.readyState === socket.OPEN) {
          socket.send(data);
        }
      },
    });

    // let voiceActivityStartTime: number | null = null;
    // const voiceActivityMinDuration = 1000; // 语音活动最小持续时间（毫秒）
    //
    // context.vad = VAD(context.audioContext, context.mediaStream, {
    //   fftSize: 1024,
    //   bufferLen: 1024,
    //   smoothingTimeConstant: 0.2,
    //   minCaptureFreq: 50,
    //   maxCaptureFreq: 1000,
    //   noiseCaptureDuration: 2000,
    //   minNoiseLevel: 0.2,
    //   maxNoiseLevel: 0.9,
    //   avgNoiseMultiplier: 1.5,
    //   onVoiceStart() {
    //     voiceActivityStartTime = Date.now();
    //   },
    //   onVoiceStop() {
    //     console.log('VAD: Voice activity ended');
    //     context.recorder?.stopRecording(() => {
    //       onVadStop?.();
    //       stopRecord();
    //       context.vad?.destroy();
    //     });
    //     // if (voiceActivityStartTime) {
    //     //   const voiceActivityDuration = Date.now() - voiceActivityStartTime;
    //     //   console.log('####voiceActivityDuration', voiceActivityDuration);
    //     //   if (voiceActivityDuration >= voiceActivityMinDuration) {
    //     //     console.log('VAD: Voice activity ended');
    //     //     context.recorder?.stopRecording(() => {
    //     //       onVadStop?.();
    //     //       stopRecord();
    //     //       context.vad?.destroy();
    //     //     });
    //     //   }
    //     // }
    //   },
    //   onUpdate(val) {
    //     console.log('Current voice activity value:', val);
    //   },
    // });

    context.recorder.startRecording();
  }

  function stopRecord() {
    const { recorder, webSocket, mediaStream } = context;

    if (!recorder) {
      return;
    }

    recorder.stopRecording(() => {
      context.vad?.destroy();
      if (!webSocket) {
        return;
      }
      webSocket.close();

      mediaStream?.getAudioTracks().forEach(track => track.stop());
    });
  }

  return Object.freeze({
    connect,
    startRecord,
    stopRecord,
  });
}
