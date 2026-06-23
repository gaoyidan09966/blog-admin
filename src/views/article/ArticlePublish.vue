<template>
    <div class="publish-container">
        <el-card class="form-card">
            <template #header>
                <div class="card-header">
                    <span>{{ isEdit ? '✏️ 编辑文章' : '✍️ 发布文章' }}</span>
                    <el-button @click="router.push('/article')">返回列表</el-button>
                </div>
            </template>

            <el-form :model="articleForm" :rules="rules" ref="formRef" label-width="80px">
                <el-form-item label="文章标题" prop="title">
                    <el-input v-model="articleForm.title" placeholder="请输入文章标题" maxlength="100" show-word-limit />
                </el-form-item>

                <el-form-item label="文章分类" prop="category_id">
                    <el-select v-model="articleForm.category_id" placeholder="选择分类" style="width: 100%;">
                        <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
                    </el-select>
                </el-form-item>

                <el-form-item label="文章标签">
                    <el-select v-model="articleForm.tag_ids" multiple placeholder="选择标签（可多选）" style="width: 100%;"
                        collapse-tags collapse-tags-tooltip>
                        <el-option v-for="tag in tagList" :key="tag.id" :label="tag.name" :value="tag.id" />
                    </el-select>
                </el-form-item>

                <el-form-item label="文章封面">
                    <el-upload class="cover-uploader" action="http://localhost:3001/api/article/upload"
                        :headers="uploadHeaders" name="image" :show-file-list="false" :before-upload="beforeCoverUpload"
                        :on-success="handleCoverSuccess">
                        <img v-if="articleForm.cover" :src="articleForm.cover" class="cover-preview" />
                        <el-icon v-else class="cover-placeholder">
                            <Plus />
                        </el-icon>
                    </el-upload>
                    <el-button v-if="articleForm.cover" type="danger" size="small" link @click="articleForm.cover = ''"
                        style="margin-top: 8px;">
                        移除封面
                    </el-button>
                </el-form-item>

                <el-form-item label="文章摘要">
                    <el-input v-model="articleForm.description" type="textarea" :rows="3" placeholder="文章摘要（选填）"
                        maxlength="200" show-word-limit />
                </el-form-item>

                <el-form-item label="文章状态">
                    <el-radio-group v-model="articleForm.status">
                        <el-radio :value="1">发布</el-radio>
                        <el-radio :value="0">草稿</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item label="文章内容" prop="content">
                    <div class="editor-wrapper">
                        <Toolbar class="editor-toolbar" :editor="editorRef" :defaultConfig="toolbarConfig"
                            mode="default" />
                        <Editor class="editor-content" v-model="articleForm.content" :defaultConfig="editorConfig"
                            mode="default" @onCreated="handleEditorCreated" />
                    </div>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
                        {{ isEdit ? '保存修改' : '发布文章' }}
                    </el-button>
                    <el-button @click="router.push('/article')">取消</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, shallowRef, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import { ElMessage } from 'element-plus';
import request from '../../api/request';

const route = useRoute();
const router = useRouter();
const formRef = ref(null);
const submitLoading = ref(false);
const isEdit = computed(() => !!route.params.id);

const editorRef = shallowRef(null);

const articleForm = reactive({
    title: '',
    description: '',
    content: '',
    cover: '',
    category_id: null,
    tag_ids: [],
    status: 1
});

const rules = {
    title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }]
};

const categoryList = ref([]);
const tagList = ref([]);

const uploadHeaders = {
    Authorization: localStorage.getItem('admin_token') || ''
};

const toolbarConfig = {
    excludeKeys: ['fullScreen', 'group-video']
};

const editorConfig = {
    placeholder: '请输入文章内容...',
    autoFocus: false,
    MENU_CONF: {
        uploadImage: {
            server: 'http://localhost:3001/api/article/upload',
            fieldName: 'image',
            headers: {
                Authorization: localStorage.getItem('admin_token') || ''
            },
            maxFileSize: 5 * 1024 * 1024,
            allowedFileTypes: ['image/*'],
            customInsert(res, insertFn) {
                if (res.code === 200) {
                    insertFn(res.data.url, '', '');
                }
            }
        }
    }
};

const handleEditorCreated = (editor) => {
    editorRef.value = editor;
};

const beforeCoverUpload = (file) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
        ElMessage.error('只能上传 JPG/PNG/GIF/WEBP 格式!');
        return false;
    }
    if (file.size / 1024 / 1024 > 5) {
        ElMessage.error('图片大小不能超过 5MB!');
        return false;
    }
    return true;
};

const handleCoverSuccess = (response) => {
    if (response.code === 200) {
        articleForm.cover = response.data.url;
        ElMessage.success('封面上传成功！');
    } else {
        ElMessage.error(response.message || '上传失败');
    }
};

const fetchOptions = async () => {
    try {
        const [catRes, tagRes] = await Promise.all([
            request.get('/category'),
            request.get('/tag')
        ]);
        categoryList.value = catRes.data;
        tagList.value = tagRes.data;
    } catch (error) {
        console.error('获取选项失败:', error);
    }
};

const fetchArticle = async () => {
    if (!route.params.id) return;
    try {
        const res = await request.get(`/article/${route.params.id}`);
        const data = res.data;
        articleForm.title = data.title;
        articleForm.description = data.description;
        articleForm.content = data.content;
        articleForm.cover = data.cover;
        articleForm.category_id = data.category_id;
        articleForm.tag_ids = data.tag_ids || [];
        articleForm.status = data.status;
    } catch (error) {
        console.error('获取文章失败:', error);
        ElMessage.error('文章加载失败');
        router.push('/article');
    }
};

const handleSubmit = () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return;

        if (!articleForm.content || articleForm.content === '<p><br></p>') {
            ElMessage.warning('请输入文章内容');
            return;
        }

        submitLoading.value = true;
        try {
            if (isEdit.value) {
                await request.put(`/article/${route.params.id}`, articleForm);
                ElMessage.success('文章更新成功！');
            } else {
                await request.post('/article', articleForm);
                ElMessage.success(articleForm.status === 1 ? '文章发布成功！' : '草稿保存成功！');
            }
            router.push('/article');
        } catch (error) {
            console.error('提交失败:', error);
        } finally {
            submitLoading.value = false;
        }
    });
};

onMounted(() => {
    fetchOptions();
    fetchArticle();
});

onBeforeUnmount(() => {
    const editor = editorRef.value;
    if (editor) editor.destroy();
});
</script>

<style scoped>
.publish-container {
    padding: 4px;
}

.form-card {
    border-radius: 8px;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
    font-weight: 700;
}

.cover-uploader {
    width: 200px;
}

.cover-preview {
    width: 200px;
    height: 120px;
    object-fit: cover;
    border-radius: 6px;
    display: block;
}

.cover-placeholder {
    width: 200px;
    height: 120px;
    border: 2px dashed #dcdfe6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #909399;
    cursor: pointer;
}

.cover-placeholder:hover {
    border-color: #409EFF;
    color: #409EFF;
}

.editor-wrapper {
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    overflow: hidden;
    width: 100%;
}

.editor-toolbar {
    border-bottom: 1px solid #e8e8e8;
}

.editor-content {
    min-height: 400px;
    height: 500px;
}
</style>