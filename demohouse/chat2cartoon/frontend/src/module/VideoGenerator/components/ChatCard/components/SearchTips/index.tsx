import { useEffect, useState } from 'react';

import clsx from 'classnames';
import { IconLoading } from '@arco-design/web-react/icon';
import { IconCheckCircleBlue } from '@/images/iconBox';

interface Props {
  finish: boolean;
  message?: string;
}

const SearchTips = ({ finish, message }: Props) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [showSearching, setShowSearching] = useState(!finish);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (finish) {
      setFadeOut(true);
      setTimeout(() => setShowSearching(false), 500); // 动画持续时间
      setTimeout(() => setHidden(true), 1000);
    } else {
      setTimeout(() => setShowSearching(true), 500); // 动画持续时间
    }
  }, [finish]);

  return (
    <div
      className={clsx(
        `transition-all transform duration-500 ease-in-out box-border bg-white rounded-lg pl-4 flex border items-center`,
        hidden ? 'mb-0' : 'mb-[20px]',
      )}
      style={{ height: hidden ? '0px' : '43px', opacity: hidden ? 0 : 100 }}
    >
      <div className={clsx(`relative w-30  flex gap-1 items-center  overflow-hidden`, hidden ? 'h-0' : 'h-[43px]')}>
        {showSearching ? (
          <>
            <IconLoading
              className={`${fadeOut ? ' opacity-0' : 'opacity-100'} force-icon-loading transition-all transform duration-500 ease-in-out `}
            />
            <div
              className={`transition-opacity duration-500 ease-in-out text-gray-500 text-xs font-normal tracking-tight ${
                fadeOut ? 'opacity-0' : 'opacity-100'
              } `}
            >
              {'思考中...'}
            </div>
          </>
        ) : (
          <>
            <IconCheckCircleBlue
              className={`transition-all transform duration-500 ease-in-out ${fadeOut ? 'opacity-100' : ' opacity-0'}`}
            />
            <div
              className={`transition-opacity duration-500  ease-in-out text-gray-500 text-xs font-normal tracking-tight ${
                fadeOut ? 'opacity-100' : ' opacity-0'
              }`}
            >
              {'思考完成'}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchTips;
