
import { ReactNode } from 'react';

import { Popover } from '@arco-design/web-react';
import { IconRefresh } from '@arco-design/web-react/icon';

import styles from './index.module.less';
import { VideoGeneratorTaskPhase } from '../../types';

interface Props {
  content: ReactNode;
  disabled: boolean;
  retryPhase: string;
  finishPhase: string;
  onRetry: (phase: string) => void;
}

const runOrder = Object.values(VideoGeneratorTaskPhase);

const FlowItemTitle = (props: Props) => {
  const { content, onRetry, disabled, retryPhase, finishPhase } = props;

  const handleRetry = () => {
    onRetry(retryPhase);
  };

  const isDisabled =
    disabled || runOrder.findIndex(item => item === finishPhase) < runOrder.findIndex(item => item === retryPhase);

  return (
    <div className={styles.flowItemTitleContainer}>
      <div>{content}</div>
      {!isDisabled && (
        <Popover content={'从当前阶段开始重新生成'}>
          <div className={styles.icon} onClick={handleRetry}>
            <IconRefresh />
          </div>
        </Popover>
      )}
    </div>
  );
};

export default FlowItemTitle;
