import { type FC, useContext } from 'react';

import classNames from 'classnames';

import s from './index.module.less';
import { WatchAndChatContext } from '../../providers/WatchAndChatProvider/context';

export enum BubbleTheme {
  BORDERLESS = 'borderless',
  LIGHT = 'light',
}
export enum BubbleState {
  RECORDING = 'recording',
}
export enum BubbleSize {
  SMALL = 'small',
  DEFAULT = 'default',
}

export interface VoiceBubbleProps {
  theme?: BubbleTheme;
  state: BubbleState;
  size?: BubbleSize;
  color?: string;
}
const VoiceBubble: FC<VoiceBubbleProps> = ({
  theme = BubbleTheme.LIGHT,
  state,
  size = BubbleSize.DEFAULT,
  color = '#fff',
}) => {
  const { userAudioWaveHeights } = useContext(WatchAndChatContext);
  return (
    <div className="flex flex-col justify-center items-center gap-[6px]">
      <div className={s.answerBubbleContent}>
        {Object.keys(userAudioWaveHeights).map((key, index) => (
          <div
            key={`bar-${index}`}
            className={classNames(s.bubbleBar, size === BubbleSize.SMALL && `${s.bubbleBarSmall} `)}
            style={{
              height: `${userAudioWaveHeights[key as keyof typeof userAudioWaveHeights]}px`,
              backgroundColor: color,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VoiceBubble;
