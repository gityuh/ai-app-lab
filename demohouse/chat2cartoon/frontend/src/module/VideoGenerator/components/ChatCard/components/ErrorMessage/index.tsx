import { useContext } from 'react';

import clsx from 'classnames';
import { Divider } from '@arco-design/web-react';

import { ReactComponent as IconRiskText } from '@/images/icon_risk_text.svg';
import { Message } from '@/components/ChatWindowV2/context';

import { BotMessageContext } from '../../../../store/BotMessage/context';
import DebugInfo from '../DebugInfo';
import styles from './index.module.less';
import { AnswerOperation } from '../../../Conversation/components/AnswerOperation';

const ErrorMessage = ({ message }: { message: Message }) => {
  const { content, logid } = message;
  const topMessage = useContext(BotMessageContext);

  return (
    <div
      className={`mb-[20px] assistant-message-container  bg-white rounded-lg border p-[16px] ${styles.assistantMdBoxContainer}`}
    >
      <div className="rounded-lg	border-solid	border border-[#DDE2E9] px-[16px] py-[12px]">
        <div className="flex gap-2">
          <IconRiskText className="shrink-0" />
          <span className="break-all">{content}</span>
        </div>
        {/* 回答操作Bar */}
        {topMessage.finish ? (
          <div className="flex justify-between">
            <AnswerOperation
              isLastMessage={topMessage.isLastMessage}
              className={clsx(!topMessage.isLastMessage && styles.answerOperationHover)}
              assistantMessage={message}
              retryable={topMessage.retryable}
            />
          </div>
        ) : null}
        <Divider style={{ margin: '10px 0' }} type="horizontal" />
        {logid ? <DebugInfo text={logid} /> : null}
      </div>
    </div>
  );
};

export default ErrorMessage;
