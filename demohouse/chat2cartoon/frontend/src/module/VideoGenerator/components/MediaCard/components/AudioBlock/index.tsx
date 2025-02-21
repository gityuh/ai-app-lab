import { useEffect, useRef, useState } from 'react';

import { Slider } from '@arco-design/web-react';
import cx from 'classnames';
import dayjs from 'dayjs';

import iconAudioFailed from '@/images/assets/icon_audio_failed.png';
import { ReactComponent as IconPause } from '@/images/pause.svg';
import { ReactComponent as IconPlay } from '@/images/play.svg';
import { ReactComponent as AudioBorder } from '@/images/audio-border.svg';
import { ReactComponent as IconMediaLoading } from '@/images/icon_media_loading.svg';
import demoSrc from '@/images/assets/doubao_logo.png';

import styles from './index.module.less';
import { ErrorString } from '../../../../types';

export const format = (s: number) => dayjs.duration(s, 'seconds').format('mm:ss');

interface TProps {
  audioLink?: string;
  seconds?: number;
  audioImg?: string;
  hasRadius?: boolean;
}

const showTime = (time: number) =>
  `${Math.floor(time / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(time % 60)
    .toString()
    .padStart(2, '0')}`;

const AudioBlock = (props: TProps) => {
  const { audioLink, audioImg, seconds = 5, hasRadius = false } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playTime, setPlayTime] = useState({ currentTime: 0, duration: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    const callback = () => {
      if (audioRef?.current?.currentTime) {
        if (audioRef?.current?.currentTime === audioRef?.current?.duration) {
          setIsPlaying(false);
        }
        setPlayTime({
          currentTime: audioRef?.current?.currentTime,
          duration: audioRef?.current?.duration,
        });
      }
    };
    audioRef.current?.addEventListener('timeupdate', callback);
    return () => {
      audioRef.current?.removeEventListener('timeupdate', callback);
    };
  }, [audioRef.current]);

  const handleMouseEnter = () => {
    if (audioRef?.current?.duration) {
      setPlayTime({
        currentTime: audioRef?.current?.currentTime,
        duration: audioRef?.current?.duration,
      });
    }
  };

  const renderAudio = () => {
    if (audioLink === ErrorString.AudioError) {
      return (
        <div className={styles.failed}>
          <img src={iconAudioFailed} style={{ width: 76, height: 76 }} />
          <div className={styles.failedText}>{'音频生成失败'}</div>
        </div>
      );
    }
    if (audioLink) {
      return (
        <div className={cx(styles.audioPlayWrapper)} onMouseEnter={handleMouseEnter}>
          <audio key={audioLink} className={styles.audio} ref={audioRef}>
            <source src={audioLink} type="audio/mp3" />
          </audio>
          {/* 毛玻璃 */}
          <div className={cx(styles.backDrop, { [styles.hasRadius]: hasRadius })} />
          <img src={audioImg || demoSrc} />
          <AudioBorder className={styles.audioBorder} />
          {/* 中间的小图 */}
          <img src={audioImg || demoSrc} className={styles.circleImg} />

          <>
            <div className={cx(styles.mask, 'mask')}>
              <div className="flex gap-[10px] align-middle">
                {isPlaying ? (
                  <IconPause
                    className={styles.icon}
                    onClick={() => {
                      setIsPlaying(false);
                      audioRef?.current?.pause();
                    }}
                  />
                ) : (
                  <IconPlay
                    className={styles.icon}
                    onClick={() => {
                      setIsPlaying(true);
                      audioRef?.current?.play();
                    }}
                  />
                )}
                <div className={styles.currentTime}>
                  {`${showTime(playTime.currentTime)}`} {` / ${showTime(playTime.duration)}`}
                </div>
              </div>
              {/* <div className={cx(styles.iconScale, styles.icon)}>
            <IconScale
              onClick={e => {
                e.stopPropagation();
                const audio = audioRef.current;
                if (audio?.requestFullscreen) {
                  audio.requestFullscreen();
                }
              }}
            />
          </div> */}
            </div>
            <Slider
              className={styles.audioSlider}
              step={0.001}
              onChange={seconds => {
                if (typeof seconds === 'number') {
                  audioRef?.current && (audioRef.current.currentTime = seconds);
                  setPlayTime({
                    ...playTime,
                    currentTime: seconds,
                  });
                }
              }}
              value={playTime.currentTime}
              max={playTime.duration || seconds}
              formatTooltip={ms => format(ms)}
            />
          </>
        </div>
      );
    }
    return (
      <div className={styles.background}>
        <IconMediaLoading className={styles.icon} />
      </div>
    );
  };

  return renderAudio();
};

export default AudioBlock;
