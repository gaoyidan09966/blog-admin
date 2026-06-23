<template>
    <div class="chat-container">
        <!-- 统计卡片 -->
        <div class="stats-grid">
            <div class="stat-card stat-theme-0">
                <span class="stat-icon">💬</span>
                <div class="stat-info">
                    <span class="stat-num">{{ stats.total }}</span>
                    <span class="stat-label">总消息数</span>
                </div>
            </div>
            <div class="stat-card stat-theme-1">
                <span class="stat-icon">⏳</span>
                <div class="stat-info">
                    <span class="stat-num">{{ stats.unread }}</span>
                    <span class="stat-label">未回复</span>
                </div>
            </div>
            <div class="stat-card stat-theme-2">
                <span class="stat-icon">✅</span>
                <div class="stat-info">
                    <span class="stat-num">{{ stats.replied }}</span>
                    <span class="stat-label">已回复</span>
                </div>
            </div>
            <div class="stat-card stat-theme-3">
                <span class="stat-icon">📊</span>
                <div class="stat-info">
                    <span class="stat-num">{{ stats.replyRate }}%</span>
                    <span class="stat-label">回复率</span>
                </div>
            </div>
        </div>

        <!-- 筛选栏 -->
        <el-card class="filter-card">
            <div class="filter-bar">
                <div class="filter-left">
                    <el-select v-model="queryParams.status" placeholder="消息状态" clearable style="width: 130px;"
                        @change="handleSearch">
                        <el-option label="全部状态" value="" />
                        <el-option label="未回复" value="0" />
                        <el-option label="已回复" value="1" />
                    </el-select>
                    <el-input v-model="queryParams.keyword" placeholder="搜索消息内容" clearable @keyup.enter="handleSearch"
                        @clear="handleSearch" style="width: 200px; margin-left: 10px;" />
                    <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
                </div>
                <div class="filter-right">
                    <el-button type="danger" size="small" @click="handleBatchDelete"
                        :disabled="selectedIds.length === 0">
                        批量删除 ({{ selectedIds.length }})
                    </el-button>
                </div>
            </div>
        </el-card>

        <!-- 消息表格 -->
        <el-card class="table-card" style="margin-top: 15px;">
            <el-table :data="messageList" v-loading="loading" border style="width: 100%;"
                :row-class-name="tableRowClass" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="45" align="center" />
                <el-table-column prop="id" label="ID" width="60" align="center" />
                <el-table-column prop="nickname" label="访客" width="90" align="center">
                    <template #default="scope">
                        <span style="font-weight: 600;">{{ scope.row.nickname }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="content" label="消息内容" min-width="200" show-overflow-tooltip />
                <el-table-column prop="reply" label="最新回复" min-width="200" show-overflow-tooltip>
                    <template #default="scope">
                        <span v-if="scope.row.reply" style="color: #67C23A;">{{ scope.row.reply }}</span>
                        <span v-else style="color: #ccc;">未回复</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="90" align="center">
                    <template #default="scope">
                        <el-tag :type="scope.row.is_replied ? 'success' : 'danger'" size="small">
                            {{ scope.row.is_replied ? '已回复' : '未回复' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="ip" label="IP" width="130" align="center">
                    <template #default="scope">
                        <span style="font-size: 12px; color: #999;">{{ scope.row.ip || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="create_time" label="时间" width="170" align="center">
                    <template #default="scope">
                        {{ formatTime(scope.row.create_time) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="170" align="center" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="handleReply(scope.row)">回复</el-button>
                        <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize"
                    :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="totalCount"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </el-card>

        <!-- 回复弹窗 -->
        <el-dialog :title="'回复「' + replyTarget.nickname + '」'" v-model="replyVisible" width="540px">
            <!-- 消息上下文 -->
            <div class="reply-context">
                <p class="context-label">访客消息：</p>
                <p class="context-text">{{ replyTarget.content }}</p>
                <p class="context-meta">
                    发送于 {{ formatTime(replyTarget.create_time) }}
                    · IP: {{ replyTarget.ip || '未知' }}
                </p>
            </div>

            <!-- 历史回复 -->
            <div class="reply-history" v-if="replyTarget.reply">
                <p class="context-label">历史回复：</p>
                <p class="context-text" style="color: #67C23A;">{{ replyTarget.reply }}</p>
            </div>

            <!-- 回复输入 -->
            <el-input v-model="replyText" type="textarea" :rows="4" placeholder="输入回复内容..." maxlength="500"
                show-word-limit />

            <!-- 快捷回复 -->
            <div class="quick-reply-section">
                <p class="quick-reply-label">💡 快捷回复：</p>
                <div class="quick-reply-btns">
                    <button v-for="(qr, i) in quickReplies" :key="i" class="quick-reply-btn" @click="replyText = qr">
                        {{ qr }}
                    </button>
                </div>
            </div>

            <template #footer>
                <el-button @click="replyVisible = false">取消</el-button>
                <el-button type="primary" :loading="replyLoading" @click="submitReply">发送回复</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api/request';

const loading = ref(false);
const messageList = ref([]);
const totalCount = ref(0);
const replyVisible = ref(false);
const replyLoading = ref(false);
const replyText = ref('');
const replyTarget = ref({});
const selectedIds = ref([]);

// 统计数据
const stats = reactive({
    total: 0,
    unread: 0,
    replied: 0,
    replyRate: 0
});

const queryParams = reactive({ page: 1, pageSize: 20, status: '', keyword: '' });

// 快捷回复模板
const quickReplies = [
    '感谢你的反馈，我会尽快处理！',
    '感谢关注！后续会有更多优质内容。',
    '你好，这个功能正在开发中，敬请期待。',
    '感谢建议！我会认真考虑你的意见。',
    '可以通过页面底部的联系方式与我详细沟通。'
];

const formatTime = (t) => t ? new Date(t).toLocaleString() : '';

const tableRowClass = ({ row }) => {
    return row.is_replied ? '' : 'unread-row';
};

const handleSelectionChange = (rows) => {
    selectedIds.value = rows.map(r => r.id);
};

// 获取列表
const fetchMessages = async () => {
    loading.value = true;
    try {
        const res = await request.get('/chat', { params: queryParams });
        messageList.value = res.data.list;
        totalCount.value = res.data.total;

        // 更新统计
        stats.total = res.data.total;
        stats.unread = res.data.unread;
        stats.replied = res.data.total - res.data.unread;
        stats.replyRate = res.data.total > 0
            ? Math.round((stats.replied / res.data.total) * 100)
            : 0;
    } catch (error) {
        console.error('获取消息列表失败:', error);
    } finally {
        loading.value = false;
    }
};

const handleSearch = () => { queryParams.page = 1; fetchMessages(); };
const handleSizeChange = (s) => { queryParams.pageSize = s; fetchMessages(); };
const handleCurrentChange = (p) => { queryParams.page = p; fetchMessages(); };

// 回复
const handleReply = (row) => {
    replyTarget.value = row;
    replyText.value = '';
    replyVisible.value = true;
};

const submitReply = async () => {
    if (!replyText.value.trim()) {
        ElMessage.warning('请输入回复内容');
        return;
    }
    replyLoading.value = true;
    try {
        await request.post(`/chat/${replyTarget.value.id}/reply`, {
            reply: replyText.value.trim()
        });
        ElMessage.success('回复成功！');
        replyVisible.value = false;
        fetchMessages();
    } catch (error) {
        console.error('回复失败:', error);
    } finally {
        replyLoading.value = false;
    }
};

// 单条删除
const handleDelete = (row) => {
    ElMessageBox.confirm('确定要删除这条消息吗？', '警告', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    }).then(async () => {
        try {
            await request.delete(`/chat/${row.id}`);
            ElMessage.success('删除成功！');
            fetchMessages();
        } catch (error) {
            console.error('删除失败:', error);
        }
    }).catch(() => { });
};

// 批量删除
const handleBatchDelete = () => {
    ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条消息吗？`, '警告', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    }).then(async () => {
        try {
            await Promise.all(selectedIds.value.map(id => request.delete(`/chat/${id}`)));
            ElMessage.success('批量删除成功！');
            selectedIds.value = [];
            fetchMessages();
        } catch (error) {
            console.error('批量删除失败:', error);
        }
    }).catch(() => { });
};

onMounted(() => { fetchMessages(); });
</script>

<style scoped>
.chat-container {
    padding: 4px;
}

/* 统计卡片 */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
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
    background: linear-gradient(90deg, #67C23A, #95D475);
}

.stat-theme-3::before {
    background: linear-gradient(90deg, #FCD34D, #FDE68A);
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

/* 未回复行高亮 */
:deep(.unread-row) {
    background: #fef2f2 !important;
}

:deep(.unread-row:hover td) {
    background: #fee2e2 !important;
}

/* 回复弹窗 */
.reply-context {
    margin-bottom: 14px;
    padding: 14px;
    background: #f5f7fa;
    border-radius: 10px;
}

.reply-history {
    margin-bottom: 14px;
    padding: 14px;
    background: #f0fff4;
    border-radius: 10px;
    border: 1px solid #d4edda;
}

.context-label {
    font-size: 12px;
    color: #999;
    margin: 0 0 6px;
}

.context-text {
    font-size: 14px;
    color: #333;
    margin: 0;
    line-height: 1.6;
}

.context-meta {
    font-size: 11px;
    color: #bbb;
    margin: 6px 0 0;
}

/* 快捷回复 */
.quick-reply-section {
    margin-top: 14px;
}

.quick-reply-label {
    font-size: 12px;
    color: #999;
    margin: 0 0 8px;
}

.quick-reply-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.quick-reply-btn {
    padding: 6px 12px;
    background: #f0f0ff;
    border: 1px solid #e0e0ff;
    border-radius: 16px;
    font-size: 12px;
    color: #667eea;
    cursor: pointer;
    transition: all 0.2s;
}

.quick-reply-btn:hover {
    background: #667eea;
    color: #fff;
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>