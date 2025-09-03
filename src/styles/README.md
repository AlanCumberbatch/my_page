# 颜色主题系统

## 概述

本项目使用统一的颜色主题系统，所有颜色配置都集中在 `colors.ts` 文件中，方便全局管理和更新。

## 颜色配置

### 主要颜色
- **深蓝** (`#0f3460`): 用于标题、重要文字、背景
- **深蓝变体** (`#1a1a2e`): 用于主要文字内容
- **酒红** (`#8b0000`): 用于标签、强调元素

### 点缀颜色
- **橙色** (`#ff6b35`): 用于边框、技能项、交互元素
- **浅紫** (`#6a4c93`): 用于坐标、项目项、特殊元素

### 中性颜色
- **白色** (`#f8f9fa`): 用于浅色文字
- **浅灰** (`#e0e0e0`): 用于浅色边框
- **深灰** (`#16213e`): 用于深色边框

## 使用方法

### 1. 在 Vue 组件中使用

```typescript
import { colors } from '@/styles/colors'

// 在 script 中使用
const primaryColor = colors.primary.deepBlue

// 在 style 中使用 v-bind
<style scoped>
.my-element {
  color: v-bind('colors.primary.deepBlue');
  border: 1px solid v-bind('colors.accent.orange');
}
</style>
```

### 2. 在 Cesium 中使用

```typescript
import { colors } from '@/styles/colors'

// 创建 Cesium 颜色
const cesiumColor = Cesium.Color.fromCssColorString(colors.cesium.university)
```

### 3. 使用预定义的透明度变体

```typescript
// 使用预定义的透明度
background: v-bind('colors.rgba.orange[30]') // 30% 透明度的橙色
```

## 颜色映射

### 标记点颜色
- 大学: 橙色 (`colors.cesium.university`)
- 公司1: 深蓝 (`colors.cesium.company1`)
- 公司2: 酒红 (`colors.cesium.company2`)
- 公司3: 浅紫 (`colors.cesium.company3`)

### 组件颜色使用
- **ResumeContent**: 使用主要颜色和点缀颜色
- **PopupModal**: 使用渐变背景和透明度变体
- **CesiumViewer**: 使用 Cesium 颜色配置

## 更新颜色

要更新整个项目的颜色方案，只需修改 `colors.ts` 文件中的颜色值：

```typescript
export const colors = {
  primary: {
    deepBlue: '#新颜色值',  // 修改这里
    // ...
  },
  // ...
}
```

所有使用该颜色的组件都会自动更新。

## 最佳实践

1. **统一性**: 始终使用 `colors.ts` 中定义的颜色
2. **语义化**: 使用有意义的颜色名称，如 `primary.deepBlue` 而不是 `#0f3460`
3. **透明度**: 使用预定义的透明度变体，保持一致性
4. **渐变**: 使用预定义的渐变配置
5. **响应式**: 考虑不同主题下的颜色适配

## 扩展

要添加新的颜色或主题：

1. 在 `colors.ts` 中添加新的颜色定义
2. 更新 `colorUsage` 对象以提供使用指导
3. 在相关组件中应用新颜色
4. 更新此文档
