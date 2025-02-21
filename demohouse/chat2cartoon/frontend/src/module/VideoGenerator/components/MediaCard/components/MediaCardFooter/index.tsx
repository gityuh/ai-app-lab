
import { Button, ButtonProps, Popover } from '@arco-design/web-react';
import { IconRefresh, IconEdit } from '@arco-design/web-react/icon';

import DoubaoImg from '@/images/assets/doubao.png';

import styles from './index.module.less';
import { IconWarningFill } from '@/images/iconBox';

interface MediaCardFooterProps {
  imgUrl?: string;
  modelName?: string;
  disabled?: boolean;
  onRefresh?: () => void;
  onEdit?: () => void;
  regenerateButtonProps?: ButtonProps;
  editButtonProps?: ButtonProps;
  editWarning?: boolean;
  regenerateWarning?: boolean;
}

const MediaCardFooter = ({
  imgUrl = DoubaoImg,
  modelName = 'Doubao-pro-32k',
  disabled = false,
  onRefresh,
  onEdit,
  regenerateButtonProps,
  editButtonProps,
  editWarning,
  regenerateWarning,
}: MediaCardFooterProps) => (
  <div className={styles.footerWrapper}>
    <div className={styles.operations}>
      <Button
        disabled={disabled}
        icon={<IconRefresh style={{ fontSize: 16 }} />}
        onClick={onRefresh}
        className={styles.icon}
        {...regenerateButtonProps}
      />
      {editWarning ? (
        <Popover content={'可能需要更新'}>
          <IconWarningFill className={styles.editWarning} />
        </Popover>
      ) : null}
      <Button
        disabled={disabled}
        icon={<IconEdit style={{ fontSize: 16 }} />}
        onClick={onEdit}
        className={styles.icon}
        {...editButtonProps}
      />
      {regenerateWarning ? (
        <Popover content={'可能需要更新'}>
          <IconWarningFill className={styles.regenerateWarning} />
        </Popover>
      ) : null}
    </div>
    <div className={styles.model}>
      <img src={imgUrl} />
      <div className={styles.name}>{modelName}</div>
    </div>
  </div>
);

export default MediaCardFooter;
