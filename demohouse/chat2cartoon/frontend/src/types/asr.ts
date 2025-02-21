interface Word {
  end_time: number;
  start_time: number;
  text: string;
}

interface Utterance {
  definite: boolean;
  end_time: number;
  start_time: number;
  text: string;
  words: Word[];
}

interface Result {
  text: string;
  utterances: Utterance[];
}

interface AudioInfo {
  duration: number;
}

export interface AudioData {
  audio_info: AudioInfo;
  result: Result;
}
