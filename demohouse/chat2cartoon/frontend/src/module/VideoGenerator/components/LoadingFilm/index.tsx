import { useEffect, useRef, useState } from 'react';

import { Progress } from '@arco-design/web-react';


import styles from './index.module.less';
import { RunningPhaseStatus } from '../../types';

interface Props {
  runningPhaseStatus: RunningPhaseStatus;
}

const LoadingFilm = (props: Props) => {
  const { runningPhaseStatus } = props;
  const timerRef = useRef<number>();
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (runningPhaseStatus === RunningPhaseStatus.Pending) {
      timerRef.current = window.setInterval(() => {
        setPercent(prev => {
          if (prev >= 98) {
            clearInterval(timerRef.current);
            return 98;
          }
          return prev + 2;
        });
      }, 1000);
    }
    if (runningPhaseStatus === RunningPhaseStatus.Ready) {
      setPercent(0);
    }
    if (runningPhaseStatus === RunningPhaseStatus.Success) {
      clearInterval(timerRef.current);
      setPercent(100);
    }
    if (runningPhaseStatus === RunningPhaseStatus.RequestError) {
      clearInterval(timerRef.current);
      setPercent(0);
    }
    return () => {
      clearInterval(timerRef.current);
    };
  }, [runningPhaseStatus]);

  return (
    <div className={styles.loadingContainer}>
      {runningPhaseStatus === RunningPhaseStatus.Pending && (
        <Progress
          percent={percent}
          color={{
            '0%': '#ce63ff',
            '40%': '#0093ff',
            '100%': '#0060ff',
          }}
          className={styles.progress}
          size="mini"
          showText={false}
        />
      )}

      <span>{'视频剪辑中'}</span>
    </div>
  );
};

export default LoadingFilm;
