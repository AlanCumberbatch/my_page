// Cesium access token (使用 Cesium 的默认 token，实际项目中需要申请自己的)
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzNjYtYTQ0MS1kMmU1YmNkMWVmZWYiLCJpZCI6MzcsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NTI0MDQ1NTJ9.h6bcw3fKm0bL9kMmjGfVTUm-gFlbRQWG7qOO4aFVFEk';

let viewer;
let isFullscreen = false;
let isPanelVisible = true;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

// 初始化页面
function initializePage() {
    // 显示加载提示
    showLoading();
    
    // 强制进入全屏模式
    enterFullscreen();
    
    // 初始化 Cesium
    initializeCesium();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 隐藏加载提示
    setTimeout(() => {
        hideLoading();
    }, 2000);
}

// 显示加载提示
function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.id = 'loadingIndicator';
    loading.textContent = '正在初始化 3D 地球...';
    document.body.appendChild(loading);
}

// 隐藏加载提示
function hideLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
        loading.remove();
    }
}

// 初始化 Cesium
function initializeCesium() {
    try {
        // 创建 Cesium viewer
        viewer = new Cesium.Viewer('cesiumContainer', {
            // 基础设置
            animation: false,           // 隐藏动画控件
            baseLayerPicker: false,     // 隐藏图层选择器
            fullscreenButton: false,    // 隐藏全屏按钮 (我们自己实现)
            geocoder: false,            // 隐藏地名搜索
            homeButton: false,          // 隐藏主页按钮
            infoBox: false,             // 隐藏信息框
            sceneModePicker: false,     // 隐藏场景模式选择器
            selectionIndicator: false,  // 隐藏选择指示器
            timeline: false,            // 隐藏时间轴
            navigationHelpButton: false, // 隐藏导航帮助按钮
            
            // 地形和影像设置
            terrainProvider: Cesium.createWorldTerrain(),
            imageryProvider: new Cesium.IonImageryProvider({ assetId: 3 }),
            
            // 天空盒和大气设置
            skyBox: new Cesium.SkyBox({
                sources: {
                    positiveX: 'https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
                    negativeX: 'https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
                    positiveY: 'https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
                    negativeY: 'https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
                    positiveZ: 'https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
                    negativeZ: 'https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'
                }
            }),
            
            // 场景设置
            scene3DOnly: false,
            orderIndependentTranslucency: false,
            contextOptions: {
                webgl: {
                    alpha: false,
                    antialias: true,
                    preserveDrawingBuffer: true,
                    failIfMajorPerformanceCaveat: false,
                    depth: true,
                    stencil: false,
                    anitalias: false
                }
            }
        });

        // 设置初始视角 (俯瞰中国)
        viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(116.3974, 39.9093, 15000000.0), // 北京上空
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-45.0),
                roll: 0.0
            }
        });

        // 设置场景属性
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.depthTestAgainstTerrain = true;
        
        // 设置大气效果
        viewer.scene.skyAtmosphere.show = true;
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.0001;
        
        // 添加一些地标
        addLandmarks();
        
        console.log('Cesium 初始化成功');
        
    } catch (error) {
        console.error('Cesium 初始化失败:', error);
        alert('3D 地球初始化失败，请刷新页面重试');
    }
}

// 添加地标
function addLandmarks() {
    if (!viewer) return;
    
    // 添加一些中国的主要城市标记
    const cities = [
        { name: '北京', lon: 116.3974, lat: 39.9093 },
        { name: '上海', lon: 121.4737, lat: 31.2304 },
        { name: '广州', lon: 113.2644, lat: 23.1291 },
        { name: '深圳', lon: 114.0579, lat: 22.5431 },
        { name: '杭州', lon: 120.1551, lat: 30.2741 },
        { name: '成都', lon: 104.0665, lat: 30.5728 }
    ];
    
    cities.forEach(city => {
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(city.lon, city.lat),
            point: {
                pixelSize: 10,
                color: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            label: {
                text: city.name,
                font: '14pt Arial',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -10)
            }
        });
    });
}

