import { createContext } from 'react';

interface InjectContextType {
  api: any;
  slots: Record<string, (props: any) => JSX.Element>;
}

export const InjectContext = createContext<InjectContextType>({ api: {}, slots: {} });
