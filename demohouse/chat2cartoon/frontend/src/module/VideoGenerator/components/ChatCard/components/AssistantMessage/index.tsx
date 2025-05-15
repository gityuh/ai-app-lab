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

import { useContext, useEffect, useState, useRef } from 'react';

import { Alert, Message } from '@arco-design/web-react';
import clsx from 'classnames';
import { IconRefresh } from '@arco-design/web-react/icon';

import DoubaoImg from '@/images/assets/doubao.png';
import { ReactComponent as IconAiEdit } from '@/images/icon_ai_edit.svg';
import { ReactComponent as IconAiBulb } from '@/images/icon_ai_bulb.svg';
import MessageContent from '@/components/Chat/components/MessageItem/components/MessageContent';
import { ChatWindowContext, Message as MessageType, EMessageType, BotMessage } from '@/components/ChatWindowV2/context';
import { Assistant } from '@/types/assistant';
import { responseForTextRiskReplace } from '@/constant';

import { BotMessageContext } from '../../../../store/BotMessage/context';
import styles from './index.module.less';
import ColorfulButton from '../../../ColorfulButton';
import { RenderedMessagesContext } from '../../../../store/RenderedMessages/context';
import { VideoGeneratorTaskPhase, UserConfirmationDataKey, ComplexMessage, VideoGeneratorMessageType } from '../../../../types';
import { MessageBranchChecker } from '../../../Conversation/components/MessageBranchChecker';
import EditStoryboard from '../../../EditStoryboard';

interface AssistantMessageProps extends MessageType {
  phase?: string;
}

