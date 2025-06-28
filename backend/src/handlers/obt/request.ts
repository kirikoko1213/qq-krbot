import axios, { type AxiosResponse, type AxiosRequestConfig } from 'axios';

// 创建axios实例
const service = axios.create({
  timeout: 10000, // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    return config;
  },
  error => {
    // 对请求错误做些什么
    console.log(error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    return res;
  },
  error => {
    console.log('err' + error);
    return Promise.reject(error);
  }
);

// 泛型请求封装
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  retcode: number;
  data?: T;
  message?: string;
  wording?: string;
}

export const request = {
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    return service.get(url, config);
  },
  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    return service.post(url, data, config);
  },
};

export default request;
