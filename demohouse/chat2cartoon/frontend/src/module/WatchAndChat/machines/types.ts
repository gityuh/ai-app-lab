export interface IWatchAndChatContext {
  videoStatus: 'paused' | 'playing';
  sseDone: boolean;

  userPrompt: string;
  imgB64: string;
}
