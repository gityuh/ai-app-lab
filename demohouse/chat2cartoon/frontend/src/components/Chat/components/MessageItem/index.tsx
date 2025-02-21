import { memo } from 'react';

import { MessageItemProps } from './types';
import Avatar from './components/Avatar';
import MessageContent from './components/MessageContent';
import ErrorContent from './components/ErrorContent';
import styles from './style/index.module.less';

/**
 * 消息项
 * @param message 消息内容
 * @param avatar 头像
 * @param errorMessage 错误消息
 * @param isAnimate 是否动画
 * @param className 类名
 * @param style 样式
 * @param renderMessage 渲染消息
 * @param renderAnimateMessage 渲染动画消息
 * @param renderErrorMessage 渲染错误消息
 * @constructor
 */
const MessageItem = ({
  message,
  avatar,
  errorMessage,
  isAnimate,
  className,
  style,
  renderMessage,
  renderAnimateMessage,
  renderErrorMessage,
  messageClassName,
}: MessageItemProps) => (
  <div className={`${styles.arkUiChatMessageItem} ${className}`} style={style}>
    <Avatar avatar={avatar} />
    {errorMessage ? (
      <ErrorContent errorMessage={errorMessage} renderErrorMessage={renderErrorMessage} />
    ) : (
      <MessageContent
        // @ts-expect-error
        className={messageClassName}
        message={message}
        isAnimate={isAnimate}
        renderMessage={renderMessage}
        renderAnimateMessage={renderAnimateMessage}
      />
    )}
  </div>
);

export default memo(MessageItem);
