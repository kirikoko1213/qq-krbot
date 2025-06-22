<template>
  <div class="trigger-view">
    <el-card class="header-card">
      <div class="header-content">
        <h2>动态触发器管理</h2>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          添加触发器
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table
        :data="triggerList"
        v-loading="tableLoading"
        stripe
        style="width: 100%"
        :height="600"
      >
        <el-table-column prop="description" label="描述" width="150" />
        <el-table-column prop="scene" label="消息类型" width="100">
          <template #default="{ row }">
            <el-tag :type="messageTypeTagType(row.scene)">
              {{ messageTypeLabel(row.scene) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="conditionType" label="条件类型" width="120">
          <template #default="{ row }">
            <el-tag type="info">
              {{ conditionTypeLabel(row.conditionType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="conditionValue" label="条件值" width="150" />
        <el-table-column prop="triggerContentType" label="响应类型" width="100">
          <template #default="{ row }">
            <el-tag :type="contentTypeTagType(row.triggerContentType)">
              {{ contentTypeLabel(row.triggerContentType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="triggerContent" label="响应内容" min-width="200">
          <template #default="{ row }">
            <div class="content-preview">
              {{ truncateText(row.triggerContent, 50) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="CreatedAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.CreatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row, $index }">
            <el-button-group>
              <el-button 
                size="small" 
                :disabled="$index === 0" 
                @click="moveUp(row.ID)"
                title="上移"
              >
                ↑
              </el-button>
              <el-button 
                size="small" 
                :disabled="$index === triggerList.length - 1" 
                @click="moveDown(row.ID)"
                title="下移"
              >
                ↓
              </el-button>
            </el-button-group>
            <el-button size="small" @click="editTrigger(row)">编辑</el-button>
            <el-popconfirm
              title="确定删除这个触发器吗？"
              @confirm="deleteTriggerItem(row.ID)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑触发器' : '添加触发器'"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="currentTrigger"
        :rules="formRules"
        label-width="120px"
      >
                 <el-form-item label="描述" prop="description">
           <el-input
             v-model="currentTrigger.description"
             placeholder="请输入触发器描述"
           />
         </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="消息类型" prop="messageType">
              <el-select
                v-model="currentTrigger.scene"
                placeholder="请选择消息类型"
                style="width: 100%"
              >
                <el-option label="群聊@我" value="at_me" />
                <el-option label="私聊" value="pr" />
                <el-option label="群聊" value="gr" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="条件类型" prop="conditionType">
              <el-select
                v-model="currentTrigger.conditionType"
                placeholder="请选择条件类型"
                style="width: 100%"
              >
                <el-option label="完全匹配" value="equals" />
                <el-option label="包含" value="contains" />
                <el-option label="开头匹配" value="startWith" />
                <el-option label="结尾匹配" value="endWith" />
                <el-option label="处理器" value="handler" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="条件值" prop="conditionValue">
          <el-input
            v-model="currentTrigger.conditionValue"
            placeholder="请输入触发条件"
            type="textarea"
            :rows="2"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="响应类型" prop="triggerContentType">
              <el-select
                v-model="currentTrigger.triggerContentType"
                placeholder="请选择响应类型"
                style="width: 100%"
                @change="onContentTypeChange"
              >
                <el-option label="文本" value="text" />
                <el-option label="图片" value="image" />
                <el-option label="AI回复" value="ai" />
                <el-option label="API调用" value="api" />
                <el-option label="函数调用" value="func" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="currentTrigger.triggerContentType === 'func'">
            <el-form-item label="选择函数" prop="selectedFunction">
              <el-select
                v-model="selectedFunction"
                placeholder="请选择函数"
                style="width: 100%"
                @change="onFunctionChange"
              >
                <el-option
                  v-for="func in functionList"
                  :key="func"
                  :label="func"
                  :value="func"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="响应内容" prop="triggerContent">
          <el-input
            v-model="currentTrigger.triggerContent"
            :placeholder="getContentPlaceholder()"
            type="textarea"
            :rows="6"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTriggerItem" :loading="saveLoading">
            {{ isEdit ? '更新' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getTriggerList,
  saveTrigger,
  deleteTrigger,
  getFunctions,
  moveTriggerUp,
  moveTriggerDown,
  type DynamicTrigger
} from '@/api/trigger'

// 响应式数据
const triggerList = ref<DynamicTrigger[]>([])
const tableLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const saveLoading = ref(false)
const functionList = ref<string[]>([])
const selectedFunction = ref('')

// 表单引用和数据
const formRef = ref<FormInstance>()
const currentTrigger = reactive<DynamicTrigger>({
  scene: '',
  conditionType: '',
  conditionValue: '',
  triggerContentType: '',
  triggerContent: '',
  sequence: 0,
  description: ''
})

// 表单验证规则
const formRules: FormRules = {
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' }
  ],
  scene: [
    { required: true, message: '请选择消息类型', trigger: 'change' }
  ],
  conditionType: [
    { required: true, message: '请选择条件类型', trigger: 'change' }
  ],
  conditionValue: [
    { required: true, message: '请输入条件值', trigger: 'blur' }
  ],
  triggerContentType: [
    { required: true, message: '请选择响应类型', trigger: 'change' }
  ],
  triggerContent: [
    { required: true, message: '请输入响应内容', trigger: 'blur' }
  ]
}

// 获取触发器列表
const fetchTriggerList = async () => {
  tableLoading.value = true
  try {
    const response = await getTriggerList()
    if (response.status === 'success') {
      triggerList.value = response.data
    } else {
      ElMessage.error('获取触发器列表失败')
    }
  } catch (error) {
    ElMessage.error('获取触发器列表失败')
    console.error(error)
  } finally {
    tableLoading.value = false
  }
}

// 获取函数列表
const fetchFunctionList = async () => {
  try {
    const response = await getFunctions()
    if (response.status === 'success') {
      functionList.value = response.data
    }
  } catch (error) {
    console.error('获取函数列表失败:', error)
  }
}

// 打开添加对话框
const openAddDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
  resetForm()
}

// 编辑触发器
const editTrigger = (trigger: DynamicTrigger) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(currentTrigger, trigger)
  if (trigger.triggerContentType === 'func') {
    selectedFunction.value = trigger.triggerContent
  }
}

// 保存触发器
const saveTriggerItem = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saveLoading.value = true
    
    const response = await saveTrigger(currentTrigger)
    if (response.status === 'success') {
      ElMessage.success(isEdit.value ? '更新成功' : '保存成功')
      dialogVisible.value = false
      fetchTriggerList()
    } else {
      ElMessage.error('保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  } finally {
    saveLoading.value = false
  }
}

// 删除触发器
const deleteTriggerItem = async (id: number) => {
  try {
    const response = await deleteTrigger(id)
    if (response.status === 'success') {
      ElMessage.success('删除成功')
      fetchTriggerList()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败')
    console.error(error)
  }
}

// 上移触发器
const moveUp = async (id: number) => {
  try {
    const response = await moveTriggerUp(id)
    if (response.status === 'success') {
      ElMessage.success('上移成功')
      fetchTriggerList()
    } else {
      ElMessage.error('上移失败')
    }
  } catch (error) {
    ElMessage.error('上移失败')
    console.error(error)
  }
}

// 下移触发器
const moveDown = async (id: number) => {
  try {
    const response = await moveTriggerDown(id)
    if (response.status === 'success') {
      ElMessage.success('下移成功')
      fetchTriggerList()
    } else {
      ElMessage.error('下移失败')
    }
  } catch (error) {
    ElMessage.error('下移失败')
    console.error(error)
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  Object.assign(currentTrigger, {
    scene: '',
    conditionType: '',
    conditionValue: '',
    triggerContentType: '',
    triggerContent: '',
    sequence: 0,
    description: ''
  })
  selectedFunction.value = ''
}

// 响应类型变化
const onContentTypeChange = (value: string) => {
  if (value === 'func') {
    fetchFunctionList()
  } else {
    selectedFunction.value = ''
    currentTrigger.triggerContent = ''
  }
}

// 函数选择变化
const onFunctionChange = (value: string) => {
  currentTrigger.triggerContent = value
}

// 辅助函数
const messageTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'at_me': '群聊@',
    'pr': '私聊',
    'gr': '群聊'
  }
  return labels[type] || type
}

const messageTypeTagType = (type: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const types: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    'at_me': 'warning',
    'pr': 'success',
    'gr': 'primary'
  }
  return types[type] || 'info'
}

const conditionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'equals': '完全匹配',
    'contains': '包含',
    'startWith': '开头匹配',
    'endWith': '结尾匹配',
    'handler': '处理器'
  }
  return labels[type] || type
}

const contentTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'text': '文本',
    'image': '图片',
    'ai': 'AI回复',
    'api': 'API调用',
    'func': '函数调用'
  }
  return labels[type] || type
}

const contentTypeTagType = (type: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const types: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    'text': 'primary',
    'image': 'success',
    'ai': 'warning',
    'api': 'danger',
    'func': 'info'
  }
  return types[type] || 'info'
}

const getContentPlaceholder = () => {
  switch (currentTrigger.triggerContentType) {
    case 'text':
      return '请输入回复的文本内容'
    case 'image':
      return '请输入图片URL或路径'
    case 'ai':
      return '请输入AI提示词或配置'
    case 'api':
      return '请输入API调用地址或配置'
    case 'func':
      return '请从上面选择函数'
    default:
      return '请输入响应内容'
  }
}

const truncateText = (text: string, length: number) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 页面初始化
onMounted(() => {
  fetchTriggerList()
})
</script>

<style scoped>
.trigger-view {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  color: #303133;
}

.table-card {
  min-height: 650px;
}

.content-preview {
  word-break: break-all;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-table .cell) {
  padding: 8px 0;
}

:deep(.el-dialog__body) {
  padding: 20px;
}
</style>