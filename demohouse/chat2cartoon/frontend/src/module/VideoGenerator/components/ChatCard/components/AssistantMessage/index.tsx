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

import { Alert, Message, Modal, Input, Button } from '@arco-design/web-react';
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

// 为存储内容添加会话ID前缀，以区分不同会话的缓存
const getStorageKeyWithPrefix = (baseKey: string) => {
  // 使用当前URL中的会话标识(如果存在)
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId') || '';
  
  if (sessionId) {
    return `${baseKey}_${sessionId}`;
  }
  return baseKey;
};

// 获取当前会话ID
const getCurrentSessionId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('sessionId') || '';
};

const AssistantMessage = (message: AssistantMessageProps) => {
  const { content, finish_reason, phase, id } = message;
  const [isLengthExceed, setIsLengthExceed] = useState(false);
  const [isContentFilter, setIsContentFilter] = useState(false);
  const [showEditStoryboard, setShowEditStoryboard] = useState(false);
  const [showEditStory, setShowEditStory] = useState(false);
  const [storyboardContent, setStoryboardContent] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [localContent, setLocalContent] = useState(content);
  const latestContentRef = useRef(''); // 用于保存最新修改后的内容
  const contentUpdatedRef = useRef(false); // 用于标记内容是否已更新
  const latestStoryContentRef = useRef(''); // 用于保存最新故事内容
  const storyContentUpdatedRef = useRef(false); // 用于标记故事内容是否已更新
  const sessionIdRef = useRef(getCurrentSessionId()); // 记录当前会话ID
  const isNewSession = useRef(true); // 标记是否是新会话
  
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

  // 检查是否为新会话
  useEffect(() => {
    // 检查是否有会话历史记录
    const lastSessionId = localStorage.getItem('last_session_id');
    const currentSessionId = sessionIdRef.current;
    
    // 如果是新的会话ID，或者找不到上一个会话ID，则认为是新会话
    if (currentSessionId && lastSessionId && currentSessionId !== lastSessionId) {
      isNewSession.current = true;
      console.log('检测到新会话，将不使用上一次的缓存内容');
      clearAllCachedContent(); // 清除所有缓存
    } else {
      isNewSession.current = false;
    }
    
    // 更新最新的会话ID
    if (currentSessionId) {
      localStorage.setItem('last_session_id', currentSessionId);
    }
  }, []);

  // 清除所有缓存内容
  const clearAllCachedContent = () => {
    try {
      console.log('清除所有缓存的故事和分镜脚本内容');
      
      // 清除所有相关localStorage项
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('story_content') || key.includes('storyboard_content') || 
            key.includes('story_update_timestamp') || key.includes('storyboard_update_timestamp'))) {
          keysToRemove.push(key);
        }
      }
      
      // 删除匹配的键
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // 重置内存缓存
      latestContentRef.current = '';
      latestStoryContentRef.current = '';
      contentUpdatedRef.current = false;
      storyContentUpdatedRef.current = false;
    } catch (e) {
      console.error('清除缓存内容失败:', e);
    }
  };
  
  // 额外的检测：故事阶段第一条消息 - 清除历史缓存
  useEffect(() => {
    // 当处于故事阶段且为第一条消息时，作为新故事开始处理
    if (topMessage.phase === VideoGeneratorTaskPhase.PhaseScript && messages.length <= 2) {
      console.log('检测到新故事开始，清除历史缓存');
      clearAllCachedContent();
    }
  }, [topMessage.phase, messages.length]);

  // 额外的检测：检查故事内容是否完全不同，如果完全不同则视为新故事
  useEffect(() => {
    if (topMessage.phase === VideoGeneratorTaskPhase.PhaseScript && !storyContentUpdatedRef.current) {
      const currentStoryContent = content.replace(/^phase=Script\s*\n*/i, '').trim();
      
      // 尝试获取缓存的故事内容
      const storageKey = getStorageKeyWithPrefix('story_content');
      const savedContent = localStorage.getItem(storageKey);
      
      if (savedContent && currentStoryContent) {
        // 如果内容完全不同，则视为新故事，清除缓存
        const similarity = calculateSimilarity(savedContent, currentStoryContent);
        console.log('故事内容相似度:', similarity);
        
        if (similarity < 0.5) { // 相似度低于50%视为新故事
          console.log('检测到内容变化较大，视为新故事，清除历史缓存');
          clearAllCachedContent();
        }
      }
    }
  }, [content, topMessage.phase]);
  
  // 计算两个文本的相似度 (0-1之间)
  const calculateSimilarity = (text1: string, text2: string): number => {
    if (!text1 || !text2) return 0;
    if (text1 === text2) return 1;
    
    // 简单的方法：计算较长文本中包含较短文本的百分比
    const shorter = text1.length < text2.length ? text1 : text2;
    const longer = text1.length < text2.length ? text2 : text1;
    
    // 将文本拆分为词或句子进行比较
    const shorterWords = shorter.split(/\s+/).filter(w => w.length > 3);
    const longerWords = longer.split(/\s+/);
    
    let matchCount = 0;
    for (const word of shorterWords) {
      if (longerWords.includes(word)) {
        matchCount++;
      }
    }
    
    return shorterWords.length > 0 ? matchCount / shorterWords.length : 0;
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

  // 获取最新的故事内容
  const getLatestStoryContent = () => {
    // 如果有缓存的最新内容，优先返回
    if (latestStoryContentRef.current) {
      return latestStoryContentRef.current;
    }
    
    // 从消息列表中找到最新的故事内容消息
    const storyMessage = messages.find(msg => {
      if (msg.role !== 'assistant') return false;
      
      // 确保是BotMessage类型
      const botMsg = msg as BotMessage;
      if (!botMsg.versions || !botMsg.currentVersion) return false;
      
      return botMsg.versions[botMsg.currentVersion].some(ver => 
        ver.type === EMessageType.Message && 
        ver.content.startsWith(`phase=${VideoGeneratorTaskPhase.PhaseScript}`)
      );
    }) as BotMessage | undefined;

    if (storyMessage) {
      const latestVersion = storyMessage.versions[storyMessage.currentVersion];
      const contentMsg = latestVersion.find(
        ver => ver.type === EMessageType.Message && 
        ver.content.startsWith(`phase=${VideoGeneratorTaskPhase.PhaseScript}`)
      );
      
      if (contentMsg) {
        // 去掉前缀"phase=Script"
        const content = contentMsg.content.replace(/^phase=Script\s*\n*/i, '').trim();
        latestStoryContentRef.current = content; // 缓存最新内容
        return content;
      }
    }
    
    // 如果找不到，则使用当前content（向后兼容）
    if (topMessage.phase === VideoGeneratorTaskPhase.PhaseScript) {
      const content = localContent.replace(/^phase=Script\s*\n*/i, '').trim();
      latestStoryContentRef.current = content; // 缓存最新内容
      return content;
    }
    
    return ''; // 默认返回空字符串
  };

  // 更新原始消息列表中的内容 - 分镜脚本
  const updateOriginalMessage = (newContent: string, phaseType = VideoGeneratorTaskPhase.PhaseStoryBoard) => {
    const phasePrefix = phaseType === VideoGeneratorTaskPhase.PhaseStoryBoard ? 
      VideoGeneratorTaskPhase.PhaseStoryBoard : VideoGeneratorTaskPhase.PhaseScript;
    
    const messageIndex = messages.findIndex(msg => {
      if (msg.role !== 'assistant') return false;
      
      // 确保是BotMessage类型
      const botMsg = msg as BotMessage;
      if (!botMsg.versions || !botMsg.currentVersion) return false;
      
      return botMsg.versions[botMsg.currentVersion].some((ver: any) => 
        ver.type === EMessageType.Message && 
        ver.content.startsWith(`phase=${phasePrefix}`)
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
          content: `phase=${phasePrefix}\n${newContent}`,
          finish: true,
          logid: '',
          finish_reason: 'stop',
        }
      ];
      
      // 更新消息数组
      newMessages[messageIndex] = currentMessage;
      setMessages(newMessages);
    }
  };

  // 在组件挂载时检查是否有保存的分镜脚本内容
  useEffect(() => {
    // 只在组件挂载且是分镜脚本阶段时执行一次
    if (topMessage.phase === VideoGeneratorTaskPhase.PhaseStoryBoard && !contentUpdatedRef.current) {
      try {
        // 如果是新会话，则不加载缓存的内容
        if (isNewSession.current) {
          console.log('新会话，不加载缓存的分镜脚本内容');
          return;
        }

        const storageKey = getStorageKeyWithPrefix('storyboard_content');
        const timestampKey = getStorageKeyWithPrefix('storyboard_update_timestamp');
        
        const savedContent = localStorage.getItem(storageKey);
        const saveTimestamp = localStorage.getItem(timestampKey);
        
        if (savedContent && saveTimestamp) {
          // 检查内容是否是最近保存的（例如在过去1小时内）
          const timestamp = parseInt(saveTimestamp, 10);
          const now = Date.now();
          const oneHour = 60 * 60 * 1000; // 1小时的毫秒数
          
          if (now - timestamp < oneHour) {
            console.log('恢复保存的分镜脚本内容:', savedContent);
            
            // 更新本地显示内容
            setLocalContent(savedContent);
            
            // 更新引用缓存
            latestContentRef.current = savedContent;
            
            // 同时更新确认数据，确保后续流程使用最新内容
            updateConfirmationMessage({
              [UserConfirmationDataKey.StoryBoards]: savedContent
            });
            
            // 更新原始消息
            updateOriginalMessage(savedContent);
            
            // 标记内容已更新
            contentUpdatedRef.current = true;
          }
        }
      } catch (e) {
        console.error('恢复保存的分镜脚本内容失败:', e);
      }
    }
  }, [topMessage.phase]);

  // 在组件挂载时检查是否有保存的故事内容
  useEffect(() => {
    // 只在组件挂载且是故事内容阶段时执行一次
    if (topMessage.phase === VideoGeneratorTaskPhase.PhaseScript && !storyContentUpdatedRef.current) {
      try {
        // 如果是新会话，则不加载缓存的内容
        if (isNewSession.current) {
          console.log('新会话，不加载缓存的故事内容');
          return;
        }

        const storageKey = getStorageKeyWithPrefix('story_content');
        const timestampKey = getStorageKeyWithPrefix('story_update_timestamp');
        
        const savedContent = localStorage.getItem(storageKey);
        const saveTimestamp = localStorage.getItem(timestampKey);
        
        if (savedContent && saveTimestamp) {
          // 检查内容是否是最近保存的（例如在过去1小时内）
          const timestamp = parseInt(saveTimestamp, 10);
          const now = Date.now();
          const oneHour = 60 * 60 * 1000; // 1小时的毫秒数
          
          if (now - timestamp < oneHour) {
            console.log('恢复保存的故事内容:', savedContent);
            
            // 更新本地显示内容
            setLocalContent(savedContent);
            
            // 更新引用缓存
            latestStoryContentRef.current = savedContent;
            
            // 同时更新确认数据，确保后续流程使用最新内容
            updateConfirmationMessage({
              [UserConfirmationDataKey.Script]: savedContent
            });
            
            // 更新原始消息
            updateOriginalMessage(savedContent, VideoGeneratorTaskPhase.PhaseScript);
            
            // 标记内容已更新
            storyContentUpdatedRef.current = true;
          }
        }
      } catch (e) {
        console.error('恢复保存的故事内容失败:', e);
      }
    }
  }, [topMessage.phase]);

  // 在内容变化时更新本地显示
  useEffect(() => {
    // 分镜脚本阶段
    if (topMessage.phase === VideoGeneratorTaskPhase.PhaseStoryBoard) {
      // 如果内容已经从localStorage更新过，则不再覆盖
      if (!contentUpdatedRef.current) {
        setLocalContent(content);
      }
    } 
    // 故事内容阶段
    else if (topMessage.phase === VideoGeneratorTaskPhase.PhaseScript) {
      // 如果内容已经从localStorage更新过，则不再覆盖
      if (!storyContentUpdatedRef.current) {
        setLocalContent(content);
      }
    }
    // 其他阶段直接更新
    else {
      setLocalContent(content);
    }
  }, [content, topMessage.phase]);

  const handleNext = async () => {
    if (topMessage.phase === VideoGeneratorTaskPhase.PhaseStoryBoard) {
      updateAutoNext(true);
    }
    if (topMessage.phase === VideoGeneratorTaskPhase.PhaseScript) {
      // 获取最新的故事内容
      const latestStory = getLatestStoryContent();
      
      // 先确保故事内容已被正确更新到系统状态中
      if (latestStory && latestStory.trim() !== '') {
        try {
          // 1. 显示加载状态
          Message.info('正在准备生成分镜脚本...');
          
          // 2. 强制更新原始消息中的故事内容
          updateOriginalMessage(latestStory, VideoGeneratorTaskPhase.PhaseScript);
          
          // 3. 更新确认数据，确保使用最新的故事内容
          updateConfirmationMessage({
            [UserConfirmationDataKey.Script]: latestStory
          });
          
          // 4. 更新本地缓存，确保持久化
          const storageKey = getStorageKeyWithPrefix('story_content');
          const timestampKey = getStorageKeyWithPrefix('story_update_timestamp');
          
          localStorage.setItem(storageKey, latestStory);
          localStorage.setItem(timestampKey, Date.now().toString());
          
          console.log('正在使用最新的故事内容生成分镜脚本:', latestStory);
          
          // 5. 强制重新生成故事内容并等待完成
          if (regenerateMessageByPhase) {
            await new Promise<void>((resolve) => {
              // 立即刷新一次故事内容，确保后续步骤使用最新内容
              regenerateMessageByPhase(VideoGeneratorTaskPhase.PhaseScript, {
                [UserConfirmationDataKey.Script]: latestStory
              });
              
              // 等待足够长的时间以确保故事内容已完全更新
              setTimeout(() => {
                resolve();
              }, 1000);
            });
            
            // 6. 提示用户正在使用最新故事内容
            Message.info('正在使用您修改后的故事内容生成分镜脚本');
            
            // 7. 等待短暂延迟后发送消息生成分镜脚本，确保最新故事内容已完全更新
            setTimeout(() => {
              // 构建一个包含最新故事内容的确认消息
              const confirmationData = {
                ...userConfirmData,
                [UserConfirmationDataKey.Script]: latestStory
              };
              
              // 强制使用确认消息模式发送
              try {
                // 使用特殊指令发送，确保系统使用最新内容
                const jsonStr = JSON.stringify(confirmationData);
                const confirmationContent = `GENERATE_STORYBOARD ${jsonStr}`;
                
                // 直接发送指令
                sendMessageImplicitly(confirmationContent);
                
                // 插入 bot 占位并启动回复
                setTimeout(() => {
                  insertBotEmptyMessage();
                  startReply();
                }, 100);
              } catch (err) {
                console.error('发送生成分镜指令失败，尝试常规方式:', err);
                // 如果失败，回退到标准方法
                sendNextMessage('生成分镜脚本', false);
              }
            }, 500);
            
            return; // 避免重复调用sendNextMessage
          }
        } catch (error) {
          console.error('准备生成分镜脚本过程中出错:', error);
          // 出错后回退到标准方法
        }
      }
      
      // 如果上述强制更新过程失败或不适用，则按原流程进行
      sendNextMessage('生成分镜脚本', false);
    } else {
      sendNextMessage('开始生成视频', false);
    }
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

  const handleEditStory = () => {
    try {
      // 每次打开编辑窗口时，重新获取最新内容
      const latestContent = getLatestStoryContent();
      console.log('获取到的最新故事内容:', latestContent);
      setStoryContent(latestContent);
      setShowEditStory(true);
    } catch (error) {
      console.error('获取故事内容失败:', error);
      Message.error('获取故事内容失败，请重试');
    }
  };

  // 验证并修复分镜脚本内容，确保编号连续且从1开始
  const validateAndFixStoryboardContent = (content: string): string => {
    try {
      // 提取分镜块
      const blocks = content.split(/分镜\d+：/).filter(b => b.trim());
      if (!blocks.length) return content;
      
      // 重新组装分镜脚本，确保编号连续
      return blocks.map((block, index) => `分镜${index + 1}：${block}`).join('\n\n');
    } catch (e) {
      console.error('尝试修复分镜脚本编号失败:', e);
      return content;
    }
  };

  // 使用regenerateMessageByPhase直接更新故事内容，确保所有地方都能看到最新内容
  const updateStoryWithConfirmation = (newContent: string) => {
    try {
      // 1. 更新确认数据
      updateConfirmationMessage({
        [UserConfirmationDataKey.Script]: newContent
      });
      
      // 2. 发送CONFIRMATION消息，触发系统重新处理故事内容
      // 构造确认消息，包含所有确认数据
      const confirmationData = {
        ...userConfirmData,
        [UserConfirmationDataKey.Script]: newContent
      };
      
      // 3. 使用regenerateMessageByPhase重新生成故事内容
      if (regenerateMessageByPhase) {
        // 先重新生成故事内容
        regenerateMessageByPhase(VideoGeneratorTaskPhase.PhaseScript, {
          [UserConfirmationDataKey.Script]: newContent
        });

        // 额外重要步骤：如果已经存在后续阶段内容(比如角色描述)，强制清除并重新生成这些内容
        const hasRoleDescription = messages.some(msg => {
          if (msg.role !== 'assistant') return false;
          
          // 确保是BotMessage类型
          const botMsg = msg as BotMessage;
          if (!botMsg.versions || !botMsg.currentVersion) return false;
          
          return botMsg.versions[botMsg.currentVersion].some((ver: any) => 
            ver.type === EMessageType.Message && 
            ver.content.startsWith(`phase=${VideoGeneratorTaskPhase.PhaseRoleDescription}`)
          );
        });

        if (hasRoleDescription) {
          console.log('已存在角色描述，将在更新故事后强制重新生成角色描述以保持一致性');
          
          // 延迟一小段时间后再触发重新生成角色描述，确保故事内容已更新
          setTimeout(() => {
            try {
              // 触发重新生成角色描述
              regenerateMessageByPhase(VideoGeneratorTaskPhase.PhaseRoleDescription, {});
              Message.info('已更新故事内容，角色描述将基于最新内容重新生成');
            } catch (err) {
              console.error('重新生成角色描述失败:', err);
            }
          }, 500);
        }

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
      console.error('更新故事内容失败:', error);
      throw error;
    }
  };

  // 使用regenerateMessageByPhase直接更新分镜脚本，确保所有地方都能看到最新内容
  const updateStoryboardWithConfirmation = (newContent: string) => {
    try {
      // 验证并修复分镜编号
      const fixedContent = validateAndFixStoryboardContent(newContent);
      if (fixedContent !== newContent) {
        console.log('已自动修复分镜脚本编号以确保视频生成正常');
        newContent = fixedContent;
      }
      
      // 计算分镜数量
      const storyboardCount = (newContent.match(/分镜\d+：/g) || []).length;
      console.log(`当前分镜脚本包含 ${storyboardCount} 个分镜场景`);
      
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
        // 先重新生成分镜脚本
        regenerateMessageByPhase(VideoGeneratorTaskPhase.PhaseStoryBoard, {
          [UserConfirmationDataKey.StoryBoards]: newContent
        });

        // 额外重要步骤：如果已经存在后续阶段内容(比如角色描述)，强制清除并重新生成这些内容
        const hasRoleDescription = messages.some(msg => {
          if (msg.role !== 'assistant') return false;
          
          // 确保是BotMessage类型
          const botMsg = msg as BotMessage;
          if (!botMsg.versions || !botMsg.currentVersion) return false;
          
          return botMsg.versions[botMsg.currentVersion].some((ver: any) => 
            ver.type === EMessageType.Message && 
            ver.content.startsWith(`phase=${VideoGeneratorTaskPhase.PhaseRoleDescription}`)
          );
        });

        if (hasRoleDescription) {
          console.log('已存在角色描述，将在更新分镜脚本后强制重新生成角色描述以保持一致性');
          
          // 延迟一小段时间后再触发重新生成角色描述，确保分镜脚本内容已更新
          setTimeout(() => {
            try {
              // 触发重新生成角色描述
              regenerateMessageByPhase(VideoGeneratorTaskPhase.PhaseRoleDescription, {});
              Message.info('已更新分镜脚本，角色描述将基于最新内容重新生成');
            } catch (err) {
              console.error('重新生成角色描述失败:', err);
            }
          }, 500);
        }

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

  // 更新当前消息内容并保存，确保整个页面都能看到最新内容 - 分镜脚本
  const updateMessageContent = (newContent: string) => {
    try {
      // 更新内容缓存引用
      latestContentRef.current = newContent;
      
      // 更新本地内容以显示更新后的内容
      setLocalContent(newContent);
      
      // 确保下次打开编辑窗口时能获取到最新内容
      setStoryboardContent(newContent);
      
      // 标记内容已更新
      contentUpdatedRef.current = true;
      
      // 尝试持久化保存
      try {
        const storageKey = getStorageKeyWithPrefix('storyboard_content');
        const timestampKey = getStorageKeyWithPrefix('storyboard_update_timestamp');
        
        localStorage.setItem(storageKey, newContent);
        localStorage.setItem(timestampKey, Date.now().toString());
        
        // 存储当前会话ID，确保能识别同一会话
        const currentSessionId = sessionIdRef.current;
        if (currentSessionId) {
          localStorage.setItem('last_session_id', currentSessionId);
        }
      } catch (e) {
        console.error('保存到localStorage失败:', e);
      }
      
      // 更新原始消息列表中的内容
      updateOriginalMessage(newContent);
    } catch (error) {
      console.error('更新消息内容失败:', error);
    }
  };

  // 更新故事内容并保存，确保整个页面都能看到最新内容
  const updateStoryContent = (newContent: string) => {
    try {
      // 更新内容缓存引用
      latestStoryContentRef.current = newContent;
      
      // 更新本地内容以显示更新后的内容
      setLocalContent(newContent);
      
      // 确保下次打开编辑窗口时能获取到最新内容
      setStoryContent(newContent);
      
      // 标记内容已更新
      storyContentUpdatedRef.current = true;
      
      // 尝试持久化保存
      try {
        const storageKey = getStorageKeyWithPrefix('story_content');
        const timestampKey = getStorageKeyWithPrefix('story_update_timestamp');
        
        localStorage.setItem(storageKey, newContent);
        localStorage.setItem(timestampKey, Date.now().toString());
        
        // 存储当前会话ID，确保能识别同一会话
        const currentSessionId = sessionIdRef.current;
        if (currentSessionId) {
          localStorage.setItem('last_session_id', currentSessionId);
        }
      } catch (e) {
        console.error('保存故事内容到localStorage失败:', e);
      }
      
      // 更新原始消息列表中的内容
      updateOriginalMessage(newContent, VideoGeneratorTaskPhase.PhaseScript);
    } catch (error) {
      console.error('更新故事内容失败:', error);
    }
  };

  useEffect(() => {
    if (finish_reason === 'length') {
      setIsLengthExceed(true);
    } else if (finish_reason === 'content_filter') {
      setIsContentFilter(true);
    }
  }, [finish_reason]);

  // 处理故事内容编辑
  const handleStoryContentChange = (value: string) => {
    setStoryContent(value);
  };

  // 手动清除缓存，用于用户主动清除历史内容
  const handleClearCache = () => {
    clearAllCachedContent();
    Message.success('历史缓存已清除，您可以开始创作全新故事');
  };

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
            <>
              <ColorfulButton className={styles.operateButton} mode="default" onClick={handleEditStoryboard}>
                <div className={styles.operateWrapper}>
                  <IconAiEdit className={styles.operateIcon} />
                  {'修改分镜脚本'}
                </div>
              </ColorfulButton>
            </>
          )}
          {topMessage.phase === VideoGeneratorTaskPhase.PhaseScript && (
            <>
              <ColorfulButton className={styles.operateButton} mode="default" onClick={handleEditStory}>
                <div className={styles.operateWrapper}>
                  <IconAiEdit className={styles.operateIcon} />
                  {'修改故事内容'}
                </div>
              </ColorfulButton>
              <ColorfulButton className={styles.operateButton} mode="default" onClick={handleClearCache}>
                <div className={styles.operateWrapper} style={{ color: '#ff7875' }}>
                  {'清除历史'}
                </div>
              </ColorfulButton>
            </>
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
              Message.success('分镜脚本保存成功，如果已生成角色描述，将重新生成以匹配最新内容');
              setShowEditStoryboard(false);
            } catch (error) {
              console.error('保存分镜脚本失败:', error);
              Message.error('保存分镜脚本失败，请重试');
            }
          }}
          onCancel={() => setShowEditStoryboard(false)}
        />
      )}
      {showEditStory && (
        <Modal
          title="编辑故事内容"
          visible={showEditStory}
          footer={
            <>
              <Button onClick={() => setShowEditStory(false)}>取消</Button>
              <Button type="primary" onClick={() => {
                try {
                  if (!storyContent || storyContent.trim() === '') {
                    Message.error('故事内容不能为空');
                    return;
                  }
                  
                  // 1. 使用更直接的方法更新故事内容
                  updateStoryWithConfirmation(storyContent);
                  
                  // 2. 同时更新本地内容显示
                  updateStoryContent(storyContent);
                  
                  // 3. 提示用户保存成功
                  Message.success('故事内容保存成功，后续所有生成内容将基于新的故事内容');
                  setShowEditStory(false);
                } catch (error) {
                  console.error('保存故事内容失败:', error);
                  Message.error('保存故事内容失败，请重试');
                }
              }}>
                确定
              </Button>
            </>
          }
          onCancel={() => setShowEditStory(false)}
          autoFocus={false}
          focusLock={true}
          maskClosable={false}
          style={{ width: '800px', maxWidth: '90vw' }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ marginBottom: '0' }}>
                请编辑故事内容，修改后将用于后续分镜脚本和视频生成。
                <br />
                <span style={{ color: '#f59337', fontWeight: 'bold' }}>
                  注意：修改故事将导致后续步骤（分镜脚本、角色描述等）重新生成以保持一致性。
                </span>
              </p>
              <Button type="text" status="danger" onClick={() => {
                clearAllCachedContent();
                setStoryContent(''); // 清空文本框内容
                Message.success('历史缓存已清除，可以开始全新故事');
              }}>
                清空并创建新故事
              </Button>
            </div>
            <Input.TextArea
              value={storyContent}
              onChange={handleStoryContentChange}
              placeholder="请编辑故事内容..."
              autoSize={{ minRows: 15, maxRows: 20 }}
              style={{ width: '100%' }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssistantMessage;

