import type { AxiosError } from 'axios';
import { get } from 'lodash';

/** AbortController 取消请求时 message 内容 */
export const AxiosCancelErrMsg = 'canceled';

/** 判断 err 是否为 AxiosError */
export const isAxiosError = (err: any): err is AxiosError => get(err, 'isAxiosError') === true;
