<template>
  <div class="cesium-viewer-container">
    <div id="cesiumContainer" class="cesium-container"></div>

      <!-- 重置视角按钮 -->
    <button
      class="reset-view-btn"
      @click="resetToInitialView"
      :title="getLocalizedText({ zh: '重置到初始视角', ja: '初期視点に戻す', en: 'Reset to initial view' })"
    >
      <span class="btn-icon">🌍</span>
      <span class="btn-text">{{ getLocalizedText({ zh: '重置视角', ja: '視点リセット', en: 'Reset View' }) }}</span>
      </button>

        <!-- 语言切换组件 -->
    <div class="language-switcher">
      <div class="language-options">
        <button
          v-for="option in languageOptions"
          :key="option.value"
          :class="['language-btn', { active: currentLanguage === option.value }]"
          @click="switchLanguage(option.value)"
          :title="option.label"
        >
          <span class="flag">{{ option.flag }}</span>
        </button>
      </div>
    </div>

    <!-- 使用新的弹窗组件 -->
    <PopupModal
      :visible="showPopup"
      :title="getLocalizedText(selectedMarker?.name)"
      :icon="selectedMarker?.icon"
      :description="getLocalizedText(selectedMarker?.description)"
      :position="popupPosition"
      @close="closePopup"
      @update:visible="showPopup = $event"
    >
      <!-- 自定义内容插槽 -->
      <template #content>
        <!-- 使用统一的简历内容组件 -->
        <ResumeContent
          :key="`${selectedMarker?.id || 'default'}-${popupUpdateCounter}`"
          :marker="selectedMarker"
          :current-language="currentLanguage"
          :get-localized-text="getLocalizedText"
          :get-localized-array="getLocalizedArray"
          v-if="selectedMarker"
        />
      </template>

      <!-- 自定义操作按钮插槽 -->
      <!-- <template #actions>
          <button class="action-btn fly-btn" @click="flyToMarker(selectedMarker)">
            🚁 飞行到此位置
          </button>
          <button class="action-btn zoom-btn" @click="zoomToMarker(selectedMarker)">
            🔍 放大查看
          </button>
      </template> -->
    </PopupModal>

    <!-- 鼠标位置显示 -->
    <div v-if="showMousePosition" class="mouse-position-display">
      <div class="position-info">
        <div class="position-item">
          <span class="label">经度:</span>
          <span class="value">{{ mousePosition.longitude.toFixed(6) }}°</span>
        </div>
        <div class="position-item">
          <span class="label">纬度:</span>
          <span class="value">{{ mousePosition.latitude.toFixed(6) }}°</span>
        </div>
        <div class="position-item">
          <span class="label">高度:</span>
          <span class="value">{{ mousePosition.height.toFixed(2) }}m</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, nextTick } from 'vue'
import PopupModal from './PopupModal.vue'
import ResumeContent from './ResumeContent.vue'
import { colors } from '@/styles/colors'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

const viewer = ref<any>(null)
const selectedMarker = ref<any>(null)
const popupPosition = ref({ x: 0, y: 0 })
const showPopup = ref(false)

// 存储转换后的locationMarkers
let locationMarkers: any[] = []

// 鼠标位置信息
const mousePosition = ref({ longitude: 0, latitude: 0, height: 0 })
const showMousePosition = ref(false)

// 弹窗更新计数器 - 用于强制重新渲染
const popupUpdateCounter = ref(0)

// 语言切换
const currentLanguage = ref<'zh' | 'ja' | 'en'>('ja') // 默认日语
const languageOptions = [
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'en', label: 'English', flag: '🇬🇧' }
]

// 事件处理器引用
let clickEventHandler: any = null

// 全局的 labelRefs 引用，用于事件处理器访问
let globalLabelRefs: any[] = []

// 创建鼠标移动事件处理器
const createMouseMoveEventHandler = () => {
  if (!viewer.value) return

  // 创建鼠标移动事件处理器
  const mouseMoveHandler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas)

  mouseMoveHandler.setInputAction((event: any) => {
    // 获取鼠标位置
    const position = event.endPosition

    if (position) {
      // 将屏幕坐标转换为世界坐标
      const cartesian = viewer.value!.camera.pickEllipsoid(position, viewer.value!.scene.globe.ellipsoid)

      if (cartesian) {
        // 将笛卡尔坐标转换为地理坐标
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
        const longitude = Cesium.Math.toDegrees(cartographic.longitude)
        const latitude = Cesium.Math.toDegrees(cartographic.latitude)
        const height = cartographic.height

        // 更新鼠标位置信息
        mousePosition.value = {
          longitude: longitude,
          latitude: latitude,
          height: height
        }

        // 显示鼠标位置
        showMousePosition.value = true
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  // 注意：鼠标位置信息会持续显示，直到鼠标移动到新的位置

  // 存储处理器引用，用于清理
  ;(viewer.value as any).mouseMoveHandler = mouseMoveHandler
}

// 创建鼠标点击事件处理器（只在 onMounted 中调用一次）
const createClickEventHandler = () => {
  if (!viewer.value) return

  clickEventHandler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas)

  clickEventHandler.setInputAction((event: any) => {
    console.log('🎯 点击事件触发', event.position) // 添加调试日志

    const pickedObject = viewer.value!.scene.pick(event.position)
    console.log('🎯 选中的对象:', pickedObject) // 添加调试日志

    if (pickedObject && pickedObject.id) {
      console.log('🔍 pickedObject.id:', pickedObject.id) // 添加调试日志
      console.log('🔍 globalLabelRefs 长度:', globalLabelRefs.length) // 添加调试日志
      console.log('🔍 globalLabelRefs 内容:', globalLabelRefs) // 添加调试日志

      // 通过 id 从全局 labelRefs 中找到对应的 marker
      const labelRef = globalLabelRefs.find(ref => ref.marker.id === pickedObject.id.id)
      console.log('✅ labelRef:', labelRef) // 添加调试日志

      if (labelRef) {
        const { entity, marker } = labelRef
        console.log('✅ 点击了标记点:', marker.name) // 添加调试日志

        // 允许东京、沈阳理工大学、北京龙科中芯科技显示弹窗
        if (marker.id === 'tokyo' || marker.id === 'shenyang-university' || marker.id === 'loongson-tech') {
          // 显示当前标签
          entity.label!.show = new Cesium.ConstantProperty(true)

          // 设置选中的标记点 - 强制触发响应式更新
          selectedMarker.value = null; // 先清空
          popupUpdateCounter.value++; // 增加更新计数器
          nextTick(() => {
            selectedMarker.value = marker; // 再设置新值
            showPopup.value = true; // 显示弹窗
            console.log('✅ selectedMarker 已设置:', selectedMarker.value) // 添加调试日志
          })

          // 固定到屏幕左侧
          popupPosition.value = {
            x: 20, // 距离屏幕左边缘 20px
            y: 100 // 距离屏幕顶部 100px
          }

          console.log('✅ 弹出标签位置:', popupPosition.value) // 添加调试日志

          // 强制触发Vue的响应式更新
          nextTick(() => {
            console.log('✅ nextTick后 selectedMarker:', selectedMarker.value)
          })

          // 飞行到标记点
          viewer.value!.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(marker.longitude, marker.latitude, 50000),
            duration: 2.0
          })
        } else {
          // 其他标记点只飞行，不显示弹窗
          console.log('🚫 此标记点不显示弹窗:', marker.name)

          // 飞行到标记点
          viewer.value!.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(marker.longitude, marker.latitude, 50000),
            duration: 2.0
          })
        }
      }
    } else {
      console.log('❌ 没有点击到标记点，pickedObject:', pickedObject)
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  console.log('✅ 鼠标点击事件处理器已创建')
}

// 销毁鼠标点击事件处理器
const destroyClickEventHandler = () => {
  if (clickEventHandler) {
    clickEventHandler.destroy()
    clickEventHandler = null
    console.log('✅ 鼠标点击事件处理器已销毁')
  }
}

// 计算弹出标签的样式
const popupStyle = computed(() => ({
  left: popupPosition.value.x + 'px',
  top: popupPosition.value.y + 'px'
}))

// 不再需要动态组件选择，统一使用 ResumeContent 组件

// 重置到初始视角 - 使用与初始化时相同的逻辑
const resetToInitialView = () => {
  if (!viewer.value) return

  // 使用与 ensureAllMarkersVisible 相同的逻辑
  const longitudes = locationMarkers.map(marker => marker.longitude)
  const latitudes = locationMarkers.map(marker => marker.latitude)

  const minLon = Math.min(...longitudes)
  const maxLon = Math.max(...longitudes)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)

  // 创建包含所有标记点的矩形
  const rectangle = Cesium.Rectangle.fromDegrees(minLon - 0.5, minLat - 0.5, maxLon + 0.5, maxLat + 0.5)

  // 飞行到包含所有标记点的矩形
  viewer.value.camera.flyTo({
    destination: rectangle,
    duration: 2.0,
    complete: () => {
      // 飞行完成后，使用 flyTo 而不是 setView 进行平滑的微调
      const currentHeight = viewer.value!.camera.positionCartographic.height
      viewer.value!.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          (minLon + maxLon) / 2,
          (minLat + maxLat) / 2,
          currentHeight * 2.0
        ),
        duration: 0.5, // 短时间的平滑过渡
        complete: () => {
          console.log('✅ 视角已重置到初始位置')
        }
      })
    }
  })

}

