<template>
  <div class="member-manage">
    <el-card class="header-card">
      <div class="header-content">
        <div class="group-selector">
          <el-select
            v-model="selectedGroupId"
            placeholder="请选择群组"
            clearable
            style="width: 300px"
            @change="handleGroupChange"
          >
            <el-option
              v-for="group in groupList"
              :key="group.groupId"
              :label="`${group.groupName} (${group.groupId})`"
              :value="group.groupId"
            />
          </el-select>
        </div>
        <el-button
          type="primary"
          :disabled="!selectedGroupId"
          :loading="syncLoading"
          @click="syncMemberList"
        >
          同步信息
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table
        :data="memberList"
        v-loading="tableLoading"
        stripe
        style="width: 100%"
        :height="500"
      >
        <el-table-column prop="qqAccount" label="QQ号" width="100" />
        <el-table-column prop="nickname" label="QQ昵称" width="140" />
        <el-table-column prop="card" label="群名片" width="100" />
        <el-table-column prop="title" label="头衔" width="110" />
        <el-table-column prop="level" label="等级" width="70" />
        <el-table-column prop="joinTime" label="入群时间" width="150">
          <template #default="{ row }">
            {{ new Date(row.joinTime * 1000).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="lastSentTime" label="最后发言时间" width="150">
          <template #default="{ row }">
            {{ new Date(row.lastSentTime * 1000).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="alias" label="群员别名" width="300">
          <template #default="{ row, $index }">
            <div class="alias-container">
              <el-tag
                v-for="(alias, aliasIndex) in row.alias"
                :key="aliasIndex"
                closable
                @close="removeAlias(row, aliasIndex)"
                class="alias-tag"
              >
                {{ alias }}
              </el-tag>
              <el-input
                v-if="row.showAddInput"
                ref="addAliasInput"
                v-model="row.newAlias"
                size="small"
                class="add-alias-input"
                @blur="confirmAddAlias(row)"
                @keyup.enter="confirmAddAlias(row)"
                @keyup.esc="cancelAddAlias(row)"
              />
              <el-button
                v-else
                size="small"
                @click="showAddAliasInput(row)"
                class="add-alias-button"
              >
                + 添加别名
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  getGroupList,
  getMemberList,
  updateMemberAlias,
  type GroupInfo,
  type MemberInfo,
} from "@/api/member";

// 响应式数据
const groupList = ref<GroupInfo[]>([]);
const selectedGroupId = ref<string>("");
const memberList = ref<MemberInfo[]>([]);
const syncLoading = ref(false);
const tableLoading = ref(false);
const originalAliasMap = ref<Map<string, string[]>>(new Map());

// 获取群组列表
const fetchGroupList = async () => {
  try {
    const response = await getGroupList();
    if (response.status === "success") {
      groupList.value = response.data;
    } else {
      ElMessage.error("获取群组列表失败：" + response.message);
    }
  } catch (error) {
    ElMessage.error("获取群组列表失败");
    console.error(error);
  }
};

// 群组选择变化
const handleGroupChange = () => {
  memberList.value = [];
  originalAliasMap.value.clear();
};

// 同步群员列表
const syncMemberList = async () => {
  if (!selectedGroupId.value) return;

  syncLoading.value = true;
  try {
    const response = await getMemberList(selectedGroupId.value);
    if (response.status === "success") {
      memberList.value = response.data.list;
      // 保存原始别名，用于比较是否有变化
      originalAliasMap.value.clear();
      response.data.list.forEach((member: MemberInfo) => {
        originalAliasMap.value.set(`${member.groupId}_${member.qqAccount}`, [
          ...member.alias,
        ]);
        // 为每个成员添加临时属性用于UI交互
        (member as any).showAddInput = false;
        (member as any).newAlias = "";
      });
      ElMessage.success("同步群员信息成功");
    } else {
      ElMessage.error("同步群员信息失败：" + response.message);
    }
  } catch (error) {
    ElMessage.error("同步群员信息失败");
    console.error(error);
  } finally {
    syncLoading.value = false;
  }
};

// 移除别名
const removeAlias = async (row: MemberInfo, aliasIndex: number) => {
  const newAlias = [...row.alias];
  newAlias.splice(aliasIndex, 1);
  await saveAliasChanges(row, newAlias);
};

// 显示添加别名输入框
const showAddAliasInput = (row: any) => {
  row.showAddInput = true;
  row.newAlias = "";
  // 使用nextTick确保DOM更新后再聚焦
  nextTick(() => {
    const inputs = document.querySelectorAll(".add-alias-input input");
    const targetInput = Array.from(inputs).find(
      (input) =>
        (input as HTMLInputElement).closest("tr") ===
        (event?.target as HTMLElement)?.closest("tr")
    ) as HTMLInputElement;
    targetInput?.focus();
  });
};

// 确认添加别名
const confirmAddAlias = async (row: any) => {
  if (!row.newAlias.trim()) {
    cancelAddAlias(row);
    return;
  }

  // 检查是否已存在相同别名
  if (row.alias.includes(row.newAlias.trim())) {
    ElMessage.warning("别名已存在");
    cancelAddAlias(row);
    return;
  }

  const newAlias = [...row.alias, row.newAlias.trim()];
  await saveAliasChanges(row, newAlias);
  row.showAddInput = false;
  row.newAlias = "";
};

// 取消添加别名
const cancelAddAlias = (row: any) => {
  row.showAddInput = false;
  row.newAlias = "";
};

// 保存别名变更
const saveAliasChanges = async (row: MemberInfo, newAlias: string[]) => {
  const key = `${row.groupId}_${row.qqAccount}`;
  const originalAlias = originalAliasMap.value.get(key) || [];

  // 如果别名没有变化，则不需要保存
  if (JSON.stringify(originalAlias) === JSON.stringify(newAlias)) {
    return;
  }

  try {
    tableLoading.value = true;
    const response = await updateMemberAlias(
      row.groupId,
      row.qqAccount,
      newAlias
    );
    if (response.status === "success") {
      // 更新原始别名和当前别名
      originalAliasMap.value.set(key, [...newAlias]);
      row.alias = newAlias;
      ElMessage.success("别名保存成功");
    } else {
      // 保存失败，恢复原始别名
      row.alias = [...originalAlias];
      ElMessage.error("别名保存失败：" + response.message);
    }
  } catch (error) {
    // 保存失败，恢复原始别名
    row.alias = [...originalAlias];
    ElMessage.error("别名保存失败");
    console.error(error);
  } finally {
    tableLoading.value = false;
  }
};

// 页面加载时获取群组列表
onMounted(() => {
  fetchGroupList();
});
</script>

<style scoped>
.member-manage {
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

.group-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-card {
  min-height: 600px;
}

.alias-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

.alias-tag {
  margin: 2px 0;
}

.add-alias-input {
  width: 120px;
}

.add-alias-button {
  padding: 4px 8px;
  height: 24px;
  font-size: 12px;
}
</style>
