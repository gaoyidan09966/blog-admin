<template>
    <el-container class="layout-container">
        <el-aside width="220px" class="layout-aside">
            <div class="logo">
                <h2>博客系统后台</h2>
            </div>
            <el-menu :default-active="route.path" router background-color="#304156" text-color="#bfcbd9"
                active-text-color="#409EFF">
                <el-menu-item index="/dashboard">
                    <el-icon>
                        <Odometer />
                    </el-icon>
                    <span>仪表盘</span>
                </el-menu-item>
                <el-menu-item index="/article">
                    <el-icon>
                        <Document />
                    </el-icon>
                    <span>文章管理</span>
                </el-menu-item>
                <el-menu-item index="/category">
                    <el-icon>
                        <Menu />
                    </el-icon>
                    <span>分类管理</span>
                </el-menu-item>
                <el-menu-item index="/tag">
                    <el-icon>
                        <PriceTag />
                    </el-icon>
                    <span>标签管理</span>
                </el-menu-item>
                <el-menu-item index="/user" v-if="isAdmin">
                    <el-icon>
                        <User />
                    </el-icon>
                    <span>用户管理</span>
                </el-menu-item>
                <el-menu-item index="/banner">
                    <el-icon>
                        <Picture />
                    </el-icon>
                    <span>轮播图管理</span>
                </el-menu-item>
                <el-menu-item index="/comment">
                    <el-icon>
                        <ChatDotRound />
                    </el-icon>
                    <span>评论管理</span>
                </el-menu-item>
                <el-menu-item index="/message">
                    <el-icon>
                        <ChatLineSquare />
                    </el-icon>
                    <span>留言墙管理</span>
                </el-menu-item>
                <el-menu-item index="/product">
                    <el-icon>
                        <ShoppingBag />
                    </el-icon>
                    <template #title>周边商品</template>
                </el-menu-item>
                <el-menu-item index="/order">
                    <el-icon>
                        <ShoppingCart />
                    </el-icon>
                    <template #title>订单管理</template>
                </el-menu-item>
                <el-menu-item index="/notice">
                    <el-icon>
                        <Document />
                    </el-icon>
                    <template #title>购买须知</template>
                </el-menu-item>
                <el-menu-item index="/chat">
                    <el-icon>
                        <ChatDotRound />
                    </el-icon>
                    <template #title>
                        客服消息
                        <span class="chat-badge" v-if="chatUnread > 0">{{ chatUnread }}</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="/profile">
                    <el-icon>
                        <User />
                    </el-icon>
                    <template #title>个人设置</template>
                </el-menu-item>
            </el-menu>
        </el-aside>

        <el-container>
            <el-header class="layout-header">
                <div class="header-left">
                    <span>欢迎回来，{{ adminName }}</span>
                </div>
                <div class="header-right">
                    <div class="header-user" @click="router.push('/profile')">
                        <el-avatar :size="32" :src="adminAvatar" class="header-avatar">
                            {{ adminName?.charAt(0) || 'A' }}
                        </el-avatar>
                        <span class="header-name">{{ adminName }}</span>
                    </div>
                    <el-button type="danger" size="small" @click="handleLogout"
                        style="margin-left: 12px;">退出登录</el-button>
                </div>
            </el-header>

            <el-main class="layout-main">
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useUserStore } from '../stores/user';
import request from '../api/request';

const route = useRoute();
const router = useRouter();
const adminName = ref('管理员');
const adminAvatar = ref('');
const isAdmin = ref(false);
const userStore = useUserStore();
const chatUnread = ref(0);

const handleLogout = () => {
    ElMessageBox.confirm('确定要退出后台管理系统吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        userStore.logout();
        ElMessage.success('已安全退出');
        router.push('/login');
    }).catch(() => { });
};

const fetchChatUnread = async () => {
    try {
        const res = await request.get('/chat/unread');
        chatUnread.value = res.data.unread;
    } catch (error) { }
};

onMounted(() => {
    const userString = localStorage.getItem('admin_user');
    if (userString) {
        const user = JSON.parse(userString);
        adminName.value = user.nickname || user.username;
        adminAvatar.value = user.avatar || '';
        isAdmin.value = user.role === 'admin';
    }
    fetchChatUnread();
    setInterval(fetchChatUnread, 30000);
});
</script>

<style scoped>
.layout-container {
    height: 100vh;
}

.layout-aside {
    background-color: #304156;
}

.logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    border-bottom: 1px solid #1f2d3d;
}

.logo h2 {
    font-size: 16px;
    margin: 0;
}

.el-menu {
    border-right: none;
}

.layout-header {
    background-color: #fff;
    border-bottom: 1px solid #e6e6e6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
}

.header-right {
    display: flex;
    align-items: center;
}

.header-user {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: background 0.2s;
}

.header-user:hover {
    background: #f5f5f5;
}

.header-avatar {
    background: linear-gradient(135deg, #409EFF, #67C23A);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
}

.header-name {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.layout-main {
    background-color: #f0f2f5;
    padding: 20px;
}

.chat-badge {
    display: inline-block;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: #F56C6C;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    line-height: 18px;
    text-align: center;
    border-radius: 10px;
    margin-left: 6px;
}
</style>