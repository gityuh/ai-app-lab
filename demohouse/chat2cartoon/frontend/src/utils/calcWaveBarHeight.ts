// 柱子高度的最高值与最低值
export const barHeightMapping = {
  small: { min: 10, max: 24 },
  default: { min: 12, max: 32 },
};

const heightRange = barHeightMapping.default;
// 根据频谱数据动态计算柱子高度
export const calculateBarHeights = (audioData: Uint8Array): { bar1: number; bar2: number; bar3: number } => {
  const sampleRate = 48000;

  const lowFreq = 300; // 人声频率的最低范围
  const highFreq = 3400; // 人声频率的最高范围

  // 新划分的三个频段
  const low = lowFreq;
  const mid = 1000; // 人声音频范围划分为中低频、中频与中高频，中频通常为1kHz
  const high = highFreq;
  // 频率和索引之间存在线性关系:
  // 频率 / (采样率 / 2) = 索引 / 频谱数据长度
  const lowIndex = Math.round((low / (sampleRate / 2)) * audioData.length);
  const midIndex = Math.round((mid / (sampleRate / 2)) * audioData.length);
  const highIndex = Math.round((high / (sampleRate / 2)) * audioData.length);

  // 修改敏感度
  const sensitivityCoefficient = {
    lowFreq: 1.2,
    midFreq: 1.5,
    highFreq: 1.2,
  };

  const calculateMax = (start: number, end: number, coefficient: number) => {
    const segment = audioData.slice(start, end);
    return Math.max(...segment) * coefficient;
  };

  const max1 = calculateMax(lowIndex, midIndex, sensitivityCoefficient.lowFreq);
  const max2 = calculateMax(midIndex, highIndex, sensitivityCoefficient.midFreq);
  const max3 = calculateMax(highIndex, audioData.length, sensitivityCoefficient.highFreq);

  const mapHeight = (value: number): number => {
    const minHeight = heightRange.min;
    const maxHeight = heightRange.max;
    value = Math.max(0, Math.min(255, value));
    return minHeight + (maxHeight - minHeight) * (value / 255);
  };

  return {
    bar1: mapHeight(max1),
    bar2: mapHeight(max2),

    bar3: mapHeight(max3),
  };
};
