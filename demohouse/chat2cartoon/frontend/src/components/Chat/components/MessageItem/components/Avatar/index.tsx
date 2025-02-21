import { MessageItemProps } from '../../types';

export interface AvatarProps {
  avatar: MessageItemProps['avatar'];
}

const Avatar = (props: AvatarProps) => {
  const { avatar } = props;
  return <div className="">{avatar}</div>;
};

export default Avatar;
