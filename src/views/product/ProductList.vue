<template>
    <div class="product-container">
        <el-card class="filter-card">
            <div class="filter-bar">
                <div class="filter-left">
                    <span class="label">商品名称：</span>
                    <el-input v-model="queryParams.name" placeholder="按名称筛选" clearable @keyup.enter="handleSearch"
                        @clear="handleSearch" style="width: 200px;" />
                    <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
                </div>
                <el-button type="primary" @click="handleAdd">新增商品</el-button>
            </div>
        </el-card>

        <el-card class="table-card" style="margin-top: 15px;">
            <el-table :data="productList" v-loading="loading" border style="width: 100%;">
                <el-table-column prop="id" label="ID" width="60" align="center" />
                <el-table-column prop="cover" label="封面" width="80" align="center">
                    <template #default="scope">
                        <el-image v-if="scope.row.cover" style="width: 50px; height: 50px; border-radius: 6px;"
                            :src="scope.row.cover" fit="cover">
                            <template #error>
                                <div
                                    style="width:50px;height:50px;background:#f5f7fa;display:flex;align-items:center;justify-content:center;font-size:11px;color:#999;">
                                    无图</div>
                            </template>
                        </el-image>
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="商品名称" min-width="180" show-overflow-tooltip />
                <el-table-column prop="category" label="分类" width="80" align="center" />
                <el-table-column prop="price" label="价格" width="80" align="center">
                    <template #default="scope">
                        <span style="color: #FF6B6B; font-weight: 700;">¥{{ scope.row.price }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="stock" label="库存" width="70" align="center">
                    <template #default="scope">
                        <span :style="{ color: scope.row.stock <= 0 ? '#F56C6C' : '#606266' }">
                            {{ scope.row.stock }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="sales" label="销量" width="70" align="center" />
                <el-table-column prop="sort_order" label="排序" width="70" align="center">
                    <template #default="scope">
                        <span style="color: #999;">{{ scope.row.sort_order || 0 }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="标签" width="100" align="center">
                    <template #default="scope">
                        <el-tag type="danger" size="small" v-if="scope.row.is_new" style="margin-right:4px;">新</el-tag>
                        <el-tag type="warning" size="small" v-if="scope.row.is_hot">热</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80" align="center">
                    <template #default="scope">
                        <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" size="small">
                            {{ scope.row.status === 1 ? '上架' : '下架' }}
                        </el-tag>
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
        <el-dialog :title="isEdit ? '编辑商品' : '新增商品'" v-model="dialogVisible" width="650px" top="4vh">
            <el-form :model="productForm" :rules="rules" ref="formRef" label-width="80px">
                <el-form-item label="商品名称" prop="name">
                    <el-input v-model="productForm.name" placeholder="请输入商品名称" />
                </el-form-item>
                <el-form-item label="商品分类">
                    <el-input v-model="productForm.category" placeholder="如：盲盒、毛绒、手办" />
                </el-form-item>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="售价" prop="price">
                            <el-input-number v-model="productForm.price" :min="0" :precision="2" style="width:100%;" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="原价">
                            <el-input-number v-model="productForm.original_price" :min="0" :precision="2"
                                style="width:100%;" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="16">
                    <el-col :span="8">
                        <el-form-item label="库存">
                            <el-input-number v-model="productForm.stock" :min="0" style="width:100%;" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="销量">
                            <el-input-number v-model="productForm.sales" :min="0" style="width:100%;" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="排序">
                            <el-input-number v-model="productForm.sort_order" :min="0" :max="9999"
                                style="width:100%;" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <!-- 封面图 -->
                <el-form-item label="封面图">
                    <el-upload action="http://localhost:3001/api/article/upload" :headers="uploadHeaders" name="image"
                        :show-file-list="false" :on-success="handleCoverSuccess">
                        <img v-if="productForm.cover" :src="productForm.cover"
                            style="width: 120px; height: 120px; border-radius: 8px; object-fit: cover;" />
                        <div v-else class="upload-placeholder">
                            <el-icon style="font-size: 28px; color: #909399;">
                                <Plus />
                            </el-icon>
                            <span style="font-size: 12px; color: #909399; margin-top: 4px;">上传封面</span>
                        </div>
                    </el-upload>
                    <el-button v-if="productForm.cover" type="danger" size="small" link @click="productForm.cover = ''"
                        style="margin-top: 8px;">移除封面</el-button>
                </el-form-item>

                <!-- 详情图（多图上传） -->
                <el-form-item label="详情图">
                    <div class="images-upload-area">
                        <div class="images-preview" v-if="productForm.imagesList.length > 0">
                            <div v-for="(img, index) in productForm.imagesList" :key="index" class="preview-item">
                                <img :src="img" class="preview-img" />
                                <div class="preview-delete" @click="removeImage(index)">
                                    <el-icon>
                                        <CircleCloseFilled />
                                    </el-icon>
                                </div>
                            </div>
                        </div>
                        <el-upload action="http://localhost:3001/api/article/upload" :headers="uploadHeaders"
                            name="image" :show-file-list="false" :on-success="handleImagesSuccess">
                            <div class="upload-add-btn">
                                <el-icon style="font-size: 24px; color: #909399;">
                                    <Plus />
                                </el-icon>
                                <span style="font-size: 11px; color: #909399;">添加图片</span>
                            </div>
                        </el-upload>
                    </div>
                    <div style="font-size: 12px; color: #999; margin-top: 6px;">
                        可上传多张商品详情图片，支持拖拽排序
                    </div>
                </el-form-item>

                <el-form-item label="商品描述">
                    <el-input v-model="productForm.description" type="textarea" :rows="3" placeholder="商品描述" />
                </el-form-item>

                <el-row :gutter="16">
                    <el-col :span="8">
                        <el-form-item label="新品">
                            <el-switch v-model="productForm.is_new" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="热销">
                            <el-switch v-model="productForm.is_hot" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="状态">
                            <el-switch v-model="productForm.status" :active-value="1" :inactive-value="0"
                                active-text="上架" inactive-text="下架" />
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
const productList = ref([]);
const totalCount = ref(0);
const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref(null);
const formRef = ref(null);

const queryParams = reactive({ page: 1, pageSize: 10, name: '' });

const productForm = reactive({
    name: '', description: '', price: 0, original_price: null,
    cover: '', images: '[]', imagesList: [],
    category: '', stock: 0, sales: 0, sort_order: 0,
    is_new: 0, is_hot: 0, status: 1
});

const rules = {
    name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
    price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
};

const uploadHeaders = { Authorization: localStorage.getItem('admin_token') || '' };

// 封面上传成功
const handleCoverSuccess = (res) => {
    if (res.code === 200) {
        productForm.cover = res.data.url;
        ElMessage.success('封面上传成功！');
    }
};

// 详情图上传成功
const handleImagesSuccess = (res) => {
    if (res.code === 200) {
        productForm.imagesList.push(res.data.url);
        productForm.images = JSON.stringify(productForm.imagesList);
        ElMessage.success('图片上传成功！');
    }
};

// 删除详情图
const removeImage = (index) => {
    productForm.imagesList.splice(index, 1);
    productForm.images = JSON.stringify(productForm.imagesList);
};

// 获取商品列表
const fetchProducts = async () => {
    loading.value = true;
    try {
        const res = await request.get('/product', { params: queryParams });
        productList.value = res.data.list;
        totalCount.value = res.data.total;
    } catch (error) {
        console.error('获取商品列表失败:', error);
    } finally {
        loading.value = false;
    }
};

const handleSearch = () => { queryParams.page = 1; fetchProducts(); };
const handleSizeChange = (s) => { queryParams.pageSize = s; fetchProducts(); };
const handleCurrentChange = (p) => { queryParams.page = p; fetchProducts(); };

// 新增
const handleAdd = () => {
    isEdit.value = false;
    editId.value = null;
    Object.assign(productForm, {
        name: '', description: '', price: 0, original_price: null,
        cover: '', images: '[]', imagesList: [],
        category: '', stock: 0, sales: 0, sort_order: 0,
        is_new: 0, is_hot: 0, status: 1
    });
    dialogVisible.value = true;
};

// 编辑
const handleEdit = (row) => {
    isEdit.value = true;
    editId.value = row.id;

    // 解析 images JSON
    let imagesList = [];
    try {
        imagesList = JSON.parse(row.images || '[]');
        if (!Array.isArray(imagesList)) imagesList = [];
    } catch (e) {
        imagesList = [];
    }

    Object.assign(productForm, {
        name: row.name, description: row.description, price: row.price,
        original_price: row.original_price, cover: row.cover,
        images: row.images || '[]', imagesList: imagesList,
        category: row.category, stock: row.stock, sales: row.sales,
        sort_order: row.sort_order || 0,
        is_new: row.is_new, is_hot: row.is_hot, status: row.status
    });
    dialogVisible.value = true;
};

// 提交
const handleSubmit = () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return;
        submitLoading.value = true;
        try {
            // 同步 images 字段
            productForm.images = JSON.stringify(productForm.imagesList);

            if (isEdit.value) {
                await request.put(`/product/${editId.value}`, productForm);
                ElMessage.success('更新成功！');
            } else {
                await request.post('/product', productForm);
                ElMessage.success('创建成功！');
            }
            dialogVisible.value = false;
            fetchProducts();
        } catch (error) {
            console.error('操作失败:', error);
        } finally {
            submitLoading.value = false;
        }
    });
};

// 删除
const handleDelete = (row) => {
    ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '警告', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    }).then(async () => {
        try {
            await request.delete(`/product/${row.id}`);
            ElMessage.success('删除成功！');
            fetchProducts();
        } catch (error) {
            console.error('删除失败:', error);
        }
    }).catch(() => { });
};

onMounted(() => { fetchProducts(); });
</script>

<style scoped>
.product-container {
    padding: 4px;
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

/* 上传占位 */
.upload-placeholder {
    width: 120px;
    height: 120px;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.3s;
}

.upload-placeholder:hover {
    border-color: #409EFF;
}

/* 多图上传区域 */
.images-upload-area {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-start;
}

.images-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.preview-item {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #eee;
}

.preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.preview-delete {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #fff;
    font-size: 14px;
    transition: background 0.2s;
}

.preview-delete:hover {
    background: rgba(255, 0, 0, 0.7);
}

.upload-add-btn {
    width: 80px;
    height: 80px;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.3s;
}

.upload-add-btn:hover {
    border-color: #409EFF;
}
</style>