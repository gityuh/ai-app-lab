import { BotMessage, Message, UserMessage } from '@/components/ChatWindowV2/context';

export enum VideoGeneratorMessageType {
  Text = 'text',
  Multiple = 'multiple',
  Loading = 'loading',
  Error = 'error',
}

export enum VideoGeneratorTaskPhase {
  PhaseScript = 'Script', // 脚本创作
  PhaseStoryBoard = 'StoryBoard', // 分镜创作
  PhaseRoleDescription = 'RoleDescription', // 角色描述
  PhaseRoleImage = 'RoleImage', // 角色画像
  PhaseFirstFrameDescription = 'FirstFrameDescription', // 首帧描述
  PhaseFirstFrameImage = 'FirstFrameImage', // 首帧画像
  PhaseVideoDescription = 'VideoDescription', // 视频描述
  PhaseVideo = 'Video', // 视频
  PhaseTone = 'Tone', // 音色
  PhaseAudio = 'Audio', // 字幕
  PhaseFilm = 'Film', // 视频
}

export interface InnerMessage {
  /**
   * 用于图片/视频的prompt
   */
  prompt?: string;
  versions: Message[][];
  currentVersion: number;
  /**
   * 是否可以重试
   */
  retryable: boolean;
}

// 渲染消息结构
export interface VideoGeneratorBotMessage extends BotMessage {
  type: VideoGeneratorMessageType;
  phase?: VideoGeneratorTaskPhase;
  /**
   * 模型信息
   */
  modelDisplayInfo?: string;
}

export type VideoGeneratorUserMessage = UserMessage;

export interface ComplexMessage {
  role: 'assistant';
  type: VideoGeneratorMessageType;
  phaseMessageMap: Record<string, VideoGeneratorBotMessage[]>;
}

export type RenderedMessages = (VideoGeneratorUserMessage | VideoGeneratorBotMessage | ComplexMessage)[];

export enum FlowPhase {
  GenerateRole = 'GenerateRole', // 生成故事角色
  GenerateStoryBoardImage = 'GenerateStoryBoardImage', // 生成分镜画面
  GenerateStoryBoardVideo = 'GenerateStoryBoardVideo', // 生成分镜视频
  GenerateStoryBoardAudio = 'GenerateStoryBoardAudio', // 生成分镜配音
  VideoEdit = 'VideoEdit', // 视频剪辑
  Result = 'Result', // 结果
}

// 后端返回的原始key + 前端要传给后端的key
export enum UserConfirmationDataKey {
  Script = 'script',
  StoryBoards = 'storyboards',
  RoleDescriptions = 'role_descriptions',
  RoleImage = 'role_images',
  FirstFrameDescriptions = 'first_frame_descriptions',
  FirstFrameImages = 'first_frame_images',
  VideoDescriptions = 'video_descriptions',
  Videos = 'videos',
  Tones = 'tones',
  Audios = 'audios',
  Film = 'film',
}

// 媒体数据为原结构，其他为普通字符串
export interface UserConfirmationData {
  [UserConfirmationDataKey.Script]?: string;
  [UserConfirmationDataKey.StoryBoards]?: string;
  [UserConfirmationDataKey.RoleDescriptions]?: string;
  [UserConfirmationDataKey.FirstFrameDescriptions]?: string;
  [UserConfirmationDataKey.VideoDescriptions]?: string;
  [UserConfirmationDataKey.RoleImage]?: Record<string, any>[];
  [UserConfirmationDataKey.FirstFrameImages]?: Record<string, any>[];
  [UserConfirmationDataKey.Videos]?: Record<string, any>[];
  [UserConfirmationDataKey.Tones]?: Record<string, any>[];
  [UserConfirmationDataKey.Audios]?: Record<string, any>[];
  [UserConfirmationDataKey.Film]?: {
    url?: string;
  };
}

export enum RunningPhaseStatus {
  Ready = 'ready',
  Pending = 'pending',
  Success = 'success',
  RequestError = 'requestError',
  ContentError = 'contentError',
}

export interface DescriptionType {
  uniqueKey: string;
  storyRole: string;
  content: string;
}

export enum ErrorString {
  ImageError = 'Post Img Risk Not Pass',
  VideoError = 'failed to generate video',
  AudioError = 'failed to generate audio',
}

export interface PhaseMapType {
  userConfirmationDataKey: UserConfirmationDataKey;
  matchDescription?: (description: string) => DescriptionType[] | undefined;
  combinationDescription?: (data: DescriptionType) => string;
  containsErrorMessage?: ErrorString; // 消息里可能包含这些错误信息
}

export enum FlowStatus {
  NotWork = 'notWork',
  Ready = 'ready',
}
