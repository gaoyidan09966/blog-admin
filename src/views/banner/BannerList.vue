<template>
    <div class="banner-container">
        <el-card class="filter-card">
            <div class="filter-bar">
                <div></div>
                <el-button type="primary" @click="handleAdd">新增轮播图</el-button>
            </div>
        </el-card>

        <el-card class="table-card" style="margin-top: 15px;">
            <el-table :data="bannerList" v-loading="loading" border style="width: 100%;">
                <el-table-column prop="id" label="ID" width="60" align="center" />
                <el-table-column prop="media_url" label="预览" width="160" align="center">
                    <template #default="scope">
                        <el-image v-if="scope.row.media_type === 'image'"
                            style="width: 120px; height: 60px; border-radius: 6px;" :src="scope.row.media_url"
                            fit="cover">
                            <template #error>
                                <div
                                    style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#f5f7fa;color:#999;font-size:12px;">
                                    暂无</div>
                            </template>
                        </el-image>
                        <div v-else style="font-size: 12px; color: #409EFF;">🎬 视频</div>
                    </template>
                </el-table-column>
                <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
                <el-table-column prop="subtitle" label="副标题" min-width="200" show-overflow-tooltip />
                <el-table-column prop="media_type" label="类型" width="80" align="center">
                    <template #default="scope">
                        <el-tag :type="scope.row.media_type === 'image' ? 'success' : 'warning'" size="small">
                            {{ scope.row.media_type === 'image' ? '图片' : '视频' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="link" label="跳转链接" width="150" show-overflow-tooltip />
                <el-table-column prop="sort_order" label="排序" width="80" align="center" />
                <el-table-column prop="status" label="状态" width="80" align="center">
                    <template #default="scope">
                        <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0"
                            @change="handleStatusChange(scope.row)" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="160" align="center" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 新增/编辑弹窗 -->
        <el-dialog :title="isEdit ? '编辑轮播图' : '新增轮播图'" v-model="dialogVisible" width="600px">
            <el-form :model="bannerForm" :rules="rules" ref="formRef" label-width="90px">
                <el-form-item label="媒体类型">
                    <el-radio-group v-model="bannerForm.media_type">
                        <el-radio value="image">图片</el-radio>
                        <el-radio value="video">视频</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="媒体文件" prop="media_url">
                    <el-upload class="media-uploader" :action="'http://localhost:3001/api/article/upload'"
                        :headers="uploadHeaders" name="image" :show-file-list="false" :before-upload="beforeUpload"
                        :on-success="handleUploadSuccess">
                        <img v-if="bannerForm.media_url && bannerForm.media_type === 'image'"
                            :src="bannerForm.media_url" class="media-preview" />
                        <div v-else-if="bannerForm.media_url && bannerForm.media_type === 'video'"
                            class="media-preview video-placeholder">
                            🎬 视频已上传
                        </div>
                        <div v-else class="media-placeholder">
                            <el-icon size="28">
                                <Plus />
                            </el-icon>
                            <span>{{ bannerForm.media_type === 'image' ? '上传图片' : '上传视频' }}</span>
                        </div>
                    </el-upload>
                    <el-input v-model="bannerForm.media_url" placeholder="或直接输入媒体URL" style="margin-top: 10px;" />
                </el-form-item>
                <el-form-item label="标题">
                    <el-input v-model="bannerForm.title" placeholder="请输入标题" maxlength="50" />
                </el-form-item>
                <el-form-item label="副标题">
                    <el-input v-model="bannerForm.subtitle" type="textarea" :rows="2" placeholder="请输入副标题"
                        maxlength="100" />
                </el-form-item>
                <el-form-item label="跳转链接">
                    <el-input v-model="bannerForm.link" placeholder="如 /articles 或 https://..." />
                </el-form-item>
                <el-form-item label="排序权重">
                    <el-input-number v-model="bannerForm.sort_order" :min="0" :max="999" />
                    <span style="margin-left: 10px; font-size: 12px; color: #999;">数字越大越靠前</span>
                </el-form-item>
                <el-form-item label="显示状态">
                    <el-switch v-model="bannerForm.status" :active-value="1" :inactive-value="0" active-text="显示"
                        inactive-text="隐藏" />
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
const bannerList = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref(null);
const formRef = ref(null);

const bannerForm = reactive({
    title: '',
    subtitle: '',
    media_url: '',
    media_type: 'image',
    link: '',
    sort_order: 0,
    status: 1
});

const rules = {
    media_url: [{ required: true, message: '请上传或填写媒体地址', trigger: 'blur' }]
};

const uploadHeaders = {
    Authorization: localStorage.getItem('admin_token') || ''
};

const beforeUpload = (file) => {
    if (bannerForm.media_type === 'image') {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.type)) {
            ElMessage.error('只能上传 JPG/PNG/GIF/WEBP 格式!');
            return false;
        }
        if (file.size / 1024 / 1024 > 5) {
            ElMessage.error('图片大小不能超过 5MB!');
            return false;
        }
    } else {
        const allowed = ['video/mp4', 'video/webm'];
        if (!allowed.includes(file.type)) {
            ElMessage.error('只能上传 MP4/WEBM 格式!');
            return false;
        }
        if (file.size / 1024 / 1024 > 50) {
            ElMessage.error('视频大小不能超过 50MB!');
            return false;
        }
    }
    return true;
};

