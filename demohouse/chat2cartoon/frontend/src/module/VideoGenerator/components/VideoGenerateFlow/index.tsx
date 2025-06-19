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

/* eslint-disable max-nested-callbacks */
import { useContext, useEffect, useRef, useState } from 'react';

import { cloneDeep, isUndefined } from 'lodash';
import clsx from 'classnames';
import { Modal, Popover } from '@arco-design/web-react';

import { ReactComponent as IconAiPlay } from '@/images/icon_ai_play.svg';
import { ReactComponent as IconAiPlayDisabled } from '@/images/icon_ai_play_disabled.svg';
import { ReactComponent as IconAiPause } from '@/images/icon_ai_pause.svg';
import { ReactComponent as IconAiChat } from '@/images/icon_ai_chat.svg';
import { ReactComponent as IconAiReset } from '@/images/icon_ai_reset.svg';
import { useStartChatWithVideo } from '@/module/WatchAndChat/providers/WatchAndChatProvider/hooks/useStartChatWithVideo';
import { ChatWindowContext } from '@/components/ChatWindowV2/context';
import { Assistant } from '@/types/assistant';

import {
  ComplexMessage,
  FlowPhase,
  FlowStatus,
  RunningPhaseStatus,
  UserConfirmationDataKey,
  VideoGeneratorTaskPhase,
} from '../../types';
import { useParseOriginData } from './useParseOriginData';
import { FlowData } from './types';
import BaseFlow, { FlowItem } from '../BaseFlow';
import CardScrollList from '../CardScrollList';
import MediaCard from '../MediaCard';
import MediaCardHeader from '../MediaCard/components/MediaCardHeader';
import { RenderedMessagesContext } from '../../store/RenderedMessages/context';
import ColorfulButton from '../ColorfulButton';
import VideoPlayer, { IVideoPlayerRef } from '../MediaCard/components/VideoPlayer';
import styles from './index.module.less';
import {
  matchFirstFrameDescription,
  matchRoleDescription,
  matchVideoDescription,
  mergedOriginDescriptionsByPhase,
} from '../../utils';
import FlowItemTitle from '../FlowItemTitle';
import LoadingFilm from '../LoadingFilm';
import useFlowPhaseData from './useFlowPhaseData';
import ContinueButton from '../ContinueButton';
import { Breadcrumb, Button, Space } from '@arco-design/web-react';
import { IconLeft, IconRight, IconRefresh } from '@arco-design/web-react/icon';
import dayjs from 'dayjs';
import Axios from 'axios';
import { Message } from '@arco-design/web-react';

interface Props {
  messages: ComplexMessage;
}

const FlowPhaseMap = [
  [VideoGeneratorTaskPhase.PhaseRoleDescription, VideoGeneratorTaskPhase.PhaseRoleImage],
  [VideoGeneratorTaskPhase.PhaseFirstFrameDescription, VideoGeneratorTaskPhase.PhaseFirstFrameImage],
  [VideoGeneratorTaskPhase.PhaseVideoDescription, VideoGeneratorTaskPhase.PhaseVideo],
  [VideoGeneratorTaskPhase.PhaseTone, VideoGeneratorTaskPhase.PhaseAudio],
  [VideoGeneratorTaskPhase.PhaseFilm],
];

