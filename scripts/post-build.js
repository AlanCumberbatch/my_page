import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist');
const cesiumSrc = path.join(distPath, 'my_page', 'cesium');
const cesiumDest = path.join(distPath, 'cesium');

// 检查源目录是否存在
if (fs.existsSync(cesiumSrc)) {
  console.log('移动Cesium资源从', cesiumSrc, '到', cesiumDest);

  // 移动cesium目录
  fs.renameSync(cesiumSrc, cesiumDest);

  // 删除空的my_page目录
  const myPageDir = path.join(distPath, 'my_page');
  if (fs.existsSync(myPageDir) && fs.readdirSync(myPageDir).length === 0) {
    fs.rmdirSync(myPageDir);
    console.log('已删除空的my_page目录');
  }

  console.log('Cesium资源已成功移动到正确位置');
} else {
  console.log('未找到Cesium资源目录，跳过移动步骤');
}


