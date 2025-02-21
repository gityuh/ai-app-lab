import { forwardRef, RefObject, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { Slider } from '@arco-design/web-react';
import cx from 'classnames';
import dayjs from 'dayjs';

import { ReactComponent as IconPause } from '@/images/pause.svg';
import { ReactComponent as IconPlay } from '@/images/play.svg';
import { ReactComponent as IconScale } from '@/images/scale.svg';

import styles from './index.module.less';

export const format = (s: number) => dayjs.duration(s, 'seconds').format('mm:ss');

type TProps = {
  videoLink?: string;
  seconds?: number;
};

const showTime = (time: number) =>
  `${Math.floor(time / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(time % 60)
    .toString()
    .padStart(2, '0')}`;

const VideoPlayer = (
  props: TProps & {
    videoRef: RefObject<HTMLVideoElement>;
    isPlaying: boolean;
    setIsPlaying: (isPlaying: boolean) => void;
  },
) => {
  const { isPlaying, setIsPlaying, videoRef, videoLink, seconds = 5 } = props;
  const [playTime, setPlayTime] = useState({ currentTime: 0, duration: 0 });

  useEffect(() => {
    const callback = () => {
      if (videoRef?.current?.currentTime) {
        if (videoRef?.current?.currentTime === videoRef?.current?.duration) {
          setIsPlaying(false);
        }
        setPlayTime({
          currentTime: videoRef?.current?.currentTime,
          duration: videoRef?.current?.duration,
        });
      }
    };
    videoRef.current?.addEventListener('timeupdate', callback);
    return () => {
      videoRef.current?.removeEventListener('timeupdate', callback);
    };
  }, [videoRef.current]);

  const handleMouseEnter = () => {
    if (videoRef?.current?.duration) {
      setPlayTime({
        currentTime: videoRef?.current?.currentTime,
        duration: videoRef?.current?.duration,
      });
    }
  };

  return (
    <div className={cx(styles.videoPlayWrapper)} onMouseEnter={handleMouseEnter}>
      <video key={videoLink} className={styles.video} ref={videoRef} loop={true}>
        <source src={videoLink} type="video/mp4" />
      </video>

      <>
        <div className={cx(styles.mask, 'mask')}>
          <div className={'flex gap-[10px] align-middle'}>
            {isPlaying ? (
              <IconPause
                className={styles.icon}
                onClick={() => {
                  setIsPlaying(false);
                  videoRef?.current?.pause();
                }}
              />
            ) : (
              <IconPlay
                className={styles.icon}
                onClick={() => {
                  setIsPlaying(true);
                  videoRef?.current?.play();
                }}
              />
            )}
            <div className={styles.currentTime}>
              {`${showTime(playTime.currentTime)}`} {` / ${showTime(playTime.duration)}`}
            </div>
          </div>
          <div className={cx(styles.iconScale, styles.icon)}>
            <IconScale
              onClick={e => {
                e.stopPropagation();
                const video = videoRef.current;
                if (video?.requestFullscreen) {
                  video.requestFullscreen();
                }
              }}
            />
          </div>
        </div>
        <Slider
          className={styles.audioSlider}
          step={0.001}
          onChange={seconds => {
            if (typeof seconds === 'number') {
              videoRef?.current && (videoRef.current.currentTime = seconds);
              setPlayTime({
                ...playTime,
                currentTime: seconds,
              });
            }
          }}
          value={playTime.currentTime}
          max={videoRef?.current?.duration || seconds}
          formatTooltip={ms => format(ms)}
        />
      </>
    </div>
  );
};

export interface IVideoPlayerRef {
  play: () => void;
  pause: () => void;
}
const VideoPlayerWithRef = forwardRef<IVideoPlayerRef, TProps>((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        videoRef.current?.play();
        setIsPlaying(true);
      },
      pause: () => {
        videoRef.current?.pause();
        setIsPlaying(false);
      },
    }),
    [],
  );
  return <VideoPlayer videoRef={videoRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} {...props} />;
});

export default VideoPlayerWithRef;
