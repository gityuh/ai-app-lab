import { CSSProperties, ReactNode } from 'react';

export interface Editable {
  onConfirm?: (value: string) => void;
  onCancel?: () => void;
}

export interface MessageItemProps {
  message: string; // 消息数据
  avatar?: ReactNode; // 角色头像
  editable?: Editable;
  errorMessage?: string;
  isAnimate?: boolean; // 使用打字机动画效果
  className?: string;
  style?: CSSProperties;
  renderMessage?: (content: any) => ReactNode; // 消息自定义渲染
  renderAnimateMessage?: (content: any) => ReactNode; // 打字机动画效果自定义渲染
  renderErrorMessage?: (content: any) => ReactNode;
  messageExtra?: ReactNode; // 消息额外信息
  messageClassName?: string;
}
