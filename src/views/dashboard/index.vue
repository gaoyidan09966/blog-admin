<template>
    <div class="dashboard-container">
        <!-- 统计卡片 -->
        <div class="stats-grid">
            <div class="stat-card stat-theme-0">
                <div class="stat-left">
                    <span class="stat-icon">📄</span>
                </div>
                <div class="stat-right">
                    <span class="stat-num">{{ stats.articles?.total || 0 }}</span>
                    <span class="stat-label">文章总数</span>
                    <span class="stat-change" :class="(stats.articles?.today || 0) > 0 ? 'up' : ''">
                        {{ (stats.articles?.today || 0) > 0 ? '今日 +' + stats.articles.today : '今日无新增' }}
                    </span>
                </div>
            </div>

            <div class="stat-card stat-theme-1">
                <div class="stat-left">
                    <span class="stat-icon">💬</span>
                </div>
                <div class="stat-right">
                    <span class="stat-num">{{ stats.comments?.total || 0 }}</span>
                    <span class="stat-label">评论总数</span>
                    <span class="stat-change" :class="(stats.comments?.today || 0) > 0 ? 'up' : ''">
                        {{ (stats.comments?.today || 0) > 0 ? '今日 +' + stats.comments.today : '今日无新增' }}
                    </span>
                </div>
            </div>

            <div class="stat-card stat-theme-2">
                <div class="stat-left">
                    <span class="stat-icon">👥</span>
                </div>
                <div class="stat-right">
                    <span class="stat-num">{{ stats.users?.total || 0 }}</span>
                    <span class="stat-label">用户总数</span>
                    <span class="stat-change" :class="(stats.users?.today || 0) > 0 ? 'up' : ''">
                        {{ (stats.users?.today || 0) > 0 ? '今日 +' + stats.users.today : '今日无新增' }}
                    </span>
                </div>
            </div>

            <div class="stat-card stat-theme-3">
                <div class="stat-left">
                    <span class="stat-icon">👁</span>
                </div>
                <div class="stat-right">
                    <span class="stat-num">{{ stats.views?.total || 0 }}</span>
                    <span class="stat-label">总访问量</span>
                    <span class="stat-change">累计阅读</span>
                </div>
            </div>
        </div>

        <!-- 图表区域 -->
        <div class="chart-grid">
            <div class="card">
                <div class="card-header">
                    <span class="card-title">📈 访问量趋势</span>
                    <span class="card-hint">最近7天</span>
                </div>
                <div class="chart-box">
                    <v-chart v-if="viewTrend.length > 0" :option="lineChartOption" autoresize style="height: 320px;" />
                    <el-empty v-else description="暂无数据" :image-size="60" />
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">📊 文章分类统计</span>
                </div>
                <div class="chart-box">
                    <v-chart v-if="categoryStats.length > 0" :option="pieChartOption" autoresize
                        style="height: 320px;" />
                    <el-empty v-else description="暂无数据" :image-size="60" />
                </div>
            </div>
        </div>

        <!-- 底部：最新文章 + 最新评论 -->
        <div class="bottom-grid">
            <!-- 最新文章 -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">📝 最新文章</span>
                    <span class="card-more" @click="router.push('/article')">查看更多 →</span>
                </div>
                <el-table :data="latestArticles" style="width: 100%;" size="small" stripe>
                    <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
                    <el-table-column prop="category_name" label="分类" width="120" align="center">
                        <template #default="scope">
                            <el-tag size="small" effect="plain">{{ scope.row.category_name || '未分类' }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="80" align="center">
                        <template #default="scope">
                            <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'" size="small">
                                {{ scope.row.status === 1 ? '已发布' : '草稿' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="author_name" label="作者" width="80" align="center" />
                    <el-table-column prop="create_time" label="发布时间" width="170" align="center">
                        <template #default="scope">
                            {{ formatTime(scope.row.create_time) }}
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 最新评论 -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">💬 最新评论</span>
                    <span class="card-more" @click="router.push('/comment')">查看更多 →</span>
                </div>
                <div class="comment-list">
                    <div v-for="comment in latestComments" :key="comment.id" class="comment-item">
                        <div class="comment-avatar">{{ comment.user_name?.charAt(0) || 'U' }}</div>
                        <div class="comment-body">
                            <div class="comment-head">
                                <span class="comment-user">{{ comment.user_name }}</span>
                                <span class="comment-time">{{ formatCommentTime(comment.create_time) }}</span>
                            </div>
                            <p class="comment-text">{{ comment.content }}</p>
                            <p class="comment-article">评论于「{{ comment.article_title || '已删除的文章' }}」</p>
                        </div>
                    </div>
                    <el-empty v-if="latestComments.length === 0" description="暂无评论" :image-size="60" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import request from '../../api/request';

use([
    CanvasRenderer,
    LineChart,
    PieChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
]);

const router = useRouter();

const stats = ref({});
const viewTrend = ref([]);
const categoryStats = ref([]);
const latestArticles = ref([]);
const latestComments = ref([]);

// 折线图配置
const lineChartOption = computed(() => ({
    tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: '#eee',
        borderWidth: 1,
        textStyle: { color: '#333' }
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: viewTrend.value.map(i => i.date),
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        axisLabel: { color: '#999', fontSize: 12 },
        axisTick: { show: false }
    },
    yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f5f5f5' } },
        axisLabel: { color: '#999', fontSize: 12 }
    },
    series: [{
        data: viewTrend.value.map(i => i.views),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#667eea', width: 3 },
        itemStyle: {
            color: '#667eea',
            borderWidth: 2,
            borderColor: '#fff'
        },
        areaStyle: {
            color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                    { offset: 0, color: 'rgba(102,126,234,0.3)' },
                    { offset: 1, color: 'rgba(102,126,234,0.02)' }
                ]
            }
        }
    }]
}));

