import { BotMessageContext } from '../../store/BotMessage/context';
import { VideoGeneratorBotMessage, VideoGeneratorMessageType, RenderedMessages, ComplexMessage } from '../../types';
import ChatCard from '../ChatCard';
import UserMessage from '../UserMessage';
import VideoGenerateFlow from '../VideoGenerateFlow';
import styles from './index.module.less';

interface Props {
  messages: RenderedMessages;
}

const ChatArea = (props: Props) => {
  const { messages } = props;

  return (
    <div className={styles.wrapper}>
      {messages.map((message, index) => {
        if (message.role === 'user') {
          return <UserMessage id={message.id} key={message.id} content={message.content} />;
        }

        // 简单消息，只有纯文本
        if (message.type !== VideoGeneratorMessageType.Multiple) {
          const botMessage = message as VideoGeneratorBotMessage;
          const versions = botMessage.versions[botMessage.currentVersion];
          return (
            <BotMessageContext.Provider key={index} value={botMessage}>
              {versions
                .filter(version => version.type !== 'slot')
                .map(version => (
                  <ChatCard message={version} key={version.id} phase={botMessage.phase} />
                ))}
            </BotMessageContext.Provider>
          );
        }
        // 复合消息
        return <VideoGenerateFlow key={index} messages={message as ComplexMessage} />;
      })}
    </div>
  );
};

export default ChatArea;
