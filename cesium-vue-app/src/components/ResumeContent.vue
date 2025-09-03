<template>
  <div class="resume-content">
    <!-- 基本情報 -->
    <div class="info-section">
      <div class="section-title">
        <span class="title-icon">📋</span>
        <span class="title-text">{{ localizedText({ zh: '基本信息', ja: '基本情報', en: 'Basic Information' }) }}</span>
      </div>
      <div class="info-content">
        <div class="info-item">
          <span class="info-label">{{ localizedText({ zh: '所属机构：', ja: '所属機関：', en: 'Organization: ' }) }}</span>
          <span class="info-value">{{ localizedText(resumeData.basicInfo.organization) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ localizedText({ zh: '详细说明：', ja: '詳細説明：', en: 'Description: ' }) }}</span>
          <span class="info-value">{{ localizedText(marker.description) }}</span>
        </div>
        <!-- 图标字段已隐藏 -->
        <!-- 东京标记点不显示在籍期间 -->
        <div v-if="marker.id !== 'tokyo'" class="info-item">
          <span class="info-label">{{ localizedText({ zh: '在籍期间：', ja: '在籍期間：', en: 'Period: ' }) }}</span>
          <span class="info-value">{{ localizedText(resumeData.basicInfo.period) }}</span>
        </div>
        <!-- 东京标记点不显示专业领域和机构类型 -->
        <div v-if="marker.id !== 'tokyo'" class="info-item">
          <span class="info-label">{{ localizedText({ zh: '专业领域：', ja: '専攻分野：', en: 'Field: ' }) }}</span>
          <span class="info-value">{{ localizedText(resumeData.basicInfo.field) }}</span>
        </div>
        <div v-if="marker.id !== 'tokyo'" class="info-item">
          <span class="info-label">{{ localizedText({ zh: '机构类型：', ja: '機関種別：', en: 'Type: ' }) }}</span>
          <span class="info-value">{{ localizedText(resumeData.basicInfo.type) }}</span>
        </div>
        <div class="coord-item">
          <span class="coord-label">{{ localizedText({ zh: '坐标：', ja: '座標：', en: 'Coordinates: ' }) }}</span>
          <span class="coord-value">{{ marker.longitude?.toFixed(4) }}°E, {{ marker.latitude?.toFixed(4) }}°N</span>
        </div>
      </div>
    </div>

    <!-- 学习项目 (仅东京显示) -->
    <div v-if="resumeData.learningProjects && Array.isArray(resumeData.learningProjects)" class="info-section">
      <div class="section-title">
        <span class="title-icon">📚</span>
        <span class="title-text">{{ localizedText({ zh: '学习项目', ja: '学習プロジェクト', en: 'Learning Projects' }) }}</span>
      </div>
      <div class="info-content">
        <div class="learning-projects">
          <div v-for="(project, index) in resumeData.learningProjects" :key="index" class="learning-project-card">
            <div class="project-header">
              <div class="project-name">{{ localizedText(project.name) }}</div>
              <div class="project-period">{{ localizedText(project.period) }}</div>
            </div>
            <div class="project-description">
              <span class="desc-label">{{ localizedText({ zh: '项目描述：', ja: 'プロジェクト説明：', en: 'Description: ' }) }}</span>
              <span class="desc-value">{{ localizedText(project.description) }}</span>
            </div>
            <div v-if="project.link" class="project-link">
              <span class="link-label">{{ localizedText({ zh: '项目链接：', ja: 'プロジェクトリンク：', en: 'Project Link: ' }) }}</span>
              <a :href="project.link.zh" target="_blank" class="link-value">{{ localizedText(project.link) }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学業成績・資格 (仅大学显示) -->
    <div v-if="marker.type === 'university'" class="info-section">
      <div class="section-title">
        <span class="title-icon">🎓</span>
        <span class="title-text">{{ localizedText({ zh: '学业成绩・资格', ja: '学業成績・資格', en: 'Academic Performance & Qualifications' }) }}</span>
      </div>
      <div class="info-content">
        <div class="info-item">
          <span class="info-label">GPA：</span>
          <span class="info-value">{{ localizedText(resumeData.academic?.gpa) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ localizedText({ zh: '取得学位：', ja: '取得学位：', en: 'Degree: ' }) }}</span>
          <span class="info-value">{{ localizedText(resumeData.academic?.degree) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ localizedText({ zh: '毕业论文：', ja: '卒業論文：', en: 'Thesis: ' }) }}</span>
          <span class="info-value">{{ localizedText(resumeData.academic?.thesis) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ localizedText({ zh: '相关资格：', ja: '関連資格：', en: 'Qualifications: ' }) }}</span>
          <span class="info-value">{{ localizedText(resumeData.academic?.qualifications) }}</span>
        </div>
      </div>
    </div>

    <!-- 主要活動・実績 (东京标记点不显示) -->
    <div v-if="marker.id !== 'tokyo'" class="info-section">
      <div class="section-title">
        <span class="title-icon">🏆</span>
        <span class="title-text">{{ localizedText({ zh: '主要活动・实绩', ja: '主要活動・実績', en: 'Major Activities & Achievements' }) }}</span>
      </div>
      <div class="info-content">
        <div class="activity-list">
          <div v-for="(activity, index) in localizedArray(resumeData.activities)" :key="index" class="activity-item">
            {{ activity }}
          </div>
        </div>
      </div>
    </div>

    <!-- 技術スキル (东京标记点不显示) -->
    <div v-if="marker.id !== 'tokyo'" class="info-section">
      <div class="section-title">
        <span class="title-icon">💻</span>
        <span class="title-text">{{ localizedText({ zh: '技术技能', ja: '技術スキル', en: 'Technical Skills' }) }}</span>
      </div>
      <div class="info-content">
        <div class="skill-list">
          <div v-for="(skill, index) in localizedArray(resumeData.skills)" :key="index" class="skill-item">
            {{ skill }}
          </div>
        </div>
      </div>
    </div>

    <!-- 工作经历详情 (仅公司显示) -->
    <div v-if="marker.type === 'company' && resumeData.workExperience" class="info-section">
      <div class="section-title">
        <span class="title-icon">💼</span>
        <span class="title-text">{{ localizedText({ zh: '工作经历', ja: '勤務経験', en: 'Work Experience' }) }}</span>
      </div>
      <div class="info-content">
        <div class="work-experience">
          <div class="work-role">
            <span class="role-label">{{ localizedText({ zh: '职位：', ja: '役職：', en: 'Position: ' }) }}</span>
            <span class="role-value">{{ localizedText(resumeData.workExperience.role) }}</span>
          </div>
          <div class="work-department">
            <span class="dept-label">{{ localizedText({ zh: '部门：', ja: '部署：', en: 'Department: ' }) }}</span>
            <span class="dept-value">{{ localizedText(resumeData.workExperience.department) }}</span>
          </div>

          <!-- 主要职责 -->
          <div class="responsibilities-section">
            <div class="subsection-title">
              <span class="subsection-icon">📋</span>
              <span class="subsection-text">{{ localizedText({ zh: '主要职责', ja: '主要職責', en: 'Key Responsibilities' }) }}</span>
            </div>
            <div class="responsibility-list">
              <div v-for="(responsibility, index) in localizedArray(resumeData.workExperience.responsibilities)" :key="index" class="responsibility-item">
                {{ responsibility }}
              </div>
            </div>
          </div>

          <!-- 主要成就 -->
          <div class="achievements-section">
            <div class="subsection-title">
              <span class="subsection-icon">🏆</span>
              <span class="subsection-text">{{ localizedText({ zh: '主要成就', ja: '主要成果', en: 'Key Achievements' }) }}</span>
            </div>
            <div class="achievement-list">
              <div v-for="(achievement, index) in localizedArray(resumeData.workExperience.achievements)" :key="index" class="achievement-item">
                {{ achievement }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 项目经验详情 -->
    <div v-if="resumeData.projects && Array.isArray(resumeData.projects) && resumeData.projects.length > 0" class="info-section">
      <div class="section-title">
        <span class="title-icon">🚀</span>
        <span class="title-text">{{ localizedText({ zh: '项目经验', ja: 'プロジェクト経験', en: 'Project Experience' }) }}</span>
      </div>
      <div class="info-content">
        <div class="project-details">
          <div v-for="(project, index) in getProjectArray()" :key="index" class="project-card">
            <div class="project-header">
              <div class="project-name">{{ localizedText(project.name) }}</div>
              <div class="project-period">{{ localizedText(project.period) }}</div>
            </div>
            <div class="project-role">
              <span class="role-label">{{ localizedText({ zh: '角色：', ja: '役割：', en: 'Role: ' }) }}</span>
              <span class="role-value">{{ localizedText(project.role) }}</span>
            </div>
            <div class="project-description">
              <span class="desc-label">{{ localizedText({ zh: '项目描述：', ja: 'プロジェクト説明：', en: 'Description: ' }) }}</span>
              <span class="desc-value">{{ localizedText(project.description) }}</span>
            </div>
            <div class="project-technologies">
              <span class="tech-label">{{ localizedText({ zh: '技术栈：', ja: '技術スタック：', en: 'Technologies: ' }) }}</span>
              <span class="tech-value">{{ localizedText(project.technologies) }}</span>
            </div>
            <div class="project-achievements">
              <div class="achievement-title">
                <span class="achievement-icon">✨</span>
                <span class="achievement-text">{{ localizedText({ zh: '项目成果', ja: 'プロジェクト成果', en: 'Project Achievements' }) }}</span>
              </div>
              <div class="achievement-list">
                <div v-for="(achievement, achIndex) in localizedArray(project.achievements)" :key="achIndex" class="achievement-item">
                  {{ achievement }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 传统项目列表 (兼容旧格式) -->
    <div v-else-if="resumeData.projects && !Array.isArray(resumeData.projects)" class="info-section">
      <div class="section-title">
        <span class="title-icon">🚀</span>
        <span class="title-text">{{ localizedText({ zh: '负责业务・项目', ja: '担当業務・プロジェクト', en: 'Responsibilities & Projects' }) }}</span>
      </div>
      <div class="info-content">
        <div class="project-list">
          <div v-for="(project, index) in localizedArray(resumeData.projects)" :key="index" class="project-item">
            {{ project }}
          </div>
        </div>
      </div>
    </div>

    <!-- 技能分类展示 -->
    <div v-if="resumeData.skills && typeof resumeData.skills === 'object' && !Array.isArray(resumeData.skills)" class="info-section">
      <div class="section-title">
        <span class="title-icon">💻</span>
        <span class="title-text">{{ localizedText({ zh: '技能分类', ja: 'スキル分類', en: 'Skills Categories' }) }}</span>
      </div>
      <div class="info-content">
        <div class="skills-categories">
          <!-- 技术技能 -->
          <div v-if="getSkillsObject().technical" class="skill-category">
            <div class="category-title">
              <span class="category-icon">⚙️</span>
              <span class="category-text">{{ localizedText({ zh: '技术技能', ja: '技術スキル', en: 'Technical Skills' }) }}</span>
            </div>
            <div class="skill-list">
              <div v-for="(skill, index) in localizedArray(getSkillsObject().technical)" :key="index" class="skill-item">
                {{ skill }}
              </div>
            </div>
          </div>

          <!-- 工具技能 -->
          <div v-if="getSkillsObject().tools" class="skill-category">
            <div class="category-title">
              <span class="category-icon">🛠️</span>
              <span class="category-text">{{ localizedText({ zh: '开发工具', ja: '開発ツール', en: 'Development Tools' }) }}</span>
            </div>
            <div class="skill-list">
              <div v-for="(skill, index) in localizedArray(getSkillsObject().tools)" :key="index" class="skill-item">
                {{ skill }}
              </div>
            </div>
          </div>

          <!-- 语言能力 -->
          <div v-if="getSkillsObject().languages" class="skill-category">
            <div class="category-title">
              <span class="category-icon">🌐</span>
              <span class="category-text">{{ localizedText({ zh: '语言能力', ja: '言語能力', en: 'Language Skills' }) }}</span>
            </div>
            <div class="skill-list">
              <div v-for="(skill, index) in localizedArray(getSkillsObject().languages)" :key="index" class="skill-item">
                {{ skill }}
              </div>
            </div>
          </div>

          <!-- 认证与最佳实践 -->
          <div v-if="getSkillsObject().certifications" class="skill-category">
            <div class="category-title">
              <span class="category-icon">🏆</span>
              <span class="category-text">{{ localizedText({ zh: '认证与最佳实践', ja: '認定・ベストプラクティス', en: 'Certifications & Best Practices' }) }}</span>
            </div>
            <div class="skill-list">
              <div v-for="(skill, index) in localizedArray(getSkillsObject().certifications)" :key="index" class="skill-item">
                {{ skill }}
              </div>
            </div>
          </div>

          <!-- 软技能 -->
          <div v-if="getSkillsObject().soft" class="skill-category">
            <div class="category-title">
              <span class="category-icon">🤝</span>
              <span class="category-text">{{ localizedText({ zh: '软技能', ja: 'ソフトスキル', en: 'Soft Skills' }) }}</span>
            </div>
            <div class="skill-list">
              <div v-for="(skill, index) in localizedArray(getSkillsObject().soft)" :key="index" class="skill-item">
                {{ skill }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 传统技能列表 (兼容旧格式) -->
    <div v-else-if="resumeData.skills && Array.isArray(resumeData.skills)" class="info-section">
      <div class="section-title">
        <span class="title-icon">💻</span>
        <span class="title-text">{{ localizedText({ zh: '技术技能', ja: '技術スキル', en: 'Technical Skills' }) }}</span>
      </div>
      <div class="info-content">
        <div class="skill-list">
          <div v-for="(skill, index) in localizedArray(resumeData.skills)" :key="index" class="skill-item">
            {{ skill }}
          </div>
        </div>
      </div>
    </div>

    <!-- 求职目标 (仅东京显示) -->
    <div v-if="resumeData.careerGoals" class="info-section">
      <div class="section-title">
        <span class="title-icon">🎯</span>
        <span class="title-text">{{ localizedText({ zh: '求职目标', ja: '求職目標', en: 'Career Goals' }) }}</span>
      </div>
      <div class="info-content">
        <div class="career-goals">
          <div class="goal-item">
            <span class="goal-label">{{ localizedText({ zh: '目标岗位：', ja: '目標ポジション：', en: 'Target Position: ' }) }}</span>
            <span class="goal-value">{{ localizedText(resumeData.careerGoals.target) }}</span>
          </div>
          <div class="goal-item">
            <span class="goal-label">{{ localizedText({ zh: '公司类型：', ja: '会社タイプ：', en: 'Company Type: ' }) }}</span>
            <span class="goal-value">{{ localizedText(resumeData.careerGoals.companyType) }}</span>
          </div>
          <div class="goal-item">
            <span class="goal-label">{{ localizedText({ zh: '经验要求：', ja: '経験要件：', en: 'Experience Requirement: ' }) }}</span>
            <span class="goal-value">{{ localizedText(resumeData.careerGoals.experience) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 个人优势 (仅东京显示) -->
    <div v-if="resumeData.personalStrengths" class="info-section">
      <div class="section-title">
        <span class="title-icon">💪</span>
        <span class="title-text">{{ localizedText({ zh: '个人优势', ja: '個人の強み', en: 'Personal Strengths' }) }}</span>
      </div>
      <div class="info-content">
        <div class="personal-strengths">
          <div class="strength-item">
            <span class="strength-label">{{ localizedText({ zh: '工作经验：', ja: '職歴：', en: 'Work Experience: ' }) }}</span>
            <span class="strength-value">{{ localizedText(resumeData.personalStrengths.experience) }}</span>
          </div>
          <div class="abilities-section">
            <div class="subsection-title">
              <span class="subsection-icon">⭐</span>
              <span class="subsection-text">{{ localizedText({ zh: '核心能力', ja: 'コア能力', en: 'Core Abilities' }) }}</span>
            </div>
            <div class="ability-list">
              <div v-for="(ability, index) in localizedArray(resumeData.personalStrengths.abilities)" :key="index" class="ability-item">
                {{ ability }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 特殊贡献/创新 (东京标记点不显示) -->
    <div v-if="resumeData.contributions && marker.id !== 'tokyo'" class="info-section">
      <div class="section-title">
        <span class="title-icon">💡</span>
        <span class="title-text">{{ localizedText({ zh: '特殊贡献', ja: '特別貢献', en: 'Special Contributions' }) }}</span>
      </div>
      <div class="info-content">
        <div class="contributions">
          <!-- 学习贡献 -->
          <div v-if="getContributionsObject().learning" class="contribution-section">
            <div class="subsection-title">
              <span class="subsection-icon">📖</span>
              <span class="subsection-text">{{ localizedText({ zh: '学习贡献', ja: '学習貢献', en: 'Learning Contributions' }) }}</span>
            </div>
            <div class="contribution-list">
              <div v-for="(learning, index) in localizedArray(getContributionsObject().learning)" :key="index" class="contribution-item">
                {{ learning }}
              </div>
            </div>
          </div>

          <!-- 适应能力 -->
          <div v-if="getContributionsObject().adaptability" class="contribution-section">
            <div class="subsection-title">
              <span class="subsection-icon">🔄</span>
              <span class="subsection-text">{{ localizedText({ zh: '适应能力', ja: '適応能力', en: 'Adaptability' }) }}</span>
            </div>
            <div class="contribution-list">
              <div v-for="(adaptability, index) in localizedArray(getContributionsObject().adaptability)" :key="index" class="contribution-item">
                {{ adaptability }}
              </div>
            </div>
          </div>

          <!-- 创新贡献 -->
          <div v-if="getContributionsObject().innovations" class="contribution-section">
            <div class="subsection-title">
              <span class="subsection-icon">🚀</span>
              <span class="subsection-text">{{ localizedText({ zh: '创新贡献', ja: 'イノベーション貢献', en: 'Innovation Contributions' }) }}</span>
            </div>
            <div class="contribution-list">
              <div v-for="(innovation, index) in localizedArray(getContributionsObject().innovations)" :key="index" class="contribution-item">
                {{ innovation }}
              </div>
            </div>
          </div>

          <!-- 领导力体现 -->
          <div v-if="getContributionsObject().leadership" class="contribution-section">
            <div class="subsection-title">
              <span class="subsection-icon">👥</span>
              <span class="subsection-text">{{ localizedText({ zh: '领导力体现', ja: 'リーダーシップ発揮', en: 'Leadership Demonstration' }) }}</span>
            </div>
            <div class="contribution-list">
              <div v-for="(leadership, index) in localizedArray(getContributionsObject().leadership)" :key="index" class="contribution-item">
                {{ leadership }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { colors } from '@/styles/colors'

interface Marker {
  id: string
  name: string | { zh: string; ja: string; en: string }
  longitude: number
  latitude: number
  description: string | { zh: string; ja: string; en: string }
  color: any
  icon: string
  type: string
  resumeData: {
    basicInfo: {
      organization: string | { zh: string; ja: string; en: string }
      period: string | { zh: string; ja: string; en: string }
      field: string | { zh: string; ja: string; en: string }
      type: string | { zh: string; ja: string; en: string }
    }
    academic?: {
      gpa: string | { zh: string; ja: string; en: string }
      degree: string | { zh: string; ja: string; en: string }
      thesis: string | { zh: string; ja: string; en: string }
      qualifications: string | { zh: string; ja: string; en: string }
    }
    activities?: string[] | { zh: string[]; ja: string[]; en: string[] }
    skills?: string[] | { zh: string[]; ja: string[]; en: string[] } | {
      technical?: { zh: string[]; ja: string[]; en: string[] }
      tools?: { zh: string[]; ja: string[]; en: string[] }
      languages?: { zh: string[]; ja: string[]; en: string[] }
      soft?: { zh: string[]; ja: string[]; en: string[] }
      certifications?: { zh: string[]; ja: string[]; en: string[] }
    }
    projects?: string[] | { zh: string[]; ja: string[]; en: string[] } | Array<{
      name: { zh: string; ja: string; en: string }
      period: { zh: string; ja: string; en: string }
      role: { zh: string; ja: string; en: string }
      description: { zh: string; ja: string; en: string }
      technologies: { zh: string; ja: string; en: string }
      achievements: { zh: string[]; ja: string[]; en: string[] }
    }>
    workExperience?: {
      role: { zh: string; ja: string; en: string }
      department: { zh: string; ja: string; en: string }
      responsibilities: { zh: string[]; ja: string[]; en: string[] }
      achievements: { zh: string[]; ja: string[]; en: string[] }
    }
    careerGoals?: {
      target: { zh: string; ja: string; en: string }
      companyType: { zh: string; ja: string; en: string }
      experience: { zh: string; ja: string; en: string }
    }
    personalStrengths?: {
      experience: { zh: string; ja: string; en: string }
      abilities: { zh: string[]; ja: string[]; en: string[] }
    }
    learningProjects?: Array<{
      name: { zh: string; ja: string; en: string }
      period: { zh: string; ja: string; en: string }
      description: { zh: string; ja: string; en: string }
      link: { zh: string; ja: string; en: string }
    }>
    contributions?: {
      innovations?: { zh: string[]; ja: string[]; en: string[] }
      leadership?: { zh: string[]; ja: string[]; en: string[] }
      learning?: { zh: string[]; ja: string[]; en: string[] }
      adaptability?: { zh: string[]; ja: string[]; en: string[] }
    }
  }
}

const props = defineProps<{
  marker: Marker
  currentLanguage?: 'zh' | 'ja' | 'en'
  getLocalizedText?: (text: any) => string
  getLocalizedArray?: (array: any) => any[]
}>()

const { marker, currentLanguage = 'ja', getLocalizedText, getLocalizedArray } = props
const resumeData = marker.resumeData

// 默认的本地化函数
const defaultGetLocalizedText = (text: any) => {
  if (typeof text === 'string') {
    return text
  }
  if (typeof text === 'object' && text !== null) {
    return text[currentLanguage] || text.ja || text.zh || text.en || ''
  }
  return ''
}

const defaultGetLocalizedArray = (array: any) => {
  if (Array.isArray(array)) {
    return array
  }
  if (typeof array === 'object' && array !== null) {
    return array[currentLanguage] || array.ja || array.zh || array.en || []
  }
  return []
}

// 使用传入的函数或默认函数
const localizedText = getLocalizedText || defaultGetLocalizedText
const localizedArray = getLocalizedArray || defaultGetLocalizedArray

// 辅助方法
const getProjectArray = () => {
  if (Array.isArray(resumeData.projects)) {
    return resumeData.projects as any[]
  }
  return []
}

const getSkillsObject = () => {
  if (typeof resumeData.skills === 'object' && !Array.isArray(resumeData.skills)) {
    return resumeData.skills as any
  }
  return {}
}

const getContributionsObject = () => {
  if (resumeData.contributions) {
    return resumeData.contributions as any
  }
  return {}
}
</script>

<style scoped>
.resume-content {
  font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo UI', sans-serif;
  color: v-bind('colors.neutral.white'); /* 改为白色文字 */
  line-height: 1.6;
}

.info-section {
  margin-bottom: 20px;
  border-bottom: 1px solid v-bind('colors.rgba.orange[30]'); /* 改为橙色边框 */
  padding-bottom: 15px;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-weight: bold;
  color: v-bind('colors.accent.orange'); /* 改为橙色标题 */
  font-size: 16px;
}

.title-icon {
  margin-right: 8px;
  font-size: 18px;
}

.title-text {
  font-size: 16px;
}

.info-content {
  padding-left: 26px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-label {
  font-weight: 600;
  color: v-bind('colors.accent.lightPurple'); /* 改为浅紫标签 */
  min-width: 100px;
  margin-right: 8px;
}

.info-value {
  color: v-bind('colors.neutral.white'); /* 改为白色值 */
  flex: 1;
}

.coord-item {
  display: flex;
  margin: 4px 0;
  font-size: 12px;
  color: v-bind('colors.accent.orange');
  opacity: 0.8;
}

.coord-label {
  font-weight: 500;
  min-width: 50px;
  margin-right: 6px;
}

.coord-value {
  font-family: 'Courier New', monospace;
  font-size: 11px;
}

.activity-list,
.skill-list,
.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item,
.skill-item,
.project-item {
  background: v-bind('colors.rgba.orange[10]'); /* 改为橙色半透明背景 */
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid v-bind('colors.accent.orange');
  font-size: 14px;
  color: v-bind('colors.neutral.white'); /* 改为白色文字 */
}

.activity-item {
  border-left-color: v-bind('colors.primary.wineRed');
  background: v-bind('colors.rgba.wineRed[20]'); /* 酒红半透明背景 */
}

.skill-item {
  border-left-color: v-bind('colors.accent.orange');
  background: v-bind('colors.rgba.orange[10]'); /* 橙色半透明背景 */
}

.project-item {
  border-left-color: v-bind('colors.accent.lightPurple');
  background: v-bind('colors.rgba.lightPurple[50]'); /* 浅紫半透明背景 */
}

/* 工作经历样式 */
.work-experience {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.work-role,
.work-department {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.role-label,
.dept-label {
  font-weight: 600;
  color: v-bind('colors.accent.lightPurple');
  min-width: 80px;
  margin-right: 8px;
}

.role-value,
.dept-value {
  color: v-bind('colors.neutral.white');
  flex: 1;
}

/* 子章节标题 */
.subsection-title {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
  color: v-bind('colors.accent.orange');
  font-size: 14px;
}

.subsection-icon {
  margin-right: 6px;
  font-size: 16px;
}

.subsection-text {
  font-size: 14px;
}

/* 职责和成就列表 */
.responsibility-list,
.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.responsibility-item,
.achievement-item {
  background: v-bind('colors.rgba.orange[10]');
  padding: 6px 10px;
  border-radius: 4px;
  border-left: 2px solid v-bind('colors.accent.orange');
  font-size: 13px;
  color: v-bind('colors.neutral.white');
}

.responsibility-item {
  border-left-color: v-bind('colors.primary.deepBlue');
  background: v-bind('colors.rgba.deepBlue[20]');
}

.achievement-item {
  border-left-color: v-bind('colors.primary.wineRed');
  background: v-bind('colors.rgba.wineRed[20]');
}

/* 项目详情卡片 */
.project-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-card {
  background: v-bind('colors.rgba.deepBlue[20]');
  border: 1px solid v-bind('colors.rgba.orange[30]');
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid v-bind('colors.rgba.orange[20]');
}

.project-name {
  font-weight: 600;
  color: v-bind('colors.accent.orange');
  font-size: 16px;
}

.project-period {
  color: v-bind('colors.accent.lightPurple');
  font-size: 13px;
  font-weight: 500;
}

.project-role,
.project-description,
.project-technologies {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.role-label,
.desc-label,
.tech-label {
  font-weight: 600;
  color: v-bind('colors.accent.lightPurple');
  min-width: 80px;
  margin-right: 8px;
}

.role-value,
.desc-value,
.tech-value {
  color: v-bind('colors.neutral.white');
  flex: 1;
}

.project-achievements {
  margin-top: 12px;
}

.achievement-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  color: v-bind('colors.accent.orange');
  font-size: 14px;
}

.achievement-icon {
  margin-right: 6px;
  font-size: 16px;
}

.achievement-text {
  font-size: 14px;
}

/* 技能分类 */
.skills-categories {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.skill-category {
  background: v-bind('colors.rgba.deepBlue[20]');
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid v-bind('colors.accent.orange');
}

.category-title {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
  color: v-bind('colors.accent.orange');
  font-size: 14px;
}

.category-icon {
  margin-right: 6px;
  font-size: 16px;
}

.category-text {
  font-size: 14px;
}

/* 贡献部分 */
.contributions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.contribution-section {
  background: v-bind('colors.rgba.deepBlue[20]');
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid v-bind('colors.accent.lightPurple');
}

.contribution-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contribution-item {
  background: v-bind('colors.rgba.lightPurple[20]');
  padding: 6px 10px;
  border-radius: 4px;
  border-left: 2px solid v-bind('colors.accent.lightPurple');
  font-size: 13px;
  color: v-bind('colors.neutral.white');
}

/* 求职目标样式 */
.career-goals {
  background: v-bind('colors.rgba.deepBlue[20]');
  border: 1px solid v-bind('colors.rgba.deepBlue[40]');
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
}

.goal-item {
  display: flex;
  margin: 8px 0;
  align-items: flex-start;
}

.goal-label {
  font-weight: 600;
  color: v-bind('colors.accent.orange');
  min-width: 100px;
  margin-right: 8px;
}

.goal-value {
  color: v-bind('colors.neutral.white');
  flex: 1;
  line-height: 1.4;
  font-weight: 500;
}

/* 个人优势样式 */
.personal-strengths {
  background: v-bind('colors.rgba.orange[20]');
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
}

.strength-item {
  display: flex;
  margin: 8px 0;
  align-items: flex-start;
}

.strength-label {
  font-weight: 600;
  color: v-bind('colors.accent.orange');
  min-width: 100px;
  margin-right: 8px;
}

.strength-value {
  color: v-bind('colors.neutral.white');
  flex: 1;
  line-height: 1.4;
}

.abilities-section {
  margin-top: 16px;
}

.ability-list {
  margin-top: 8px;
}

.ability-item {
  background: v-bind('colors.rgba.deepBlue[20]');
  border-left: 3px solid v-bind('colors.primary.deepBlue');
  padding: 8px 12px;
  margin: 6px 0;
  border-radius: 4px;
  font-size: 0.9em;
  line-height: 1.4;
}

/* 学习项目样式 */
.learning-projects {
  margin: 12px 0;
}

.learning-project-card {
  background: v-bind('colors.rgba.lightPurple[20]');
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
  border: 1px solid v-bind('colors.rgba.lightPurple[50]');
}

.project-description {
  margin: 12px 0;
  display: flex;
  align-items: flex-start;
}

.desc-label {
  font-weight: 600;
  color: v-bind('colors.accent.lightPurple');
  min-width: 100px;
  margin-right: 8px;
}

.desc-value {
  color: v-bind('colors.neutral.white');
  flex: 1;
  line-height: 1.4;
}

.project-link {
  margin: 12px 0;
  display: flex;
  align-items: flex-start;
}

.link-label {
  font-weight: 600;
  color: v-bind('colors.accent.lightPurple');
  min-width: 100px;
  margin-right: 8px;
}

.link-value {
  color: v-bind('colors.accent.orange');
  text-decoration: none;
  flex: 1;
  line-height: 1.4;
  word-break: break-all;
}

.link-value:hover {
  text-decoration: underline;
  color: v-bind('colors.primary.deepBlue');
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-content {
    padding-left: 20px;
  }

  .info-label {
    min-width: 80px;
    font-size: 13px;
  }

  .info-value {
    font-size: 13px;
  }

  .activity-item,
  .skill-item,
  .project-item {
    font-size: 13px;
    padding: 6px 10px;
  }
}
</style>
