<template>
  <div id="cesiumContainer" class="cesium-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as Cesium from 'cesium'

const viewer = ref<Cesium.Viewer | null>(null)

onMounted(async () => {
  // 初始化Cesium Viewer
  viewer.value = new Cesium.Viewer('cesiumContainer', {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    navigationInstructionsInitiallyVisible: false,
  })

  // 异步设置地形
  try {
    const terrainProvider = await Cesium.createWorldTerrainAsync()
    viewer.value.terrainProvider = terrainProvider
  } catch (error) {
    console.warn('Failed to load world terrain:', error)
  }

  // 设置初始视角
  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.3974, 39.9093, 20000000), // 北京上空
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0
    }
  })

  // 禁用默认的双击行为
  viewer.value.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
})

onUnmounted(() => {
  if (viewer.value) {
    viewer.value.destroy()
  }
})
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: sans-serif;
}
</style>