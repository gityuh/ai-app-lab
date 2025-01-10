// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// Licensed under the 【火山方舟】原型应用软件自用许可协议
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at 
//     https://www.volcengine.com/docs/82379/1433703
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License. 

import { decodeWebSocketResponse, pack } from '.';
import type { JSONResponse, WebRequest } from '@/types';
import { CONST } from '@/constant';

interface IVoiceBotService {
  ws_url: string;
  handleJSONMessage: (json: JSONResponse) => void;
  onStartPlayAudio: (data: ArrayBuffer) => void;
  onStopPlayAudio: () => void;
}
export default class VoiceBotService {
  private ws_url: string;
  private ws?: WebSocket;
  // private sonic:any;
  private audioCtx: AudioContext;
  private source: AudioBufferSourceNode | undefined;
  private audioChunks: ArrayBuffer[] = [];
  private handleJSONMessage: (json: JSONResponse) => void;
  private onStartPlayAudio: (data: ArrayBuffer) => void;
  private onStopPlayAudio: () => void;
  protected playing = false;
  constructor(props: IVoiceBotService) {
    this.ws_url = props.ws_url;
    this.audioCtx = new AudioContext();
    this.handleJSONMessage = props.handleJSONMessage;
    this.onStartPlayAudio = props.onStartPlayAudio;
    this.onStopPlayAudio = props.onStopPlayAudio;
  }
  public async connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.ws_url);
      ws.onopen = () => {
        this.ws = ws;
        resolve(ws);
      };
      ws.onerror = e => {
        reject(e);
        this.onError(e);
      };
      ws.onmessage = e => this.onMessage(e);
    });
  }

  // 发送消息
  public sendMessage(message: WebRequest) {
    const data = pack(message);
    this.ws?.send(data);
  }

  // 接收消息
  public onMessage(e: MessageEvent<any>) {
    try {
      e.data.arrayBuffer().then((buffer: ArrayBuffer) => {
        const resp = decodeWebSocketResponse(buffer);
        if (resp.messageType === CONST.SERVER_FULL_RESPONSE) {
          this.handleJSONMessage(resp.payload as JSONResponse);
        }
        if (resp.messageType === CONST.SERVER_AUDIO_ONLY_RESPONSE) {
          this.handleAudioOnlyResponse(resp.payload as ArrayBuffer);
        }
        // handleMessage?.(json);
      });
    } catch (e) {
      this.onError(e);
    }
  }
  private async handleAudioOnlyResponse(data: ArrayBuffer) {
    this.audioChunks.push(data);
    if (!this.playing) {
      this.onStartPlayAudio(data);
      this.playNextAudioChunk();
      this.playing = true;
    }
  }
  private async playNextAudioChunk() {
    const data = this.audioChunks.shift();
    if (!data) {
      this.onStopPlayAudio();
      this.playing = false;
      return;
    }
    const audioBuffer = await this.audioCtx.decodeAudioData(
      new Uint8Array(data).buffer,
    );
    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioCtx.destination);
    source.addEventListener('ended', () => this.playNextAudioChunk());
    this.source = source;
    source.start(0);
  }
  private onError(e: any) {
    console.error(e);
    this.dispose();
  }
  private dispose() {
    this.ws?.close();
    this.reset();
  }
  private reset() {
    this.audioChunks = [];
    this.source?.stop();
    this.source = undefined;
  }
}
