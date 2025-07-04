import axios, { type AxiosResponse, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // api的base_url
  timeout: 10000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    return config
  },
  error => {
    // 对请求错误做些什么
    console.log(error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    return res
  },
  error => {
    console.log('err' + error)
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 3 * 1000
    })
    return Promise.reject(error)
  }
)

// 泛型请求封装
interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  status: "success" | "error"
}

export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return service.get(url, config)
  },
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return service.post(url, data, config)
  },
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return service.put(url, data, config)
  },
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return service.delete(url, config)
  }
}

export default service 