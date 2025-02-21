import cx from 'classnames';

import styles from './index.module.less';

interface Props {
  title: string;
  imgArr?: string[];
  onSelect?: (index: number) => void;
  currentIndex?: number;
}

const MediaCardHeader = ({ title, imgArr = [], currentIndex, onSelect }: Props) => (
  <div className={styles.wrapper}>
    <div className={styles.title}>{title}</div>
    <div className={styles.imgList}>
      {imgArr?.map((img, index) => (
        <img
          key={index}
          src={img}
          className={cx(styles.imgItem, {
            [styles.imgItemSelected]: index === currentIndex,
          })}
          onClick={() => {
            onSelect?.(index);
          }}
        />
      ))}
    </div>
  </div>
);

export default MediaCardHeader;
