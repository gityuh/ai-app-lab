
import { IconLeft, IconRight } from '@arco-design/web-react/icon';

import { Message } from '@/components/ChatWindowV2/context';
import { useToggleMessage, EToggleMessageDirection } from '@/components/ChatWindowV2/useToggleMessage';

import { ActionIcon } from '../ActionIcon';

interface Props {
  message: Message;
}

export const MessageBranchChecker = ({ message }: Props) => {
  const { indicator, enableLastMsgDirection, toggle } = useToggleMessage();

  return indicator.show ? (
    <>
      <ActionIcon
        tips={'上一条'}
        disabled={!enableLastMsgDirection.canPrev}
        onClick={() => {
          toggle(message.id, EToggleMessageDirection.Prev);
        }}
      >
        <IconLeft className="hover:bg-[##E2EAF9] rounded-[4px]" />
      </ActionIcon>
      <span className="text-[12px]">{`${indicator.current} / ${indicator.total}`}</span>
      <ActionIcon
        tips={'下一条'}
        disabled={!enableLastMsgDirection.canNext}
        onClick={() => {
          toggle(message.id, EToggleMessageDirection.Next);
        }}
      >
        <IconRight className="hover:bg-[##E2EAF9] rounded-[4px]" />
      </ActionIcon>
    </>
  ) : null;
};