const VideoGenerateFlow = (props: Props) => {
  const { messages } = props;
  const { assistantInfo } = useContext(ChatWindowContext);
  const assistantData = assistantInfo as Assistant & { Extra?: any };

  // 是否需要提示重新生成
  const [firstFrameDescriptionRegenerateState, setFirstFrameDescriptionRegenerateState] = useState<number>(0);
  const [firstFrameRegenerateState, setFirstFrameRegenerateState] = useState<number>(0);
  const [videoRegenerateState, setVideoRegenerateState] = useState<number>(0);
  const [audioRegenerateState, setAudioRegenerateState] = useState<number>(0);

  const {
    runningPhase,
    finishPhase,
    userConfirmData,
    autoNext,
    isEditing,
    runningPhaseStatus,
    mediaRelevance,
    flowStatus,
    proceedNextPhase,
    regenerateMessageByPhase,
    sendRegenerationDescription,
    updateConfirmationMessage,
    updateAutoNext,
    resetMessages,
    updateRunningPhaseStatus,
    correctDescription,
    retryFromPhase,
  } = useContext(RenderedMessagesContext);
  const { videoBackgroundImages, audioBackgroundImages, updateVideoBackgroundImages, updateAudioBackgroundImages } =
    mediaRelevance;

  const parsedOriginData = useParseOriginData(messages);
  const {
    roleDescription,
    firstFrameDescription,
    videoDescription,
    resultFilm,
  } = parsedOriginData;

  const {
    generateRolePhaseData,
    generateStoryBoardImageData,
    generateStoryBoardVideoData,
    generateStoryBoardAudioData,
  } = useFlowPhaseData(messages, parsedOriginData, assistantData);

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  const [, setVideoStatus] = useState<number>(0);

  const { startChatWithVideo } = useStartChatWithVideo();

  const finalFilmPlayerRef = useRef<IVideoPlayerRef>(null);

  const [uploadedImages, setUploadedImages] = useState<Record<number, string>>({});
  const [imagesRestored, setImagesRestored] = useState(false);

  useEffect(() => {
    // 如果已经恢复过图片，不再重复执行
    if (imagesRestored) {
      return;
    }
    
    // 页面加载时从localStorage恢复已上传的图片
    try {
      // 从统一存储中恢复
      const storedImagesJson = localStorage.getItem('allUploadedImages');
      console.log('尝试从localStorage恢复图片', storedImagesJson ? '找到数据' : '未找到数据');
      
      if (storedImagesJson) {
        const recoveredImages = JSON.parse(storedImagesJson) as Record<number, string>;
        
        if (Object.keys(recoveredImages).length > 0) {
          console.log('恢复的图片数量:', Object.keys(recoveredImages).length);
          
          // 先设置uploadedImages状态
          setUploadedImages(recoveredImages);
          // 标记已恢复，避免重复执行
          setImagesRestored(true);
          
          // 延迟执行UI更新，确保组件已完全挂载
          setTimeout(() => {
            // 恢复图片到相应的显示区域
            Object.entries(recoveredImages).forEach(([indexStr, dataUrl]) => {
              const index = parseInt(indexStr, 10);
              console.log(`正在恢复索引 ${index} 的图片`);
              
              // 恢复到第一帧图像
              if (userConfirmData?.[UserConfirmationDataKey.FirstFrameImages]) {
                const firstFrameImages = cloneDeep(userConfirmData[UserConfirmationDataKey.FirstFrameImages]);
                const firstFrameImageIndex = firstFrameImages.findIndex(item => item.index === index);
                
                if (firstFrameImageIndex !== -1) {
                  console.log(`将图片设置到第一帧图像 index=${index}`);
                  firstFrameImages[firstFrameImageIndex].images = [dataUrl];
                  
                  updateConfirmationMessage({
                    [UserConfirmationDataKey.FirstFrameImages]: firstFrameImages,
                  });
                }
              }
              
              // 更新视频背景图片
              console.log(`更新视频背景图片 index=${index}`);
              updateVideoBackgroundImages(val => {
                return { ...val, [index]: [dataUrl] };
              });
              
              // 更新音频背景图片
              console.log(`更新音频背景图片 index=${index}`);
              updateAudioBackgroundImages(val => {
                return { ...val, [index]: [dataUrl] };
              });
              
              // 更新缩略图数据
              if (generateStoryBoardImageData[index]) {
                console.log(`更新缩略图数据 index=${index}`);
                const mediaData = generateStoryBoardImageData[index];
                const currentMediaUrls = mediaData.mediaUrls || [];
                
                if (currentMediaUrls.length === 0) {
                  generateStoryBoardImageData[index].mediaUrls = [dataUrl];
                } else if (!currentMediaUrls.includes(dataUrl)) {
                  generateStoryBoardImageData[index].mediaUrls = [
                    dataUrl,
                    ...currentMediaUrls
                  ];
                }
              }
            });
            
            // 强制触发UI更新
            console.log('强制UI更新');
            setVideoStatus(prev => prev + 1);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('从本地存储恢复图片失败:', error);
    }
  }, [userConfirmData, generateStoryBoardImageData, imagesRestored]);

  // 监听页面可见性变化，页面重新变为可见时尝试恢复图片
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !imagesRestored) {
        // 页面变为可见时，重新设置imagesRestored为false以触发恢复逻辑
        setImagesRestored(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [imagesRestored]);

  // 修复页面滚动逻辑，添加保护机制避免过度滚动
  useEffect(() => {
    // 防止在数据加载阶段或恢复图片时触发滚动
    if (document.readyState !== 'complete') {
      return;
    }
    
    const phaseArr = [
      '',
      FlowPhase.GenerateRole,
      FlowPhase.GenerateStoryBoardImage,
      FlowPhase.GenerateStoryBoardVideo,
      FlowPhase.GenerateStoryBoardAudio,
      FlowPhase.VideoEdit,
      FlowPhase.Result,
    ];
    const phase = phaseArr[currentPhaseIndex];
    const element = document.getElementById(phase);
    
    // 添加判断，只有在元素存在且用户没有手动滚动时才执行自动滚动
    if (element) {
      // 使用更温和的滚动选项，允许用户中断
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentPhaseIndex]);

  // 添加一个新的函数用于同步上传的图片到缩略图显示
  const syncUploadedImagesToThumbnails = () => {
    // 遍历所有上传的图片
    Object.entries(uploadedImages).forEach(([indexStr, dataUrl]) => {
      const index = parseInt(indexStr, 10);
      
      // 确保分镜画面数据中包含这些图片作为缩略图选项
      if (generateStoryBoardImageData[index]) {
        // 检查图片是否已经在mediaUrls中
        const exists = generateStoryBoardImageData[index].mediaUrls?.includes(dataUrl);
        
        if (!exists) {
          // 如果不存在，添加到mediaUrls数组的开头
          generateStoryBoardImageData[index].mediaUrls = [
            dataUrl,
            ...(generateStoryBoardImageData[index].mediaUrls || [])
          ];
        }
      }
    });
  };

  // 每当上传的图片变化时，同步到缩略图，但添加节流以避免过度渲染
  useEffect(() => {
    if (Object.keys(uploadedImages).length > 0) {
      // 使用setTimeout来避免频繁更新
      const timeoutId = setTimeout(() => {
        syncUploadedImagesToThumbnails();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [uploadedImages]);

  const modelOperateDisabled = autoNext || runningPhaseStatus === RunningPhaseStatus.Pending;

  const markFirstFrameDescriptionRegenerate = (role: string) => {
    const updateState = generateStoryBoardImageData.reduce((pre, cur, index) => {
      if (cur.role?.includes(role)) {
        return pre | (1 << index);
      }
      return pre;
    }, 0);
    setFirstFrameDescriptionRegenerateState(val => val | updateState);
  };

  const resetConfirm = () => {
    Modal.confirm({
      title: '确认清空对话吗？',
      content:
        '确认清空当前故事及生成的所有图片及音视频素材？删除后记录及素材无法找回，如有需要请先保存。',
      okText: '确认清空',
      closable: true,
      onOk: () => {
        resetMessages();
      },
    });
  };

  const renderOperationBtn = () => {
    if (finishPhase === VideoGeneratorTaskPhase.PhaseFilm && resultFilm.length > 0) {
      // 视频生成结束后的按钮事件
      if (isEditing) {
        return (
          <div className="flex gap-[10px]">
            <Popover
              disabled={flowStatus === FlowStatus.Ready}
              content={
                '当前有相关内容错误，请重新生成相关内容'
              }
            >
              <ColorfulButton
                mode="active"
                disabled={runningPhaseStatus === RunningPhaseStatus.Pending}
                style={{ width: 250 }}
              >
                <div
                  className={styles.operateWrapper}
                  onClick={() => {
                    if (runningPhaseStatus === RunningPhaseStatus.Pending) {
                      return;
                    }
                    const params = { url: '' };
                    regenerateMessageByPhase(VideoGeneratorTaskPhase.PhaseFilm, {
                      [UserConfirmationDataKey.Film]: params,
                    });
                  }}
                >
                  {runningPhaseStatus !== RunningPhaseStatus.Pending ? (
                    <IconAiPlay className={clsx(styles.operateIcon, styles.disabledIcon)} />
                  ) : (
                    <IconAiPlayDisabled className={styles.operateIcon} />
                  )}
                  <div>
                    {
                      '素材已编辑，再次生成视频'
                    }
                  </div>
                </div>
              </ColorfulButton>
            </Popover>
            <ColorfulButton mode="default" style={{ width: 130, borderWidth: 1 }}>
              <div
                className={styles.operateWrapper}
                onClick={() => {
                  resetConfirm();
                }}
              >
                <IconAiReset className={styles.operateIcon} />
                {'清空对话'}
              </div>
            </ColorfulButton>
          </div>
        );
      }

      return (
        <ColorfulButton mode="active" style={{ width: 250 }}>
          <div
            className={styles.operateWrapper}
            onClick={() => {
              resetConfirm();
            }}
          >
            <IconAiReset className={styles.operateIcon} />
            {'清空历史，开始新故事'}
          </div>
        </ColorfulButton>
      );
    }

    return (
      <>
        {autoNext ? (
          <ColorfulButton mode="active" style={{ width: 225 }}>
            <div
              className={styles.operateWrapper}
              onClick={() => {
                updateAutoNext(false);
              }}
            >
              <IconAiPause className={styles.operateIcon} />
              {'暂停后续流程'}
            </div>
          </ColorfulButton>
        ) : (
          <div className="flex gap-[10px]">
            <Popover
              disabled={flowStatus === FlowStatus.Ready}
              content={
                '当前有相关内容错误，请重新生成相关内容'
              }
            >
              <ColorfulButton mode="active" style={{ width: 225 }}>
                <div
                  onClick={() => {
                    // 点击继续，重新生成视频
                    proceedNextPhase(finishPhase);
                    updateAutoNext(true);
                  }}
                  className={styles.operateWrapper}
                >
                  <IconAiPlay className={styles.operateIcon} />
                  {'点击继续'}
                </div>
              </ColorfulButton>
            </Popover>
            <ColorfulButton mode="default" style={{ width: 130, borderWidth: 1 }}>
              <div
                className={styles.operateWrapper}
                onClick={() => {
                  resetConfirm();
                }}
              >
                <IconAiReset className={styles.operateIcon} />
                {'清空对话'}
              </div>
            </ColorfulButton>
          </div>
        )}
      </>
    );
  };

  const handleImageUpload = async (file: File, index: number) => {
    try {
      // 创建一个临时URL用于预览
      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const dataUrl = e.target?.result as string;
        
        // 立即更新上传图片状态，确保UI立即显示上传的图片
        setUploadedImages(prev => ({
          ...prev,
          [index]: dataUrl
        }));
        
        // 将图片数据保存到localStorage中，确保刷新页面后仍能显示
        try {
          // 保存所有已上传图片，作为单个JSON对象存储，避免分散存储引起的问题
          const allImages = { ...uploadedImages, [index]: dataUrl };
          localStorage.setItem('allUploadedImages', JSON.stringify(allImages));
          localStorage.setItem('lastUploadTimestamp', String(Date.now()));
          
          console.log('图片已保存到localStorage', Object.keys(allImages).length);
        } catch (storageError) {
          console.error('无法保存图片到本地存储:', storageError);
        }
        
        // 更新到第一帧图像中
        if (userConfirmData?.[UserConfirmationDataKey.FirstFrameImages]) {
          const firstFrameImages = cloneDeep(userConfirmData[UserConfirmationDataKey.FirstFrameImages]);
          const firstFrameImageIndex = firstFrameImages.findIndex(item => item.index === index);
          
          if (firstFrameImageIndex !== -1) {
            // 使用dataUrl替代实际URL
            firstFrameImages[firstFrameImageIndex].images = [dataUrl];
            
            // 更新状态，确保其他组件可以使用上传的图片
            updateConfirmationMessage({
              [UserConfirmationDataKey.FirstFrameImages]: firstFrameImages,
            });
            
            // 同时更新视频和音频背景图片
            updateVideoBackgroundImages(val => ({
              ...val,
              [index]: [dataUrl],
            }));
            
            updateAudioBackgroundImages(val => ({
              ...val,
              [index]: [dataUrl],
            }));
          }
        }
        
        // 直接更新缩略图数据，确保立即显示
        if (generateStoryBoardImageData[index]) {
          // 如果该索引存在图片数据，将上传的图片添加到数组首位
          const mediaData = generateStoryBoardImageData[index];
          const currentMediaUrls = mediaData.mediaUrls || [];
          
          if (currentMediaUrls.length === 0) {
            // 如果不存在或为空数组，直接设置新数组
            generateStoryBoardImageData[index].mediaUrls = [dataUrl];
          } else if (!currentMediaUrls.includes(dataUrl)) {
            // 如果已存在但不包含当前图片，添加到首位
            generateStoryBoardImageData[index].mediaUrls = [
              dataUrl,
              ...currentMediaUrls
            ];
          }
          // 强制更新UI
          setVideoStatus(prev => prev + 1);
        }
        
        // 通知用户上传成功
        Message.success('图片上传成功');
      };
      
      reader.onerror = () => {
        Message.error('图片读取失败，请重试');
      };
      
      // 读取文件为DataURL
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('上传图片失败:', error);
      Message.error('图片上传失败，请重试');
    }
  };

  // 在VideoGenerateFlow组件内添加重置上传状态的函数
  const resetUploadedImages = () => {
    console.log('重置已上传图片状态');
    setUploadedImages({});
    localStorage.removeItem('allUploadedImages');
    localStorage.removeItem('lastUploadTimestamp');
    Message.success('已重置上传状态');
  };

  const flowList: FlowItem[] = [
    {
      id: FlowPhase.GenerateRole,
      title: (
        <FlowItemTitle
          content={'1.生成故事角色'}
          disabled={finishPhase === VideoGeneratorTaskPhase.PhaseFilm || modelOperateDisabled}
          onRetry={retryFromPhase}
          retryPhase={VideoGeneratorTaskPhase.PhaseRoleDescription}
          finishPhase={finishPhase}
        />
      ),
      phase: FlowPhase.GenerateRole,
      content:
        generateRolePhaseData.length > 0
          ? active => {
              const roleImages = userConfirmData?.[UserConfirmationDataKey.RoleImage];

              return (
                <CardScrollList
                  id={FlowPhase.GenerateRole}
                  list={generateRolePhaseData.map((item, index) => {
                    const imageIndex = roleImages?.findIndex(item => item.index === index);

                    return (
                      <MediaCard
                        key={`${FlowPhase.GenerateRole}${index}`}
                        src={(!isUndefined(imageIndex) && roleImages?.[imageIndex]?.images?.[0]) || ''}
                        prompt={item.description}
                        header={
                          <MediaCardHeader
                            title={`
                              故事角色 ${index + 1}
                            `}
                          />
                        }
                        type="image"
                        modelInfo={item.modelDisplayInfo}
                        onEdit={val => {
                          const currentDescriptionData = roleDescription[index];
                          const storeDescriptionData = userConfirmData?.[UserConfirmationDataKey.RoleDescriptions];
                          if (!storeDescriptionData) {
                            return;
                          }
                          const matchDescriptionList = matchRoleDescription(storeDescriptionData);
                          if (!matchDescriptionList?.length) {
                            return;
                          }
                          // 合成新的描述
                          const mergedDescriptionStr = mergedOriginDescriptionsByPhase({
                            phase: VideoGeneratorTaskPhase.PhaseRoleDescription,
                            replaceDesc: val ?? '',
                            mergeList: matchDescriptionList,
                            uniqueKey: String(currentDescriptionData.key),
                          });
                          correctDescription(VideoGeneratorTaskPhase.PhaseRoleDescription, mergedDescriptionStr);
                          updateConfirmationMessage({
                            [UserConfirmationDataKey.RoleDescriptions]: mergedDescriptionStr,
                          });
                          if (generateStoryBoardImageData.length > 0) {
                            markFirstFrameDescriptionRegenerate(item.role ?? '');
                          }
                        }}
                        promptLoading={runningPhaseStatus === RunningPhaseStatus.Pending}
                        disabled={modelOperateDisabled}
                        onRegenerate={() => {
                          const roleImages = userConfirmData?.[UserConfirmationDataKey.RoleImage];
                          if (!roleImages) {
                            return;
                          }
                          const imageIndex = roleImages.findIndex(item => item.index === index);
                          if (imageIndex === -1) {
                            return;
                          }
                          // 将相应的图片置为空字符串，传给后端
                          const cloneArr = cloneDeep(roleImages);
                          cloneArr[imageIndex].images = [];
                          // 发送重新生成消息
                          regenerateMessageByPhase(VideoGeneratorTaskPhase.PhaseRoleImage, {
                            [UserConfirmationDataKey.RoleImage]: cloneArr,
                          });
                        }}
                      />
                    );
                  })}
                  isActive={active}
                />
              );
            }
          : undefined,
    },
    {
      id: FlowPhase.GenerateStoryBoardImage,
      title: (
        <FlowItemTitle
          content={'2.生成分镜画面'}
          disabled={finishPhase === VideoGeneratorTaskPhase.PhaseFilm || modelOperateDisabled}
          onRetry={retryFromPhase}
          retryPhase={VideoGeneratorTaskPhase.PhaseFirstFrameDescription}
          finishPhase={finishPhase}
        />
      ),
      phase: FlowPhase.GenerateStoryBoardImage,
      content:
        generateStoryBoardImageData.length > 0
          ? active => {
              const firstFrameImages = userConfirmData?.[UserConfirmationDataKey.FirstFrameImages];
              return (
                <CardScrollList
                  id={FlowPhase.GenerateStoryBoardImage}
                  list={generateStoryBoardImageData.map((item, index) => {
                    const firstFrameImageIndex = firstFrameImages?.findIndex(item => item.index === index);

                    return (
                      <MediaCard
                        key={`${FlowPhase.GenerateRole}${index}`}
                        src={
                          uploadedImages[index] || 
                          (!isUndefined(firstFrameImageIndex) &&
                            firstFrameImages?.[firstFrameImageIndex]?.images?.[0]) ||
                          ''
                        }
                        prompt={item.description}
                        disabled={modelOperateDisabled}
                        header={
                          <MediaCardHeader
                            title={`分镜画面 ${index + 1}`}
                            imgArr={generateStoryBoardImageData?.[index]?.mediaUrls}
                            currentIndex={generateStoryBoardImageData?.[index]?.mediaUrls?.findIndex(
                              item =>
                                item ===
                                  (!isUndefined(firstFrameImageIndex) &&
                                    firstFrameImages?.[firstFrameImageIndex]?.images?.[0]) || '',
                            )}
                            onSelect={val => {
                              if (isUndefined(firstFrameImageIndex) || !firstFrameImages) {
                                return;
                              }
                              const cloneArr = cloneDeep(firstFrameImages);
                              cloneArr[firstFrameImageIndex].images = [
                                generateStoryBoardImageData?.[index]?.mediaUrls?.[val],
                              ];
                              updateConfirmationMessage({
                                [UserConfirmationDataKey.FirstFrameImages]: cloneArr,
                              });
                              // 清除该索引的上传图片记录
                              if (uploadedImages[index]) {
                                const newUploadedImages = { ...uploadedImages };
                                delete newUploadedImages[index];
                                setUploadedImages(newUploadedImages);
                              }
                            }}
                          />
                        }
                        type="image"
                        modelInfo={item.modelDisplayInfo}
                        editWarning={Boolean(firstFrameDescriptionRegenerateState & (1 << index))}
                        regenerateWarning={Boolean(firstFrameRegenerateState & (1 << index))}
                        onEdit={val => {
                          const currentDescriptionData = firstFrameDescription[index];
                          const storeDescriptionData =
                            userConfirmData?.[UserConfirmationDataKey.FirstFrameDescriptions];
                          if (!storeDescriptionData) {
                            return;
                          }
                          const matchDescriptionList = matchFirstFrameDescription(storeDescriptionData);
                          if (!matchDescriptionList?.length) {
                            return;
                          }
                          // 合成新的描述
                          const mergedDescriptionStr = mergedOriginDescriptionsByPhase({
                            phase: VideoGeneratorTaskPhase.PhaseFirstFrameDescription,
                            replaceDesc: val ?? '',
                            mergeList: matchDescriptionList,
                            uniqueKey: String(currentDescriptionData.key),
                          });
                          correctDescription(VideoGeneratorTaskPhase.PhaseFirstFrameDescription, mergedDescriptionStr);
                          updateConfirmationMessage({
                            [UserConfirmationDataKey.FirstFrameDescriptions]: mergedDescriptionStr,
                          });
                          setFirstFrameDescriptionRegenerateState(val => val & ~(1 << index));
                          setFirstFrameRegenerateState(val => val | (1 << index));
                        }}
                        onRegenerate={() => {
                          const firstFrameImages = userConfirmData?.[UserConfirmationDataKey.FirstFrameImages];
                          if (!firstFrameImages) {
                            return;
                          }
                          const firstFrameImageIndex = firstFrameImages.findIndex(item => item.index === index);
                          if (firstFrameImageIndex === -1) {
                            return;
                          }
                          // 将相应的图片置为空字符串，传给后端
                          const cloneArr = cloneDeep(firstFrameImages);
                          cloneArr[firstFrameImageIndex].images = [];
                          // 发送重新生成消息
                          regenerateMessageByPhase(VideoGeneratorTaskPhase.PhaseFirstFrameImage, {
                            [UserConfirmationDataKey.FirstFrameImages]: cloneArr,
                          });
                          setFirstFrameRegenerateState(val => val & ~(1 << index));
                          if (generateStoryBoardVideoData.length > 0) {
                            setVideoRegenerateState(val => val | (1 << index));
                          }
                          // 清除该索引的上传图片记录
                          if (uploadedImages[index]) {
                            const newUploadedImages = { ...uploadedImages };
                            delete newUploadedImages[index];
                            setUploadedImages(newUploadedImages);
                          }
                        }}
                        promptLoading={runningPhaseStatus === RunningPhaseStatus.Pending}
                        onPromptGenerate={() => {
                          const currentDescriptionData = firstFrameDescription[index];
                          const storeDescriptionData =
                            userConfirmData?.[UserConfirmationDataKey.FirstFrameDescriptions];
                          if (!storeDescriptionData) {
                            return;
                          }
                          const matchDescriptionList = matchFirstFrameDescription(storeDescriptionData);
                          if (!matchDescriptionList?.length) {
                            return;
                          }
                          const mergedDescriptionStr = mergedOriginDescriptionsByPhase({
                            phase: VideoGeneratorTaskPhase.PhaseFirstFrameDescription,
                            replaceDesc: '',
                            mergeList: matchDescriptionList,
                            uniqueKey: String(currentDescriptionData.key),
                          });
                          sendRegenerationDescription(
                            VideoGeneratorTaskPhase.PhaseFirstFrameDescription,
                            {
                              [UserConfirmationDataKey.FirstFrameDescriptions]: mergedDescriptionStr,
                            },
                            String(currentDescriptionData.key),
                          );
                          setFirstFrameDescriptionRegenerateState(val => val & ~(1 << index));
                          setFirstFrameRegenerateState(val => val | (1 << index));
                          // 清除该索引的上传图片记录
                          if (uploadedImages[index]) {
                            const newUploadedImages = { ...uploadedImages };
                            delete newUploadedImages[index];
                            setUploadedImages(newUploadedImages);
                          }
                        }}
                        onImageUpload={(file) => {
                          handleImageUpload(file, index);
                        }}
                      />
                    );
                  })}
                  isActive={active}
                />
              );
            }
          : undefined,
    },
    {
      id: FlowPhase.GenerateStoryBoardVideo,
      title: (
        <FlowItemTitle
          content={'3.生成分镜视频'}
          disabled={finishPhase === VideoGeneratorTaskPhase.PhaseFilm || modelOperateDisabled}
          onRetry={retryFromPhase}
          retryPhase={VideoGeneratorTaskPhase.PhaseVideoDescription}
          finishPhase={finishPhase}
        />
      ),
      phase: FlowPhase.GenerateStoryBoardVideo,
      content:
        generateStoryBoardVideoData.length > 0
          ? active => {
              const videos = userConfirmData?.[UserConfirmationDataKey.Videos];
              const firstFrameImages = userConfirmData?.[UserConfirmationDataKey.FirstFrameImages];

              return (
                <CardScrollList
                  id={FlowPhase.GenerateStoryBoardVideo}
                  list={generateStoryBoardVideoData.map((item, index) => {
                    const videoIndex = videos?.findIndex(item => item.index === index);
                    const firstImageIndex = firstFrameImages?.findIndex(item => item.index === index);

                    if (!isUndefined(firstImageIndex) && 
                        (firstFrameImages?.[firstImageIndex]?.images?.[0] || uploadedImages[index])) {
                      if (!(index in videoBackgroundImages)) {
                        updateVideoBackgroundImages(val => ({
                          ...val,
                          [index]: [uploadedImages[index] || firstFrameImages?.[firstImageIndex]?.images?.[0]],
                        }));
                        videoBackgroundImages[index] = [uploadedImages[index] || firstFrameImages?.[firstImageIndex]?.images?.[0]];
                      }
                    }

                    return (
                      <MediaCard
                        key={`${FlowPhase.GenerateStoryBoardVideo}${index}`}
                        src={(!isUndefined(videoIndex) && videos?.[videoIndex]?.content_generation_task_id) || ''}
                        prompt={item.description}
                        disabled={modelOperateDisabled}
                        header={
                          <MediaCardHeader
                            title={`
                              视频画面 ${index + 1}
                            `}
                            imgArr={videoBackgroundImages?.[index]}
                            currentIndex={generateStoryBoardVideoData?.[index]?.mediaIds?.findIndex(
                              item =>
                                item === (!isUndefined(videoIndex) && videos?.[videoIndex]?.content_generation_task_id) || '',
                            )}
                            onSelect={val => {
                              if (isUndefined(videoIndex) || !videos) {
                                return;
                              }
                              const cloneArr = cloneDeep(videos);
                              cloneArr[videoIndex].content_generation_task_id =
                                generateStoryBoardVideoData?.[index]?.mediaIds?.[val];
                              updateConfirmationMessage({
                                [UserConfirmationDataKey.Videos]: cloneArr,
                              });
                            }}
                          />
                        }
                        type="video"
                        modelInfo={item.modelDisplayInfo}
                        afterLoad={() => {
                          setVideoStatus(status => {
                            if ((status | (1 << index)) === (1 << generateStoryBoardVideoData.length) - 1 && runningPhase === VideoGeneratorTaskPhase.PhaseVideo) {
                              // 阶段转终态
                              updateRunningPhaseStatus(RunningPhaseStatus.Success);
                              if (autoNext) {
                                // 视频全部加载完毕，进入下一步
                                proceedNextPhase(finishPhase);
                              }
                            }
                            return status | (1 << index);
                          });
                        }}
                        audioImg={isUndefined(firstImageIndex) ? '' : firstFrameImages?.[firstImageIndex]?.images?.[0]}
                        onEdit={val => {
                          const currentDescriptionData = videoDescription[index];
                          const storeDescriptionData = userConfirmData?.[UserConfirmationDataKey.VideoDescriptions];
                          if (!storeDescriptionData) {
                            return;
                          }
                          const matchDescriptionList = matchVideoDescription(storeDescriptionData);
                          if (!matchDescriptionList?.length) {
                            return;
                          }
                          // 合成新的描述
                          const mergedDescriptionStr = mergedOriginDescriptionsByPhase({
                            phase: VideoGeneratorTaskPhase.PhaseVideoDescription,
                            replaceDesc: val ?? '',
                            mergeList: matchDescriptionList,
                            uniqueKey: String(currentDescriptionData.key),
                          });
                          correctDescription(VideoGeneratorTaskPhase.PhaseVideoDescription, mergedDescriptionStr);
                          updateConfirmationMessage({
                            [UserConfirmationDataKey.VideoDescriptions]: mergedDescriptionStr,
                          });
                          setVideoRegenerateState(val => val | (1 << index));
                        }}
                        regenerateWarning={Boolean(videoRegenerateState & (1 << index))}
                        onRegenerate={() => {
                          const videoIds = userConfirmData?.[UserConfirmationDataKey.Videos];
                          if (!videoIds) {
                            return;
                          }
                          const videoIndex = videoIds.findIndex(item => item.index === index);
                          if (videoIndex === -1) {
                            return;
                          }
                          // 将相应的图片置为空字符串，传给后端
                          const cloneArr = cloneDeep(videoIds);
                          cloneArr[videoIndex].content_generation_task_id = '';
                          // 发送重新生成消息
                          regenerateMessageByPhase(VideoGeneratorTaskPhase.PhaseVideo, {
                            [UserConfirmationDataKey.Videos]: cloneArr,
                          });
                          setVideoStatus(status => status & ~(1 << videoIndex));
                          updateVideoBackgroundImages(val => {
                            const cloneArr = cloneDeep(val);
                            cloneArr[index].push(
                              isUndefined(firstImageIndex) ? '' : firstFrameImages?.[firstImageIndex]?.images?.[0],
                            );
                            return cloneArr;
                          });
                          setVideoRegenerateState(val => val & ~(1 << index));
                        }}
                        promptLoading={runningPhaseStatus === RunningPhaseStatus.Pending}
                        onPromptGenerate={() => {
                          const currentDescriptionData = videoDescription[index];
                          const storeDescriptionData = userConfirmData?.[UserConfirmationDataKey.VideoDescriptions];
                          if (!storeDescriptionData) {
                            return;
                          }
                          const matchDescriptionList = matchVideoDescription(storeDescriptionData);
                          if (!matchDescriptionList?.length) {
                            return;
                          }
                          const mergedDescriptionStr = mergedOriginDescriptionsByPhase({
                            phase: VideoGeneratorTaskPhase.PhaseVideoDescription,
                            replaceDesc: '',
                            mergeList: matchDescriptionList,
                            uniqueKey: String(currentDescriptionData.key),
                          });
                          sendRegenerationDescription(
                            VideoGeneratorTaskPhase.PhaseVideoDescription,
                            {
                              [UserConfirmationDataKey.VideoDescriptions]: mergedDescriptionStr,
                            },
                            String(currentDescriptionData.key),
                          );
                          setVideoRegenerateState(val => val | (1 << index));
                        }}
                      />
                    );
                  })}
                  isActive={active}
                />
              );
            }
          : undefined,
    },
    {
      id: FlowPhase.GenerateStoryBoardAudio,
      title: (
        <FlowItemTitle
          content={'4.生成分镜配音'}
          disabled={finishPhase === VideoGeneratorTaskPhase.PhaseFilm || modelOperateDisabled}
          onRetry={retryFromPhase}
          retryPhase={VideoGeneratorTaskPhase.PhaseTone}
          finishPhase={finishPhase}
        />
      ),
      phase: FlowPhase.GenerateStoryBoardAudio,
      content:
        generateStoryBoardAudioData.length > 0
          ? active => {
              const audios = userConfirmData?.[UserConfirmationDataKey.Audios];
              const firstFrameImages = userConfirmData?.[UserConfirmationDataKey.FirstFrameImages];

              return (
                <CardScrollList
                  id={FlowPhase.GenerateStoryBoardAudio}
                  list={generateStoryBoardAudioData.map((item, index) => {
                    const audioIndex = audios?.findIndex(item => item.index === index);
                    const firstImageIndex = firstFrameImages?.findIndex(item => item.index === index);

                    if (!isUndefined(firstImageIndex) && 
                        (firstFrameImages?.[firstImageIndex]?.images?.[0] || uploadedImages[index])) {
                      if (!(index in audioBackgroundImages)) {
                        updateAudioBackgroundImages(val => ({
                          ...val,
                          [index]: [uploadedImages[index] || firstFrameImages?.[firstImageIndex]?.images?.[0]],
                        }));
                        audioBackgroundImages[index] = [uploadedImages[index] || firstFrameImages?.[firstImageIndex]?.images?.[0]];
                      }
                    }

                    return (
                      <MediaCard
                        key={`${FlowPhase.GenerateStoryBoardAudio}${index}`}
                        src={(!isUndefined(audioIndex) && audios?.[audioIndex]?.url) || ''}
                        prompt={item.description}
                        disabled={modelOperateDisabled}
                        tone={item.tone}
                        regenerateWarning={Boolean(audioRegenerateState & (1 << index))}
                        header={
                          <MediaCardHeader
                            title={`
                              分镜配音 ${index + 1}
                            `}
                            imgArr={audioBackgroundImages?.[index]}
                            currentIndex={generateStoryBoardAudioData?.[index]?.mediaUrls?.findIndex(
                              item => item === (!isUndefined(audioIndex) && audios?.[audioIndex]?.url) || '',
                            )}
                            onSelect={val => {
                              if (isUndefined(audioIndex) || !audios) {
                                return;
                              }
                              const cloneArr = cloneDeep(audios);
                              cloneArr[audioIndex].url = generateStoryBoardAudioData?.[index]?.mediaUrls?.[val];
                              // 发送重新生成消息
                              updateConfirmationMessage({
                                [UserConfirmationDataKey.Audios]: cloneArr,
                              });
                            }}
                          />
                        }
                        audioImg={uploadedImages[index] || generateStoryBoardImageData[index]?.mediaUrls?.[0]}
                        type="audio"
                        modelInfo={item.modelDisplayInfo}
                        onRegenerate={() => {
                          const audios = userConfirmData?.[UserConfirmationDataKey.Audios];
                          if (!audios) {
                            return;
                          }
                          const audioIndex = audios.findIndex(item => item.index === index);
                          if (audioIndex === -1) {
                            return;
                          }
                          const cloneArr = cloneDeep(audios);
                          cloneArr[audioIndex].url = '';
                          // 发送重新生成消息
                          regenerateMessageByPhase(VideoGeneratorTaskPhase.PhaseAudio, {
                            [UserConfirmationDataKey.Audios]: cloneArr,
                          });
                          updateAudioBackgroundImages(val => {
                            const cloneArr = cloneDeep(val);
                            cloneArr[index].push(
                              uploadedImages[index] || (isUndefined(firstImageIndex) ? '' : firstFrameImages?.[firstImageIndex]?.images?.[0]),
                            );
                            return cloneArr;
                          });
                          setAudioRegenerateState(status => status & ~(1 << index));
                        }}
                        onEdit={(val, tone) => {
                          const tones = userConfirmData?.[UserConfirmationDataKey.Tones];
                          if (!tones) {
                            return;
                          }
                          const toneIndex = tones?.findIndex(item => item.index === index);
                          if (toneIndex === -1) {
                            return;
                          }
                          const cloneArr = cloneDeep(tones);
                          cloneArr[toneIndex].line = val;
                          if (tone) {
                            cloneArr[toneIndex].tone = tone;
                          }
                          correctDescription(
                            VideoGeneratorTaskPhase.PhaseTone,
                            JSON.stringify({ [UserConfirmationDataKey.Tones]: cloneArr }),
                          );
                          updateConfirmationMessage({
                            [UserConfirmationDataKey.Tones]: cloneArr,
                          });
                          setAudioRegenerateState(val => val | (1 << index));
                        }}
                        promptLoading={runningPhaseStatus === RunningPhaseStatus.Pending}
                        onPromptGenerate={() => {
                          const tones = userConfirmData?.[UserConfirmationDataKey.Tones];
                          if (!tones) {
                            return;
                          }
                          const toneIndex = tones?.findIndex(item => item.index === index);
                          if (toneIndex === -1) {
                            return;
                          }
                          const cloneArr = cloneDeep(tones);
                          cloneArr[toneIndex].line = '';
                          // 发送重新生成消息
                          sendRegenerationDescription(
                            VideoGeneratorTaskPhase.PhaseTone,
                            {
                              [UserConfirmationDataKey.Tones]: cloneArr,
                            },
                            String(tones[toneIndex].key),
                          );
                        }}
                      />
                    );
                  })}
                  isActive={active}
                />
              );
            }
          : undefined,
    },
    // resultFilm 操控两个步骤，第5步是loading，第6步是展示视频
    // 这里的逻辑是，当视频生成完，进入第6步，否则进入第5步
    {
      id: FlowPhase.VideoEdit,
      title: null,
      phase: FlowPhase.VideoEdit,
      content: active => (
        <ColorfulButton style={{ width: 180 }} mode={active ? 'active' : 'default'}>
          <div id={FlowPhase.VideoEdit}>
            {runningPhase === VideoGeneratorTaskPhase.PhaseFilm && runningPhaseStatus !== RunningPhaseStatus.Success ? (
              <LoadingFilm runningPhaseStatus={runningPhaseStatus} />
            ) : (
              '5.视频剪辑'
            )}
          </div>
        </ColorfulButton>
      ),
    },
    {
      id: FlowPhase.Result,
      title: '6.最终视频',
      phase: FlowPhase.Result,
      content: () => {
        if (!userConfirmData?.film?.url) {
          return null;
        }

        return (
          <div id={FlowPhase.Result} className={styles.videoChatWrapper}>
            <div className={styles.videoWrapper}>
              <div className={styles.videoBorder}>
                <VideoPlayer ref={finalFilmPlayerRef} videoLink={userConfirmData?.film?.url || ''} />
              </div>
            </div>
            <ColorfulButton
              mode="active"
              style={{ width: 225 }}
              onClick={() => {
                finalFilmPlayerRef.current?.pause();
                startChatWithVideo({
                  videoUrl: userConfirmData?.film?.url || '',
                  // userConfirmData?.videos?.at(-1)||'',
                  confirmation: JSON.stringify({
                    [UserConfirmationDataKey.Script]: userConfirmData?.script,
                    [UserConfirmationDataKey.StoryBoards]: userConfirmData?.storyboards,
                    [UserConfirmationDataKey.RoleDescriptions]: userConfirmData?.role_descriptions,
                  }),
                });
              }}
            >
              <div className={styles.operateWrapper}>
                <IconAiChat className={styles.operateIcon} />
                {'边看边聊'}
              </div>
            </ColorfulButton>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    if (!runningPhase) {
      return;
    }
    // 映射 phase 到当前第几步
    const index = FlowPhaseMap.findIndex(item => item.includes(runningPhase as VideoGeneratorTaskPhase));
    setCurrentPhaseIndex(index === -1 ? 0 : index + 1);
  }, [runningPhase]);

  useEffect(() => {
    // 如果视频生成完，进入第6步
    if (runningPhase === VideoGeneratorTaskPhase.PhaseFilm && runningPhaseStatus === RunningPhaseStatus.Success) {
      setCurrentPhaseIndex(6);
    }
  }, [runningPhaseStatus]);

  // 定义需要显示ContinueButton的阶段
  const stagesToShowContinueButton = [
    VideoGeneratorTaskPhase.PhaseRoleDescription,
    VideoGeneratorTaskPhase.PhaseRoleImage,
    VideoGeneratorTaskPhase.PhaseFirstFrameDescription,
    VideoGeneratorTaskPhase.PhaseFirstFrameImage,
    VideoGeneratorTaskPhase.PhaseVideoDescription,
    VideoGeneratorTaskPhase.PhaseVideo,
    VideoGeneratorTaskPhase.PhaseTone,
    VideoGeneratorTaskPhase.PhaseAudio,
  ];

  // 判断当前是否需要显示ContinueButton
  const shouldShowContinueButton = () => {
    if (!finishPhase || runningPhaseStatus !== RunningPhaseStatus.Success) {
      return false;
    }
    return stagesToShowContinueButton.includes(finishPhase as VideoGeneratorTaskPhase);
  };

  // 处理ContinueButton点击事件
  const handleContinueClick = () => {
    if (finishPhase && stagesToShowContinueButton.includes(finishPhase as VideoGeneratorTaskPhase)) {
      proceedNextPhase(finishPhase);
    }
  };

  // 在render末尾添加ContinueButton
  const renderContinueButton = () => {
    if (shouldShowContinueButton()) {
      return (
        <div className={styles.continueButtonContainer}>
          <ContinueButton
            phase={finishPhase}
            onClick={handleContinueClick}
            loading={runningPhaseStatus === RunningPhaseStatus.Pending}
          />
          <Button 
            type="text" 
            style={{ marginTop: '8px' }}
            onClick={resetUploadedImages}
          >
            <IconRefresh />
            重置上传状态
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center w-full">
      {renderContinueButton()}
      <div>
        <div className={styles['base-flow-wrapper']}>
          <BaseFlow items={flowList} current={currentPhaseIndex} />
        </div>
        <div className={styles.operateButton}>{renderOperationBtn()}</div>
      </div>
      {renderContinueButton()}
    </div>
  );
};

export default VideoGenerateFlow;
