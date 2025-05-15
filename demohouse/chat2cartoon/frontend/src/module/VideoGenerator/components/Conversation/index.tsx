// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// Licensed under the 【火山方舟】原型应用软件自用许可协议
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at 
//     https://www.volcengine.com/docs/82379/1433703
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useContext, useMemo, useState } from 'react';

import { Button } from '@arco-design/web-react';

import { IconClean } from '@/images/iconBox';
import { ChatWindowContext } from '@/components/ChatWindowV2/context';
import { WatchAndChat } from '@/module/WatchAndChat';
import { useStartChatWithVideo } from '@/module/WatchAndChat/providers/WatchAndChatProvider/hooks/useStartChatWithVideo';
import { EMessageType } from '@/components/ChatWindowV2/context';

import { RenderedMessagesContext } from '../../store/RenderedMessages/context';
import styles from './index.module.less';
import ChatArea from '../ChatArea';
import { VideoGeneratorMessageType, VideoGeneratorTaskPhase, ComplexMessage } from '../../types';
import { FlowMiniMap } from '../FlowMiniMap';
import { usePlaceholderInfo } from './hooks/usePlaceholderInfo';
import { useScrollToBottom } from '../../hooks/useScrollToBottom';
import { Placeholder } from './components/Placeholder';
import { MessageInput } from './components/MessageInput';
import { InjectContext } from '../../store/Inject/context';
import EditStoryboard from '../EditStoryboard';


const Conversation = () => {
  const { slots } = useContext(InjectContext);
  const { LimitIndicator } = slots;
  const { messages, sending, assistantInfo, sendMessageFromInput, startReply, insertBotEmptyMessage } =
    useContext(ChatWindowContext);
  const { miniMapRef, renderedMessages, finishPhase, autoNext, resetMessages, correctDescription } =
    useContext(RenderedMessagesContext);

  const placeholderInfoShow = usePlaceholderInfo({ assistant: assistantInfo });

  const showMessageList = useMemo(() => messages.length > 0, [messages]);

  const { scrollRef: chatMessageListRef, setAutoScroll } = useScrollToBottom(!autoNext);

  const [showEditStoryboard, setShowEditStoryboard] = useState(false);
  const [storyboardContent, setStoryboardContent] = useState('');

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

  const isStoryboardGenerated = useMemo(() => 
    finishPhase === VideoGeneratorTaskPhase.PhaseStoryBoard, 
    [finishPhase]
  );

  return (
    <div className={styles.conversationWrapper}>
      <div className={styles.displayBar}>
        <FlowMiniMap ref={miniMapRef} />
        {isStoryboardGenerated && (
          <Button 
            className={styles.editStoryboardBtn}
            onClick={() => {
              // 获取分镜脚本内容
              const storyboard = renderedMessages.find(
                msg => msg.role === 'assistant' && 
                       msg.type === VideoGeneratorMessageType.Multiple && 
                       'phaseMessageMap' in msg && 
                       msg.phaseMessageMap[VideoGeneratorTaskPhase.PhaseStoryBoard]
              ) as ComplexMessage | undefined;
              
              if (storyboard && storyboard.phaseMessageMap) {
                const storyboardPhase = storyboard.phaseMessageMap[VideoGeneratorTaskPhase.PhaseStoryBoard];
                if (storyboardPhase && storyboardPhase.length > 0) {
                  // 获取最新的分镜内容
                  const lastStoryboard = storyboardPhase[storyboardPhase.length - 1];
                  const messageContent = lastStoryboard.versions[lastStoryboard.currentVersion].find(
                    (msg: any) => msg.type === EMessageType.Message
                  );
                  
                  if (messageContent) {
                    // 去掉前缀"phase=StoryBoard"
                    const content = messageContent.content.replace(/^phase=StoryBoard\s*\n*/i, '').trim();
                    setStoryboardContent(content);
                    setShowEditStoryboard(true);
                  }
                }
              }
            }}
          >
            编辑分镜脚本
          </Button>
        )}
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
      {showEditStoryboard && (
        <EditStoryboard
          visible={showEditStoryboard}
          content={storyboardContent}
          onOk={(newContent: string) => {
            setShowEditStoryboard(false);
            correctDescription(VideoGeneratorTaskPhase.PhaseStoryBoard, newContent);
          }}
          onCancel={() => setShowEditStoryboard(false)}
        />
      )}
    </div>
  );
};

export default Conversation;
