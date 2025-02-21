import { FC, useEffect, useState } from 'react';

import { MessageItemProps } from '../../types';
import EditableMessage from '../EditableMessage';
import AnimateMessage from '../AnimateMessage';
import styles from './index.module.less';

export interface MessageContentProps {
  message: MessageItemProps['message'];
  isAnimate?: MessageItemProps['isAnimate'];
  editable?: MessageItemProps['editable'];
  renderMessage?: MessageItemProps['renderMessage'];
  renderAnimateMessage?: MessageItemProps['renderAnimateMessage'];
  messageExtra?: MessageItemProps['messageExtra'];
}

const MessageContent: FC<MessageContentProps> = ({
  message,
  isAnimate,
  editable,
  renderMessage,
  renderAnimateMessage,
  messageExtra,
}) => {
  const [showAnimation, setShowAnimation] = useState(isAnimate);

  useEffect(() => {
    let timer: number;

    if (isAnimate) {
      setShowAnimation(true);
    } else if (!isAnimate && showAnimation) {
      // 假设动画持续时间为 500 毫秒
      timer = window.setTimeout(() => {
        setShowAnimation(false);
      }, 500);
    }

    return () => clearTimeout(timer);
  }, [isAnimate, showAnimation]);

  const animateMessage = renderAnimateMessage ? renderAnimateMessage(message) : <AnimateMessage message={message} />;

  if (showAnimation) {
    return <div className={styles.ani}>{animateMessage}</div>;
  }

  return (
    <>
      {renderMessage ? renderMessage(message) : <EditableMessage message={message} />}
      {messageExtra && !editable ? <div>{messageExtra}</div> : null}
    </>
  );
};

export default MessageContent;