// 定义地理位置标记点（使用字符串颜色，Cesium加载后再转换）
const locationMarkersData = [
  {
    id: 'shenyang-university',
    // 多语言支持
    name: {
      zh: '0- 沈阳理工大学',
      ja: '0- 瀋陽理工大学',
      en: '0- Shenyang University of Technology'
    },
    longitude: 123.49117708088355,
    latitude: 41.72701912960851,
    description: {
      zh: '位于辽宁省沈阳市',
      ja: '遼寧省瀋陽市に位置',
      en: 'Located in Shenyang, Liaoning Province'
    },
    colorString: colors.cesium.university, // 橙色
    icon: '🏫',
    type: 'university',
    // 简历数据
    resumeData: {
      basicInfo: {
        organization: {
          zh: '沈阳理工大学',
          ja: '瀋陽理工大学',
          en: 'Shenyang University of Technology'
        },
        period: {
          zh: '2014年9月 - 2020年6月',
          ja: '2014年9月 - 2020年6月',
          en: 'April 2018 - March 2022'
        },
        field: {
          zh: '探测制导与控制技术',
          ja: '探査誘導制御技術',
          en: 'Detection, Guidance and Control Technology'
        },
        type: {
          zh: '国立理工系大学',
          ja: '国立理工系大学',
          en: 'National Technical University'
        }
      },
      academic: {
        gpa: {
          zh: '3.8/4.0（前5%）',
          ja: '3.8/4.0（上位5%）',
          en: '3.8/4.0 (Top 5%)'
        },
        degree: {
          zh: '工学学士',
          ja: '工学学士',
          en: 'Bachelor of Engineering'
        },
        thesis: {
          zh: 'N/A',
          // zh: '「基于机器学习的图像识别系统开发」',
          ja: 'N/A',
          en: 'N/A'
        },
        qualifications: {
          zh: 'N/A',
          // zh: '基本信息技术者考试、TOEIC 850分',
          ja: 'N/A',
          en: 'N/A'
        }
      },
      activities: {
        zh: [
          '服兵役两年（2016年-2018年）',
          '编程社团参加',
          '实习（IT企业）'
        ],
        ja: [
          '兵役2年間（2016年-2018年）',
          'プログラミングサークル参加',
          'インターンシップ（IT企業）'
        ],
        en: [
          'Military Service - 2 Years (2016-2018)',
          'Programming Club Participation',
          'Internship (IT Company)'
        ]
      },
      skills: {
        zh: [
          '编程语言：C++, JavaScript',
          '框架： Vue.js, React',
          '数据库：MySQL, PostgreSQL, MongoDB',
          '开发工具：Git, VSCode, Markdown'
        ],
        ja: [
          'プログラミング言語：C++, JavaScript',
          'フレームワーク：Vue.js, React',
          'データベース：MySQL, PostgreSQL, MongoDB',
          '開発ツール：Git, VSCode, Markdown'
        ],
        en: [
          'Programming Languages: C++, JavaScript',
          'Frameworks: Vue.js, React',
          'Databases: MySQL, PostgreSQL, MongoDB',
          'Development Tools: Git, VSCode, Markdown'
        ]
      },
      projects: {
        zh: [
          '学习教育系统网页开发（Vue.js）',
          'Web应用程序开发实习（Vue.js）'
        ],
        ja: [
          '学習教育システムWeb開発（Vue.js）',
          'Webアプリケーション開発インターンシップ（Vue.js）'
        ],
        en: [
          'Learning Education System Web Development (Vue.js)',
          'Web Application Development Internship (Vue.js)'
        ]
      }
    }
  },
  // {
  //   // 41.739075, 123.410952
  //   id: 'ai-tech-company',
  //   name: {
  //     zh: '1- 沈阳市艾尔时代科技公司',
  //     ja: '1- 瀋陽市エール時代科技公司',
  //     en: '1- Shenyang AI Era Technology Co., Ltd.'
  //   },
  //   longitude: 123.410952,
  //   latitude: 41.739075,
  //   description: {
  //     zh: '沈阳市艾尔时代科技公司 - 科技企业',
  //     ja: '瀋陽市エール時代科技公司 - 科技企業',
  //     en: 'Shenyang AI Era Technology Co., Ltd. - Technology Company'
  //   },
  //   colorString: colors.cesium.company1, // 深蓝
  //   icon: '🏢',
  //   type: 'company',
  // },
  {
    // 40.0598665273991, 116.17430093708816
    id: 'loongson-tech',
    name: {
      zh: '1- 北京龙科中芯科技',
      ja: '1- 北京龍科中芯科技',
      en: '1- Beijing Longke Zhongxin Technology'
    },
    longitude: 116.17430093708816,
    latitude: 40.0598665273991,
    description: {
      zh: '北京市海淀区中关村软件园',
      ja: '北京市海淀区中関村ソフトウェアパーク',
      en: 'Zhongguancun Software Park, Haidian District, Beijing'
    },
    colorString: colors.cesium.company2, // 酒红
    icon: '💻',
    type: 'company',
    // 简历数据
    resumeData: {
      basicInfo: {
        organization: {
          zh: '北京龙科中芯科技',
          ja: '北京龍科中芯科技',
          en: 'Beijing Longke Zhongxin Technology'
        },
        period: {
          zh: '2020年4月 - 2022年4月',
          ja: '2020年4月 - 2022年4月',
          en: 'April 2020 - April 2022'
        },
        field: {
          zh: '软件工程师',
          ja: 'ソフトウェアエンジニア',
          en: 'Software Engineer'
        },
        type: {
          zh: '半导体・硬件开发企业',
          ja: '半導体・ハードウェア開発企業',
          en: 'Semiconductor & Hardware Development Company'
        }
      },
      academic: {
        gpa: {
          zh: 'N/A',
          ja: 'N/A',
          en: 'N/A'
        },
        degree: {
          zh: 'N/A',
          ja: 'N/A',
          en: 'N/A'
        },
        thesis: {
          zh: 'N/A',
          ja: 'N/A',
          en: 'N/A'
        },
        qualifications: {
          zh: 'N/A',
          ja: 'N/A',
          en: 'N/A',
        }
      },
      activities: {
        zh: [
          '技术会议参加',
          '社内技术发表会'
        ],
        ja: [
          '技術会議参加',
          '社内技術発表会'
        ],
        en: [
          'Technical Conference Participation',
          'Internal Technical Presentations'
        ]
      },
      skills: {
        zh: [
          '编程语言：C, C++, JavaScript, Shader/GLSL',
          '开发工具：Git, Make, Shader Editor'
        ],
        ja: [
          'プログラミング言語：C, C++, JavaScript, Shader/GLSL',
          '開発ツール：Git, Make, Shader Editor'
        ],
        en: [
          'Programming Languages: C, C++, JavaScript, Shader/GLSL',
          'Development Tools: Git, Make, Shader Editor'
        ]
      },
      projects: {
        zh: [
          '基于Loogonson浏览器开发Cesium功能',
          '系统优化・性能提升'
        ],
        ja: [
          'LoogonsonブラウザベースのCesium機能開発',
          'システム最適化・性能向上'
        ],
        en: [
          'Cesium Feature Development Based on Loogonson Browser',
          'System Optimization & Performance Improvement'
        ]
      }
    }
  },
  {
    // 39.93420597170334, 116.30932090962676
    id: 'thunder-tech',
    name: {
      zh: '2- 雷象科技(北京)',
      ja: '2- 雷象科技(北京)',
      en: '2- Thunder Elephant Technology (Beijing)'
    },
    longitude: 116.303646,
    latitude: 39.934120,
    description: {
      zh: '雷象科技(北京) - 科技公司',
      ja: '雷象科技(北京) - 科技会社',
      en: 'Thunder Elephant Technology (Beijing) - Technology Company'
    },
    colorString: colors.cesium.company3, // 浅紫
    icon: '🚀',
    type: 'company',
    // 简历数据
    resumeData: {
      basicInfo: {
        organization: {
          zh: '雷象科技(北京)',
          ja: '雷象科技(北京)',
          en: 'Thunder Elephant Technology (Beijing)'
        },
        period: {
          zh: '2024年4月 - 现在',
          ja: '2024年4月 - 現在',
          en: 'April 2024 - Present'
        },
        field: {
          zh: 'IT・软件开发',
          ja: 'IT・ソフトウェア開発',
          en: 'IT & Software Development'
        },
        type: {
          zh: 'IT・软件开发企业',
          ja: 'IT・ソフトウェア開発企業',
          en: 'IT & Software Development Company'
        }
      },
      academic: {
        gpa: {
          zh: 'N/A',
          ja: 'N/A',
          en: 'N/A'
        },
        degree: {
          zh: 'N/A',
          ja: 'N/A',
          en: 'N/A'
        },
        thesis: {
          zh: 'N/A',
          ja: 'N/A',
          en: 'N/A'
        },
        qualifications: {
          zh: '基本信息技术者考试、AWS认定资格、Kubernetes认定',
          ja: '基本情報技術者試験、AWS認定資格、Kubernetes認定',
          en: 'Fundamental Information Technology Engineer Exam, AWS Certification, Kubernetes Certification'
        }
      },
      // 工作经历详情
      workExperience: {
        role: {
          zh: '高级软件工程师',
          ja: 'シニアソフトウェアエンジニア',
          en: 'Senior Software Engineer'
        },
        department: {
          zh: '技术研发部',
          ja: '技術研究開発部',
          en: 'Technology R&D Department'
        },
        responsibilities: {
          zh: [
            '负责公司核心产品的架构设计与开发',
            '带领团队完成微服务架构的迁移和优化',
            '参与技术选型决策，推动新技术在公司内的应用',
            '指导初级开发人员，进行代码审查和技术培训',
            '与产品团队协作，确保技术方案满足业务需求'
          ],
          ja: [
            '会社のコア製品のアーキテクチャ設計・開発を担当',
            'チームを率いてマイクロサービスアーキテクチャの移行・最適化を完了',
            '技術選定の意思決定に参加、新技術の社内応用を推進',
            'ジュニア開発者の指導、コードレビュー・技術研修を実施',
            'プロダクトチームと協力し、技術ソリューションがビジネス要件を満たすよう確保'
          ],
          en: [
            'Responsible for architecture design and development of core company products',
            'Led team to complete microservices architecture migration and optimization',
            'Participated in technology selection decisions, promoted new technology adoption within company',
            'Mentored junior developers, conducted code reviews and technical training',
            'Collaborated with product team to ensure technical solutions meet business requirements'
          ]
        },
        achievements: {
          zh: [
            '成功将单体应用重构为微服务架构，系统性能提升60%',
            '建立完善的CI/CD流程，部署效率提升80%，错误率降低70%',
            '带领团队完成3个重要产品模块的开发，按时交付率100%',
            '建立代码质量监控体系，代码缺陷率降低50%',
            '获得公司年度最佳技术贡献奖'
          ],
          ja: [
            'モノリシックアプリケーションをマイクロサービスアーキテクチャにリファクタリング、システム性能60%向上',
            '完備したCI/CDプロセスを構築、デプロイ効率80%向上、エラー率70%削減',
            'チームを率いて3つの重要製品モジュールの開発を完了、納期遵守率100%',
            'コード品質監視システムを構築、コード欠陥率50%削減',
            '会社年間最優秀技術貢献賞を受賞'
          ],
          en: [
            'Successfully refactored monolithic application to microservices architecture, improving system performance by 60%',
            'Established comprehensive CI/CD process, improving deployment efficiency by 80% and reducing error rate by 70%',
            'Led team to complete development of 3 important product modules with 100% on-time delivery rate',
            'Built code quality monitoring system, reducing code defect rate by 50%',
            'Received company Annual Best Technical Contribution Award'
          ]
        }
      },

      // 项目经验详情
      projects: [
        {
          name: {
            zh: '企业级微服务管理平台',
            ja: 'エンタープライズマイクロサービス管理プラットフォーム',
            en: 'Enterprise Microservices Management Platform'
          },
          period: {
            zh: '2024年6月 - 2024年12月',
            ja: '2024年6月 - 2024年12月',
            en: 'June 2024 - December 2024'
          },
          role: {
            zh: '技术负责人',
            ja: '技術責任者',
            en: 'Technical Lead'
          },
          description: {
            zh: '设计并开发了一套完整的企业级微服务管理平台，包括服务注册发现、配置管理、监控告警、链路追踪等功能，支持大规模微服务集群的统一管理',
            ja: '完全なエンタープライズマイクロサービス管理プラットフォームを設計・開発。サービス登録・発見、設定管理、監視・アラート、トレーシングなどの機能を含み、大規模マイクロサービスクラスターの統一管理をサポート',
            en: 'Designed and developed a comprehensive enterprise microservices management platform including service registration & discovery, configuration management, monitoring & alerting, distributed tracing, supporting unified management of large-scale microservices clusters'
          },
          technologies: {
            zh: 'Spring Cloud, Kubernetes, Docker, Prometheus, Grafana, Jaeger, Redis, PostgreSQL',
            ja: 'Spring Cloud, Kubernetes, Docker, Prometheus, Grafana, Jaeger, Redis, PostgreSQL',
            en: 'Spring Cloud, Kubernetes, Docker, Prometheus, Grafana, Jaeger, Redis, PostgreSQL'
          },
          achievements: {
            zh: [
              '平台支持管理1000+微服务实例，服务发现延迟降低到10ms以内',
              '实现99.9%的服务可用性，故障恢复时间缩短至30秒',
              '为公司节省运维成本40%，提升开发效率50%',
              '获得3项软件著作权，申请发明专利2项'
            ],
            ja: [
              'プラットフォームは1000+マイクロサービスインスタンスの管理をサポート、サービス発見レイテンシを10ms以内に短縮',
              '99.9%のサービス可用性を実現、障害復旧時間を30秒に短縮',
              '会社の運用コスト40%削減、開発効率50%向上',
              'ソフトウェア著作権3件取得、発明特許2件申請'
            ],
            en: [
              'Platform supports management of 1000+ microservice instances, reducing service discovery latency to under 10ms',
              'Achieved 99.9% service availability, reduced failure recovery time to 30 seconds',
              'Saved 40% operational costs for company, improved development efficiency by 50%',
              'Obtained 3 software copyrights, applied for 2 invention patents'
            ]
          }
        },
        {
          name: {
            zh: '智能数据分析与可视化系统',
            ja: 'インテリジェントデータ分析・可視化システム',
            en: 'Intelligent Data Analysis & Visualization System'
          },
          period: {
            zh: '2024年1月 - 2024年5月',
            ja: '2024年1月 - 2024年5月',
            en: 'January 2024 - May 2024'
          },
          role: {
            zh: '核心开发工程师',
            ja: 'コア開発エンジニア',
            en: 'Core Development Engineer'
          },
          description: {
            zh: '开发了一套基于机器学习的智能数据分析系统，支持实时数据处理、智能报表生成、交互式数据可视化等功能，为业务决策提供数据支持',
            ja: '機械学習ベースのインテリジェントデータ分析システムを開発。リアルタイムデータ処理、インテリジェントレポート生成、インタラクティブデータ可視化などの機能をサポートし、ビジネス意思決定にデータサポートを提供',
            en: 'Developed an ML-based intelligent data analysis system supporting real-time data processing, intelligent report generation, interactive data visualization, providing data support for business decision-making'
          },
          technologies: {
            zh: 'Python, TensorFlow, Apache Kafka, Elasticsearch, Vue.js, D3.js, Apache Spark',
            ja: 'Python, TensorFlow, Apache Kafka, Elasticsearch, Vue.js, D3.js, Apache Spark',
            en: 'Python, TensorFlow, Apache Kafka, Elasticsearch, Vue.js, D3.js, Apache Spark'
          },
          achievements: {
            zh: [
              '系统处理数据量达到TB级别，实时分析延迟控制在100ms以内',
              '智能报表准确率达到95%以上，为业务部门节省80%的报表制作时间',
              '支持20+种数据源接入，数据可视化组件库被公司内多个项目复用',
              '获得客户高度评价，续约率达到100%'
            ],
            ja: [
              'システムのデータ処理量はTBレベルに達し、リアルタイム分析レイテンシを100ms以内に制御',
              'インテリジェントレポートの精度は95%以上、ビジネス部門のレポート作成時間80%削減',
              '20+種類のデータソース接続をサポート、データ可視化コンポーネントライブラリは社内複数プロジェクトで再利用',
              '顧客から高評価を獲得、契約更新率100%'
            ],
            en: [
              'System processes TB-level data with real-time analysis latency controlled under 100ms',
              'Intelligent report accuracy reached over 95%, saving 80% report creation time for business departments',
              'Supports 20+ data source connections, data visualization component library reused across multiple company projects',
              'Received high customer satisfaction, achieved 100% contract renewal rate'
            ]
          }
        }
      ],

      // 技能分类
      skills: {
        technical: {
          zh: [
            '编程语言：Java, Python, JavaScript, TypeScript, Go',
            '后端框架：Spring Boot, Spring Cloud, Django, Express.js',
            '前端技术：Vue.js, React, Angular, HTML5, CSS3',
            '数据库：MySQL, PostgreSQL, MongoDB, Redis, Elasticsearch',
            '大数据：Apache Spark, Apache Kafka, Hadoop, HBase',
            '机器学习：TensorFlow, PyTorch, scikit-learn, Pandas'
          ],
          ja: [
            'プログラミング言語：Java, Python, JavaScript, TypeScript, Go',
            'バックエンドフレームワーク：Spring Boot, Spring Cloud, Django, Express.js',
            'フロントエンド技術：Vue.js, React, Angular, HTML5, CSS3',
            'データベース：MySQL, PostgreSQL, MongoDB, Redis, Elasticsearch',
            'ビッグデータ：Apache Spark, Apache Kafka, Hadoop, HBase',
            '機械学習：TensorFlow, PyTorch, scikit-learn, Pandas'
          ],
          en: [
            'Programming Languages: Java, Python, JavaScript, TypeScript, Go',
            'Backend Frameworks: Spring Boot, Spring Cloud, Django, Express.js',
            'Frontend Technologies: Vue.js, React, Angular, HTML5, CSS3',
            'Databases: MySQL, PostgreSQL, MongoDB, Redis, Elasticsearch',
            'Big Data: Apache Spark, Apache Kafka, Hadoop, HBase',
            'Machine Learning: TensorFlow, PyTorch, scikit-learn, Pandas'
          ]
        },
        tools: {
          zh: [
            '开发工具：Git, Docker, Kubernetes, Jenkins, Maven, Gradle',
            '云服务：AWS, Azure, 阿里云, Google Cloud Platform',
            '监控工具：Prometheus, Grafana, ELK Stack, Jaeger',
            '项目管理：Jira, Confluence, Trello, Slack',
            '设计工具：Figma, Adobe XD, Sketch, Draw.io'
          ],
          ja: [
            '開発ツール：Git, Docker, Kubernetes, Jenkins, Maven, Gradle',
            'クラウドサービス：AWS, Azure, 阿里云, Google Cloud Platform',
            '監視ツール：Prometheus, Grafana, ELK Stack, Jaeger',
            'プロジェクト管理：Jira, Confluence, Trello, Slack',
            'デザインツール：Figma, Adobe XD, Sketch, Draw.io'
          ],
          en: [
            'Development Tools: Git, Docker, Kubernetes, Jenkins, Maven, Gradle',
            'Cloud Services: AWS, Azure, Alibaba Cloud, Google Cloud Platform',
            'Monitoring Tools: Prometheus, Grafana, ELK Stack, Jaeger',
            'Project Management: Jira, Confluence, Trello, Slack',
            'Design Tools: Figma, Adobe XD, Sketch, Draw.io'
          ]
        },
        languages: {
          zh: [
            '中文：母语水平',
            '日语：N1水平，商务会话流利',
            '英语：CET-612312，技术文档阅读和写作熟练'
          ],
          ja: [
            '中国語：母語レベル',
            '日本語：N1レベル、ビジネス会話流暢',
            '英語：CET-6、技術文書読解・執筆に熟練'
          ],
          en: [
            'Chinese: Native level',
            'Japanese: N1 level, fluent in business conversation',
            'English: CET-6, proficient in technical documentation reading and writing'
          ]
        }
      },

      // 特殊贡献/创新
      contributions: {
        innovations: {
          zh: [
            '设计并实现了一套自动化测试框架，支持API、UI、性能测试，测试覆盖率提升至90%',
            '开发了智能代码质量分析工具，能够自动检测代码异味和潜在问题，帮助团队提升代码质量',
            '建立了微服务治理平台，实现了服务的自动注册、发现、配置管理和监控告警',
            '创新性地将机器学习技术应用于系统监控，实现了智能异常检测和预测性维护'
          ],
          ja: [
            'API、UI、性能テストをサポートする自動テストフレームワークを設計・実装、テストカバレッジ90%向上',
            'コードの匂いや潜在的問題を自動検出するインテリジェントコード品質分析ツールを開発、チームのコード品質向上を支援',
            'マイクロサービスガバナンスプラットフォームを構築、サービスの自動登録・発見・設定管理・監視アラートを実現',
            '機械学習技術をシステム監視に革新的に応用、インテリジェント異常検出・予測保守を実現'
          ],
          en: [
            'Designed and implemented automated testing framework supporting API, UI, performance testing, improving test coverage to 90%',
            'Developed intelligent code quality analysis tool that automatically detects code smells and potential issues, helping teams improve code quality',
            'Built microservices governance platform achieving automatic service registration, discovery, configuration management and monitoring alerts',
            'Innovatively applied machine learning technology to system monitoring, achieving intelligent anomaly detection and predictive maintenance'
          ]
        },
        leadership: {
          zh: [
            '担任技术分享会主讲人，每月组织技术分享，分享前沿技术趋势和最佳实践',
            '建立mentor制度，指导5名初级开发人员，帮助他们快速成长和融入团队',
            '参与公司技术委员会，负责技术选型决策和架构评审，推动技术标准化',
            '组织跨部门技术交流，促进不同团队间的技术协作和知识共享'
          ],
          ja: [
            '技術共有会の講師を担当、月次で技術共有を組織し、最先端技術トレンド・ベストプラクティスを共有',
            'メンター制度を構築、5名のジュニア開発者を指導し、迅速な成長・チーム適応を支援',
            '会社技術委員会に参加、技術選定意思決定・アーキテクチャレビューを担当、技術標準化を推進',
            '部門横断技術交流を組織、異なるチーム間の技術協力・知識共有を促進'
          ],
          en: [
            'Served as speaker at technical sharing sessions, organizing monthly technical sharing on cutting-edge technology trends and best practices',
            'Established mentor system, guided 5 junior developers to help them grow quickly and integrate into the team',
            'Participated in company technical committee, responsible for technology selection decisions and architecture reviews, promoting technical standardization',
            'Organized cross-departmental technical exchanges, promoting technical collaboration and knowledge sharing between different teams'
          ]
        }
      }
    }
  },
  {
    // 35.67532479622418, 139.56860153825758
    id: 'tokyo',
    name: {
      zh: '3- 东京',
      ja: '3- 東京',
      en: '3- Tokyo'
    },
    longitude: 139.56860153825758,
    latitude: 35.67532479622418,
    description: {
      zh: '东京 - 语言学习与AWS技术自学',
      ja: '東京 - 語学学習・AWS技術独学',
      en: 'Tokyo - Language Learning & AWS Technology Self-Study'
    },
    colorString: colors.cesium.university, // 使用橙色
    icon: '🗼',
    type: 'city',
    // 简历数据
    resumeData: {
      basicInfo: {
        organization: {
          zh: '亚非语学院',
          ja: '専門学校アジア・アフリカ語学院',
          en: 'Asia Africa Linguistic Institute'
        },
        period: {
          // zh: '2024年月 - 現在',
          // ja: '2024年5月 - 現在',
          // en: 'May 2024 - Present'
          zh: 'N/A',
          ja: 'N/A',
          en: 'N/A',
        },
        field: {
          zh: '日语学习・AWS技术学习',
          ja: '日本語学習・AWS技術学習',
          en: 'Japanese Language Learning & AWS Technology Study'
        },
        type: {
          zh: '语言学校・技术学习',
          ja: '語学学校・技術学習',
          en: 'Language School & Technology Study'
        }
      },
      academic: {
        gpa: {
          zh: 'N/A',
          ja: 'N/A',
          en: 'N/A'
        },
        degree: {
          zh: 'N/A',
          ja: 'N/A',
          en: 'N/A'
        },
        thesis: {
          zh: 'N/A',
          ja: 'N/A',
          en: 'N/A'
        },
        qualifications: {
          zh: 'AWS相关认证学习中',
          ja: 'AWS関連認定学習中',
          en: 'AWS Certification in Progress'
        }
      },

      // 求职目标
      careerGoals: {
        positions: {
          zh: [
            'Web前端工程师（5年经验）',
            'Cesium开发工程师（5年经验）',
            'AWS相关岗位（正在学习中）'
          ],
          ja: [
            'Webフロントエンドエンジニア（5年経験）',
            'Cesium開発エンジニア（5年経験）',
            'AWS関連ポジション（学習中）'
          ],
          en: [
            'Web Frontend Engineer (5 Years Experience)',
            'Cesium Development Engineer (5 Years Experience)',
            'AWS-related Positions (Currently Learning)'
          ]
        },
        companyType: {
          zh: '日本企业的派遣或正社员岗位',
          ja: '日本企業の派遣または正社員ポジション',
          en: 'Japanese Company Dispatch or Full-time Employee Positions'
        },
        experience: {
          zh: '当前阶段接受无经验可的岗位，后续通过学习考取AWS相关证书提升技能',
          ja: '現在の段階では未経験可のポジションを受け入れ、その後学習を通じてAWS関連資格を取得しスキル向上',
          en: 'Currently accepting entry-level positions, with plans to obtain AWS-related certifications through learning to enhance skills'
        }
      },

      // 个人优势
      personalStrengths: {
        experience: {
          zh: '5年中国开发经验',
          ja: '5年間の中国開発経験',
          en: '5 years of development experience in China'
        },
        abilities: {
          zh: [
            '面对问题的分析、整理、解决能力',
            '与人沟通协作的能力',
            '适应新工作环境的能力',
            '快速定位自己在协作中的定位'
          ],
          ja: [
            '問題に対する分析・整理・解決能力',
            '人とのコミュニケーション・協力能力',
            '新しい職場環境への適応能力',
            'チーム協力での自分の役割を素早く見つける能力'
          ],
          en: [
            'Problem analysis, organization, and resolution abilities',
            'Communication and collaboration skills',
            'Adaptability to new work environments',
            'Quick identification of role in team collaboration'
          ]
        }
      },

      // 技能分类
      skills: {
        technical: {
          zh: [
            'AWS云服务：EC2, S3, Lambda, RDS, VPC, IAM（学习中）',
            '编程语言：Python, JavaScript, TypeScript',
            '开发框架：Serverless Framework, AWS SDK',
            '数据库：MySQL, PostgreSQL, DynamoDB'
          ],
          ja: [
            'AWSクラウドサービス：EC2, S3, Lambda, RDS, VPC, IAM（学習中）',
            'プログラミング言語：Python, JavaScript, TypeScript',
            '開発フレームワーク：Serverless Framework, AWS SDK',
            'データベース：MySQL, PostgreSQL, DynamoDB'
          ],
          en: [
            'AWS Cloud Services: EC2, S3, Lambda, RDS, VPC, IAM (Learning)',
            'Programming Languages: Python, JavaScript, TypeScript',
            'Development Frameworks: Serverless Framework, AWS SDK',
            'Databases: MySQL, PostgreSQL, DynamoDB'
          ]
        },
        tools: {
          zh: [
            '基础设施即代码：CloudFormation, CDK（学习中）',
            '容器技术：Docker, Kubernetes（学习中）',
            'CI/CD工具：Git, GitHub Actions, AWS CodePipeline',
            '监控工具：CloudWatch, X-Ray'
          ],
          ja: [
            'インフラストラクチャ・アズ・コード：CloudFormation, CDK（学習中）',
            'コンテナ技術：Docker, Kubernetes（学習中）',
            'CI/CDツール：Git, GitHub Actions, AWS CodePipeline',
            '監視ツール：CloudWatch, X-Ray'
          ],
          en: [
            'Infrastructure as Code: CloudFormation, CDK (Learning)',
            'Container Technologies: Docker, Kubernetes (Learning)',
            'CI/CD Tools: Git, GitHub Actions, AWS CodePipeline',
            'Monitoring Tools: CloudWatch, X-Ray'
          ]
        },
        certifications: {
          zh: [
            'AWS Certifications: Solutions Architect Associate, Developer Associate (Planned)',
            'Architecture Patterns: Microservices, Event-driven, Serverless Architecture (Learning)',
            'Security Best Practices: Least Privilege, Encryption, Auditing (Learning)'
          ],
          ja: [
            'AWS認定：Solutions Architect Associate, Developer Associate（計画中）',
            'アーキテクチャパターン：マイクロサービス, イベント駆動, サーバーレスアーキテクチャ（学習中）',
            'セキュリティベストプラクティス：最小権限原則, 暗号化, 監査（学習中）'
          ],
          en: [
            'AWS Certifications: Solutions Architect Associate, Developer Associate (Planned)',
            'Architecture Patterns: Microservices, Event-driven, Serverless Architecture (Learning)',
            'Security Best Practices: Least Privilege, Encryption, Auditing (Learning)'
          ]
        },
        languages: {
          zh: [
            '中文：母语水平',
            '日语：N2水平（备考N1中）- 可进行日常会话与基础业务交流',
            // '英语：CET-6、托业750分 - 可阅读技术文档，进行书面和口头交流'
            '英语：可阅读技术文档，进行书面和口头交流'
          ],
          ja: [
            '中国語：母語レベル',
            '日本語：N2レベル（N1受験準備中）- 日常会話・基礎ビジネス会話可能',
            // '英語：CET-6、TOEIC 750点 - 技術文書読解、書面・口頭コミュニケーション可能'
            '英語：技術文書読解、書面・口頭コミュニケーション可能'
          ],
          en: [
            'Chinese: Native level',
            'Japanese: N2 level (preparing for N1) - Daily conversation and basic business communication',
            // 'English: CET-6, TOEIC 750 - Technical documentation reading, written and verbal communication'
            'English: Technical documentation reading, written and verbal communication'
          ]
        },
        soft: {
          zh: [
            '问题分析与解决能力',
            '团队协作与沟通能力',
            '学习适应能力',
            '跨文化沟通能力'
          ],
          ja: [
            '問題分析・解決能力',
            'チーム協力・コミュニケーション能力',
            '学習適応能力',
            '異文化コミュニケーション能力'
          ],
          en: [
            'Problem analysis and resolution skills',
            'Team collaboration and communication skills',
            'Learning and adaptation abilities',
            'Cross-cultural communication skills'
          ]
        }
      },

      // 个人项目链接
      links: {
        awsBlog: {
          url: 'https://alancumberbatch.github.io/aws_blog/',
          title: {
            zh: 'AWS技术学习博客',
            ja: 'AWS技術学習ブログ',
            en: 'AWS Technology Learning Blog'
          },
          description: {
            zh: '记录AWS学习心得、技术总结与实践经验',
            ja: 'AWS学習体験、技術まとめ・実践経験を記録',
            en: 'Recording AWS learning experiences, technical summaries and practical insights'
          }
        },
        personalPage: {
          url: 'https://alancumberbatch.github.io/MarquezSpace',
          title: {
            zh: '个人主页 - 技术简历与项目展示',
            ja: '個人ホームページ - 技術履歴書・プロジェクト紹介',
            en: 'Personal Homepage - Technical Resume & Project Showcase'
          },
          description: {
            zh: '使用Cesium、Vue3构建的3D交互式简历展示页面',
            ja: 'Cesium、Vue3で構築した3Dインタラクティブ履歴書ページ',
            en: '3D interactive resume page built with Cesium and Vue3'
          }
        },
        github: {
          url: 'https://github.com/AlanCumberbatch/cesium-',
          title: {
            zh: 'GitHub 项目仓库',
            ja: 'GitHub プロジェクトリポジトリ',
            en: 'GitHub Project Repository'
          },
          description: {
            zh: '开源项目与代码示例',
            ja: 'オープンソースプロジェクト・コードサンプル',
            en: 'Open source projects and code samples'
          }
        }
      },

      // // 学习项目与已完成项目
      // projects: [
      //   // {
      //   //   name: {
      //   //     zh: 'Cesium 3D地球简历展示系统',
      //   //     ja: 'Cesium 3D地球履歴書表示システム',
      //   //     en: 'Cesium 3D Globe Resume System'
      //   //   },
      //   //   type: 'personal',
      //   //   period: {
      //   //     zh: '2024年10月 - 现在',
      //   //     ja: '2024年10月 - 現在',
      //   //     en: 'October 2024 - Present'
      //   //   },
      //   //   description: {
      //   //     zh: '使用Cesium.js + Vue3构建的3D交互式简历展示系统，通过地球上的标记点展示个人经历、技能和项目',
      //   //     ja: 'Cesium.js + Vue3で構築した3Dインタラクティブ履歴書表示システム、地球上のマーカーで個人経歴・スキル・プロジェクトを表示',
      //   //     en: '3D interactive resume system built with Cesium.js + Vue3, displaying personal experience, skills and projects through markers on globe'
      //   //   },
      //   //   technologies: {
      //   //     zh: 'Cesium.js, Vue3, TypeScript, Vite',
      //   //     ja: 'Cesium.js, Vue3, TypeScript, Vite',
      //   //     en: 'Cesium.js, Vue3, TypeScript, Vite'
      //   //   },
      //   //   features: {
      //   //     zh: [
      //   //       '3D地球可视化展示',
      //   //       '多语言支持（中文、日语、英语）',
      //   //       '交互式标记点与弹窗',
      //   //       '响应式设计',
      //   //       'GitHub Pages部署'
      //   //     ],
      //   //     ja: [
      //   //       '3D地球可視化表示',
      //   //       '多言語サポート（中国語、日本語、英語）',
      //   //       'インタラクティブマーカー・ポップアップ',
      //   //       'レスポンシブデザイン',
      //   //       'GitHub Pagesデプロイ'
      //   //     ],
      //   //     en: [
      //   //       '3D globe visualization',
      //   //       'Multi-language support (Chinese, Japanese, English)',
      //   //       'Interactive markers and popups',
      //   //       'Responsive design',
      //   //       'GitHub Pages deployment'
      //   //     ]
      //   //   },
      //   //   link: 'https://alancumberbatch.github.io/my_page/',
      //   //   github: 'https://github.com/AlanCumberbatch/my_page'
      //   // },
      //   {
      //     name: {
      //       zh: 'AWS学习博客网站',
      //       ja: 'AWS学習ブログサイト',
      //       en: 'AWS Learning Blog Site'
      //     },
      //     type: 'learning',
      //     period: {
      //       zh: '2024年5月 - 现在',
      //       ja: '2024年5月 - 現在',
      //       en: 'May 2024 - Present'
      //     },
      //     description: {
      //       zh: '记录AWS云服务学习过程的技术博客，包括EC2、S3、Lambda等服务的实践经验和学习心得',
      //       ja: 'AWSクラウドサービス学習過程を記録する技術ブログ、EC2、S3、Lambdaなどのサービスの実践経験・学習体験を含む',
      //       en: 'Technical blog recording AWS cloud services learning process, including practical experience with EC2, S3, Lambda and other services'
      //     },
      //     technologies: {
      //       zh: 'AWS, Markdown, GitHub Pages',
      //       ja: 'AWS, Markdown, GitHub Pages',
      //       en: 'AWS, Markdown, GitHub Pages'
      //     },
      //     link: 'https://alancumberbatch.github.io/blog/'
      //   },
      //   // {
      //   //   name: {
      //   //     zh: '企业管理系统（Vue2项目）',
      //   //     ja: '企業管理システム（Vue2プロジェクト）',
      //   //     en: 'Enterprise Management System (Vue2 Project)'
      //   //   },
      //   //   type: 'work',
      //   //   period: {
      //   //     zh: '2020年1月 - 2020年4月',
      //   //     ja: '2020年1月 - 2020年4月',
      //   //     en: 'January 2020 - April 2020'
      //   //   },
      //   //   description: {
      //   //     zh: '使用Vue2开发的企业管理系统前端，包含数据可视化、地图集成、打印功能等模块',
      //   //     ja: 'Vue2で開発した企業管理システムのフロントエンド、データ可視化・地図統合・印刷機能などのモジュールを含む',
      //   //     en: 'Enterprise management system frontend developed with Vue2, including data visualization, map integration, printing features'
      //   //   },
      //   //   technologies: {
      //   //     zh: 'Vue2, Axios, G2, 高德地图API',
      //   //     ja: 'Vue2, Axios, G2, 高德地図API',
      //   //     en: 'Vue2, Axios, G2, Amap API'
      //   //   },
      //   //   features: {
      //   //     zh: [
      //   //       'G2数据可视化图表',
      //   //       '高德地图路径规划',
      //   //       'Web端报销单打印',
      //   //       '数据字典标准化',
      //   //       'Axios请求封装'
      //   //     ],
      //   //     ja: [
      //   //       'G2データ可視化チャート',
      //   //       '高德地図ルート計画',
      //   //       'Web端末経費精算書印刷',
      //   //       'データ辞書標準化',
      //   //       'Axiosリクエストカプセル化'
      //   //     ],
      //   //     en: [
      //   //       'G2 data visualization charts',
      //   //       'Amap route planning',
      //   //       'Web-based expense report printing',
      //   //       'Data dictionary standardization',
      //   //       'Axios request encapsulation'
      //   //     ]
      //   //   }
      //   // }
      // ],

      // 特殊贡献/创新
      contributions: {
        learning: {
          zh: [
            '主动学习AWS技术，为职业转型做准备',
            '在语言学校期间同时进行技术学习，展现学习能力',
            '将中国5年开发经验与日本职场需求相结合',
            '持续提升日语能力，为在日本工作做准备'
          ],
          ja: [
            'AWS技術を積極的に学習し、キャリア転換の準備',
            '語学学校在学中に技術学習を並行し、学習能力をアピール',
            '中国5年間の開発経験を日本の職場ニーズと結合',
            '日本語能力を継続的に向上させ、日本での就職準備'
          ],
          en: [
            'Proactively learning AWS technology to prepare for career transition',
            'Conducting technical learning alongside language school, demonstrating learning ability',
            'Combining 5 years of Chinese development experience with Japanese workplace needs',
            'Continuously improving Japanese language skills for working in Japan'
          ]
        },
        adaptability: {
          zh: [
            '从中国开发环境适应日本职场文化',
            '跨文化沟通与协作能力',
            '快速学习新技术的能力',
            '在团队中快速找到自己的定位'
          ],
          ja: [
            '中国開発環境から日本の職場文化への適応',
            '異文化コミュニケーション・協力能力',
            '新技術を素早く学習する能力',
            'チーム内で自分の役割を素早く見つける能力'
          ],
          en: [
            'Adapting from Chinese development environment to Japanese workplace culture',
            'Cross-cultural communication and collaboration abilities',
            'Ability to quickly learn new technologies',
            'Quick identification of role within teams'
          ]
        }
      }
    }
  }
]

