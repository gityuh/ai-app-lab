import { useContext } from 'react';

import { MachineContext } from './context';

export const useWatchAndChatMachine = () => {
  const { state, send, machine } = useContext(MachineContext);
  return {
    state,
    send,
    machine,
  };
};