const handleUploadSuccess = (response) => {
    if (response.code === 200) {
        bannerForm.media_url = response.data.url;
        ElMessage.success('上传成功！');
    } else {
        ElMessage.error(response.message || '上传失败');
    }
};

const fetchBanners = async () => {
    loading.value = true;
    try {
        const res = await request.get('/banner');
        bannerList.value = res.data;
    } catch (error) {
        console.error('获取轮播图列表失败:', error);
    } finally {
        loading.value = false;
    }
};

const handleAdd = () => {
    isEdit.value = false;
    editId.value = null;
    Object.assign(bannerForm, {
        title: '', subtitle: '', media_url: '', media_type: 'image',
        link: '', sort_order: 0, status: 1
    });
    dialogVisible.value = true;
};

const handleEdit = (row) => {
    isEdit.value = true;
    editId.value = row.id;
    Object.assign(bannerForm, {
        title: row.title,
        subtitle: row.subtitle,
        media_url: row.media_url,
        media_type: row.media_type,
        link: row.link,
        sort_order: row.sort_order,
        status: row.status
    });
    dialogVisible.value = true;
};

const handleSubmit = () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return;
        submitLoading.value = true;
        try {
            if (isEdit.value) {
                await request.put(`/banner/${editId.value}`, bannerForm);
                ElMessage.success('更新成功！');
            } else {
                await request.post('/banner', bannerForm);
                ElMessage.success('创建成功！');
            }
            dialogVisible.value = false;
            fetchBanners();
        } catch (error) {
            console.error('操作失败:', error);
        } finally {
            submitLoading.value = false;
        }
    });
};

const handleDelete = (row) => {
    ElMessageBox.confirm('确定要删除该轮播图吗？', '警告', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    }).then(async () => {
        try {
            await request.delete(`/banner/${row.id}`);
            ElMessage.success('删除成功！');
            fetchBanners();
        } catch (error) {
            console.error('删除失败:', error);
        }
    }).catch(() => { });
};

const handleStatusChange = async (row) => {
    try {
        await request.put(`/banner/${row.id}`, {
            title: row.title,
            subtitle: row.subtitle,
            media_url: row.media_url,
            media_type: row.media_type,
            link: row.link,
            sort_order: row.sort_order,
            status: row.status
        });
        ElMessage.success(row.status === 1 ? '已显示' : '已隐藏');
    } catch (error) {
        console.error('状态更新失败:', error);
        row.status = row.status === 1 ? 0 : 1;
    }
};

onMounted(() => {
    fetchBanners();
});
</script>

<style scoped>
.banner-container {
    padding: 4px;
}

.filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table-card {
    border-radius: 8px;
}

.media-uploader {
    width: 100%;
}

.media-preview {
    width: 280px;
    height: 140px;
    border-radius: 8px;
    object-fit: cover;
    display: block;
    border: 1px solid #eee;
}

.video-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f4ff;
    color: #409EFF;
    font-size: 14px;
    font-weight: 600;
}

.media-placeholder {
    width: 280px;
    height: 140px;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #909399;
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.3s;
}

.media-placeholder:hover {
    border-color: #409EFF;
    color: #409EFF;
}
</style>