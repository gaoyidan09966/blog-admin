import axios from "axios";
import { ElMessage } from "element-plus";

// 创建 Axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
});

// 1. 请求拦截器：在发送请求前做点什么
service.interceptors.request.use(
  (config) => {
    // 从 localStorage 中读取登录时保存的 Token
    const token = localStorage.getItem("admin_token");
    if (token) {
      // 自动为每一个请求挂载企业级请求头
      config.headers["Authorization"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 2. 响应拦截器：在接收到后端返回后做点什么
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 如果后端返回的自定义 code 不是 200 或 201，视为错误处理
    if (res.code !== 200 && res.code !== 201) {
      ElMessage.error(res.message || "系统错误");
      return Promise.reject(new Error(res.message || "Error"));
    }
    return res;
  },
  (error) => {
    // 捕获网络或 HTTP 状态码错误 (例如后端的 401, 403, 500)
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        ElMessage.error("登录已过期或无权访问，请重新登录");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        // 非法访问，强制跳转回登录页
        window.location.href = "/login";
      } else {
        ElMessage.error(
          error.response.data.message || "服务器崩了，请稍后再试",
        );
      }
    } else {
      ElMessage.error("网络连接异常");
    }
    return Promise.reject(error);
  },
);

export default service;