// 创建相邻标记点之间的拱形线
const createArchedLines = () => {
  if (!viewer.value) return

  // 遍历相邻的标记点对
  for (let i = 0; i < locationMarkers.length - 1; i++) {
    const startMarker = locationMarkers[i]
    const endMarker = locationMarkers[i + 1]

    // 创建拱形线
    createArchedLine(startMarker, endMarker, i)
  }
}

// 创建单个拱形线
const createArchedLine = (startMarker: any, endMarker: any, index: number) => {
  if (!viewer.value) return

  // 计算起点和终点
  const startPosition = Cesium.Cartesian3.fromDegrees(startMarker.longitude, startMarker.latitude)
  const endPosition = Cesium.Cartesian3.fromDegrees(endMarker.longitude, endMarker.latitude)

  // 计算中点
  const midPosition = Cesium.Cartesian3.lerp(startPosition, endPosition, 0.5, new Cesium.Cartesian3())

  // 计算距离，用于确定拱形高度
  const distance = Cesium.Cartesian3.distance(startPosition, endPosition)
  const archHeight = distance * 0.3 // 拱形高度为距离的30%

  // 计算拱形顶点位置（向上偏移）
  const archTop = Cesium.Cartesian3.add(midPosition,
    Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_Z, archHeight, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  )

  // 创建拱形路径点
  const archPoints = []
  const numPoints = 20 // 拱形线的分段数

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints

    // 使用二次贝塞尔曲线创建拱形
    const point1 = Cesium.Cartesian3.lerp(startPosition, archTop, t, new Cesium.Cartesian3())
    const point2 = Cesium.Cartesian3.lerp(archTop, endPosition, t, new Cesium.Cartesian3())
    const finalPoint = Cesium.Cartesian3.lerp(point1, point2, t, new Cesium.Cartesian3())

    archPoints.push(finalPoint)
  }

  // 创建动态颜色（根据索引变化）
  const colors = [
    Cesium.Color.fromCssColorString('#ff6b35'), // 橙色
    Cesium.Color.fromCssColorString('#0f3460'), // 深蓝
    Cesium.Color.fromCssColorString('#8b0000'), // 酒红
    Cesium.Color.fromCssColorString('#6a4c93')  // 浅紫
  ]
  const lineColor = colors[index % colors.length]

  // 创建多条拱形线实体 - 实现颜色传递效果
  // createTransferLines(startMarker, endMarker, archPoints, index)

  // 创建动态箭头效果
  // createDynamicArrows(startMarker, endMarker, archPoints, lineColor, index)

  console.log(`✅ 创建拱形线: ${startMarker.name} -> ${endMarker.name}`)
}

