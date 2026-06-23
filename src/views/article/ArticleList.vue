<template>
    <div class="article-container">
        <el-card class="filter-card">
            <div class="filter-bar">
                <div class="filter-left">
                    <span class="label">文章标题：</span>
                    <el-input v-model="queryParams.title" placeholder="按标题筛选" clearable @keyup.enter="handleSearch"
                        @clear="handleSearch" style="width: 200px;" />
                    <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
                </div>
                <div class="filter-right">
                    <el-button type="primary" @click="handleAdd">新增文章</el-button>
                </div>
            </div>
        </el-card>

        <el-card class="table-card" style="margin-top: 15px;">
            <el-table :data="articleList" v-loading="loading" border style="width: 100%;">
                <el-table-column prop="id" label="ID" width="70" align="center" />
                <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
                <el-table-column prop="category_name" label="分类" width="120" align="center">
                    <template #default="scope">
                        <el-tag size="small">{{ scope.row.category_name || '未分类' }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="view_count" label="阅读" width="80" align="center">
                    <template #default="scope">
                        <span class="stat-num">{{ scope.row.view_count || 0 }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="like_count" label="点赞" width="90" align="center">
                    <template #default="scope">
                        <span class="like-link" @click="handleViewLikes(scope.row)">
                            {{ scope.row.like_count || 0 }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="is_recommend" label="推荐" width="80" align="center">
                    <template #default="scope">
                        <el-switch v-model="scope.row.is_recommend" :active-value="1" :inactive-value="0"
                            @change="handleRecommendChange(scope.row)" />
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="90" align="center">
                    <template #default="scope">
                        <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'" size="small">
                            {{ scope.row.status === 1 ? '已发布' : '草稿' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="create_time" label="创建时间" width="170" align="center">
                    <template #default="scope">
                        {{ formatTime(scope.row.create_time) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" align="center" fixed="right">
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

        <!-- 点赞用户详情弹窗 -->
        <el-dialog v-model="likesDialogVisible" width="520px">
            <template #header>
                <div class="likes-dialog-header">
                    <span class="likes-dialog-title">❤️ 点赞详情</span>
                    <span class="likes-dialog-subtitle">{{ likesArticle.title }}</span>
                </div>
            </template>
            <div class="likes-dialog-body" v-loading="likesLoading">
                <div class="likes-summary">
                    共 <strong>{{ likesList.length }}</strong> 人点赞
                </div>
                <div class="likes-list" v-if="likesList.length > 0">
                    <div v-for="item in likesList" :key="item.id" class="like-user-item">
                        <el-avatar :size="36" :src="item.avatar" class="like-user-avatar">
                            {{ item.nickname?.charAt(0) || item.username?.charAt(0) || 'U' }}
                        </el-avatar>
                        <div class="like-user-info">
                            <span class="like-user-name">{{ item.nickname || item.username }}</span>
                            <span class="like-user-username">@{{ item.username }}</span>
                        </div>
                        <span class="like-user-time">{{ formatTime(item.create_time) }}</span>
                    </div>
                </div>
                <el-empty v-else description="暂无点赞" :image-size="60" />
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import request from '../../api/request';

const router = useRouter();
const loading = ref(false);
const articleList = ref([]);
const totalCount = ref(0);

const queryParams = reactive({
    page: 1,
    pageSize: 10,
    title: ''
});

// 点赞弹窗相关
const likesDialogVisible = ref(false);
const likesLoading = ref(false);
const likesArticle = ref({});
const likesList = ref([]);

// 获取文章列表
const fetchArticles = async () => {
    loading.value = true;
    try {
        const res = await request.get('/article', { params: queryParams });
        articleList.value = res.data.list;
        totalCount.value = res.data.total;
    } catch (error) {
        console.error('获取文章列表失败:', error);
    } finally {
        loading.value = false;
    }
};

// 搜索
const handleSearch = () => {
    queryParams.page = 1;
    fetchArticles();
};

// 分页
const handleSizeChange = (newSize) => {
    queryParams.pageSize = newSize;
    fetchArticles();
};

const handleCurrentChange = (newPage) => {
    queryParams.page = newPage;
    fetchArticles();
};

// 新增
const handleAdd = () => {
    router.push('/article/publish');
};

// 编辑
const handleEdit = (row) => {
    router.push(`/article/edit/${row.id}`);
};

// 删除
const handleDelete = (row) => {
    ElMessageBox.confirm(
        `确定要删除文章「${row.title}」吗？`,
        '警告',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    ).then(async () => {
        try {
            await request.delete(`/article/${row.id}`);
            ElMessage.success('删除成功！');
            fetchArticles();
        } catch (error) {
            console.error('删除失败:', error);
        }
    }).catch(() => { });
};

// 切换推荐状态
const handleRecommendChange = async (row) => {
    try {
        await request.put(`/article/${row.id}`, {
            title: row.title,
            description: row.description || '',
            content: row.content || '',
            cover: row.cover || '',
            category_id: row.category_id,
            status: row.status,
            is_recommend: row.is_recommend,
            tagIds: []
        });
        ElMessage.success(row.is_recommend ? '已设为推荐' : '已取消推荐');
    } catch (error) {
        row.is_recommend = row.is_recommend === 1 ? 0 : 1;
        ElMessage.error('操作失败');
    }
};

// 查看点赞详情
const handleViewLikes = async (row) => {
    likesArticle.value = row;
    likesDialogVisible.value = true;
    likesLoading.value = true;
    likesList.value = [];

    try {
        const res = await request.get(`/article/${row.id}/likes`);
        likesArticle.value = res.data.article || row;
        likesList.value = res.data.likes;
    } catch (error) {
        console.error('获取点赞详情失败:', error);
    } finally {
        likesLoading.value = false;
    }
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleString();
};

onMounted(() => {
    fetchArticles();
});
</script>

<style scoped>
.article-container {
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
    white-space: nowrap;
}

.table-card {
    border-radius: 8px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

/* 阅读量 */
.stat-num {
    font-weight: 600;
    color: #606266;
}

/* 点赞数链接 */
.like-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    padding: 2px 10px;
    background: #fff0f0;
    color: #FF6B6B;
    font-size: 14px;
    font-weight: 700;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.like-link:hover {
    background: #ffe0e0;
    transform: scale(1.08);
}

/* ==================== 点赞弹窗 ==================== */
.likes-dialog-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.likes-dialog-title {
    font-size: 18px;
    font-weight: 800;
    color: #1a1a2e;
}

.likes-dialog-subtitle {
    font-size: 13px;
    color: #999;
}

.likes-summary {
    font-size: 14px;
    color: #666;
    padding: 12px 0 16px;
    border-bottom: 1px solid #f5f5f5;
    margin-bottom: 8px;
}

.likes-summary strong {
    color: #FF6B6B;
    font-size: 20px;
    font-weight: 900;
}

.likes-list {
    max-height: 400px;
    overflow-y: auto;
}

.like-user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 8px;
    border-bottom: 1px solid #f8f8f8;
    transition: background 0.2s;
    border-radius: 8px;
}

.like-user-item:last-child {
    border-bottom: none;
}

.like-user-item:hover {
    background: #fafafa;
}

.like-user-avatar {
    background: linear-gradient(135deg, #FF6B6B, #ee5a24);
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
}

.like-user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.like-user-name {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a2e;
}

.like-user-username {
    font-size: 12px;
    color: #bbb;
}

.like-user-time {
    font-size: 12px;
    color: #ccc;
    white-space: nowrap;
}
</style>