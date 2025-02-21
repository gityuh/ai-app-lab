import React, { FC, PropsWithChildren } from 'react';

import { useSpring, animated, SpringConfig } from '@react-spring/web';

interface AnimatedItemProps {
  specificClassName: string;
  config: SpringConfig;
}

const AnimatedItem: FC<AnimatedItemProps> = ({ specificClassName, config }) => {
  const props = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config,
    loop: { reverse: true },
  });

  return <animated.div style={props} className={`blur-md mix-blend-overlay absolute ${specificClassName}`} />;
};

export const BorderGradientFade: FC<PropsWithChildren<{ border: boolean }>> = ({ children, border }) => {
  const config: SpringConfig = { duration: 1500 };
  return (
    <div className="relative w-full h-full group overflow-hidden">
      {border && (
        <>
          <AnimatedItem
            specificClassName="left-0 top-0 h-2 w-full bg-gradient-to-r from-[#AA6EEE] to-[#8D99FF]"
            config={config}
          />
          <AnimatedItem
            specificClassName="right-0 top-2 bottom-0 w-2 bg-gradient-to-b from-[#8D99FF] to-[#A0FCFD]"
            config={config}
          />
          <AnimatedItem
            specificClassName="left-0 right-2 bottom-0 h-2 w-full bg-gradient-to-l from-[#A0FCFD] to-[#C686FF]"
            config={config}
          />
          <AnimatedItem
            specificClassName="left-0 top-2 bottom-2 w-2 bg-gradient-to-t from-[#C686FF] via-[#37E1BE] to-[#AA6EEE]"
            config={config}
          />
        </>
      )}
      <div className={'h-full'}>{children}</div>
    </div>
  );
};
