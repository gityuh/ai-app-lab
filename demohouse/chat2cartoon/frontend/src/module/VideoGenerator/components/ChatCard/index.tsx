import { BotMessage, EMessageType } from '@/components/ChatWindowV2/context';

import SearchTips from './components/SearchTips';
import ErrorMessage from './components/ErrorMessage';
import AssistantMessage from './components/AssistantMessage';
import styles from './index.module.less';

const ChatCard = ({ message, phase }: { message: BotMessage['versions'][number][number]; phase?: string }) => {
  const renderMessage = () => {
    switch (message.type) {
      case EMessageType.Searching:
        return <SearchTips finish={Boolean(message?.finish)} message={message.content} />;
      case EMessageType.Error:
        return <ErrorMessage message={message} />;
      default:
        return message?.content ? <AssistantMessage {...message} phase={phase} /> : null;
    }
  };

  return <div className={styles.message}>{renderMessage()}</div>;
};

export default ChatCard;
