<template>
    <div class="tag-container">
        <div class="tag-header">
            <el-button type="primary" @click="handleAdd">
                <el-icon>
                    <Plus />
                </el-icon>
                新增标签
            </el-button>
        </div>

        <el-card shadow="never" class="tag-card">
            <el-table :data="tagList" stripe style="width: 100%">
                <el-table-column prop="id" label="ID" width="80" align="center" />
                <el-table-column label="标签名" min-width="200">
                    <template #default="{ row }">
                        <el-tag effect="plain" round>{{ row.name }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="create_time" label="创建时间" width="220">
                    <template #default="{ row }">
                        {{ formatTime(row.create_time) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="180" align="center">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                        <el-divider direction="vertical" />
                        <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 新增/编辑弹窗 -->
        <el-dialog :title="isEdit ? '编辑标签' : '新增标签'" v-model="dialogVisible" width="420px" destroy-on-close>
            <el-form label-width="70px">
                <el-form-item label="标签名">
                    <el-input v-model="tagName" placeholder="请输入标签名" maxlength="20" show-word-limit clearable />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getTagList, createTag, updateTag, deleteTag } from '@/api/tag'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const tagList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const tagName = ref('')

// 格式化时间
const formatTime = (time) => {
    if (!time) return '-'
    const date = new Date(time)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}:${s}`
}

// 获取标签列表
const fetchTags = async () => {
    try {
        const res = await getTagList()
        tagList.value = res.data
    } catch (error) {
        console.error('获取标签失败:', error)
    }
}

// 新增按钮
const handleAdd = () => {
    isEdit.value = false
    editId.value = null
    tagName.value = ''
    dialogVisible.value = true
}

// 编辑按钮
const handleEdit = (row) => {
    isEdit.value = true
    editId.value = row.id
    tagName.value = row.name
    dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
    if (!tagName.value.trim()) {
        ElMessage.warning('标签名不能为空')
        return
    }

    try {
        if (isEdit.value) {
            await updateTag(editId.value, { name: tagName.value })
            ElMessage.success('更新成功！')
        } else {
            await createTag({ name: tagName.value })
            ElMessage.success('创建成功！')
        }
        dialogVisible.value = false
        fetchTags()
    } catch (error) {
        console.error('操作失败:', error)
    }
}

// 删除按钮
const handleDelete = async (id) => {
    try {
        await ElMessageBox.confirm('确定要删除该标签吗？', '提示', {
            type: 'warning'
        })
        await deleteTag(id)
        ElMessage.success('删除成功！')
        fetchTags()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除失败:', error)
        }
    }
}

onMounted(() => {
    fetchTags()
})
</script>

<style scoped>
.tag-container {
    padding: 4px;
}

.tag-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
}

.tag-card {
    border-radius: 6px;
}
</style>