# 步骤 1：初始化项目
1. 创建 Vite + React + TypeScript 项目：
    打开终端并运行以下命令来创建一个 React + TypeScript 项目：
    ```bash
      npm create vite@latest my-app -- --template react-ts
      cd my-app
      yarn
    ```
2. 安装依赖：
    接下来安装 Framer Motion 和 React Router：
    ```bash
      yarn add react-router-dom@6 framer-motion
    ```
    安装 Tailwind CSS
    ```bash
      yarn add -D tailwindcss postcss autoprefixer
    ```
    初始化项目中的 Tailwind CSS
    ```bash
      npx tailwindcss init -p
    ```
3. 配置 Tailwind CSS：
    初始化 Tailwind 配置文件：
    ```bash
      npx tailwindcss init -p
    ```
    这会生成 tailwind.config.js 和 postcss.config.js 文件。
4. 配置 Tailwind 在项目中生效：
    编辑 tailwind.config.js 文件，添加你的项目文件夹路径，以便 Tailwind 可以扫描到你的代码文件：
    ```ts
      /** @type {import('tailwindcss').Config} */
      export default {
        content: [
          "./index.html",
          "./src/**/*.{js,ts,jsx,tsx}",
        ],
        theme: {
          extend: {},
        },
        plugins: [],
      };
    ```
5. 在 CSS 中导入 Tailwind：
    在 src/index.css 中添加以下内容来导入 Tailwind 基本样式：
    ```css
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
    ```

# 步骤 2：添加示例页面（Framer Motion 动画的）
1. Home
    ```ts
      // import React from 'react';
      import { motion } from 'framer-motion';

      const Home = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
          <h1 className="text-2xl font-bold text-center">Home Page</h1>
        </motion.div>
      );

      export default Home;
    ```
2. About
    ```ts
      // import React from 'react';
      import { motion } from 'framer-motion';

      const About = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
          <h1 className="text-2xl font-bold text-center">About Page</h1>
        </motion.div>
      );

      export default About;
    ```
# 步骤 3：添加基本路由

   ```ts
      // 注： 此为 App.tsx 的 demo。 关于 main.ts 并为做任何修改
      // import React, { useState } from 'react'
      import './App.css'
      import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
      import About from './pages/About';
      import Home from  './pages/Home';
      function App() {
        return (
          <>
            <div className="App">
              <Router >
                <div>
                  <nav>
                    <ul id="navigation">
                      <li>
                        <Link to="/">Home</Link>
                      </li>
                      <li>
                      <Link to="/about">About</Link>
                      </li>
                    </ul>
                  </nav>
                </div>

                <Routes >
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                </Routes>
              </Router>
            </div>
          </>
        )git
      }
      export default App
    ```

  此时的 main.ts

    ```ts
      import { StrictMode } from 'react'
      import { createRoot } from 'react-dom/client'
      import './index.css'
      import App from './App.tsx'

      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <App />
        </StrictMode>,
      )
   ```



# 步骤 4：配置 GitHub Pages 部署
1. 安装 gh-pages：
   ```bash
      yarn add gh-pages
   ```
2. 添加发布脚本：
   ```json
      // 在 package.json 中添加
      "predeploy": "npm run build",
      "deploy": "gh-pages -d dist", // dist 是因为使用 vite， 如果打包后的文件名是 build，则写成built
   ```
3. 配置 homepage：
   ```json
     // 在 package.json 中添加
     // alancumberbatch - - - 对应的 github 名字（全部小写字母）
     // test_ts         - - - 对应的仓库名称
    "homepage": "https://alancumberbatch.github.io/test_ts/",
   ```
4. 配置 vit.config.ts
   ```ts
    export default defineConfig({
      ...
      base: '/test_ts/'  // 替换为你的仓库名称
      ...
    })
   ```
# 步骤 5：初始化 Git 仓库并推送到 GitHub

   ```ts
      git remote add <name-of-remote> <url-of-repository>
      [demo]git remote add origin https://github.com/AlanCumberbatch/test_ts

      git push --set-upstream origin master
   ```

# 步骤 6：发布到 GitHub Pages
1. 发布项目：
    ```cmd
      yarn build
      yarn deploy
    ```
2. 访问页面：具体地址去对应仓库的 settings/Pages 中查看



