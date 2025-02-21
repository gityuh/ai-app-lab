import { useContext, useEffect } from 'react';

import { useSpring, animated } from '@react-spring/web';

import { BotAvatar } from './components/BotAvatar';
import { NoAccessAlert } from './components/NoAccessAlert';
import { VideoPlayer } from './components/VideoPlayer';
import { MachineContext } from './providers/MachineProvider/context';
import { useStartChatWithVideo } from './providers/WatchAndChatProvider/hooks/useStartChatWithVideo';
import { IconClose } from './images/IconClose';

export const WatchAndChat = () => {
  const { send, state } = useContext(MachineContext);
  const { visible, stopChatWithVideo } = useStartChatWithVideo();

  const animationProps = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1)' : 'scale(0.8)',
    zIndex: visible ? 100 : 0,
    from: { opacity: 0, transform: 'scale(0.8)', zIndex: 0 },
    config: { duration: 300 },
    onRest: () => {
      if (!visible) {
        send({ type: 'EXIT' });
      }
    },
  });

  useEffect(() => {
    if (visible) {
      send({ type: 'INIT' });
    }
    return () => {
      send({ type: 'EXIT' });
    };
  }, [visible]);

  return visible ? (
    <animated.div style={animationProps} className="w-full h-full absolute relative">
      <IconClose
        className="absolute right-5 top-5 z-20"
        onClick={() => {
          stopChatWithVideo();
        }}
      />
      {state.matches('NO_ACCESS') && <NoAccessAlert />}
      <VideoPlayer />
      <BotAvatar />
    </animated.div>
  ) : null;
};
