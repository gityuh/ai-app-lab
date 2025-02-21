import { MessageItemProps } from '../../types';
import styles from './index.module.less';

export interface ErrorContentProps {
  errorMessage: MessageItemProps['errorMessage'];
  renderErrorMessage?: MessageItemProps['renderErrorMessage'];
}

const ErrorContent = (props: ErrorContentProps) => {
  const { errorMessage, renderErrorMessage } = props;

  const errorContent = renderErrorMessage ? (
    renderErrorMessage(errorMessage)
  ) : (
    <div className={styles.arkUiChatMessageItemErrorContent}>
      <span>{errorMessage}</span>
    </div>
  );

  return <div>{errorContent}</div>;
};

export default ErrorContent;
