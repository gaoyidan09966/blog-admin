<template>
    <div class="user-container">
        <el-card class="filter-card">
            <div class="filter-bar">
                <div class="filter-left">
                    <span class="label">用户名筛选：</span>
                    <el-input v-model="queryParams.username" placeholder="请输入用户名" clearable @keyup.enter="handleSearch"
                        @clear="handleSearch" style="width: 200px;" />
                    <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
                </div>
                <div class="filter-right">
                    <el-button type="primary" @click="handleAdd">新增用户</el-button>
                </div>
            </div>
        </el-card>

        <el-card class="table-card" style="margin-top: 15px;">
            <el-table :data="userList" v-loading="loading" border style="width: 100%;">
                <el-table-column prop="id" label="ID" width="70" align="center" />
                <el-table-column prop="username" label="用户名" width="150" />
                <el-table-column prop="nickname" label="昵称" width="150" />
                <el-table-column prop="role" label="角色" width="120" align="center">
                    <template #default="scope">
                        <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'info'">
                            {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="create_time" label="注册时间" width="180" align="center">
                    <template #default="scope">
                        {{ formatTime(scope.row.create_time) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="180" align="center" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize"
                    :page-sizes="[5, 10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" :total="totalCount"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </el-card>

        <!-- 新增/编辑弹窗 -->
        <el-dialog :title="isEdit ? '编辑用户' : '新增用户'" v-model="dialogVisible" width="480px">
            <el-form :model="userForm" :rules="rules" ref="formRef" label-width="80px">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="isEdit" />
                </el-form-item>
                <el-form-item label="密码" :prop="isEdit ? '' : 'password'">
                    <el-input v-model="userForm.password" type="password" show-password
                        :placeholder="isEdit ? '留空则不修改密码' : '请输入密码'" />
                </el-form-item>
                <el-form-item label="昵称" prop="nickname">
                    <el-input v-model="userForm.nickname" placeholder="请输入昵称" />
                </el-form-item>
                <el-form-item label="角色" prop="role">
                    <el-select v-model="userForm.role" style="width: 100%;">
                        <el-option label="普通用户" value="user" />
                        <el-option label="管理员" value="admin" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api/request';

const loading = ref(false);
const submitLoading = ref(false);
const userList = ref([]);
const totalCount = ref(0);
const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref(null);
const formRef = ref(null);

const queryParams = reactive({
    page: 1,
    pageSize: 10,
    username: ''
});

const userForm = reactive({
    username: '',
    password: '',
    nickname: '',
    role: 'user'
});

const rules = {
    username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
    password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
    nickname: [{ required: true, message: '昵称不能为空', trigger: 'blur' }],
    role: [{ required: true, message: '请选择角色', trigger: 'change' }]
};

// 获取用户列表
const fetchUsers = async () => {
    loading.value = true;
    try {
        const res = await request.get('/user/list', { params: queryParams });
        userList.value = res.data.list;
        totalCount.value = res.data.total;
    } catch (error) {
        console.error('获取用户列表失败:', error);
    } finally {
        loading.value = false;
    }
};

// 搜索
const handleSearch = () => {
    queryParams.page = 1;
    fetchUsers();
};

// 分页
const handleSizeChange = (newSize) => {
    queryParams.pageSize = newSize;
    fetchUsers();
};

const handleCurrentChange = (newPage) => {
    queryParams.page = newPage;
    fetchUsers();
};

// 新增
const handleAdd = () => {
    isEdit.value = false;
    editId.value = null;
    userForm.username = '';
    userForm.password = '';
    userForm.nickname = '';
    userForm.role = 'user';
    dialogVisible.value = true;
};

// 编辑
const handleEdit = async (row) => {
    isEdit.value = true;
    editId.value = row.id;
    userForm.username = row.username;
    userForm.password = '';
    userForm.nickname = row.nickname;
    userForm.role = row.role;
    dialogVisible.value = true;
};

// 提交
const handleSubmit = () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return;
        submitLoading.value = true;
        try {
            if (isEdit.value) {
                // 编辑：密码留空就不传
                const data = {
                    nickname: userForm.nickname,
                    role: userForm.role
                };
                if (userForm.password) {
                    data.password = userForm.password;
                }
                await request.put(`/user/${editId.value}`, data);
                ElMessage.success('用户信息更新成功！');
            } else {
                // 新增
                await request.post('/user', userForm);
                ElMessage.success('用户创建成功！');
            }
            dialogVisible.value = false;
            fetchUsers();
        } catch (error) {
            console.error('操作失败:', error);
        } finally {
            submitLoading.value = false;
        }
    });
};

// 删除
const handleDelete = (row) => {
    ElMessageBox.confirm(
        `确定要删除用户「${row.nickname}」吗？此操作不可逆。`,
        '警告',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    ).then(async () => {
        try {
            await request.delete(`/user/${row.id}`);
            ElMessage.success('用户删除成功！');
            fetchUsers();
        } catch (error) {
            console.error('删除用户失败:', error);
        }
    }).catch(() => { });
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleString();
};

onMounted(() => {
    fetchUsers();
});
</script>

<style scoped>
.user-container {
    padding: 4px;
}

.filter-card {
    border-radius: 8px;
}

.filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.filter-left {
    display: flex;
    align-items: center;
}

.filter-left .label {
    font-size: 14px;
    color: #606266;
}

.table-card {
    border-radius: 8px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>