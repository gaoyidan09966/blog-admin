<template>
    <div class="order-container">
        <el-card class="filter-card">
            <div class="filter-bar">
                <div class="filter-left">
                    <span class="label">状态筛选：</span>
                    <el-select v-model="queryParams.status" placeholder="全部状态" clearable @change="handleSearch"
                        style="width: 140px;">
                        <el-option label="全部" value="" />
                        <el-option label="待付款" :value="0" />
                        <el-option label="已付款" :value="1" />
                        <el-option label="已发货" :value="2" />
                        <el-option label="已完成" :value="3" />
                        <el-option label="已取消" :value="4" />
                    </el-select>
                    <el-input v-model="queryParams.keyword" placeholder="订单号/用户名/收货人" clearable
                        @keyup.enter="handleSearch" @clear="handleSearch" style="width: 220px; margin-left: 10px;" />
                    <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
                </div>
            </div>
        </el-card>

        <el-card class="table-card" style="margin-top: 15px;">
            <el-table :data="orderList" v-loading="loading" border style="width: 100%;">
                <el-table-column prop="id" label="ID" width="60" align="center" />
                <el-table-column prop="order_no" label="订单号" min-width="180" show-overflow-tooltip />
                <el-table-column prop="nickname" label="用户" width="100" align="center">
                    <template #default="scope">
                        {{ scope.row.nickname || scope.row.username }}
                    </template>
                </el-table-column>
                <el-table-column prop="total_amount" label="金额" width="100" align="center">
                    <template #default="scope">
                        <span class="price">¥{{ Number(scope.row.total_amount).toFixed(2) }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100" align="center">
                    <template #default="scope">
                        <el-tag :type="statusType(scope.row.status)" size="small">
                            {{ statusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="receiver_name" label="收货人" width="100" align="center" />
                <el-table-column prop="receiver_phone" label="电话" width="130" align="center" />
                <el-table-column prop="create_time" label="下单时间" width="170" align="center">
                    <template #default="scope">
                        {{ formatTime(scope.row.create_time) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" align="center" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="handleDetail(scope.row)">详情</el-button>
                        <el-dropdown v-if="scope.row.status !== 4" trigger="click"
                            @command="(cmd) => handleStatusChange(scope.row, cmd)" style="margin-left: 8px;">
                            <el-button type="warning" size="small">状态</el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item v-if="scope.row.status === 1"
                                        :command="2">标记已发货</el-dropdown-item>
                                    <el-dropdown-item v-if="scope.row.status === 2"
                                        :command="3">标记已完成</el-dropdown-item>
                                    <el-dropdown-item v-if="scope.row.status === 0" :command="4">取消订单</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize"
                    :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" :total="totalCount"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </el-card>

        <!-- 订单详情弹窗 -->
        <el-dialog v-model="detailVisible" width="600px" title="订单详情">
            <div v-if="currentOrder" class="order-detail">
                <div class="detail-row">
                    <span class="detail-label">订单号</span>
                    <span class="detail-value">{{ currentOrder.order_no }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">用户</span>
                    <span class="detail-value">{{ currentOrder.nickname || currentOrder.username }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">收货人</span>
                    <span class="detail-value">{{ currentOrder.receiver_name }} {{ currentOrder.receiver_phone }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">收货地址</span>
                    <span class="detail-value">{{ currentOrder.receiver_address }}</span>
                </div>
                <div class="detail-row" v-if="currentOrder.remark">
                    <span class="detail-label">备注</span>
                    <span class="detail-value">{{ currentOrder.remark }}</span>
                </div>

                <el-divider />

                <div class="detail-items">
                    <div v-for="item in currentOrder.items" :key="item.id" class="detail-item">
                        <div class="di-cover">
                            <img v-if="item.product_cover" :src="item.product_cover" class="di-img" />
                            <div class="di-placeholder" v-else>🛍️</div>
                        </div>
                        <div class="di-info">
                            <span class="di-name">{{ item.product_name }}</span>
                            <span class="di-price">¥{{ item.price }} x {{ item.quantity }}</span>
                        </div>
                        <div class="di-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
                    </div>
                </div>

                <el-divider />

                <div class="detail-row total-row">
                    <span class="detail-label">合计金额</span>
                    <span class="detail-price">¥{{ Number(currentOrder.total_amount).toFixed(2) }}</span>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../api/request';

const loading = ref(false);
const orderList = ref([]);
const totalCount = ref(0);
const detailVisible = ref(false);
const currentOrder = ref(null);

const queryParams = reactive({
    page: 1,
    pageSize: 10,
    status: '',
    keyword: ''
});

const statusText = (status) => {
    const map = { 0: '待付款', 1: '已付款', 2: '已发货', 3: '已完成', 4: '已取消' };
    return map[status] || '未知';
};

const statusType = (status) => {
    const map = { 0: 'warning', 1: 'success', 2: 'primary', 3: 'info', 4: 'danger' };
    return map[status] || '';
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleString();
};

const fetchOrders = async () => {
    loading.value = true;
    try {
        const res = await request.get('/order/admin/list', { params: queryParams });
        orderList.value = res.data.list;
        totalCount.value = res.data.total;
    } catch (error) {
        console.error('获取订单列表失败:', error);
    } finally {
        loading.value = false;
    }
};

const handleSearch = () => {
    queryParams.page = 1;
    fetchOrders();
};

const handleSizeChange = (newSize) => {
    queryParams.pageSize = newSize;
    fetchOrders();
};

const handleCurrentChange = (newPage) => {
    queryParams.page = newPage;
    fetchOrders();
};

const handleDetail = (row) => {
    currentOrder.value = row;
    detailVisible.value = true;
};

const handleStatusChange = async (row, status) => {
    const labels = { 2: '已发货', 3: '已完成', 4: '已取消' };
    try {
        await ElMessageBox.confirm(`确定将订单状态改为「${labels[status]}」吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });
        await request.put(`/order/${row.id}/status`, { status });
        ElMessage.success('状态更新成功');
        fetchOrders();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('更新状态失败:', error);
        }
    }
};

onMounted(() => {
    fetchOrders();
});
</script>

<style scoped>
.order-container {
    padding: 4px;
}

.filter-card {
    border-radius: 8px;
}

.filter-bar {
    display: flex;
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

.price {
    font-weight: 700;
    color: #ff6b6b;
}

/* 订单详情弹窗 */
.order-detail {
    padding: 0 4px;
}

.detail-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
}

.detail-label {
    width: 80px;
    font-size: 13px;
    color: #999;
    flex-shrink: 0;
}

.detail-value {
    font-size: 14px;
    color: #333;
}

.detail-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: #fafafa;
    border-radius: 8px;
}

.di-cover {
    width: 50px;
    height: 50px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
    background: #f0f0f0;
}

.di-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.di-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.di-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.di-name {
    font-size: 14px;
    font-weight: 600;
    color: #333;
}

.di-price {
    font-size: 12px;
    color: #999;
}

.di-subtotal {
    font-size: 15px;
    font-weight: 800;
    color: #ff6b6b;
}

.total-row {
    justify-content: flex-end;
}

.detail-price {
    font-size: 22px;
    font-weight: 900;
    color: #ff6b6b;
}
</style>