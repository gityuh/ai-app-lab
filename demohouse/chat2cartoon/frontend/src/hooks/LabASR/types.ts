export interface IClientRequestData {
  app: {
    appid: string;
    token: string;
    auth_method: string;
    cluster: string;
  };
  user: {
    uid: string;
  };
  audio: {
    format: string;
    rate: number;
    bits: number;
    channel: number;
  };
  request: {
    reqid: string;
    workflow: string;
    sequence: number;
    show_utterances?: boolean;
    show_volume_v2?: boolean;
    show_speech_rate?: boolean;
  };
}

export interface Word {
  blank_duration: number;
  end_time: number;
  start_time: number;
  text: string;
}

export interface Utterance {
  definite: boolean;
  end_time: number;
  start_time: number;
  text: string;
  words: Word[];
}

export interface Result {
  text: string;
  utterances: Utterance[];
}

export interface AudioInfo {
  duration: number;
}

export interface ASRResponseData {
  audio_info: AudioInfo;
  result: Result;
}
