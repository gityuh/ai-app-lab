import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

import { MessageItemProps } from '../../types';


export interface AnimateMessageProps {
  message: MessageItemProps['message'];
}

const AnimateMessage = (props: AnimateMessageProps) => {
  const { message } = props;

  return <Markdown remarkPlugins={[remarkBreaks]}>{message}</Markdown>;
};

export default AnimateMessage;
