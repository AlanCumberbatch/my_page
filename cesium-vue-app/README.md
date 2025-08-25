# Cesium Vue3 TypeScript 应用

这是一个使用 Vue 3 + TypeScript + Cesium 创建的 3D 地球可视化应用。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - JavaScript 的类型安全超集
- **Cesium** - 开源 3D 地球和地图库
- **Vite** - 快速的前端构建工具

## 功能特性

- 🌍 3D 地球显示
- 🚀 高性能渲染
- 📱 响应式设计
- 🔧 TypeScript 类型安全
- ⚡ Vite 快速开发

## 项目设置

### 安装依赖
```sh
npm install
```

### 开发环境运行
```sh
npm run dev
```

### 类型检查
```sh
npm run type-check
```

### 构建生产版本
```sh
npm run build
```

### 预览生产构建
```sh
npm run preview
```

## 项目结构

```
cesium-vue-app/
├── src/
│   ├── components/
│   │   └── CesiumViewer.vue    # Cesium 地球组件
│   ├── views/
│   │   └── HomeView.vue        # 主页视图
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 应用入口
├── vite.config.ts              # Vite 配置（包含 Cesium 插件）
└── package.json
```

## 使用说明

项目启动后，主页会显示一个全屏的 3D 地球。地球具有以下特性：

- 默认视角定位在北京上空
- 包含世界地形数据
- 简化的控制界面（移除了不必要的 UI 控件）
- 支持鼠标/触摸交互进行缩放、旋转和平移

## 自定义配置

你可以在 `src/components/CesiumViewer.vue` 中自定义：

- 初始相机位置
- 地形提供商
- UI 控件显示/隐藏
- 其他 Cesium 配置选项

## 许可证

[MIT](./LICENSE)