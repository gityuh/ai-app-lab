import { useContext } from 'react';


import clsx from 'classnames';
import { IconRefresh } from '@arco-design/web-react/icon';

import { ChatWindowContext, Message } from '@/components/ChatWindowV2/context';
import { CopyButton } from '@/components/CopyButton';

import styles from './style.module.less';
import { ActionIcon } from '../ActionIcon';
import { MessageBranchChecker } from '../MessageBranchChecker';

interface Props {
  assistantMessage: Message;
  // eslint-disable-next-line react/boolean-prop-naming
  retryable: boolean;
  className?: string;
  isLastMessage?: boolean;
}

export const AnswerOperation = ({ assistantMessage, retryable, isLastMessage, className }: Props) => {
  const { retryMessage } = useContext(ChatWindowContext);

  const handleRebuild = () => {
    retryMessage();
  };

  return (
    <div className={clsx(styles.operation, className)}>
      {/* 重新生成 & 分支切换 */}
      {isLastMessage ? <MessageBranchChecker message={assistantMessage} /> : null}
      {retryable ? (
        <ActionIcon tips={'重新生成'} onClick={handleRebuild}>
          <IconRefresh />
        </ActionIcon>
      ) : null}
      {/* 复制 */}
      <CopyButton textToCopy={assistantMessage.content} />
    </div>
  );
};
