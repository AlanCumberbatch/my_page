// 全局颜色配置
export const colors = {
  // 主要颜色
  primary: {
    deepBlue: '#0f3460',      // 深蓝
    darkBlue: '#1a1a2e',      // 深蓝变体
    wineRed: '#8b0000',       // 酒红
  },

  // 点缀颜色
  accent: {
    orange: '#ff6b35',        // 橙色
    lightPurple: '#6a4c93',   // 浅紫
  },

  // 中性颜色
  neutral: {
    white: '#f8f9fa',         // 浅色文字
    lightGray: '#e0e0e0',     // 浅灰边框
    darkGray: '#16213e',      // 深灰边框
  },

  // 透明度变体
  rgba: {
    deepBlue: {
      20: 'rgba(15, 52, 96, 0.2)',
      40: 'rgba(15, 52, 96, 0.4)',
      95: 'rgba(15, 52, 96, 0.95)',
    },
    darkBlue: {
      95: 'rgba(26, 26, 46, 0.95)',
    },
    wineRed: {
      20: 'rgba(139, 0, 0, 0.2)',
    },
    lightPurple: {
      20: 'rgba(106, 76, 147, 0.2)',
      50: 'rgba(106, 76, 147, 0.5)',
    },
    orange: {
      10: 'rgba(255, 107, 53, 0.1)',
      20: 'rgba(255, 107, 53, 0.2)',
      30: 'rgba(255, 107, 53, 0.3)',
      50: 'rgba(255, 107, 53, 0.5)',
      70: 'rgba(255, 107, 53, 0.7)',
    },
  },

  // 渐变
  gradients: {
    popupBackground: 'linear-gradient(135deg, rgba(15, 52, 96, 0.95), rgba(26, 26, 46, 0.95))',
    headerBackground: 'linear-gradient(90deg, rgba(139, 0, 0, 0.2), rgba(15, 52, 96, 0.2))',
  },

  // Cesium 标记点颜色
  cesium: {
    university: '#ff6b35',    // 橙色 - 大学
    company1: '#0f3460',      // 深蓝 - 公司1
    company2: '#8b0000',      // 酒红 - 公司2
    company3: '#6a4c93',      // 浅紫 - 公司3
  }
}

// 颜色使用说明
export const colorUsage = {
  // 文字颜色
  text: {
    primary: colors.primary.darkBlue,      // 主要文字
    secondary: colors.primary.deepBlue,    // 次要文字
    accent: colors.accent.lightPurple,     // 强调文字
    light: colors.neutral.white,           // 浅色文字
  },

  // 背景颜色
  background: {
    popup: colors.gradients.popupBackground,
    header: colors.gradients.headerBackground,
    card: colors.neutral.white,
  },

  // 边框颜色
  border: {
    primary: colors.primary.deepBlue,
    secondary: colors.neutral.darkGray,
    accent: colors.accent.orange,
  },

  // 交互颜色
  interactive: {
    hover: colors.accent.orange,
    active: colors.accent.lightPurple,
    disabled: colors.neutral.lightGray,
  }
}

// 导出默认配置
export default colors
