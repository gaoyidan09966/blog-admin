import request from "./request";

// 获取管理员信息
export function getAdminInfo() {
  return request({
    url: "/user/admin",
    method: "get",
  });
}