// 创建动态箭头效果
const createDynamicArrows = (startMarker: any, endMarker: any, archPoints: Cesium.Cartesian3[], lineColor: Cesium.Color, index: number) => {
  if (!viewer.value) return

  // 创建多个箭头，沿着拱形线移动
  const numArrows = 3
  const arrowSize = 20

  for (let i = 0; i < numArrows; i++) {
    const arrowEntity = viewer.value.entities.add({
      id: `arrow-${startMarker.id}-${endMarker.id}-${i}`,
      position: archPoints[Math.floor((i + 1) * archPoints.length / (numArrows + 1))],
      billboard: {
        image: createArrowImage(lineColor),
        width: arrowSize,
        height: arrowSize,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        // 添加旋转动画
        rotation: Cesium.Math.toRadians(0)
      }
    })

    // 添加箭头移动动画
    animateArrow(arrowEntity, archPoints, i, numArrows)
  }
}



// 创建传递线条 - 通过多条线条实现颜色传递效果
const createTransferLines = (startMarker: any, endMarker: any, archPoints: Cesium.Cartesian3[], index: number) => {
  if (!viewer.value) return

  const startColor = startMarker.color
  const endColor = endMarker.color

  // 创建多条线条，每条线条使用不同的颜色和透明度
  const numLines = 5 // 创建5条线条

  for (let i = 0; i < numLines; i++) {
    const t = i / (numLines - 1) // 0 到 1 的插值

    // 计算当前线条的颜色
    const currentColor = Cesium.Color.lerp(startColor, endColor, t, new Cesium.Color())

    // 计算透明度，中间线条更透明
    const alpha = 0.3 + (1.0 - Math.abs(t - 0.5) * 2) * 0.4

    // 创建线条实体
    const lineEntity = viewer.value.entities.add({
      id: `transfer-line-${startMarker.id}-${endMarker.id}-${i}`,
      polyline: {
        positions: archPoints,
        width: 8 + i * 2, // 不同宽度的线条
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.6 + i * 0.1,
          color: currentColor.withAlpha(alpha),
          taperPower: 1.0 + i * 0.2
        }),
        clampToGround: true,
        show: true
      }
    })
  }

  // 创建主要的传递线条
  const mainLineEntity = viewer.value.entities.add({
    id: `main-transfer-line-${startMarker.id}-${endMarker.id}`,
    polyline: {
      positions: archPoints,
      width: 12,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 1.0,
        color: Cesium.Color.lerp(startColor, endColor, 0.5, new Cesium.Color()),
        taperPower: 2.0
      }),
      clampToGround: true,
      show: true
    }
  })
}



