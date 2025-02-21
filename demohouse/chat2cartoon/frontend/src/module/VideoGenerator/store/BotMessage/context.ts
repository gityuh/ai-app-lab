import { createContext } from 'react';

import { VideoGeneratorBotMessage } from '../../types';

export const BotMessageContext = createContext<VideoGeneratorBotMessage>({} as never);
