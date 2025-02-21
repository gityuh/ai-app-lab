import clsx from 'classnames';

import s from './index.module.less';
import { useWatchAndChatMachine } from '../../providers/MachineProvider/useWatchAndChatMachine';
import { AudioVisualizer } from './AudioVisualizer';
import { ControlLayer } from './ControlLayer';

export const BotAvatar = () => {
  const { state } = useWatchAndChatMachine();
  const videoSrc =
    'https://lf3-static.bytednsdoc.com/obj/eden-cn/LM-STH-hahK/ljhwZthlaukjlkulzlp/ark/bot/watch_and_chat_demo/speaking.mp4';
  return (
    <div className={clsx('absolute right-[38px] bottom-[196px]', state.matches('NO_ACCESS') && 'cursor-not-allowed')}>
      {state.matches('BotWelcome') || state.matches('Chat.BotSpeaking') ? (
        <video src={videoSrc} autoPlay className={clsx(s.avatar, 'object-cover')} muted loop />
      ) : (
        <img
          className={s.avatar}
          src="https://lf3-static.bytednsdoc.com/obj/eden-cn/LM-STH-hahK/ljhwZthlaukjlkulzlp/ark/bot/watch_and_chat_demo/avatar.png"
        />
      )}

      <AudioVisualizer />
      <ControlLayer />
    </div>
  );
};