// 箭头动画
const animateArrow = (arrowEntity: Cesium.Entity, archPoints: Cesium.Cartesian3[], arrowIndex: number, totalArrows: number) => {
  if (!viewer.value) return

  let currentIndex = Math.floor((arrowIndex + 1) * archPoints.length / (totalArrows + 1))
  let direction = 1 // 1 表示向前移动，-1 表示向后移动

  const animate = () => {
    if (!viewer.value || !arrowEntity.billboard) return

    // 更新箭头位置
    currentIndex += direction
    if (currentIndex >= archPoints.length - 1) {
      direction = -1
      currentIndex = archPoints.length - 1
    } else if (currentIndex <= 0) {
      direction = 1
      currentIndex = 0
    }

    arrowEntity.position = new Cesium.ConstantPositionProperty(archPoints[currentIndex])

    // 计算箭头旋转角度（指向移动方向）
    if (currentIndex > 0 && currentIndex < archPoints.length - 1) {
      const prevPoint = archPoints[currentIndex - 1]
      const nextPoint = archPoints[currentIndex + 1]
      const angle = Math.atan2(
        nextPoint.y - prevPoint.y,
        nextPoint.x - prevPoint.x
      )
      arrowEntity.billboard!.rotation = new Cesium.ConstantProperty(angle)
    }

    // 继续动画
    setTimeout(animate, 100) // 每100ms更新一次
  }

  // 开始动画
  animate()
}

// 计算最佳相机位置，确保所有标记点都可见
const calculateOptimalCameraPosition = () => {
  // 计算所有标记点的边界
  const longitudes = locationMarkers.map(marker => marker.longitude)
  const latitudes = locationMarkers.map(marker => marker.latitude)

  const minLon = Math.min(...longitudes)
  const maxLon = Math.max(...longitudes)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)

  // 计算中心点
  const centerLon = (minLon + maxLon) / 2
  const centerLat = (minLat + maxLat) / 2

  // 计算经纬度跨度
  const lonSpan = maxLon - minLon
  const latSpan = maxLat - minLat

  // 根据跨度计算相机高度，确保所有点都可见
  const maxSpan = Math.max(lonSpan, latSpan)
  const cameraHeight = Math.max(maxSpan * 2000000, 10000000) // 增加高度系数，确保所有点可见

  return {
    longitude: centerLon,
    latitude: centerLat,
    height: cameraHeight
  }
}

// 确保所有标记点都在视野范围内的函数
const ensureAllMarkersVisible = () => {
  if (!viewer.value) return

  // 计算包含所有标记点的矩形
  const longitudes = locationMarkers.map(marker => marker.longitude)
  const latitudes = locationMarkers.map(marker => marker.latitude)

  const minLon = Math.min(...longitudes)
  const maxLon = Math.max(...longitudes)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)

  // 创建包含所有标记点的矩形
  const rectangle = Cesium.Rectangle.fromDegrees(minLon - 0.5, minLat - 0.5, maxLon + 0.5, maxLat + 0.5)

  // 飞行到包含所有标记点的矩形
  viewer.value.camera.flyTo({
    destination: rectangle,
    duration: 3.0,
    complete: () => {
      // 飞行完成后，稍微拉远一点，确保所有点都清晰可见
      const currentHeight = viewer.value!.camera.positionCartographic.height
      viewer.value!.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          (minLon + maxLon) / 2,
          (minLat + maxLat) / 2,
          currentHeight * 1.2
        )
      })
    }
  })
}

// 计算屏幕坐标的函数
const calculateScreenPosition = (longitude: number, latitude: number) => {
  if (!viewer.value) return { x: 0, y: 0 }

  const worldPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude)
  const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
    viewer.value.scene,
    worldPosition
  )

  return screenPosition || { x: 0, y: 0 }
}

// 隐藏Cesium商标和版权信息的函数
const hideCesiumCredits = () => {
  if (!viewer.value) return

  // 隐藏版权信息容器
  const creditContainer = viewer.value.creditDisplay.container
  if (creditContainer) {
    creditContainer.style.display = 'none'
  }

  // 隐藏Cesium商标
  const cesiumLogo = document.querySelector('.cesium-widget-credits')
  if (cesiumLogo && cesiumLogo instanceof HTMLElement) {
    cesiumLogo.style.display = 'none'
  }

  // 隐藏所有版权相关的元素
  const creditElements = document.querySelectorAll('.cesium-widget-credits, .cesium-credit-logoContainer, .cesium-credit-textContainer')
  creditElements.forEach(element => {
    if (element instanceof HTMLElement) {
      element.style.display = 'none'
    }
  })

  // 隐藏版权显示
  viewer.value.creditDisplay.container.style.display = 'none'
}

