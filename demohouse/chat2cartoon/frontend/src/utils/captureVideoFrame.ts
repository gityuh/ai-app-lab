export const captureVideoFrame = (canvas: HTMLCanvasElement | null, video: HTMLVideoElement | null) => {
  if (!canvas || !video) {
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg');
};