// 绑定事件监听器
function bindEventListeners() {
    // 全屏按钮
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // 面板切换按钮
    const toggleBtn = document.getElementById('togglePanel');
    toggleBtn.addEventListener('click', toggleInfoPanel);
    
    // 控制按钮
    const homeViewBtn = document.getElementById('homeView');
    homeViewBtn.addEventListener('click', goToHomeView);
    
    const flyToLocationBtn = document.getElementById('flyToLocation');
    flyToLocationBtn.addEventListener('click', flyToRandomLocation);
    
    // 时间滑块
    const timeSlider = document.getElementById('timeSlider');
    timeSlider.addEventListener('input', handleTimeSlider);
    
    // 键盘事件
    document.addEventListener('keydown', handleKeyboard);
    
    // 全屏状态变化监听
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}

// 进入全屏
function enterFullscreen() {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
    
    document.body.classList.add('fullscreen');
    isFullscreen = true;
    
    // 调整 Cesium 容器大小
    setTimeout(() => {
        if (viewer) {
            viewer.resize();
        }
    }, 100);
}

// 退出全屏
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
    
    document.body.classList.remove('fullscreen');
    isFullscreen = false;
    
    // 调整 Cesium 容器大小
    setTimeout(() => {
        if (viewer) {
            viewer.resize();
        }
    }, 100);
}

// 切换全屏
function toggleFullscreen() {
    if (isFullscreen) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

// 全屏状态变化处理
function handleFullscreenChange() {
    const fullscreenElement = document.fullscreenElement || 
                             document.webkitFullscreenElement || 
                             document.mozFullScreenElement || 
                             document.msFullscreenElement;
    
    isFullscreen = !!fullscreenElement;
    
    if (isFullscreen) {
        document.body.classList.add('fullscreen');
    } else {
        document.body.classList.remove('fullscreen');
    }
    
    // 调整 Cesium 容器大小
    setTimeout(() => {
        if (viewer) {
            viewer.resize();
        }
    }, 100);
}

// 切换信息面板
function toggleInfoPanel() {
    const panel = document.getElementById('infoPanel');
    const toggleBtn = document.getElementById('togglePanel');
    
    if (isPanelVisible) {
        panel.classList.add('hidden');
        toggleBtn.textContent = '显示面板';
        isPanelVisible = false;
    } else {
        panel.classList.remove('hidden');
        toggleBtn.textContent = '隐藏面板';
        isPanelVisible = true;
    }
}

// 回到主视图
function goToHomeView() {
    if (!viewer) return;
    
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(116.3974, 39.9093, 15000000.0),
        orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: Cesium.Math.toRadians(-45.0),
            roll: 0.0
        },
        duration: 3.0
    });
}

// 飞行到随机位置
function flyToRandomLocation() {
    if (!viewer) return;
    
    const locations = [
        { name: '埃菲尔铁塔', lon: 2.2945, lat: 48.8584, height: 1000 },
        { name: '自由女神像', lon: -74.0445, lat: 40.6892, height: 500 },
        { name: '悉尼歌剧院', lon: 151.2153, lat: -33.8568, height: 800 },
        { name: '金字塔', lon: 31.1342, lat: 29.9792, height: 1500 },
        { name: '富士山', lon: 138.7274, lat: 35.3606, height: 8000 },
        { name: '万里长城', lon: 116.5704, lat: 40.4319, height: 2000 }
    ];
    
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            randomLocation.lon, 
            randomLocation.lat, 
            randomLocation.height
        ),
        duration: 4.0
    });
}

// 时间滑块处理
function handleTimeSlider(event) {
    if (!viewer) return;
    
    const value = parseFloat(event.target.value);
    const julianDate = Cesium.JulianDate.fromDate(new Date());
    
    // 根据滑块值调整时间 (简单示例)
    const offsetHours = (value - 50) * 24; // -24 到 +24 小时
    Cesium.JulianDate.addHours(julianDate, offsetHours, julianDate);
    
    viewer.clock.currentTime = julianDate;
}

// 键盘事件处理
function handleKeyboard(event) {
    switch(event.key) {
        case 'F11':
            event.preventDefault();
            toggleFullscreen();
            break;
        case 'h':
        case 'H':
            goToHomeView();
            break;
        case 'p':
        case 'P':
            toggleInfoPanel();
            break;
        case 'r':
        case 'R':
            flyToRandomLocation();
            break;
        case 'Escape':
            if (isFullscreen) {
                exitFullscreen();
            }
            break;
    }
}

// 窗口大小变化处理
window.addEventListener('resize', function() {
    if (viewer) {
        setTimeout(() => {
            viewer.resize();
        }, 100);
    }
});

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
    if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
    }
});