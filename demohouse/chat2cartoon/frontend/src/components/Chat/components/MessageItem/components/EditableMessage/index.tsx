import { useState } from 'react';

import { Input } from '@arco-design/web-react';
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks';

export interface EditableMessageProps {
  message: string;
  isEdit?: boolean;
}

const EditableMessage = (props: EditableMessageProps) => {
  const { message, isEdit } = props;
  const [inputMessage, setInputMessage] = useState<string>(message);

  if (isEdit) {
    return <Input value={inputMessage} onChange={setInputMessage} autoFocus />;
  } else {
    return <Markdown remarkPlugins={[remarkBreaks]}>{message}</Markdown>;
  }
};

export default EditableMessage;
