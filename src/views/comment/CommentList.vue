<template>
    <div class="comment-container">
        <el-card class="filter-card">
            <div class="filter-bar">
                <div class="filter-left">
                    <span class="label">文章标题：</span>
                    <el-input v-model="queryParams.article_title" placeholder="按文章标题筛选" clearable
                        @keyup.enter="handleSearch" @clear="handleSearch" style="width: 200px;" />
                    <span class="label" style="margin-left: 16px;">用户名：</span>
                    <el-input v-model="queryParams.user_name" placeholder="按用户名筛选" clearable @keyup.enter="handleSearch"
                        @clear="handleSearch" style="width: 180px;" />
                    <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
                </div>
            </div>
        </el-card>

        <el-card class="table-card" style="margin-top: 15px;">
            <el-table :data="commentList" v-loading="loading" border style="width: 100%;">
                <el-table-column prop="id" label="ID" width="70" align="center" />
                <el-table-column prop="user_name" label="用户" width="120">
                    <template #default="scope">
                        <div class="user-cell">
                            <span class="user-tag" v-if="scope.row.is_reply">回复</span>
                            <span>{{ scope.row.user_name || scope.row.username || '未知' }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="article_title" label="所属文章" min-width="180" show-overflow-tooltip>
                    <template #default="scope">
                        <span class="article-link" @click="goToArticle(scope.row.article_id)">
                            {{ scope.row.article_title || '已删除的文章' }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="content" label="评论内容" min-width="280">
                    <template #default="scope">
                        <div class="comment-content-cell">
                            <p class="comment-text">{{ scope.row.content }}</p>
                            <div class="reply-hint" v-if="scope.row.parent_id">
                                <span>回复于评论 #{{ scope.row.parent_id }}</span>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="create_time" label="评论时间" width="170" align="center">
                    <template #default="scope">
                        {{ formatTime(scope.row.create_time) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="center" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="handleView(scope.row)">查看</el-button>
                        <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize"
                    :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="totalCount"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </el-card>

        <!-- 查看详情弹窗 -->
        <el-dialog title="评论详情" v-model="detailVisible" width="520px">
            <div class="detail-dialog" v-loading="detailLoading">
                <template v-if="commentDetail">
                    <div class="detail-row">
                        <span class="detail-label">评论ID</span>
                        <span class="detail-value">#{{ commentDetail.id }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">评论用户</span>
                        <span class="detail-value">{{ commentDetail.user_name || commentDetail.username }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">所属文章</span>
                        <span class="detail-value article-link" @click="goToArticle(commentDetail.article_id)">
                            {{ commentDetail.article_title || '已删除的文章' }}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">评论时间</span>
                        <span class="detail-value">{{ formatTime(commentDetail.create_time) }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">评论内容</span>
                        <span class="detail-value content-box">{{ commentDetail.content }}</span>
                    </div>
                    <div class="detail-row" v-if="commentDetail.parent_id">
                        <span class="detail-label">回复目标</span>
                        <span class="detail-value">
                            评论 #{{ commentDetail.parent_id }}
                            <span v-if="commentDetail.parent_content" class="parent-content">
                                ：{{ commentDetail.parent_content }}
                            </span>
                        </span>
                    </div>
                </template>
            </div>
            <template #footer>
                <el-button @click="detailVisible = false">关闭</el-button>
                <el-button type="danger" @click="handleDeleteFromDetail">删除此评论</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api/request';

const loading = ref(false);
const detailLoading = ref(false);
const commentList = ref([]);
const totalCount = ref(0);
const detailVisible = ref(false);
const commentDetail = ref(null);
const currentDetailId = ref(null);

const queryParams = reactive({
    page: 1,
    pageSize: 10,
    article_title: '',
    user_name: ''
});

// 获取评论列表
const fetchComments = async () => {
    loading.value = true;
    try {
        const res = await request.get('/comment/admin/list', { params: queryParams });
        commentList.value = res.data.list;
        totalCount.value = res.data.total;
    } catch (error) {
        console.error('获取评论列表失败:', error);
    } finally {
        loading.value = false;
    }
};

// 搜索
const handleSearch = () => {
    queryParams.page = 1;
    fetchComments();
};

// 分页
const handleSizeChange = (newSize) => {
    queryParams.pageSize = newSize;
    fetchComments();
};

const handleCurrentChange = (newPage) => {
    queryParams.page = newPage;
    fetchComments();
};

// 查看详情
const handleView = async (row) => {
    currentDetailId.value = row.id;
    detailVisible.value = true;
    detailLoading.value = true;
    try {
        const res = await request.get(`/comment/admin/detail/${row.id}`);
        commentDetail.value = res.data;
    } catch (error) {
        console.error('获取评论详情失败:', error);
    } finally {
        detailLoading.value = false;
    }
};

// 从详情弹窗中删除
const handleDeleteFromDetail = () => {
    if (!commentDetail.value) return;
    handleDelete(commentDetail.value, true);
};

// 删除评论
const handleDelete = (row, fromDialog = false) => {
    const tipText = row.is_reply
        ? `确定要删除这条回复吗？`
        : `确定要删除这条评论及其所有回复吗？`;

    ElMessageBox.confirm(tipText, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        try {
            await request.delete(`/comment/admin/${row.id}`);
            ElMessage.success('评论删除成功！');
            fetchComments();
            if (fromDialog) {
                detailVisible.value = false;
                commentDetail.value = null;
            }
        } catch (error) {
            console.error('删除评论失败:', error);
        }
    }).catch(() => { });
};

// 跳转到文章
const goToArticle = (articleId) => {
    if (!articleId) return;
    window.open(`http://localhost:5173/article/${articleId}`, '_blank');
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleString();
};

onMounted(() => {
    fetchComments();
});
</script>

<style scoped>
.comment-container {
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

/* 用户单元格 */
.user-cell {
    display: flex;
    align-items: center;
    gap: 6px;
}

.user-tag {
    display: inline-block;
    padding: 1px 6px;
    background: #E6A23C;
    color: #fff;
    font-size: 10px;
    border-radius: 4px;
    font-weight: 600;
}

/* 文章链接 */
.article-link {
    color: #409EFF;
    cursor: pointer;
    font-weight: 500;
}

.article-link:hover {
    text-decoration: underline;
}

/* 评论内容单元格 */
.comment-content-cell {
    padding: 4px 0;
}

.comment-text {
    font-size: 14px;
    color: #303133;
    margin: 0;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.reply-hint {
    margin-top: 4px;
}

.reply-hint span {
    font-size: 11px;
    color: #E6A23C;
    background: #FDF6EC;
    padding: 2px 8px;
    border-radius: 4px;
}

/* 详情弹窗 */
.detail-row {
    display: flex;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
}

.detail-row:last-child {
    border-bottom: none;
}

.detail-label {
    width: 80px;
    font-size: 13px;
    color: #909399;
    flex-shrink: 0;
    padding-top: 2px;
}

.detail-value {
    flex: 1;
    font-size: 14px;
    color: #303133;
}

.content-box {
    background: #f9f9f9;
    padding: 12px;
    border-radius: 8px;
    line-height: 1.6;
}

.parent-content {
    display: block;
    margin-top: 6px;
    padding: 8px 12px;
    background: #FFF7E6;
    border-left: 3px solid #E6A23C;
    border-radius: 4px;
    font-size: 13px;
    color: #666;
    line-height: 1.5;
}
</style>