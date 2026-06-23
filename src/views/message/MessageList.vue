<template>
    <div class="message-container">
        <!-- 统计卡片 -->
        <div class="stats-grid">
            <div class="stat-card stat-theme-0">
                <span class="stat-icon">💬</span>
                <div class="stat-info">
                    <span class="stat-num">{{ totalCount }}</span>
                    <span class="stat-label">总留言数</span>
                </div>
            </div>
            <div class="stat-card stat-theme-1">
                <span class="stat-icon">📌</span>
                <div class="stat-info">
                    <span class="stat-num">{{ topCount }}</span>
                    <span class="stat-label">置顶留言</span>
                </div>
            </div>
            <div class="stat-card stat-theme-2">
                <span class="stat-icon">❤️</span>
                <div class="stat-info">
                    <span class="stat-num">{{ totalLikes }}</span>
                    <span class="stat-label">总点赞数</span>
                </div>
            </div>
        </div>

        <!-- 筛选栏 -->
        <el-card class="filter-card">
            <div class="filter-bar">
                <div class="filter-left">
                    <el-input v-model="queryParams.nickname" placeholder="按昵称筛选" clearable @keyup.enter="handleSearch"
                        @clear="handleSearch" style="width: 200px;" />
                    <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
                </div>
            </div>
        </el-card>

        <!-- 表格 -->
        <el-card class="table-card" style="margin-top: 15px;">
            <el-table :data="messageList" v-loading="loading" border style="width: 100%;">
                <el-table-column prop="id" label="ID" width="60" align="center" />
                <el-table-column prop="emoji" label="表情" width="60" align="center">
                    <template #default="scope">
                        <span style="font-size: 22px;">{{ scope.row.emoji }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="nickname" label="昵称" width="110" />
                <el-table-column prop="content" label="留言内容" min-width="200" show-overflow-tooltip />
                <el-table-column label="图片" width="70" align="center">
                    <template #default="scope">
                        <span v-if="scope.row.image_url" style="color: #67C23A; font-size: 16px;">📷</span>
                        <span v-else style="color: #ccc;">-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="color" label="颜色" width="70" align="center">
                    <template #default="scope">
                        <div class="color-preview" :style="{ background: scope.row.color }"></div>
                    </template>
                </el-table-column>
                <el-table-column prop="like_count" label="点赞" width="65" align="center" />
                <el-table-column prop="reply_count" label="回复" width="65" align="center">
                    <template #default="scope">
                        <span>{{ scope.row.reply_count || 0 }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="is_top" label="置顶" width="80" align="center">
                    <template #default="scope">
                        <el-tag :type="scope.row.is_top ? 'danger' : 'info'" size="small">
                            {{ scope.row.is_top ? '置顶' : '普通' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80" align="center">
                    <template #default="scope">
                        <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0"
                            @change="handleStatusChange(scope.row)" />
                    </template>
                </el-table-column>
                <el-table-column prop="create_time" label="时间" width="170" align="center">
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

        <!-- 编辑弹窗 -->
        <el-dialog title="编辑留言" v-model="dialogVisible" width="500px">
            <el-form :model="editForm" label-width="60px">
                <el-form-item label="昵称">
                    <el-input v-model="editForm.nickname" maxlength="20" />
                </el-form-item>
                <el-form-item label="内容">
                    <el-input v-model="editForm.content" type="textarea" :rows="3" maxlength="200" />
                </el-form-item>
                <el-form-item label="图片" v-if="editForm.image_url">
                    <div class="edit-image-preview">
                        <img :src="getAdminImageUrl(editForm.image_url)" />
                    </div>
                </el-form-item>
                <el-form-item label="表情">
                    <div class="emoji-picker">
                        <span v-for="e in emojiList" :key="e" class="emoji-item"
                            :class="{ active: editForm.emoji === e }" @click="editForm.emoji = e">{{ e }}</span>
                    </div>
                </el-form-item>
                <el-form-item label="颜色">
                    <div class="color-picker">
                        <span v-for="c in colorList" :key="c" class="color-item"
                            :class="{ active: editForm.color === c }" :style="{ background: c }"
                            @click="editForm.color = c"></span>
                    </div>
                </el-form-item>
                <el-form-item label="置顶">
                    <el-switch v-model="editForm.is_top" :active-value="1" :inactive-value="0" />
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
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api/request';

const loading = ref(false);
const submitLoading = ref(false);
const messageList = ref([]);
const totalCount = ref(0);
const dialogVisible = ref(false);

const emojiList = ['💬', '🌟', '☀️', '❤️', '🌙', '📖', '🎨', '🎵', '🔥', '💡', '🍀', '🌈'];
const colorList = ['#667eea', '#4ECDC4', '#FF6B6B', '#FCD34D', '#A78BFA', '#F472B6', '#34D399', '#FB923C'];

const queryParams = reactive({ page: 1, pageSize: 10, nickname: '' });
const editForm = reactive({ id: null, nickname: '', content: '', emoji: '💬', color: '#667eea', is_top: 0, status: 1, image_url: '' });

// 统计
const topCount = computed(() => messageList.value.filter(m => m.is_top).length);
const totalLikes = computed(() => messageList.value.reduce((sum, m) => sum + (m.like_count || 0), 0));

// 图片地址（改成你的端口 3001）
const getAdminImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3001${url}`;
};

const fetchMessages = async () => {
    loading.value = true;
    try {
        const res = await request.get('/message', { params: queryParams });
        messageList.value = res.data.list;
        totalCount.value = res.data.total;
    } catch (error) {
        console.error('获取留言列表失败:', error);
    } finally {
        loading.value = false;
    }
};

const handleSearch = () => { queryParams.page = 1; fetchMessages(); };
const handleSizeChange = (s) => { queryParams.pageSize = s; fetchMessages(); };
const handleCurrentChange = (p) => { queryParams.page = p; fetchMessages(); };

const handleEdit = (row) => { Object.assign(editForm, row); dialogVisible.value = true; };

const handleSubmit = async () => {
    submitLoading.value = true;
    try {
        await request.put(`/message/${editForm.id}`, editForm);
        ElMessage.success('更新成功！');
        dialogVisible.value = false;
        fetchMessages();
    } catch (error) { console.error('更新失败:', error); }
    finally { submitLoading.value = false; }
};

const handleDelete = (row) => {
    ElMessageBox.confirm(`确定要删除这条留言吗？`, '警告', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    }).then(async () => {
        try { await request.delete(`/message/${row.id}`); ElMessage.success('删除成功！'); fetchMessages(); }
        catch (error) { console.error('删除失败:', error); }
    }).catch(() => { });
};

const handleStatusChange = async (row) => {
    try { await request.put(`/message/${row.id}`, row); ElMessage.success(row.status === 1 ? '已显示' : '已隐藏'); }
    catch (error) { row.status = row.status === 1 ? 0 : 1; }
};

const formatTime = (t) => t ? new Date(t).toLocaleString() : '';

onMounted(() => { fetchMessages(); });
</script>

<style scoped>
.message-container {
    padding: 4px;
}

/* 统计卡片 */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 15px;
}

.stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    border: 1px solid rgba(0, 0, 0, 0.04);
    position: relative;
    overflow: hidden;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
}

.stat-theme-0::before {
    background: linear-gradient(90deg, #667eea, #8ba0f5);
}

.stat-theme-1::before {
    background: linear-gradient(90deg, #FF6B6B, #FF9F9F);
}

.stat-theme-2::before {
    background: linear-gradient(90deg, #F472B6, #FCD34D);
}

.stat-icon {
    font-size: 30px;
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-num {
    font-size: 26px;
    font-weight: 900;
    color: #1a1a2e;
    line-height: 1.2;
}

.stat-label {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
}

/* 筛选栏 */
.filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.filter-left {
    display: flex;
    align-items: center;
}

.table-card {
    border-radius: 8px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.color-preview {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin: 0 auto;
}

/* 编辑弹窗图片 */
.edit-image-preview {
    display: flex;
    align-items: center;
    gap: 10px;
}

.edit-image-preview img {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
}

/* Emoji & 颜色选择器 */
.emoji-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.emoji-item {
    font-size: 22px;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    border: 2px solid transparent;
    transition: all 0.2s;
}

.emoji-item:hover {
    background: #f5f5f5;
}

.emoji-item.active {
    border-color: #409EFF;
    background: #f0f7ff;
}

.color-picker {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.color-item {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    border: 3px solid transparent;
    transition: all 0.2s;
}

.color-item:hover {
    transform: scale(1.1);
}

.color-item.active {
    border-color: #1a1a2e;
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }
}
</style>