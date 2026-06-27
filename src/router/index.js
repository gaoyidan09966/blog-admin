import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/login/index.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/",
    component: () => import("../layout/index.vue"),
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("../views/dashboard/index.vue"),
        meta: { title: "仪表盘" },
      },
      {
        path: "article",
        name: "Article",
        component: () => import("../views/article/ArticleList.vue"),
        meta: { title: "文章管理" },
      },
      {
        path: "article/publish",
        name: "ArticlePublish",
        component: () => import("../views/article/ArticlePublish.vue"),
        meta: { title: "发布文章" },
      },
      {
        path: "article/edit/:id",
        name: "ArticleEdit",
        component: () => import("../views/article/ArticlePublish.vue"),
        meta: { title: "编辑文章" },
      },
      {
        path: "category",
        name: "Category",
        component: () => import("../views/category/index.vue"),
        meta: { title: "分类管理" },
      },
      {
        path: "tag",
        name: "Tag",
        component: () => import("../views/tag/index.vue"),
        meta: { title: "标签管理" },
      },
      {
        path: "user",
        name: "User",
        component: () => import("../views/user/UserList.vue"),
        meta: { title: "用户管理" },
      },
      {
        path: "comment",
        name: "Comment",
        component: () => import("../views/comment/CommentList.vue"),
        meta: { title: "评论管理" },
      },
      {
        path: "banner",
        name: "Banner",
        component: () => import("../views/banner/BannerList.vue"),
        meta: { title: "轮播图管理" },
      },
      {
        path: "message",
        name: "Message",
        component: () => import("../views/message/MessageList.vue"),
        meta: { title: "留言墙管理" },
      },
      {
        path: "profile",
        name: "AdminProfile",
        component: () => import("../views/profile/index.vue"),
        meta: { title: "个人设置" },
      },
      {
        path: "/product",
        name: "Product",
        component: () => import("../views/product/ProductList.vue"),
        meta: { title: "周边商品" },
      },
      {
        path: "/notice",
        name: "Notice",
        component: () => import("../views/notice/NoticeList.vue"),
        meta: { title: "购买须知" },
      },
      {
        path: "/chat",
        name: "Chat",
        component: () => import("../views/chat/ChatList.vue"),
        meta: { title: "客服消息" },
      },
      {
        path: "/order",
        component: () => import("../views/order/OrderList.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory("/admin/"),
  routes,
});

router.beforeEach((to) => {
  const token = localStorage.getItem("admin_token");

  if (to.path === "/login") {
    if (token) return "/dashboard";
    return;
  }

  if (!token) return "/login";

  if (to.meta.title) {
    document.title = to.meta.title + " - 博客后台管理系统";
  }
});

export default router;
