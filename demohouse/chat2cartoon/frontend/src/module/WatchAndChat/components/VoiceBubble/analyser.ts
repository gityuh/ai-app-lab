export const fftSize = 1024;

export const blobToBuffer = (blob: Blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(arrayBuffer);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });

export const calculateSpectrumData = async ({
  blob,
  onSpectrumData,
}: {
  blob: Blob;
  onSpectrumData: ((data: Uint8Array) => void) | null;
}) => {
  if (!onSpectrumData) {
    return;
  }

  if (blob.size <= 0) {
    return;
  }

  // 创建 OfflineAudioContext 并设置分析器
  const numberOfChannels = 1;
  const sampleRate = 48000;
  const arrayBuffer = (await blobToBuffer(blob)) as ArrayBuffer;
  const offlineCtx = new OfflineAudioContext(numberOfChannels, arrayBuffer.byteLength, sampleRate);
  const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer); // 将 ArrayBuffer 解码为 AudioBuffer
  // console.log(audioBuffer, 'audioBuffer');

  const analyser = offlineCtx.createAnalyser();
  // 创建 buffer source 和连接结构
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);
  analyser.connect(offlineCtx.destination);

  source.start(0);

  // 渲染并获取频谱数据
  offlineCtx
    .startRendering()
    .then(renderedBuffer => {
      // console.log('audio_data_analyse_render', renderedBuffer);
      // 创建数组以获取频谱数据，frequencyBinCount为fftSize的一半
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      analyser.getByteFrequencyData(dataArray);

      onSpectrumData?.(dataArray);
    })
    .catch(error => {
      console.log('audio_data_analyse_render', error);
    });
};
