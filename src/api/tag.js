import request from "./request";

// 获取所有标签
export function getTagList() {
  return request({
    url: "/tag",
    method: "get",
  });
}

//获取单个标签详情
export function getTagDetail(id) {
  return request({
    url: `/tag/${id}`,
    method: "get",
  });
}

// 添加标签
export function createTag(data) {
  return request({
    url: "/tag",
    method: "post",
    data,
  });
}

// 更新标签
export function updateTag(id, data) {
  return request({
    url: `/tag/${id}`,
    method: "put",
    data,
  });
}

// 删除标签
export function deleteTag(id) {
  return request({
    url: `/tag/${id}`,
    method: "delete",
  });
}