onMounted(async () => {
  console.log('🚀 开始初始化Cesium...')

  // 检查容器是否存在
  const container = document.getElementById('cesiumContainer')
  console.log('📦 容器检查:', container ? '✅ 存在' : '❌ 不存在')

  // 设置 Cesium Ion 访问令牌（如果需要使用Cesium Ion服务）
  // 从环境变量读取 TOKEN，或使用默认的公共 TOKEN
  // const cesiumToken = import.meta.env.VITE_CESIUM_ION_TOKEN
  const cesiumToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5ODk1NmMwNC02MjYwLTQyZWUtYTIxMy1lMjgwMTA3NWE1MmIiLCJpZCI6NDI2NzgsImlhdCI6MTYxMTcwOTEzMH0.DwVnaNdLhZd8miWzYmC9O2k2F4_ODdrWU3EFZRbOWLo';
  if (cesiumToken) {
    Cesium.Ion.defaultAccessToken = cesiumToken
    console.log('✅ Cesium Ion Token 已设置')
  } else {
    console.log('⚠️ 未设置 Cesium Ion Token，将使用默认配置')
  }

  // Cesium已通过import导入，转换locationMarkersData为locationMarkers
  try {
    locationMarkers = locationMarkersData.map(marker => ({
      ...marker,
      color: Cesium.Color.fromCssColorString(marker.colorString)
    }))
    console.log('✅ locationMarkers 已转换完成')
  } catch (error) {
    console.error('❌ locationMarkers 转换失败:', error)
    return
  }

  // 初始化Cesium Viewer
  console.log('🔧 创建Cesium Viewer...')
  try {
  viewer.value = new Cesium.Viewer('cesiumContainer', {
    animation: false,
    baseLayerPicker: false, // 启用图层选择器，确保有地图
    fullscreenButton: false, // 启用全屏按钮
    geocoder: false,
    homeButton: false, // 启用主页按钮
    infoBox: false,
    sceneModePicker: false, // 启用场景模式选择器
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    navigationInstructionsInitiallyVisible: false,
      creditContainer: document.createElement('div'), // 隐藏版权信息容器
    })
    // console.log('✅ Cesium Viewer 创建成功')
  } catch (error) {
    // console.error('❌ Cesium Viewer 创建失败:', error)
    return
  }

  // 详细检查地图图层状态
  console.log('🔍 === 地图图层状态检查 ===')
  console.log('🔍 当前地图图层数量:', viewer.value.imageryLayers.length)

  for (let i = 0; i < viewer.value.imageryLayers.length; i++) {
    const layer = viewer.value.imageryLayers.get(i)
    console.log(`🔍 图层 ${i}:`, {
      show: layer.show,
      alpha: layer.alpha,
      brightness: layer.brightness,
      contrast: layer.contrast,
      hue: layer.hue,
      saturation: layer.saturation,
      gamma: layer.gamma
    })
  }

  // 检查场景状态
  console.log('🌍 === 场景状态检查 ===')
  console.log('🌍 场景模式:', viewer.value.scene.mode)
  console.log('🌍 相机位置:', viewer.value.camera.position)
  console.log('🌍 地球是否可见:', viewer.value.scene.globe.show)

  // 检查地球状态
  console.log('🌐 === 地球状态检查 ===')
  console.log('🌐 地球显示:', viewer.value.scene.globe.show)
  console.log('🌐 地球是否启用:', viewer.value.scene.globe.enableLighting)

    // 由于网络连接问题，直接使用Cesium默认配置
  console.log('🌐 网络连接有问题，使用Cesium默认配置')
  console.log('🔍 当前地图图层数量:', viewer.value.imageryLayers.length)

  // 确保地球可见
  viewer.value.scene.globe.show = true
  console.log('✅ 确保地球可见')

  // 设置一个简单的背景色，让地球更明显
  viewer.value.scene.backgroundColor = Cesium.Color.LIGHTBLUE
  console.log('✅ 设置背景色为浅蓝色')

  // 隐藏Cesium商标和版权信息
  hideCesiumCredits()

  // 延迟再次隐藏，确保所有元素都已加载
  setTimeout(() => {
    hideCesiumCredits()
  }, 1000)

  // // 异步设置地形
  // console.log('🏔️ === 地形加载测试 ===')
  // try {
  //   console.log('🔧 尝试加载世界地形...')
  //   const terrainProvider = await Cesium.createWorldTerrainAsync()
  //   viewer.value.terrainProvider = terrainProvider
  //   console.log('✅ 世界地形加载成功:', terrainProvider)
  //   console.log('🏔️ 地形提供者类型:', terrainProvider.constructor.name)
  // } catch (error) {
  //   console.warn('❌ 世界地形加载失败:', error)
  //   console.log('🔧 使用默认椭球体地形...')
  //   // 如果世界地形加载失败，使用默认地形
  //   viewer.value.terrainProvider = new Cesium.EllipsoidTerrainProvider()
  //   console.log('✅ 默认地形设置成功:', viewer.value.terrainProvider)
  //   console.log('🏔️ 默认地形类型:', viewer.value.terrainProvider.constructor.name)
  // }

  // 先创建鼠标点击事件处理器（只创建一次）
  createClickEventHandler()

  // 创建鼠标移动事件处理器
  createMouseMoveEventHandler()

  // 添加地理位置标记点
  addLocationMarkers()

  // 延迟一下再确保所有标记点可见，让初始视角先设置完成
  setTimeout(() => {
    ensureAllMarkersVisible()
  }, 1000)

  // // 设置初始视角 - 调整到能看到所有标记点的位置，让地球居中
  // 设置初始视角 - 显示所有标记点的最佳视角
  const optimalPosition = calculateOptimalCameraPosition()
  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(optimalPosition.longitude, optimalPosition.latitude, optimalPosition.height),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-60), // 调整俯仰角，让地球更居中
      roll: 0.0
    }
  })

  // 设置相机限制，确保地球始终可见
  viewer.value.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z

  // 设置场景限制
  // viewer.value.scene.screenSpaceCameraController.minimumZoomDistance = 1000000
  // viewer.value.scene.screenSpaceCameraController.maximumZoomDistance = 20000000

  // 设置相机默认行为
  viewer.value.scene.screenSpaceCameraController.enableRotate = true
  viewer.value.scene.screenSpaceCameraController.enableZoom = true
  viewer.value.scene.screenSpaceCameraController.enableTranslate = true

  // 禁用默认的双击行为
  viewer.value.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

  // 添加全局点击事件监听器作为备用方案
  const cesiumContainer = document.getElementById('cesiumContainer')
  if (cesiumContainer) {
    cesiumContainer.addEventListener('click', handleGlobalClick)
  }
})

// 添加地理位置标记点函数
const addLocationMarkers = () => {
  if (!viewer.value) return

  // 清空全局 labelRefs
  globalLabelRefs = []

  locationMarkers.forEach((marker, index) => {
    // 创建标记点实体
    const entity = viewer.value!.entities.add({
      id: marker.id, // 使用 marker 的 id 作为 Entity 的 id
      position: Cesium.Cartesian3.fromDegrees(marker.longitude, marker.latitude),

      // 隐藏圆形点
      point: {
        show: false
      },

        // 使用新的红色定位图钉图标 - 正方形尺寸
      billboard: {
        image: '/my_page/assets/nagv_red.png',
        width: 40,
        height: 40, // 设置成正方形，与Canvas图标大小一致
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 改回BOTTOM，让图标底部贴地
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平居中
        // 固定大小，不随距离变化
        scale: 1.0,
        show: true
      },

      // 标签显示 - 使用相同的距离缩放
      label: {
        text: String(getLocalizedText(marker.name)),
        font: 'bold 14pt sans-serif', // 调小字体
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 4,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -45), // 调整偏移量
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 与图标保持一致
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 与图标保持一致
        // 固定大小，与图标保持一致
        scale: 1.0
      },

      description: String(getLocalizedText(marker.description))
    })

    // 存储到全局 labelRefs
    globalLabelRefs.push({ entity, marker })
    // console.log('🔍 添加标记点:', marker.name, 'id:', marker.id, 'entity:', entity) // 添加调试日志
  })

  // 创建相邻标记点之间的拱形线
  // createArchedLines()

  // console.log('✅ 标记点已创建，globalLabelRefs 长度:', globalLabelRefs.length)
  // console.log('🔍 globalLabelRefs 详情:', globalLabelRefs.map(ref => ({ name: ref.marker.name, id: ref.marker.id, entity: ref.entity }))) // 添加调试日志

  // // 最终状态检查
  // console.log('🎯 === 最终状态检查 ===')
  // console.log('🎯 Viewer状态:', viewer.value ? '✅ 已创建' : '❌ 未创建')
  // console.log('🎯 地图图层数量:', viewer.value?.imageryLayers.length || 0)
  // console.log('🎯 地形提供者:', viewer.value?.terrainProvider?.constructor.name || '未知')
  // console.log('🎯 地球显示状态:', viewer.value?.scene.globe.show)
  // console.log('🎯 场景模式:', viewer.value?.scene.mode)
  // console.log('🎯 相机位置:', viewer.value?.camera.position)
  // console.log('🎯 标记点数量:', globalLabelRefs.length)

  //   // 网络连接测试（简化版，避免过多错误信息）
  // console.log('🌐 网络连接测试已跳过（已知网络问题）')
}

// 创建红色定位图钉图标
const createRedPinIcon = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 40
  canvas.height = 50
  const context = canvas.getContext('2d')

  if (context) {
    const centerX = 20
    const pinY = 15
    const radius = 12

    // 绘制红色定位图钉
    // 上半圆
    context.beginPath()
    context.arc(centerX, pinY, radius, 0, Math.PI, true)
    context.lineTo(centerX, pinY + 25) // 底部尖点
    context.closePath()

    // 红色渐变填充
    const gradient = context.createLinearGradient(centerX - radius, pinY - radius, centerX + radius, pinY + radius)
    gradient.addColorStop(0, '#FF4444') // 亮红色
    gradient.addColorStop(0.5, '#CC0000') // 深红色
    gradient.addColorStop(1, '#990000') // 更深的红色
    context.fillStyle = gradient
    context.fill()

    // 白色边框
    context.strokeStyle = Cesium.Color.WHITE.toCssColorString()
    context.lineWidth = 2
    context.stroke()

    // 内部高光
    context.fillStyle = Cesium.Color.WHITE.withAlpha(0.8).toCssColorString()
    context.beginPath()
    context.arc(centerX - 3, pinY - 3, 4, 0, 2 * Math.PI)
    context.fill()

    // 添加阴影效果
    context.shadowColor = 'rgba(0, 0, 0, 0.3)'
    context.shadowBlur = 4
    context.shadowOffsetX = 1
    context.shadowOffsetY = 1
  }

  console.log('🔴 红色定位图钉创建完成，Canvas尺寸:', canvas.width, 'x', canvas.height)
  return canvas
}

// 创建几何形状标识
const createGeometricMarker = (marker: any) => {
  const canvas = document.createElement('canvas')
  canvas.width = 50
  canvas.height = 50
  const context = canvas.getContext('2d')

  if (context) {
    const centerX = 25
    const centerY = 25
    const size = 18

    // 根据类型绘制不同形状
    switch (marker.type) {
      case 'university':
        // 圆形 - 大学
        context.beginPath()
        context.arc(centerX, centerY, size, 0, 2 * Math.PI)
        context.fillStyle = marker.color.withAlpha(0.9).toCssColorString()
        context.fill()
        context.strokeStyle = Cesium.Color.WHITE.toCssColorString()
        context.lineWidth = 3
        context.stroke()
        break

      case 'company':
        // 正方形 - 公司
        context.fillStyle = marker.color.withAlpha(0.9).toCssColorString()
        context.fillRect(centerX - size, centerY - size, size * 2, size * 2)
        context.strokeStyle = Cesium.Color.WHITE.toCssColorString()
        context.lineWidth = 3
        context.strokeRect(centerX - size, centerY - size, size * 2, size * 2)
        break

      case 'city':
        // 三角形 - 城市
        context.beginPath()
        context.moveTo(centerX, centerY - size)
        context.lineTo(centerX - size, centerY + size)
        context.lineTo(centerX + size, centerY + size)
        context.closePath()
        context.fillStyle = marker.color.withAlpha(0.9).toCssColorString()
        context.fill()
        context.strokeStyle = Cesium.Color.WHITE.toCssColorString()
        context.lineWidth = 3
        context.stroke()
        break

      default:
        // 默认圆形
        context.beginPath()
        context.arc(centerX, centerY, size, 0, 2 * Math.PI)
        context.fillStyle = marker.color.withAlpha(0.9).toCssColorString()
        context.fill()
        context.strokeStyle = Cesium.Color.WHITE.toCssColorString()
        context.lineWidth = 3
        context.stroke()
        break
    }
  }

  console.log('🎨 几何形状创建完成:', marker.type, 'Canvas尺寸:', canvas.width, 'x', canvas.height)
  return canvas
}

