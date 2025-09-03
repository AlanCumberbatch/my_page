<template>
  <div class="location-marker-info">
    <!-- 基本信息 -->
    <div class="marker-basic-info">
      <div class="marker-header">
        <span class="marker-icon">{{ marker.icon }}</span>
        <h3 class="marker-name">{{ marker.name }}</h3>
      </div>
      <p class="marker-description">{{ marker.description }}</p>
    </div>

    <!-- 坐标信息 -->
    <div class="marker-coordinates">
      <h4 class="coordinates-title">📍 位置坐标</h4>
      <div class="coord-grid">
        <div class="coord-item">
          <span class="coord-label">经度</span>
          <span class="coord-value">{{ marker.longitude.toFixed(6) }}°E</span>
        </div>
        <div class="coord-item">
          <span class="coord-label">纬度</span>
          <span class="coord-value">{{ marker.latitude.toFixed(6) }}°N</span>
        </div>
      </div>
    </div>

    <!-- 公司类型信息 -->
    <div class="marker-type-info">
      <h4 class="type-title">🏢 公司类型</h4>
      <div class="type-badge" :class="getTypeClass(marker.name)">
        {{ getCompanyType(marker.name) }}
      </div>
    </div>

    <!-- 地区信息 -->
    <div class="marker-region-info">
      <h4 class="region-title">🌍 所属地区</h4>
      <div class="region-info">
        <span class="region-name">{{ getRegionName(marker.name) }}</span>
        <span class="region-province">{{ getProvinceName(marker.name) }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="marker-actions">
      <button class="action-btn primary-btn" @click="flyToLocation">
        🚁 飞行到此位置
      </button>
      <button class="action-btn secondary-btn" @click="zoomToLocation">
        🔍 放大查看
      </button>
      <button class="action-btn info-btn" @click="showMoreInfo">
        ℹ️ 更多信息
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 定义组件属性
interface Marker {
  name: string
  longitude: number
  latitude: number
  description: string
  color: any
  icon: string
}

interface Props {
  marker: Marker
}

const props = defineProps<Props>()

// 定义组件事件
const emit = defineEmits<{
  flyTo: [marker: Marker]
  zoomTo: [marker: Marker]
  showMore: [marker: Marker]
}>()

// 获取公司类型
const getCompanyType = (name: string): string => {
  if (name.includes('大学') || name.includes('理工')) {
    return '教育机构'
  } else if (name.includes('科技') || name.includes('科技公司')) {
    return '科技企业'
  } else if (name.includes('公司')) {
    return '企业'
  }
  return '其他'
}

// 获取公司类型对应的CSS类
const getTypeClass = (name: string): string => {
  const type = getCompanyType(name)
  switch (type) {
    case '教育机构':
      return 'type-education'
    case '科技企业':
      return 'type-tech'
    case '企业':
      return 'type-enterprise'
    default:
      return 'type-other'
  }
}

// 获取地区名称
const getRegionName = (name: string): string => {
  if (name.includes('沈阳')) {
    return '沈阳市'
  } else if (name.includes('北京')) {
    return '北京市'
  }
  return '未知地区'
}

// 获取省份名称
const getProvinceName = (name: string): string => {
  if (name.includes('沈阳')) {
    return '辽宁省'
  } else if (name.includes('北京')) {
    return '北京市'
  }
  return '未知省份'
}

// 事件处理函数
const flyToLocation = () => {
  emit('flyTo', props.marker)
}

const zoomToLocation = () => {
  emit('zoomTo', props.marker)
}

const showMoreInfo = () => {
  emit('showMore', props.marker)
}
</script>

<style scoped>
.location-marker-info {
  padding: 0;
  color: white;
  font-family: 'Arial', sans-serif;
}

/* 基本信息 */
.marker-basic-info {
  margin-bottom: 20px;
}

.marker-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.marker-icon {
  font-size: 28px;
}

.marker-name {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  margin: 0;
}

.marker-description {
  font-size: 14px;
  color: #ddd;
  line-height: 1.5;
  margin: 0;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border-left: 4px solid #4CAF50;
}

/* 坐标信息 */
.marker-coordinates {
  margin-bottom: 20px;
}

.coordinates-title {
  font-size: 16px;
  color: #fff;
  margin: 0 0 12px 0;
  font-weight: bold;
}

.coord-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.coord-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  text-align: center;
}

.coord-label {
  font-size: 12px;
  color: #ccc;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.coord-value {
  font-size: 14px;
  color: #fff;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

/* 公司类型信息 */
.marker-type-info {
  margin-bottom: 20px;
}

.type-title {
  font-size: 16px;
  color: #fff;
  margin: 0 0 12px 0;
  font-weight: bold;
}

.type-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
}

.type-education {
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  color: white;
}

.type-tech {
  background: linear-gradient(135deg, #4ECDC4, #6EDDD6);
  color: white;
}

.type-enterprise {
  background: linear-gradient(135deg, #45B7D1, #6BC5D8);
  color: white;
}

.type-other {
  background: linear-gradient(135deg, #96CEB4, #A8D5BA);
  color: white;
}

/* 地区信息 */
.marker-region-info {
  margin-bottom: 20px;
}

.region-title {
  font-size: 16px;
  color: #fff;
  margin: 0 0 12px 0;
  font-weight: bold;
}

.region-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.region-name {
  font-size: 16px;
  color: #fff;
  font-weight: bold;
}

.region-province {
  font-size: 14px;
  color: #ccc;
}

/* 操作按钮 */
.marker-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
  text-align: center;
}

.primary-btn {
  background: linear-gradient(135deg, #4CAF50, #45A049);
  color: white;
}

.primary-btn:hover {
  background: linear-gradient(135deg, #45A049, #3D8B40);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.secondary-btn {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
}

.secondary-btn:hover {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.info-btn {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
}

.info-btn:hover {
  background: linear-gradient(135deg, #F57C00, #EF6C00);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .coord-grid {
    grid-template-columns: 1fr;
  }

  .region-info {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
