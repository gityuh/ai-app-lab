import { useContext, useMemo } from 'react';

import { Button } from '@arco-design/web-react';

import { IconClean } from '@/images/iconBox';
import { ChatWindowContext } from '@/components/ChatWindowV2/context';
import { WatchAndChat } from '@/module/WatchAndChat';
import { useStartChatWithVideo } from '@/module/WatchAndChat/providers/WatchAndChatProvider/hooks/useStartChatWithVideo';

import { RenderedMessagesContext } from '../../store/RenderedMessages/context';
import styles from './index.module.less';
import ChatArea from '../ChatArea';
import { VideoGeneratorMessageType, VideoGeneratorTaskPhase } from '../../types';
import { FlowMiniMap } from '../FlowMiniMap';
import { usePlaceholderInfo } from './hooks/usePlaceholderInfo';
import { useScrollToBottom } from '../../hooks/useScrollToBottom';
import { Placeholder } from './components/Placeholder';
import { MessageInput } from './components/MessageInput';
import { InjectContext } from '../../store/Inject/context';


const Conversation = () => {
  const { slots } = useContext(InjectContext);
  const { LimitIndicator } = slots;
  const { messages, sending, assistantInfo, sendMessageFromInput, startReply, insertBotEmptyMessage } =
    useContext(ChatWindowContext);
  const { miniMapRef, renderedMessages, finishPhase, autoNext, resetMessages } =
    useContext(RenderedMessagesContext);

  const placeholderInfoShow = usePlaceholderInfo({ assistant: assistantInfo });

  const showMessageList = useMemo(() => messages.length > 0, [messages]);

  const { scrollRef: chatMessageListRef, setAutoScroll } = useScrollToBottom(!autoNext);

  const handleScroll = (e: HTMLElement) => {
    if (autoNext) {
      return;
    }
    const bottomHeight = e.scrollTop + e.clientHeight;
    const isHitBottom = e.scrollHeight - bottomHeight <= 150;

    setAutoScroll(isHitBottom);
  };

  const handleSend = (value = '') => {
    if (!value || sending) {
      return;
    }
    miniMapRef.current?.close();
    // 用户消息加入到列表
    sendMessageFromInput(value);

    // 插入 bot 占位
    setTimeout(() => {
      insertBotEmptyMessage();
      // 请求接口
      startReply();
    }, 10);
  };

  const getPlaceHolderProps = () => ({
    chatStarted: showMessageList,
    onQuestionClick: handleSend,
    ...placeholderInfoShow,
  });

  const { visible: isFullScreen } = useStartChatWithVideo();

  return (
    <div className={styles.conversationWrapper}>
      <div className={styles.displayBar}>
        <FlowMiniMap ref={miniMapRef} />
      </div>
      <div className={styles.conversationContainer}>
        <div
          className={styles.conversationChatAreaContainer}
          ref={chatMessageListRef}
          onScroll={e => handleScroll(e.currentTarget)}
        >
          <div className="h-full">
            <Placeholder {...(getPlaceHolderProps() as any)} />
            <ChatArea messages={renderedMessages} />
          </div>
        </div>
        {!renderedMessages.find(item => item.type === VideoGeneratorMessageType.Multiple) && !isFullScreen && (
          <div className={styles.conversationInputContainer}>
            <>
              {!finishPhase ||
                ([VideoGeneratorTaskPhase.PhaseScript, VideoGeneratorTaskPhase.PhaseStoryBoard].includes(
                  finishPhase as VideoGeneratorTaskPhase,
                ) && (
                  <div className={styles.resetBtnWrapper}>
                    <Button
                      className={styles.resetBtn}
                      size="small"
                      icon={<IconClean />}
                      onClick={() => {
                        resetMessages();
                      }}
                    >
                      {'清空当前对话'}
                    </Button>
                  </div>
                ))}
            </>
            <MessageInput
              activeSendBtn={true}
              autoFocus
              placeholder={
                '请输入问题，体验智能体能力'
              }
              canSendMessage={!sending}
              sendMessage={handleSend}
              extra={inputValue => LimitIndicator && <LimitIndicator text={inputValue} />}
            />
          </div>
        )}
        <WatchAndChat />
      </div>
    </div>
  );
};

export default Conversation;