// 创建3D定位针图标 - 动态版本
const createLocationPinImage = (color: Cesium.Color) => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 80
  const context = canvas.getContext('2d')

  if (context) {
    const centerX = 32
    const pinY = 18
    const radius = 16

    // 获取当前时间用于动画
    const time = Date.now() * 0.003
    const pulseScale = 1 + Math.sin(time) * 0.1 // 脉冲效果
    const currentRadius = radius * pulseScale

    // 绘制外圈脉冲光环
    const pulseGradient = context.createRadialGradient(centerX, pinY, 0, centerX, pinY, currentRadius + 8)
    pulseGradient.addColorStop(0, color.withAlpha(0.0).toCssColorString())
    pulseGradient.addColorStop(0.7, color.withAlpha(0.2).toCssColorString())
    pulseGradient.addColorStop(1, color.withAlpha(0.0).toCssColorString())
    context.fillStyle = pulseGradient
    context.beginPath()
    context.arc(centerX, pinY, currentRadius + 8, 0, 2 * Math.PI)
    context.fill()

    // 绘制外圈阴影效果
    context.shadowColor = color.withAlpha(0.4).toCssColorString()
    context.shadowBlur = 6
    context.shadowOffsetX = 1
    context.shadowOffsetY = 1

    // 绘制定位针主体（改进的水滴形状）
    context.beginPath()
    context.arc(centerX, pinY, currentRadius, 0, Math.PI, true) // 上半圆
    context.lineTo(centerX, pinY + 40) // 底部尖点
    context.closePath()

    // 使用更鲜明的配色 - 深蓝色主题
    const mainColor = Cesium.Color.fromCssColorString('#1E3A8A') // 深蓝色
    const accentColor = Cesium.Color.fromCssColorString('#3B82F6') // 亮蓝色

    // 径向渐变填充 - 深蓝色渐变
    const radialGradient = context.createRadialGradient(centerX - 5, pinY - 5, 0, centerX, pinY, currentRadius)
    radialGradient.addColorStop(0, accentColor.withAlpha(0.95).toCssColorString())
    radialGradient.addColorStop(0.4, mainColor.withAlpha(0.9).toCssColorString())
    radialGradient.addColorStop(0.8, mainColor.withAlpha(0.8).toCssColorString())
    radialGradient.addColorStop(1, mainColor.withAlpha(0.7).toCssColorString())
    context.fillStyle = radialGradient
    context.fill()

    // 重置阴影
    context.shadowBlur = 0
    context.shadowOffsetX = 0
    context.shadowOffsetY = 0

    // 绘制内圈高光 - 更亮的高光
    const innerGradient = context.createRadialGradient(centerX - 4, pinY - 4, 0, centerX - 4, pinY - 4, 8)
    innerGradient.addColorStop(0, Cesium.Color.WHITE.withAlpha(0.95).toCssColorString())
    innerGradient.addColorStop(0.3, Cesium.Color.WHITE.withAlpha(0.7).toCssColorString())
    innerGradient.addColorStop(1, Cesium.Color.WHITE.withAlpha(0.0).toCssColorString())
    context.fillStyle = innerGradient
    context.beginPath()
    context.arc(centerX - 4, pinY - 4, 8, 0, 2 * Math.PI)
    context.fill()

    // 绘制边框 - 亮蓝色边框
    context.strokeStyle = accentColor.toCssColorString()
    context.lineWidth = 2.5
    context.stroke()

    // 添加底部尖点的阴影
    context.fillStyle = mainColor.withAlpha(0.5).toCssColorString()
    context.beginPath()
    context.moveTo(centerX - 2, pinY + 35)
    context.lineTo(centerX + 2, pinY + 35)
    context.lineTo(centerX, pinY + 40)
    context.closePath()
    context.fill()

    // 添加顶部小圆点装饰 - 亮蓝色
    context.fillStyle = accentColor.withAlpha(0.9).toCssColorString()
    context.beginPath()
    context.arc(centerX, pinY - 8, 2, 0, 2 * Math.PI)
    context.fill()

    // 添加闪烁效果
    const blinkAlpha = Math.sin(time * 2) * 0.3 + 0.7
    context.fillStyle = Cesium.Color.WHITE.withAlpha(blinkAlpha).toCssColorString()
    context.beginPath()
    context.arc(centerX, pinY - 8, 1, 0, 2 * Math.PI)
    context.fill()
  }

  console.log('📍 动态定位针图标创建完成，Canvas尺寸:', canvas.width, 'x', canvas.height)
  return canvas
}

// 创建3D立方体图标
const createCubeImage = (color: Cesium.Color) => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 80
  const context = canvas.getContext('2d')

  if (context) {
    const centerX = 32
    const centerY = 30
    const size = 24

    // 绘制3D立方体 - 改进版本
    // 顶面（最亮）
    const topGradient = context.createLinearGradient(centerX - size/2, centerY - size/2, centerX + size/2, centerY - size/2)
    topGradient.addColorStop(0, color.withAlpha(0.9).toCssColorString())
    topGradient.addColorStop(1, color.withAlpha(0.7).toCssColorString())
    context.fillStyle = topGradient
    context.beginPath()
    context.moveTo(centerX - size/2, centerY - size/2)
    context.lineTo(centerX - size/2 + 10, centerY - size/2 - 10)
    context.lineTo(centerX + size/2 + 10, centerY - size/2 - 10)
    context.lineTo(centerX + size/2, centerY - size/2)
    context.closePath()
    context.fill()

    // 右面（中等亮度）
    const rightGradient = context.createLinearGradient(centerX + size/2, centerY - size/2, centerX + size/2, centerY + size/2)
    rightGradient.addColorStop(0, color.withAlpha(0.7).toCssColorString())
    rightGradient.addColorStop(1, color.withAlpha(0.5).toCssColorString())
    context.fillStyle = rightGradient
    context.beginPath()
    context.moveTo(centerX + size/2, centerY - size/2)
    context.lineTo(centerX + size/2 + 10, centerY - size/2 - 10)
    context.lineTo(centerX + size/2 + 10, centerY + size/2 - 10)
    context.lineTo(centerX + size/2, centerY + size/2)
    context.closePath()
    context.fill()

    // 前面（主面，最清晰）
    const frontGradient = context.createLinearGradient(centerX - size/2, centerY - size/2, centerX + size/2, centerY + size/2)
    frontGradient.addColorStop(0, color.withAlpha(0.9).toCssColorString())
    frontGradient.addColorStop(0.5, color.withAlpha(0.8).toCssColorString())
    frontGradient.addColorStop(1, color.withAlpha(0.6).toCssColorString())
    context.fillStyle = frontGradient
    context.fillRect(centerX - size/2, centerY - size/2, size, size)

    // 添加内部高光
    context.fillStyle = Cesium.Color.WHITE.withAlpha(0.6).toCssColorString()
    context.fillRect(centerX - size/2 + 2, centerY - size/2 + 2, size/3, size/3)

    // 白色边框
    context.strokeStyle = Cesium.Color.WHITE.toCssColorString()
    context.lineWidth = 2
    context.strokeRect(centerX - size/2, centerY - size/2, size, size)
  }

  console.log('🏢 立方体图标创建完成，Canvas尺寸:', canvas.width, 'x', canvas.height)
  return canvas
}

// 创建3D箭头图标
const createArrowImage = (color: Cesium.Color) => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 80
  const context = canvas.getContext('2d')

  if (context) {
    const centerX = 32
    const arrowY = 25

    // 绘制3D箭头 - 改进版本
    // 箭头主体（带渐变）
    const arrowGradient = context.createLinearGradient(centerX, arrowY - 15, centerX, arrowY + 25)
    arrowGradient.addColorStop(0, color.withAlpha(0.9).toCssColorString())
    arrowGradient.addColorStop(0.3, color.withAlpha(0.8).toCssColorString())
    arrowGradient.addColorStop(0.7, color.withAlpha(0.7).toCssColorString())
    arrowGradient.addColorStop(1, color.withAlpha(0.6).toCssColorString())

    context.beginPath()
    context.moveTo(centerX, arrowY - 15)
    context.lineTo(centerX - 12, arrowY + 5)
    context.lineTo(centerX - 6, arrowY + 5)
    context.lineTo(centerX - 6, arrowY + 25)
    context.lineTo(centerX + 6, arrowY + 25)
    context.lineTo(centerX + 6, arrowY + 5)
    context.lineTo(centerX + 12, arrowY + 5)
    context.closePath()
    context.fillStyle = arrowGradient
    context.fill()

    // 添加内部高光（箭头头部）
    context.fillStyle = Cesium.Color.WHITE.withAlpha(0.7).toCssColorString()
    context.beginPath()
    context.moveTo(centerX, arrowY - 15)
    context.lineTo(centerX - 4, arrowY - 5)
    context.lineTo(centerX + 4, arrowY - 5)
    context.closePath()
    context.fill()

    // 添加侧面阴影效果
    context.fillStyle = color.withAlpha(0.4).toCssColorString()
    context.beginPath()
    context.moveTo(centerX - 12, arrowY + 5)
    context.lineTo(centerX - 6, arrowY + 5)
    context.lineTo(centerX - 6, arrowY + 25)
    context.lineTo(centerX - 8, arrowY + 25)
    context.lineTo(centerX - 8, arrowY + 7)
    context.lineTo(centerX - 10, arrowY + 7)
    context.closePath()
    context.fill()

    // 白色边框
    context.strokeStyle = Cesium.Color.WHITE.toCssColorString()
    context.lineWidth = 2
    context.stroke()
  }

  console.log('🏙️ 箭头图标创建完成，Canvas尺寸:', canvas.width, 'x', canvas.height)
  return canvas
}

// 根据标记类型创建相应的图标
const createMarkerImage = (marker: any) => {
  console.log('🎨 创建图标:', marker.name, '类型:', marker.type)
  let image
  switch (marker.type) {
    case 'university':
      image = createLocationPinImage(marker.color)
      console.log('📍 创建定位针图标')
      break
    case 'company':
      image = createCubeImage(marker.color)
      console.log('🏢 创建立方体图标')
      break
    case 'city':
      image = createArrowImage(marker.color)
      console.log('🏙️ 创建箭头图标')
      break
    default:
      image = createLocationPinImage(marker.color)
      console.log('📍 默认创建定位针图标')
      break
  }
  return image
}

// 重置视角函数
const resetView = () => {
  if (viewer.value) {
    const optimalPosition = calculateOptimalCameraPosition()
    viewer.value.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(optimalPosition.longitude, optimalPosition.latitude, optimalPosition.height),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-60), // 调整俯仰角，让地球更居中
        roll: 0.0
      }
    })
  }
}

// 关闭弹出标签函数
const closePopup = () => {
  selectedMarker.value = null
  showPopup.value = false

  // 关闭弹窗时重置视角
  resetToInitialView()
}

// 语言切换相关函数
const getCurrentLanguageLabel = () => {
  const current = languageOptions.find(option => option.value === currentLanguage.value)
  return current ? current.label : '日本語'
}

const switchLanguage = (language: string) => {
  if (language === 'zh' || language === 'ja' || language === 'en') {
    currentLanguage.value = language
    popupUpdateCounter.value++; // 增加更新计数器，强制重新渲染弹窗内容
    console.log('🌐 语言切换至:', language)

    // 更新所有标记点的标签文本
    updateMarkerLabels()
  }
}

// 更新所有标记点的标签文本
const updateMarkerLabels = () => {
  if (!viewer.value) return

  // 遍历所有标记点，更新标签文本
  locationMarkers.forEach((marker) => {
    const entity = viewer.value!.entities.getById(marker.id)
    if (entity && entity.label) {
      // 使用Cesium的Property系统更新文本
      entity.label.text = new Cesium.ConstantProperty(String(getLocalizedText(marker.name)))
    }
  })

  console.log('🔄 已更新所有标记点标签文本')
}

// 获取当前语言的文本
const getLocalizedText = (text: any) => {
  if (typeof text === 'string') {
    return text
  }
  if (typeof text === 'object' && text !== null) {
    return text[currentLanguage.value] || text.ja || text.zh || text.en || ''
  }
  return ''
}

// 获取当前语言的数组
const getLocalizedArray = (array: any) => {
  if (Array.isArray(array)) {
    return array
  }
  if (typeof array === 'object' && array !== null) {
    return array[currentLanguage.value] || array.ja || array.zh || array.en || []
  }
  return []
}

// 飞行到标记点函数
const flyToMarker = (marker: any) => {
  if (viewer.value) {
    viewer.value.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(marker.longitude, marker.latitude, 50000),
      duration: 2.0,
      complete: () => {
        // 显示信息窗口
        selectedMarker.value = marker
        // 将弹出标签定位到屏幕中央
        popupPosition.value = {
          x: window.innerWidth / 2 - 150,
          y: window.innerHeight / 2 - 100
        }
      }
    })
  }
}

// 放大查看标记点函数
const zoomToMarker = (marker: any) => {
  if (viewer.value) {
    viewer.value.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(marker.longitude, marker.latitude, 10000),
      duration: 2.0,
      complete: () => {
        // 显示信息窗口
        selectedMarker.value = marker
        // 将弹出标签定位到屏幕中央
        popupPosition.value = {
          x: window.innerWidth / 2 - 150,
          y: window.innerHeight / 2 - 100
        }
      }
    })
  }
}

// 测试弹出标签函数
const testPopup = () => {
  console.log('测试弹出标签')
  selectedMarker.value = locationMarkers[0] // 显示第一个标记点
  showPopup.value = true
  popupPosition.value = {
    x: window.innerWidth / 2 - 150,
    y: window.innerHeight / 2 - 100
  }
  console.log('选中的标记点:', selectedMarker.value)
  console.log('弹出标签位置:', popupPosition.value)
}

// 强制显示弹窗函数
const forceShowPopup = () => {
  console.log('🚀 强制显示弹窗')
  selectedMarker.value = {
    name: '测试公司',
    icon: '🏢',
    description: '这是一个测试弹窗',
    longitude: 123.456,
    latitude: 41.789
  }
  showPopup.value = true
  console.log('🚀 selectedMarker 强制设置为:', selectedMarker.value)
}

// 清除所有标签函数
const clearAllLabels = () => {
  if (!viewer.value) return

  // 清除所有实体
  viewer.value.entities.removeAll()

  // 重新添加标记点（但不显示标签）
  setTimeout(() => {
    addLocationMarkers()
  }, 100)

  console.log('已清除所有标签')
}

