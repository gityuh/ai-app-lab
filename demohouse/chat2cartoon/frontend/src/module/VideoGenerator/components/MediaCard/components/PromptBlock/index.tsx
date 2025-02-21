import { Typography } from '@arco-design/web-react';

import styles from './index.module.less';

interface Props {
  prompt: string;
  rows?: number;
}

const PromptBlock = ({ prompt, rows = 2 }: Props) => (
  <Typography.Paragraph ellipsis={{ rows, showTooltip: true }} className={styles.text} style={{ marginBottom: 10 }}>
    {prompt}
  </Typography.Paragraph>
);

export default PromptBlock;