// 饼图配置
const colors = ['#667eea', '#4ECDC4', '#FF6B6B', '#FCD34D', '#A78BFA', '#F472B6', '#34D399', '#FB923C'];

const pieChartOption = computed(() => ({
    tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} 篇 ({d}%)',
        backgroundColor: '#fff',
        borderColor: '#eee',
        borderWidth: 1,
        textStyle: { color: '#333' }
    },
    legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: '#666', fontSize: 12 }
    },
    series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: categoryStats.value.map((item, index) => ({
            name: item.category_name || '未分类',
            value: item.count,
            itemStyle: { color: colors[index % colors.length] }
        }))
    }]
}));

// 获取数据
const fetchStats = async () => {
    try {
        const res = await request.get('/dashboard/stats');
        stats.value = res.data;
    } catch (error) {
        console.error('获取统计失败:', error);
    }
};

const fetchViewTrend = async () => {
    try {
        const res = await request.get('/dashboard/view-trend');
        viewTrend.value = res.data;
    } catch (error) {
        console.error('获取趋势失败:', error);
    }
};

const fetchCategoryStats = async () => {
    try {
        const res = await request.get('/dashboard/category-stats');
        categoryStats.value = res.data;
    } catch (error) {
        console.error('获取分类统计失败:', error);
    }
};

const fetchLatestArticles = async () => {
    try {
        const res = await request.get('/dashboard/latest-articles');
        latestArticles.value = res.data;
    } catch (error) {
        console.error('获取最新文章失败:', error);
    }
};

const fetchLatestComments = async () => {
    try {
        const res = await request.get('/dashboard/latest-comments');
        latestComments.value = res.data;
    } catch (error) {
        console.error('获取最新评论失败:', error);
    }
};

const formatTime = (t) => {
    if (!t) return '';
    return new Date(t).toLocaleString();
};

const formatCommentTime = (t) => {
    if (!t) return '';
    const date = new Date(t);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
};

onMounted(() => {
    fetchStats();
    fetchViewTrend();
    fetchCategoryStats();
    fetchLatestArticles();
    fetchLatestComments();
});
</script>

<style scoped>
.dashboard-container {
    width: 100%;
}

/* ==================== 统计卡片 ==================== */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
}

.stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 18px;
    border: 1px solid rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
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
    background: linear-gradient(90deg, #4ECDC4, #7EDDD6);
}

.stat-theme-2::before {
    background: linear-gradient(90deg, #FF6B6B, #FF9F9F);
}

.stat-theme-3::before {
    background: linear-gradient(90deg, #FCD34D, #FDE68A);
}

.stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.stat-left {
    flex-shrink: 0;
}

.stat-icon {
    font-size: 40px;
    display: block;
}

.stat-right {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.stat-num {
    font-size: 30px;
    font-weight: 900;
    color: #1a1a2e;
    line-height: 1.2;
}

.stat-label {
    font-size: 13px;
    color: #999;
    margin-top: 4px;
}

.stat-change {
    font-size: 12px;
    color: #ccc;
    margin-top: 4px;
    font-weight: 600;
}

.stat-change.up {
    color: #67C23A;
}

/* ==================== 卡片通用 ==================== */
.card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid rgba(0, 0, 0, 0.04);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px solid #f5f5f5;
}

.card-title {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a2e;
}

.card-hint {
    font-size: 12px;
    color: #ccc;
}

.card-more {
    font-size: 13px;
    color: #999;
    cursor: pointer;
    transition: color 0.3s;
}

.card-more:hover {
    color: #667eea;
}

/* ==================== 图表 ==================== */
.chart-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
}

.chart-box {
    width: 100%;
    min-height: 320px;
}

/* ==================== 底部双栏 ==================== */
.bottom-grid {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 16px;
}

/* 最新评论 */
.comment-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    max-height: 360px;
    overflow-y: auto;
}

.comment-item {
    display: flex;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid #f8f8f8;
}

.comment-item:last-child {
    border-bottom: none;
}

.comment-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
}

.comment-body {
    flex: 1;
    min-width: 0;
}

.comment-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
}

.comment-user {
    font-size: 14px;
    font-weight: 700;
    color: #333;
}

.comment-time {
    font-size: 11px;
    color: #ccc;
}

.comment-text {
    font-size: 13px;
    color: #555;
    margin: 0 0 4px;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.comment-article {
    font-size: 11px;
    color: #bbb;
    margin: 0;
}

/* ==================== 响应式 ==================== */
@media (max-width: 1200px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .chart-grid {
        grid-template-columns: 1fr;
    }

    .bottom-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 640px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }
}
</style>