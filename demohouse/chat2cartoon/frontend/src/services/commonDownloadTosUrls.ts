import { signedSource } from "./tos";

export const CommonDownloadTosUrls = async (params: { TosObjects: any[] }) => {
  if (!params.TosObjects || params.TosObjects.length === 0) {
    return { TolUrls: [] };
  }
  const promiseList = params.TosObjects.map(obj => signedSource(obj));
  return { TolUrls: await Promise.all(promiseList) };
};
