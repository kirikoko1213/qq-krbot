<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { Menu as IconMenu, Message, Setting } from '@element-plus/icons-vue'
</script>

<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <el-menu
        default-active="1"
        class="el-menu-vertical"
        :collapse="false"
        router>
        <el-menu-item index="/">
          <el-icon><message /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/member-manage">
          <el-icon><icon-menu /></el-icon>
          <span>群员管理</span>
        </el-menu-item>
        <el-menu-item index="/about">
          <el-icon><setting /></el-icon>
          <span>关于</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header height="60px">管理系统</el-header>
      <el-main>
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-aside {
  background-color: #304156;
}

.el-menu {
  border-right: none;
}

.el-header {
  background-color: #fff;
  color: #333;
  line-height: 60px;
  border-bottom: 1px solid #dcdfe6;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