// 全局点击事件处理函数
const handleGlobalClick = (event: MouseEvent) => {
  if (!viewer.value) return

  const cesiumContainer = document.getElementById('cesiumContainer')
  if (!cesiumContainer) return

  const canvas = cesiumContainer.querySelector('canvas')
  if (!canvas) return

  // 计算相对于画布的坐标
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const pickedObject = viewer.value.scene.pick(new Cesium.Cartesian2(x, y))

  if (pickedObject && pickedObject.id) {
    const entity = pickedObject.id
    // 检查是否是我们的标记点实体
    if (entity.point && entity.label) {
      const labelText = entity.label.text.getValue()
      const marker = locationMarkers.find(m => labelText.includes(m.icon))

      if (marker) {
        console.log('全局点击检测到标记点:', marker.name)
        selectedMarker.value = marker
        popupPosition.value = {
          x: event.clientX - 150,
          y: event.clientY - 100
        }
        viewer.value.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(marker.longitude, marker.latitude, 50000),
          duration: 2.0
        })
      }
    }
  }
}

onUnmounted(() => {
  // 销毁鼠标点击事件处理器
  destroyClickEventHandler()

  // 销毁鼠标移动事件处理器
  if (viewer.value && (viewer.value as any).mouseMoveHandler) {
    ;(viewer.value as any).mouseMoveHandler.destroy()
  }

  if (viewer.value) {
    viewer.value.destroy()
  }
  const cesiumContainer = document.getElementById('cesiumContainer')
  if (cesiumContainer) {
    cesiumContainer.removeEventListener('click', handleGlobalClick)
  }
})
</script>

<style scoped>
.cesium-viewer-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.cesium-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: sans-serif;
  position: fixed;
  top: 0;
  left: 0;
}

/* 重置视角按钮 - 强制样式 */
.reset-view-btn {
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  left: auto !important;
  bottom: auto !important;
  z-index: 1000 !important;

  width: auto !important;
  height: auto !important;
  min-width: 120px !important;
  max-width: 200px !important;
  min-height: auto !important;
  max-height: auto !important;

  background: linear-gradient(135deg, rgba(15, 52, 96, 0.95), rgba(26, 26, 46, 0.95)) !important;
  color: #f8f9fa !important;
  border: 1px solid rgba(255, 107, 53, 0.3) !important;
  border-radius: 8px !important;
  padding: 12px 16px !important;
  margin: 0 !important;

  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  box-sizing: border-box !important;

  font-size: 14px !important;
  font-weight: 500 !important;
  font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo UI', sans-serif !important;
  line-height: 1.2 !important;

  transition: all 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(15, 52, 96, 0.4) !important;
  backdrop-filter: blur(10px) !important;

  outline: none !important;
  text-decoration: none !important;
  vertical-align: baseline !important;

  /* 重置可能的继承样式 */
  float: none !important;
  clear: none !important;
  overflow: visible !important;
  visibility: visible !important;
}

.reset-view-btn:hover {
  background: rgba(255, 107, 53, 0.1) !important;
  border-color: #ff6b35 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(15, 52, 96, 0.4) !important;
}

.reset-view-btn:active {
  transform: translateY(0) !important;
}

.btn-icon {
  font-size: 16px !important;
  display: inline-block !important;
  line-height: 1 !important;
}

.btn-text {
  font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo UI', sans-serif !important;
  display: inline-block !important;
  line-height: 1.2 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reset-view-btn {
    top: 15px !important;
    right: 15px !important;
    padding: 10px 12px !important;
    font-size: 13px !important;
    min-width: 80px !important;
    max-width: 120px !important;
  }

  .btn-text {
    display: none !important; /* 在小屏幕上隐藏文字，只显示图标 */
  }
}

/* 鼠标位置显示样式 */
.mouse-position-display {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  background: linear-gradient(135deg, rgba(15, 52, 96, 0.95), rgba(26, 26, 46, 0.95));
  color: #f8f9fa;
  border: 1px solid rgba(255, 107, 53, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(15, 52, 96, 0.4);
  backdrop-filter: blur(10px);
  font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo UI', sans-serif;
  min-width: 200px;
}

.position-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.position-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  line-height: 1.4;
}

.position-item .label {
  color: #ff6b35;
  font-weight: 600;
  margin-right: 8px;
}

.position-item .value {
  color: #f8f9fa;
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

/* 响应式设计 - 鼠标位置显示 */
@media (max-width: 768px) {
  .mouse-position-display {
    bottom: 15px;
    left: 15px;
    padding: 10px 12px;
    min-width: 180px;
  }

  .position-item {
    font-size: 12px;
  }
}

/* 语言切换组件样式 */
.language-switcher {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  background: linear-gradient(135deg, rgba(15, 52, 96, 0.95), rgba(26, 26, 46, 0.95));
  border: 1px solid rgba(255, 107, 53, 0.3);
  border-radius: 25px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(15, 52, 96, 0.4);
  backdrop-filter: blur(10px);
  min-width: auto;
}

.language-label {
  color: #ff6b35;
  font-weight: 600;
  font-size: 11px;
  margin-bottom: 4px;
  text-align: center;
  font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo UI', sans-serif;
}

.language-options {
  display: flex;
  flex-direction: row;
  gap: 6px;
}

.language-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 50%;
  color: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo UI', sans-serif;
  position: relative;
  overflow: hidden;
}

.language-btn:hover {
  background: rgba(255, 107, 53, 0.3);
  border-color: rgba(255, 107, 53, 0.6);
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.language-btn.active {
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.8), rgba(255, 107, 53, 0.6));
  border-color: #ff6b35;
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 107, 53, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.language-btn .flag {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.language-btn:hover .flag {
  transform: scale(1.2);
}

.language-btn.active .flag {
  transform: scale(1.1);
}

.language-btn .label {
  font-weight: 500;
}

/* 响应式设计 - 语言切换 */
@media (max-width: 768px) {
  .language-switcher {
    top: 70px;
    right: 15px;
    padding: 6px;
    border-radius: 20px;
  }

  .language-btn {
    width: 28px;
    height: 28px;
  }

  .language-btn .flag {
    font-size: 14px;
  }
}

.legend {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 10px;
  min-width: 300px;
  z-index: 1000;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.legend h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #fff;
  text-align: center;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.3s ease;
}

.legend-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.marker-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 12px;
  border: 2px solid white;
  flex-shrink: 0;
}

.marker-info {
  flex: 1;
}

.marker-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
}

.marker-desc {
  font-size: 12px;
  color: #ccc;
  line-height: 1.3;
}

.legend-tip {
  margin-top: 15px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 12px;
  color: #ddd;
  text-align: center;
  border-left: 3px solid #4CAF50;
}

.reset-view-btn {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
}

.reset-view-btn:hover {
  background-color: #388E3C;
}

.show-all-markers-btn {
  position: absolute;
  bottom: 20px;
  left: 200px;
  background-color: #2196F3;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
}

.show-all-markers-btn:hover {
  background-color: #1976D2;
}

.test-popup-btn {
  position: absolute;
  bottom: 20px;
  left: 380px;
  background-color: #FF9800;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
}

.test-popup-btn:hover {
  background-color: #F57C00;
}

.clear-labels-btn {
  position: absolute;
  bottom: 20px;
  left: 560px;
  background-color: #F44336;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
}

.clear-labels-btn:hover {
  background-color: #D32F2F;
}

/* 自定义弹出标签样式 */
.custom-popup {
  position: fixed !important;
  background: rgba(255, 0, 0, 0.9) !important; /* 改为红色背景，更容易看到 */
  color: white !important;
  border-radius: 12px;
  padding: 20px !important;
  min-width: 320px;
  max-width: 400px;
  z-index: 9999 !important; /* 提高z-index */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 3px solid yellow !important; /* 添加黄色边框 */
  backdrop-filter: blur(15px);
  animation: popupFadeIn 0.3s ease-out;

  top: 100px !important; /* 固定位置 */
  left: 100px !important;
  font-size: 20px !important;
  font-weight: bold !important;
}

@keyframes popupFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px 12px 0 0;
}

.popup-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.popup-icon {
  font-size: 24px;
}

.popup-name {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.popup-close {
  background: none;
  border: none;
  color: #ccc;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.popup-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.popup-content {
  padding: 20px;
}

.popup-description {
  font-size: 14px;
  color: #ddd;
  margin-bottom: 16px;
  line-height: 1.5;
}

.popup-coordinates {
  margin-bottom: 20px;
}

.coord-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.coord-item:last-child {
  border-bottom: none;
}

.coord-label {
  color: #ccc;
  font-size: 13px;
}

.coord-value {
  color: #fff;
  font-weight: bold;
  font-family: monospace;
  font-size: 13px;
}

.popup-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.fly-btn {
  background-color: #4CAF50;
  color: white;
}

.fly-btn:hover {
  background-color: #388E3C;
  transform: translateY(-2px);
}

.zoom-btn {
  background-color: #2196F3;
  color: white;
}

.zoom-btn:hover {
  background-color: #1976D2;
  transform: translateY(-2px);
}

/* 自定义标记点标签样式 */
.custom-marker-label {
  position: absolute !important;
  background: rgba(0, 0, 0, 0.95) !important;
  color: white !important;
  padding: 16px !important;
  border-radius: 12px !important;
  min-width: 220px !important;
  max-width: 280px !important;
  z-index: 1000 !important;
  font-family: 'Arial', sans-serif !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(15px) !important;
  transform: translate(-50%, -100%) !important;
  pointer-events: none !important;
  border: 2px solid !important;
  animation: labelFadeIn 0.5s ease-out !important;
  transition: all 0.3s ease !important;
}

@keyframes labelFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -100%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}

.custom-marker-label .label-header {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin-bottom: 12px !important;
  padding-bottom: 8px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.custom-marker-label .label-icon {
  font-size: 20px !important;
}

.custom-marker-label .label-name {
  font-size: 16px !important;
  font-weight: bold !important;
  color: #fff !important;
}

.custom-marker-label .label-content {
  line-height: 1.4 !important;
}

.custom-marker-label .label-desc {
  font-size: 13px !important;
  color: #ddd !important;
  margin-bottom: 8px !important;
}

.custom-marker-label .label-coords {
  font-size: 12px !important;
  color: #ccc !important;
  font-family: 'Courier New', monospace !important;
  background: rgba(255, 255, 255, 0.1) !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  text-align: center !important;
}

.custom-marker-label .label-close {
  background: none !important;
  border: none !important;
  color: #ccc !important;
  font-size: 20px !important;
  cursor: pointer !important;
  padding: 4px !important;
  border-radius: 4px !important;
  transition: all 0.2s ease !important;
  margin-left: auto !important;
  line-height: 1 !important;
}

.custom-marker-label .label-close:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

/* 隐藏Cesium商标和版权信息 */
.cesium-widget-credits,
.cesium-credit-logoContainer,
.cesium-credit-textContainer,
.cesium-widget-credits a,
.cesium-widget-credits img {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  height: 0 !important;
  width: 0 !important;
  overflow: hidden !important;
}

/* 隐藏Cesium水印 */
.cesium-widget-credits {
  display: none !important;
}

/* 隐藏所有包含Cesium文字的版权信息 */
[class*="cesium-credit"],
[class*="cesium-widget-credits"] {
  display: none !important;
}

/* 调试信息样式 */
.debug-info {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 1000;
  max-width: 300px;
}

.debug-info p {
  margin: 5px 0;
  word-break: break-all;
}

/* 弹窗内容样式 */
.popup-description {
  font-size: 14px;
  color: #ddd;
  margin-bottom: 16px;
  line-height: 1.5;
}

.popup-coordinates {
  margin-bottom: 20px;
}

.coord-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.coord-item:last-child {
  border-bottom: none;
}

.coord-label {
  color: #ccc;
  font-size: 13px;
}

.coord-value {
  color: #fff;
  font-weight: bold;
  font-family: monospace;
  font-size: 13px;
}

.action-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.fly-btn {
  background-color: #4CAF50;
  color: white;
}

.fly-btn:hover {
  background-color: #388E3C;
  transform: translateY(-2px);
}

.zoom-btn {
  background-color: #2196F3;
  color: white;
}

.zoom-btn:hover {
  background-color: #1976D2;
  transform: translateY(-2px);
}
</style>