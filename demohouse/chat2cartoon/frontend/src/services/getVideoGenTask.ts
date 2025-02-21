import { globalEnv } from "@/constant";
import Cookies from "js-cookie";

import axios, { AxiosPromise, AxiosRequestConfig } from "axios";


type Request = <T>(params: { Id: string }) => AxiosPromise<T>;

export const GetVideoGenTask: Request = async (params: any) =>{
  const url = `/api/v3/contents/generations/tasks/${params.Id}`;
  const axiosConfig: AxiosRequestConfig = {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      'X-Csrf-Token': Cookies.get('csrfToken') || '',
      'Authorization': `Bearer ${globalEnv.ARK_API_KEY}`
    },
    url,
  };

  try {
    const result = await axios(axiosConfig);
    return Promise.resolve(result.data);
  } catch (error: any) {
    return Promise.reject(error);
  }
}
