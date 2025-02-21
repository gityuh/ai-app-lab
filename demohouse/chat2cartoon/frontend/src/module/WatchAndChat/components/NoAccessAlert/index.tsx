import { useContext } from 'react';

import clsx from 'classnames';
import { IconCloseCircleFill } from '@arco-design/web-react/icon';

import s from './index.module.less';
import { MachineContext } from '../../providers/MachineProvider/context';

export const NoAccessAlert = () => {
  const { send } = useContext(MachineContext);
  return (
    <div className={s.alert}>
      <div className="flex items-center gap-2 z-30">
        <IconCloseCircleFill className="text-[#D7312A] w-4 h-4" />
        <div className={clsx(s.text)}>
          {
            '麦克风开启失败，请检查浏览器设置'
          }
        </div>
      </div>
      <div
        onClick={() => {
          send({ type: 'INIT' });
        }}
        className={s.refresh}
      >
        {'刷新重试'}
      </div>
    </div>
  );
};
