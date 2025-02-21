import { assign, createMachine } from 'xstate';

import { IWatchAndChatContext } from './types';

export const watchAndChatMachine = createMachine<IWatchAndChatContext>({
  context: {
    videoStatus: 'paused' as const,
    sseDone: false,
    //
    userPrompt: '',
    imgB64: '',
  },
  id: 'WatchAndChat',
  initial: 'idle',
  on: {
    EXIT: {
      target: 'idle',
      actions: [
        {
          type: 'stopBotAudio',
        },
        {
          type: 'stopRecord',
        },
        {
          type: 'releaseMedia',
        },
      ],
    },
  },
  states: {
    idle: {
      on: {
        INIT: {
          target: 'INITING',
        },
      },
    },
    NO_ACCESS: {
      on: {
        INIT: {
          target: 'INITING',
        },
      },
    },
    INITING: {
      entry: {
        type: 'loadVideo',
      },
      invoke: {
        onDone: {
          target: 'BotWelcome',
        },
        onError: {
          target: 'NO_ACCESS',
        },
        src: 'getUserMedia',
      },
    },
    BotWelcome: {
      invoke: {
        onDone: {
          target: '#WatchAndChat.Chat.UserSpeaking',
        },
        src: 'playBotOpeningRemark',
      },
    },
    Chat: {
      initial: 'UserSpeaking',
      on: {
        WatchVideo: {
          target: '#WatchAndChat.VideoPlaying',
          actions: [
            {
              type: 'stopRecord',
            },
            {
              type: 'stopBotAudio',
            },
            {
              type: 'playVideo',
            },
          ],
        },
      },
      states: {
        UserSpeaking: {
          invoke: {
            onDone: {
              target: 'BotThinking',
              actions: [
                assign({
                  userPrompt: (context, event) => event.data,
                }),
                {
                  type: 'captureFrame',
                },
              ],
            },
            src: 'recognizeUserAudioText',
          },
          entry: [
            {
              type: 'pauseVideo',
            },
          ],
        },
        BotThinking: {
          on: {
            AUDIO_RECEIVE: {
              target: 'BotSpeaking',
              actions: {
                type: 'updateAudioData',
              },
            },
          },
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          invoke: {
            src: 'botChatCompletion',
            onDone: {
              actions: [
                assign({
                  sseDone: () => true,
                }),
              ],
            },
          },
          entry: [
            {
              type: 'stopRecord',
            },
            assign({
              sseDone: () => false,
            }),
          ],
        },
        BotSpeaking: {
          on: {
            AUDIO_RECEIVE: {
              target: 'BotSpeaking',
              actions: {
                type: 'updateAudioData',
              },
            },
            SSE_DONE: {
              target: 'BotSpeaking',
              actions: { type: 'markAudioDataFinished' },
            },
          },
          invoke: {
            onDone: {
              target: 'UserSpeaking',
            },
            src: 'playBotAudio',
          },
        },
      },
    },
    VideoPlaying: {
      on: {
        ChatBot: {
          target: '#WatchAndChat.Chat.UserSpeaking',
          actions: {
            type: 'pauseVideo',
          },
        },
      },
    },
  },
});
