import { globalEnv } from '@/constant';
import TosClient from '@volcengine/tos-sdk';

const TOP_REGION = 'cn-beijing';
const TOS_ENDPOINT = `tos-${TOP_REGION}.volces.com`;

const tosClient = new TosClient({
  region: TOP_REGION,
  endpoint: TOS_ENDPOINT,
  accessKeyId: globalEnv.ARK_ACCESS_KEY ?? '',
  accessKeySecret: globalEnv.ARK_SECRET_KEY ?? '',
});

export const signedSource = async (obj: any) => {
  await tosClient.getBucketAcl(obj.BucketName);
  const url = await tosClient.getPreSignedUrl({
    method: 'GET',
    bucket: obj.BucketName,
    key: obj.ObjectKey,
    expires: 60 * 60 * 24 * 7,
  });
  return url;
}
