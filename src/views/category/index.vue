<template>
    <div class="category-container">
        <el-card class="table-card">
            <div class="action-bar">
                <el-button type="primary" icon="Plus" @click="openDialog('add')">新增分类</el-button>
                <el-button icon="Refresh" @click="fetchCategories">刷新数据</el-button>
            </div>

            <el-table :data="categoryList" v-loading="loading" border style="width: 100%; margin-top: 15px;">
                <el-table-column prop="id" label="ID" width="80" align="center" />
                <el-table-column prop="name" label="分类名称" min-width="150" />
                <el-table-column prop="create_time" label="创建时间" min-width="180">
                    <template #default="scope">
                        {{ formatTime(scope.row.create_time) }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="180" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" icon="Edit" @click="openDialog('edit', scope.row)">
                            编辑
                        </el-button>
                        <el-button type="danger" size="small" icon="Delete" @click="handleDelete(scope.row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增分类' : '编辑分类'" width="450px"
            @close="closeDialog">
            <el-form :model="categoryForm" :rules="rules" ref="formRef" label-width="80px">
                <el-form-item label="分类名" prop="name">
                    <el-input v-model="categoryForm.name" placeholder="请输入分类名称" maxlength="20" show-word-limit />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取 消</el-button>
                    <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api/request'; // 上几章封装的拦截器实例

// 状态控制
const categoryList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitLoading = ref(false);
const dialogType = ref('add'); // 'add' 或 'edit'
const formRef = ref(null);

// 表单响应式数据
const categoryForm = reactive({
    id: null,
    name: ''
});

// 预校验规则
const rules = {
    name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }]
};

// ==================== 核心业务逻辑 ====================

// 1. 获取全部分类列表
const fetchCategories = async () => {
    loading.value = true;
    try {
        // 【异步等待①】：向后端 GET /api/category 索要数据
        // 此时主线程释放，渲染表格的 loading 动画丝滑运转
        const res = await request.get('/category');
        categoryList.value = res.data;
    } catch (error) {
        console.error('获取分类失败:', error);
    } finally {
        loading.value = false;
    }
};

// 页面加载完毕后，立刻异步加载数据
onMounted(() => {
    fetchCategories();
});

// 2. 打开弹窗（兼容新增与修改）
const openDialog = (type, row = null) => {
    dialogType.value = type;
    dialogVisible.value = true;
    if (type === 'edit' && row) {
        // 回显数据：如果是编辑，把当前行的数据塞进表单里
        categoryForm.id = row.id;
        categoryForm.name = row.name;
    }
};

// 关闭弹窗清空表单
const closeDialog = () => {
    formRef.value.resetFields();
    categoryForm.id = null;
    categoryForm.name = '';
};

// 3. 提交表单（合并了 新增 与 修改 的请求逻辑）
const handleSubmit = () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return;
        submitLoading.value = true;
        try {
            if (dialogType.value === 'add') {
                // 【异步等待②-A】：新增分类发送 POST 请求
                await request.post('/category', { name: categoryForm.name });
                ElMessage.success('分类新增成功');
            } else {
                // 【异步等待②-B】：编辑分类发送 PUT /api/category/:id 请求
                await request.put(`/category/${categoryForm.id}`, { name: categoryForm.name });
                ElMessage.success('分类修改成功');
            }
            dialogVisible.value = false;
            fetchCategories(); // 重新异步刷新列表
        } catch (error) {
            console.error('提交分类异常:', error);
        } finally {
            submitLoading.value = false;
        }
    });
};

// 4. 删除分类
const handleDelete = (row) => {
    ElMessageBox.confirm(
        `确定要删除分类【${row.name}】吗？这可能会使该分类下的文章失去归属。`,
        '高危警告',
        { confirmButtonText: '极其确定', cancelButtonText: '算了吧', type: 'warning' }
    ).then(async () => {
        try {
            // 【异步等待③】：向后端发送 DELETE /api/category/:id 请求
            await request.delete(`/category/${row.id}`);
            ElMessage.success('分类已安全安全擦除');
            fetchCategories(); // 刷新列表
        } catch (error) {
            console.error('删除分类异常:', error);
        }
    }).catch(() => { });
};

// 简单的时间格式化工具
const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleString();
};
</script>

<style scoped>
.category-container {
    padding: 10px 0;
}

.action-bar {
    display: flex;
    gap: 10px;
}

.table-card {
    border-radius: 8px;
}
</style>