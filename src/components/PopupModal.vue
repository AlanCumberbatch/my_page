<template>
  <Transition name="popup-slide" appear>
    <div v-if="visible" class="popup-modal-overlay" @click="handleOverlayClick">
      <div class="popup-modal" :style="modalStyle" @click.stop>
      <!-- 弹窗头部 -->
      <div class="popup-modal-header">
        <div class="popup-modal-title">
          <slot name="header">
            <span class="popup-modal-icon">{{ icon }}</span>
            <span class="popup-modal-name">{{ title }}</span>
          </slot>
        </div>
        <button class="popup-modal-close" @click="closeModal">×</button>
      </div>

      <!-- 弹窗内容 -->
      <div class="popup-modal-content">
        <slot name="content">
          <div class="popup-modal-description">{{ description }}</div>
        </slot>
      </div>

      <!-- 弹窗底部操作按钮 -->
      <div class="popup-modal-actions" v-if="$slots.actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { colors } from '@/styles/colors'

// 定义组件属性
const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
  icon?: string
  description?: string
  position?: {
    x: number
    y: number
  }
  width?: string
  height?: string
  closeOnOverlay?: boolean
}>(), {
  title: '',
  icon: '📋',
  description: '',
  position: () => ({ x: 100, y: 100 }),
  width: '400px',
  height: 'auto',
  closeOnOverlay: true
})

const emit = defineEmits<{
  close: []
  'update:visible': [value: boolean]
}>()

// 计算弹窗样式
const modalStyle = computed(() => ({
  left: props.position.x + 'px',
  top: props.position.y + 'px',
  width: props.width,
  height: props.height
}))

// 关闭弹窗
const closeModal = () => {
  emit('close')
  emit('update:visible', false)
}

// 点击遮罩层处理
const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    closeModal()
  }
}
</script>

<style scoped>
/* 遮罩层 - 透明，不阻挡点击 */
.popup-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent; /* 透明遮罩 */
  z-index: 10000;
  pointer-events: none; /* 不阻挡鼠标事件 */
}

/* 弹窗主体 - 固定到左侧 */
.popup-modal {
  position: fixed;
  background: v-bind('colors.gradients.popupBackground');
  color: v-bind('colors.neutral.white');
  border-radius: 12px;
  min-width: 320px;
  max-width: 500px; /* 适合左侧显示 */
  z-index: 10001;
  box-shadow: 0 8px 32px v-bind('colors.rgba.deepBlue[40]');
  border: 1px solid v-bind('colors.rgba.orange[30]');
  backdrop-filter: blur(15px);
  max-height: 90vh;
  overflow-y: auto;
  pointer-events: auto; /* 允许鼠标事件 */
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: v-bind('colors.rgba.orange[50]') transparent;
}

/* 滑动动画效果 */
.popup-slide-enter-active,
.popup-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.popup-slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.popup-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.popup-slide-enter-to,
.popup-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* 自定义滚动条样式 - Webkit浏览器 */
.popup-modal::-webkit-scrollbar {
  width: 6px;
}

.popup-modal::-webkit-scrollbar-track {
  background: transparent;
}

.popup-modal::-webkit-scrollbar-thumb {
  background: v-bind('colors.rgba.orange[50]');
  border-radius: 3px;
}

.popup-modal::-webkit-scrollbar-thumb:hover {
  background: v-bind('colors.rgba.orange[70]');
}

/* 旧的动画已移除，使用新的滑动动画 */

/* 弹窗头部 */
.popup-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid v-bind('colors.rgba.orange[30]');
  background: v-bind('colors.gradients.headerBackground');
  border-radius: 12px 12px 0 0;
}

.popup-modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.popup-modal-icon {
  font-size: 24px;
}

.popup-modal-name {
  font-size: 18px;
  font-weight: bold;
  color: v-bind('colors.neutral.white');
}

.popup-modal-close {
  background: none;
  border: none;
  color: v-bind('colors.accent.lightPurple');
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  line-height: 1;
}

.popup-modal-close:hover {
  color: v-bind('colors.accent.orange');
  background: v-bind('colors.rgba.orange[10]');
}

/* 弹窗内容 */
.popup-modal-content {
  padding: 15px; /* 减少内边距 */
  max-height: calc(90vh - 120px); /* 减去头部和底部的高度 */
  overflow-y: auto;
}

.popup-modal-description {
  font-size: 14px;
  color: #ddd;
  line-height: 1.5;
}

/* 弹窗底部操作按钮 */
.popup-modal-actions {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .popup-modal {
    width: 90vw !important;
    max-width: 90vw !important;
    left: 5vw !important;
    top: 10vh !important;
  }
}
</style>
