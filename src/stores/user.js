import { defineStore } from "pinia";
import { ref } from "vue";
import request from "../api/request";

// 定义一个名为 'user' 的 Store
export const useUserStore = defineStore("user", () => {
  // 1. 响应式状态 (State)
  const token = ref(localStorage.getItem("admin_token") || "");
  const userInfo = ref(JSON.parse(localStorage.getItem("admin_user") || "{}"));

  // 2. 行为逻辑 (Actions)

  // 设置登录信息（保存到内存 + 持久化到硬盘）
  const setLoginInfo = (loginData) => {
    token.value = loginData.token;
    userInfo.value = loginData.user;
    localStorage.setItem("admin_token", loginData.token);
    localStorage.setItem("admin_user", JSON.stringify(loginData.user));
  };

  // 退出登录（清空内存 + 清空硬盘）
  const logout = () => {
    token.value = "";
    userInfo.value = {};
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
  };

  // 【异步行为】：更新最新的用户信息
  const fetchLatestInfo = async () => {
    try {
      // 【异步等待】：调用我们在后端第一阶段写的 /api/user/info 接口
      const res = await request.get("/user/info");
      userInfo.value = res.data;
      localStorage.setItem("admin_user", JSON.stringify(res.data));
    } catch (error) {
      console.error("刷新用户信息失败:", error);
    }
  };

  return {
    token,
    userInfo,
    setLoginInfo,
    logout,
    fetchLatestInfo,
  };
});