const AssistantMessage = (message: AssistantMessageProps) => {
  const { content, finish_reason, phase, id } = message;
  const [isLengthExceed, setIsLengthExceed] = useState(false);
  const [isContentFilter, setIsContentFilter] = useState(false);
  const [showEditStoryboard, setShowEditStoryboard] = useState(false);
  const [storyboardContent, setStoryboardContent] = useState('');
  const [localContent, setLocalContent] = useState(content);
  const latestContentRef = useRef(''); // 用于保存最新修改后的内容
  
  // 通过topMessage的finish 来判断是否可以操作
  const topMessage = useContext(BotMessageContext);
  const { 
    assistantInfo, 
    retryMessage, 
    messages, 
    setMessages, 
    sendMessageImplicitly,
    insertBotEmptyMessage,
    startReply
  } = useContext(ChatWindowContext);
  const { 
    sendNextMessage, 
    updateAutoNext, 
    updateConfirmationMessage,
    renderedMessages,
    userConfirmData,
    regenerateMessageByPhase
  } = useContext(RenderedMessagesContext);
  const assistantData = assistantInfo as Assistant & { Extra?: any };
  const findModelInfo = assistantData?.Extra?.Models?.find((item: any) => {
    if (Array.isArray(item.Used)) {
      return item.Used.includes(phase);
    }
    return false;
  });
  const modelInfo = {
    displayName: findModelInfo?.Name || '',
    modelName: findModelInfo?.ModelName || '',
    imgSrc: findModelInfo?.Icon || '',
  };

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleNext = async () => {
    if (topMessage.phase === VideoGeneratorTaskPhase.PhaseStoryBoard) {
      updateAutoNext(true);
    }
    if (topMessage.phase === VideoGeneratorTaskPhase.PhaseScript) {
      sendNextMessage('生成分镜脚本', false);
    } else {
      sendNextMessage('开始生成视频', false);
    }
  };

  // 获取最新的分镜脚本内容
  const getLatestStoryboardContent = () => {
    // 如果有缓存的最新内容，优先返回
    if (latestContentRef.current) {
      return latestContentRef.current;
    }
    
    // 从消息列表中找到最新的分镜脚本消息
    const storyboardMessage = messages.find(msg => {
      if (msg.role !== 'assistant') return false;
      
      // 确保是BotMessage类型
      const botMsg = msg as BotMessage;
      if (!botMsg.versions || !botMsg.currentVersion) return false;
      
      return botMsg.versions[botMsg.currentVersion].some(ver => 
        ver.type === EMessageType.Message && 
        ver.content.startsWith(`phase=${VideoGeneratorTaskPhase.PhaseStoryBoard}`)
      );
    }) as BotMessage | undefined;

    if (storyboardMessage) {
      const latestVersion = storyboardMessage.versions[storyboardMessage.currentVersion];
      const contentMsg = latestVersion.find(
        ver => ver.type === EMessageType.Message && 
        ver.content.startsWith(`phase=${VideoGeneratorTaskPhase.PhaseStoryBoard}`)
      );
      
      if (contentMsg) {
        // 去掉前缀"phase=StoryBoard"
        const content = contentMsg.content.replace(/^phase=StoryBoard\s*\n*/i, '').trim();
        latestContentRef.current = content; // 缓存最新内容
        return content;
      }
    }
    
    // 如果找不到，则使用当前content（向后兼容）
    const content = localContent.replace(/^phase=StoryBoard\s*\n*/i, '').trim();
    latestContentRef.current = content; // 缓存最新内容
    return content;
  };

  const handleEditStoryboard = () => {
    try {
      // 每次打开编辑窗口时，重新获取最新内容
      const latestContent = getLatestStoryboardContent();
      console.log('获取到的最新分镜脚本内容:', latestContent);
      setStoryboardContent(latestContent);
      setShowEditStoryboard(true);
    } catch (error) {
      console.error('获取分镜脚本内容失败:', error);
      Message.error('获取分镜脚本内容失败，请重试');
    }
  };

  // 使用regenerateMessageByPhase直接更新分镜脚本，确保所有地方都能看到最新内容
  const updateStoryboardWithConfirmation = (newContent: string) => {
    try {
      // 1. 更新确认数据
      updateConfirmationMessage({
        [UserConfirmationDataKey.StoryBoards]: newContent
      });
      
      // 2. 发送CONFIRMATION消息，触发系统重新处理分镜脚本
      // 构造确认消息，包含所有确认数据
      const confirmationData = {
        ...userConfirmData,
        [UserConfirmationDataKey.StoryBoards]: newContent
      };
      
      // 3. 使用regenerateMessageByPhase重新生成分镜脚本
      if (regenerateMessageByPhase) {
        regenerateMessageByPhase(VideoGeneratorTaskPhase.PhaseStoryBoard, {
          [UserConfirmationDataKey.StoryBoards]: newContent
        });
        return true;
      } else {
        // 备用方案：如果没有regenerateMessageByPhase，尝试模拟用户发送消息
        try {
          // 发送隐藏消息，触发重新生成
          const jsonStr = JSON.stringify(confirmationData);
          const confirmationContent = `CONFIRMATION ${jsonStr}`;
          
          // 使用ChatWindowContext中的方法发送确认消息
          sendMessageImplicitly(confirmationContent);
          
          // 插入 bot 占位
          setTimeout(() => {
            insertBotEmptyMessage();
            // 请求接口
            startReply();
          }, 10);
          
          return true;
        } catch (err) {
          console.error('发送确认消息失败:', err);
          throw err;
        }
      }
    } catch (error) {
      console.error('更新分镜脚本失败:', error);
      throw error;
    }
  };

  // 更新当前消息内容并保存，确保整个页面都能看到最新内容
  const updateMessageContent = (newContent: string) => {
    try {
      // 更新内容缓存引用
      latestContentRef.current = newContent;
      
      // 更新本地内容以显示更新后的内容
      setLocalContent(`phase=${VideoGeneratorTaskPhase.PhaseStoryBoard}\n${newContent}`);
      
      // 确保下次打开编辑窗口时能获取到最新内容
      setStoryboardContent(newContent);
      
      // 尝试持久化保存
      try {
        localStorage.setItem('storyboard_content', newContent);
        localStorage.setItem('storyboard_update_timestamp', Date.now().toString());
      } catch (e) {
        console.error('保存到localStorage失败:', e);
      }
      
      // 更新原始消息列表中的内容
      const messageIndex = messages.findIndex(msg => {
        if (msg.role !== 'assistant') return false;
        
        // 确保是BotMessage类型
        const botMsg = msg as BotMessage;
        if (!botMsg.versions || !botMsg.currentVersion) return false;
        
        return botMsg.versions[botMsg.currentVersion].some(ver => 
          ver.type === EMessageType.Message && 
          ver.content.startsWith(`phase=${VideoGeneratorTaskPhase.PhaseStoryBoard}`)
        );
      });
      
      if (messageIndex !== -1) {
        // 克隆消息数组
        const newMessages = [...messages];
        const currentMessage = JSON.parse(JSON.stringify(newMessages[messageIndex])) as BotMessage;
        
        // 创建新版本
        currentMessage.currentVersion = currentMessage.currentVersion + 1;
        currentMessage.versions[currentMessage.currentVersion] = [
          {
            id: Date.now(),
            type: EMessageType.Message,
            content: `phase=${VideoGeneratorTaskPhase.PhaseStoryBoard}\n${newContent}`,
            finish: true,
            logid: '',
            finish_reason: 'stop',
          }
        ];
        
        // 更新消息数组
        newMessages[messageIndex] = currentMessage;
        setMessages(newMessages);
      }
    } catch (error) {
      console.error('更新消息内容失败:', error);
    }
  };

  useEffect(() => {
    if (finish_reason === 'length') {
      setIsLengthExceed(true);
    } else if (finish_reason === 'content_filter') {
      setIsContentFilter(true);
    }
  }, [finish_reason]);

  return (
    <div
      className={clsx(
        `mb-[20px] break-all assistant-message-container bg-white rounded-lg border p-[16px] ${styles.assistantMdBoxContainer}`,
      )}
    >
      {isContentFilter ? (
        <MessageContent message={responseForTextRiskReplace.modelResponse} isAnimate={!topMessage.finish} />
      ) : (
        <MessageContent message={localContent} isAnimate={!topMessage.finish} />
      )}
      {isLengthExceed ? (
        <Alert
          className="mt-[8px]"
          type="warning"
          content={
            '当前对话前后文信息已达该模型 tokens 数上限，输出文本可能不完整。建议您可以减少输入文本长度'
          }
        />
      ) : null}
      <div className={styles.footWrapper}>
        <div className={styles.operation}>
          {topMessage.finish && topMessage.isLastMessage ? (
            <div className={styles.button}>
              <MessageBranchChecker message={message} />
              <IconRefresh fontSize={16} onClick={retryMessage} style={{ cursor: 'pointer' }} />
            </div>
          ) : null}
        </div>
        <div className={styles.info}>
          {modelInfo?.modelName ? (
            <div className={styles.model}>
              <img src={modelInfo?.imgSrc || DoubaoImg} />
              <div className={styles.name}>{modelInfo?.displayName}</div>
            </div>
          ) : null}
        </div>
      </div>
      {topMessage.finish && topMessage.isLastMessage && topMessage.phase ? (
        <div className={styles.buttonsContainer}>
          {topMessage.phase === VideoGeneratorTaskPhase.PhaseStoryBoard && (
            <ColorfulButton className={styles.operateButton} mode="default" onClick={handleEditStoryboard}>
              <div className={styles.operateWrapper}>
                <IconAiEdit className={styles.operateIcon} />
                {'修改分镜脚本'}
              </div>
            </ColorfulButton>
          )}
          <ColorfulButton className={styles.operateButton} mode="active" onClick={handleNext}>
            {topMessage.phase === VideoGeneratorTaskPhase.PhaseScript ? (
              <div className={styles.operateWrapper}>
                <IconAiEdit className={styles.operateIcon} />
                {'生成分镜脚本'}
              </div>
            ) : (
              <div className={styles.operateWrapper}>
                <IconAiBulb className={styles.operateIcon} />
                {'开始生成视频'}
              </div>
            )}
          </ColorfulButton>
        </div>
      ) : null}
      {showEditStoryboard && (
        <EditStoryboard
          visible={showEditStoryboard}
          content={storyboardContent}
          onOk={(newContent: string) => {
            try {
              if (!newContent || newContent.trim() === '') {
                Message.error('分镜脚本内容不能为空');
                return;
              }
              
              // 1. 使用更直接的方法更新分镜脚本
              const success = updateStoryboardWithConfirmation(newContent);
              
              // 2. 同时更新本地内容显示
              updateMessageContent(newContent);
              
              // 3. 提示用户保存成功
              Message.success('分镜脚本保存成功');
              setShowEditStoryboard(false);
            } catch (error) {
              console.error('保存分镜脚本失败:', error);
              Message.error('保存分镜脚本失败，请重试');
            }
          }}
          onCancel={() => setShowEditStoryboard(false)}
        />
      )}
    </div>
  );
};

export default AssistantMessage;

