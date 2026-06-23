<template>
    <div class="profile-container">
        <el-row :gutter="20">
            <!-- 左侧：用户信息卡片 -->
            <el-col :span="8">
                <el-card class="info-card">
                    <div class="info-header">
                        <div class="avatar-wrapper" @click="triggerAvatarInput">
                            <el-avatar :size="100" :src="profileForm.avatar" class="admin-avatar">
                                {{ profileForm.nickname?.charAt(0) || 'A' }}
                            </el-avatar>
                            <div class="avatar-overlay">
                                <el-icon>
                                    <Camera />
                                </el-icon>
                            </div>
                        </div>
                        <input ref="avatarInput" type="file" accept="image/*" style="display: none;"
                            @change="handleAvatarChange" />
                        <h3 class="info-name">{{ profileForm.nickname || '管理员' }}</h3>
                        <el-tag :type="profileForm.role === 'admin' ? 'danger' : 'info'" size="small">
                            {{ profileForm.role === 'admin' ? '超级管理员' : '普通管理员' }}
                        </el-tag>
                    </div>
                    <div class="info-list">
                        <div class="info-item">
                            <span class="info-label">用户名</span>
                            <span class="info-value">{{ profileForm.username }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">注册时间</span>
                            <span class="info-value">{{ formatTime(profileForm.create_time) }}</span>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <!-- 右侧：编辑表单 -->
            <el-col :span="16">
                <el-card class="edit-card">
                    <el-tabs v-model="activeTab">
                        <!-- 基本资料 -->
                        <el-tab-pane label="基本资料" name="info">
                            <el-form :model="profileForm" :rules="infoRules" ref="infoFormRef" label-width="80px"
                                style="max-width: 500px; margin-top: 20px;">
                                <el-form-item label="用户名">
                                    <el-input :value="profileForm.username" disabled />
                                </el-form-item>
                                <el-form-item label="昵称" prop="nickname">
                                    <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
                                </el-form-item>
                                <el-form-item label="个人简介" prop="bio">
                                    <el-input v-model="profileForm.bio" type="textarea" :rows="4"
                                        placeholder="介绍一下自己吧..." maxlength="200" show-word-limit />
                                </el-form-item>
                                <el-form-item>
                                    <el-button type="primary" :loading="infoSaving" @click="handleSaveInfo">
                                        保存修改
                                    </el-button>
                                </el-form-item>
                            </el-form>
                        </el-tab-pane>

                        <!-- 修改密码 -->
                        <el-tab-pane label="修改密码" name="password">
                            <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef"
                                label-width="100px" style="max-width: 500px; margin-top: 20px;">
                                <el-form-item label="当前密码" prop="oldPassword">
                                    <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码"
                                        show-password />
                                </el-form-item>
                                <el-form-item label="新密码" prop="newPassword">
                                    <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码"
                                        show-password />
                                </el-form-item>
                                <el-form-item label="确认新密码" prop="confirmPassword">
                                    <el-input v-model="passwordForm.confirmPassword" type="password"
                                        placeholder="请再次输入新密码" show-password />
                                </el-form-item>
                                <el-form-item>
                                    <el-button type="primary" :loading="passwordSaving" @click="handleChangePassword">
                                        修改密码
                                    </el-button>
                                </el-form-item>
                            </el-form>
                        </el-tab-pane>
                    </el-tabs>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../../api/request';

const activeTab = ref('info');
const infoSaving = ref(false);
const passwordSaving = ref(false);
const infoFormRef = ref(null);
const passwordFormRef = ref(null);
const avatarInput = ref(null);

const profileForm = reactive({
    id: null,
    username: '',
    nickname: '',
    avatar: '',
    bio: '',
    role: '',
    create_time: ''
});

const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const infoRules = {
    nickname: [{ required: true, message: '昵称不能为空', trigger: 'blur' }]
};

const validateConfirm = (rule, value, callback) => {
    if (value !== passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
    } else {
        callback();
    }
};

const passwordRules = {
    oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不少于 6 位', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        { validator: validateConfirm, trigger: 'blur' }
    ]
};

// 触发头像选择
const triggerAvatarInput = () => {
    avatarInput.value.click();
};

// 处理头像上传
const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        ElMessage.error('头像只能是 JPG/PNG/GIF 格式!');
        return;
    }
    if (file.size / 1024 / 1024 > 2) {
        ElMessage.error('头像大小不能超过 2MB!');
        return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const res = await request.post('/user/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        profileForm.avatar = res.data.avatar;
        // 同步 localStorage
        localStorage.setItem('admin_user', JSON.stringify({
            ...JSON.parse(localStorage.getItem('admin_user') || '{}'),
            avatar: res.data.avatar
        }));
        ElMessage.success('头像更新成功！');
    } catch (error) {
        ElMessage.error('头像上传失败');
    }

    e.target.value = '';
};

// 获取当前管理员信息
const fetchProfile = async () => {
    try {
        const res = await request.get('/user/info');
        Object.assign(profileForm, res.data);
        localStorage.setItem('admin_user', JSON.stringify(res.data));
    } catch (error) {
        console.error('获取管理员信息失败:', error);
    }
};

// 保存基本资料
const handleSaveInfo = () => {
    infoFormRef.value.validate(async (valid) => {
        if (!valid) return;
        infoSaving.value = true;
        try {
            await request.put(`/user/${profileForm.id}`, {
                nickname: profileForm.nickname,
                bio: profileForm.bio,
                avatar: profileForm.avatar,
                role: profileForm.role
            });
            ElMessage.success('资料更新成功！');
            localStorage.setItem('admin_user', JSON.stringify({
                ...JSON.parse(localStorage.getItem('admin_user') || '{}'),
                nickname: profileForm.nickname,
                avatar: profileForm.avatar
            }));
            fetchProfile();
        } catch (error) {
            console.error('更新失败:', error);
        } finally {
            infoSaving.value = false;
        }
    });
};

// 修改密码（使用新的专用接口）
const handleChangePassword = () => {
    passwordFormRef.value.validate(async (valid) => {
        if (!valid) return;
        passwordSaving.value = true;
        try {
            await request.put('/user/password', {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            });
            ElMessage.success('密码修改成功！下次登录请使用新密码');
            passwordForm.oldPassword = '';
            passwordForm.newPassword = '';
            passwordForm.confirmPassword = '';
        } catch (error) {
            console.error('修改密码失败:', error);
        } finally {
            passwordSaving.value = false;
        }
    });
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleString();
};

onMounted(() => {
    fetchProfile();
});
</script>

<style scoped>
.profile-container {
    padding: 4px;
}

.info-card {
    border-radius: 8px;
}

.info-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 20px;
}

.avatar-wrapper {
    position: relative;
    cursor: pointer;
    border-radius: 50%;
    overflow: hidden;
}

.admin-avatar {
    background: linear-gradient(135deg, #409EFF, #67C23A);
    font-size: 40px;
    font-weight: 800;
    color: #fff;
}

.avatar-overlay {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 24px;
    opacity: 0;
    transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-overlay {
    opacity: 1;
}

.info-name {
    margin: 0;
    font-size: 18px;
    color: #303133;
}

.info-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.info-label {
    font-size: 13px;
    color: #909399;
}

.info-value {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
}

.edit-card {
    border-radius: 8px;
    min-height: 400px;
}
</style>