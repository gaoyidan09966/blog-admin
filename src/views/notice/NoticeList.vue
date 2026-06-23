<template>
    <div class="notice-container">
        <el-card class="filter-card">
            <div class="filter-bar">
                <span class="page-info">购买须知管理</span>
                <el-button type="primary" @click="handleAdd">新增须知</el-button>
            </div>
        </el-card>

        <el-card class="table-card" style="margin-top: 15px;">
            <el-table :data="noticeList" v-loading="loading" border style="width: 100%;">
                <el-table-column prop="id" label="ID" width="60" align="center" />
                <el-table-column prop="icon" label="图标" width="70" align="center">
                    <template #default="scope">
                        <span style="font-size: 24px;">{{ scope.row.icon }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="title" label="标题" width="140" />
                <el-table-column prop="description" label="内容" min-width="300" show-overflow-tooltip />
                <el-table-column prop="sort_order" label="排序" width="80" align="center">
                    <template #default="scope">
                        <span style="color: #999;">{{ scope.row.sort_order || 0 }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80" align="center">
                    <template #default="scope">
                        <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0"
                            @change="handleStatusChange(scope.row)" />
                    </template>
                </el-table-column>
                <el-table-column prop="create_time" label="创建时间" width="170" align="center">
                    <template #default="scope">
                        {{ formatTime(scope.row.create_time) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="160" align="center" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize"
                    :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" :total="totalCount"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </el-card>

        <!-- 新增/编辑弹窗 -->
        <el-dialog :title="isEdit ? '编辑须知' : '新增须知'" v-model="dialogVisible" width="520px">
            <el-form :model="noticeForm" :rules="rules" ref="formRef" label-width="60px">
                <el-form-item label="图标">
                    <div class="emoji-picker">
                        <span v-for="e in iconList" :key="e" class="emoji-item"
                            :class="{ active: noticeForm.icon === e }" @click="noticeForm.icon = e">
                            {{ e }}
                        </span>
                    </div>
                </el-form-item>
                <el-form-item label="标题" prop="title">
                    <el-input v-model="noticeForm.title" placeholder="如：配送说明" maxlength="50" />
                </el-form-item>
                <el-form-item label="内容" prop="description">
                    <el-input v-model="noticeForm.description" type="textarea" :rows="4" placeholder="详细说明内容..."
                        maxlength="500" show-word-limit />
                </el-form-item>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="排序">
                            <el-input-number v-model="noticeForm.sort_order" :min="0" :max="9999" style="width:100%;" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="状态">
                            <el-switch v-model="noticeForm.status" :active-value="1" :inactive-value="0"
                                active-text="启用" inactive-text="禁用" />
                        </el-form-item>
                    </el-col>
                </el-row>
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
const noticeList = ref([]);
const totalCount = ref(0);
const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref(null);
const formRef = ref(null);

const queryParams = reactive({ page: 1, pageSize: 10 });

const noticeForm = reactive({
    icon: '📌', title: '', description: '', sort_order: 0, status: 1
});

const rules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    description: [{ required: true, message: '请输入内容', trigger: 'blur' }]
};

const iconList = ['📌', '🚚', '🔄', '🎁', '💬', '📦', '🛡️', '✅', '🔒', '⏰', '📋', '💡', '⚠️', '🔔', '💰', '🏪'];

const formatTime = (t) => t ? new Date(t).toLocaleString() : '';

// 获取列表
const fetchNotices = async () => {
    loading.value = true;
    try {
        const res = await request.get('/notice', { params: queryParams });
        noticeList.value = res.data.list;
        totalCount.value = res.data.total;
    } catch (error) {
        console.error('获取列表失败:', error);
    } finally {
        loading.value = false;
    }
};

const handleSizeChange = (s) => { queryParams.pageSize = s; fetchNotices(); };
const handleCurrentChange = (p) => { queryParams.page = p; fetchNotices(); };

// 新增
const handleAdd = () => {
    isEdit.value = false;
    editId.value = null;
    Object.assign(noticeForm, {
        icon: '📌', title: '', description: '', sort_order: 0, status: 1
    });
    dialogVisible.value = true;
};

// 编辑
const handleEdit = (row) => {
    isEdit.value = true;
    editId.value = row.id;
    Object.assign(noticeForm, {
        icon: row.icon || '📌', title: row.title,
        description: row.description, sort_order: row.sort_order || 0,
        status: row.status
    });
    dialogVisible.value = true;
};

// 提交
const handleSubmit = () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return;
        submitLoading.value = true;
        try {
            if (isEdit.value) {
                await request.put(`/notice/${editId.value}`, noticeForm);
                ElMessage.success('更新成功！');
            } else {
                await request.post('/notice', noticeForm);
                ElMessage.success('创建成功！');
            }
            dialogVisible.value = false;
            fetchNotices();
        } catch (error) {
            console.error('操作失败:', error);
        } finally {
            submitLoading.value = false;
        }
    });
};

// 删除
const handleDelete = (row) => {
    ElMessageBox.confirm(`确定要删除「${row.title}」吗？`, '警告', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    }).then(async () => {
        try {
            await request.delete(`/notice/${row.id}`);
            ElMessage.success('删除成功！');
            fetchNotices();
        } catch (error) {
            console.error('删除失败:', error);
        }
    }).catch(() => { });
};

// 状态切换
const handleStatusChange = async (row) => {
    try {
        await request.put(`/notice/${row.id}`, row);
        ElMessage.success(row.status === 1 ? '已启用' : '已禁用');
    } catch (error) {
        row.status = row.status === 1 ? 0 : 1;
        console.error('状态更新失败:', error);
    }
};

onMounted(() => { fetchNotices(); });
</script>

<style scoped>
.notice-container {
    padding: 4px;
}

.filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-info {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a2e;
}

.table-card {
    border-radius: 8px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

/* 图标选择器 */
.emoji-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.emoji-item {
    font-size: 24px;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    transition: all 0.2s;
    border: 2px solid transparent;
}

.emoji-item:hover {
    background: #f5f5f5;
}

.emoji-item.active {
    border-color: #409EFF;
    background: #f0f7ff;
}
</style>