<template>
    <div class="login-container">
        <el-card class="login-card">
            <template #header>
                <div class="login-title">
                    <h2>博客系统 - 管理后台</h2>
                </div>
            </template>

            <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" size="large">

                <el-form-item prop="username">
                    <el-input v-model="loginForm.username" placeholder="请输入管理员账号" prefix-icon="User" clearable />
                </el-form-item>

                <el-form-item prop="password">
                    <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock"
                        show-password @keyup.enter="handleLogin" />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" class="login-button" :loading="loading" @click="handleLogin">
                        {{ loading ? '正在登录...' : '登 录' }}
                    </el-button>
                </el-form-item>

            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '../../api/request'; // 引入上一章封装的 Axios 拦截器
import { useUserStore } from '../../stores/user'; // 引入 Pinia 的 User Store

const router = useRouter();
const loginFormRef = ref(null);
const loading = ref(false);
const userStore = useUserStore();

// 1. 响应式表单数据源
const loginForm = reactive({
    username: '',
    password: ''
});

// 2. 企业级前端表单校验规则
const loginRules = {
    username: [
        { required: true, message: '账号不能为空', trigger: 'blur' },
        { min: 3, max: 20, message: '账号长度需在 3 到 20 个字符之间', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '密码不能为空', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度需在 6 到 20 个字符之间', trigger: 'blur' }
    ]
};

// 3. 核心登录提交逻辑
const handleLogin = () => {
    loginFormRef.value.validate(async (valid) => {
        if (!valid) return;
        loading.value = true;
        try {
            const res = await request.post('/user/login', loginForm);
            // 【重构点】：调用 Store 的动作，一键完成内存和硬盘的同步
            userStore.setLoginInfo(res.data);

            ElMessage.success('登录成功');
            router.push('/article');
        } finally {
            loading.value = false;
        }
    });
};
</script>

<style scoped>
.login-container {
    height: 100vh;
    background: linear-gradient(135deg, #141e30, #243b55);
    /* 沉稳的程序员暗夜渐变色 */
    display: flex;
    justify-content: center;
    align-items: center;
}

.login-card {
    width: 420px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.login-title h2 {
    text-align: center;
    margin: 0;
    color: #303133;
    font-size: 20px;
    font-weight: 600;
}

.login-button {
    width: 100%;
    margin-top: 10px;
    letter-spacing: 2px;
}
</style>