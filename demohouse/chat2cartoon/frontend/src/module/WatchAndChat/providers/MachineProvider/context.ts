import { createContext } from 'react';

import { State } from 'xstate';

import { IWatchAndChatContext } from '../../machines/types';

interface IMachineContext {
  state: State<IWatchAndChatContext>;
  send: any;
  machine: any;
}

export const MachineContext = createContext<IMachineContext>({} as unknown as never);
