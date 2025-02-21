export const base64ToArrayBuffer = (base64: string) => {
  const str = atob(base64);
  const u8arr = new Uint8Array(str.length);
  for (let i = 0, L = u8arr.length; i < L; i++) {
    u8arr[i] = str.charCodeAt(i);
  }
  return u8arr.buffer;
};
