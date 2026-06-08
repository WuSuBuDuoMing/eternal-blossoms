# 永恒花海 · 花海记忆

## ETERNAL BLOSSOMS -- HUA HAI JI YI

一个基于 Three.js 的沉浸式 3D 照片卡片画廊。用粒子和光为你编织永恒的花海记忆。

---

## 技术架构

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 前端 | HTML + CSS + JavaScript + Three.js (CDN) |
| 数据 | JSON 文件 + REST API |
| 粒子 | Canvas 2D |
| 3D | Three.js + WebGL |
| 纹理 | CanvasTexture |

## 目录结构

```
02-Eternal-Blossoms/
├── package.json          # 项目配置
├── server.js             # Express 服务端入口
├── README.md             # 项目说明
├── routes/
│   └── api.js            # API 路由（/api/cards）
├── data/
│   └── cards.json        # 24 张预置卡片数据
└── public/
    ├── index.html        # 主页面
    ├── css/
    │   └── style.css     # 全局样式
    └── js/
        ├── app.js        # 主入口（初始化 + 渲染循环）
        ├── scene.js      # Three.js 3D 场景管理
        ├── particles.js  # Canvas 2D 粒子系统
        ├── layouts.js    # 6 种布局模式算法
        └── ui.js         # UI 交互控制
```

## 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 启动服务
npm start

# 3. 打开浏览器
http://localhost:3000
```

## 功能特性

### 粒子系统
- 70 个粉色爱心粒子 + 50 个金色光斑粒子
- 持续飘落、摇摆、旋转、渐隐动画
- Constant Glow 模式增强发光效果

### 六种 3D 布局模式
通过滚动平滑切换，每种模式都有独特的数学曲线：

1. **ARRIVAL (晨曦初临 / 0%)** -- 卡片从远处飞入，在空间中散开
2. **FAN (卷帘展开 / 20%)** -- 手风琴扇形折叠
3. **GATHER (同心汇聚 / 35%)** -- Fibonacci 球面分布
4. **GRID (网格呼吸 / 50%)** -- Bernoulli 双纽线(无限形)
5. **SPIRAL (螺旋花涡 / 70%)** -- 三圈螺旋涡流
6. **DEPART (永恒归宿 / 92%)** -- 心形参数曲线环绕

### 交互方式
- 滚轮 -- 控制场景切换
- 鼠标拖拽 -- 旋转视角
- 双击卡片 -- 弹出详情弹窗
- 触摸屏 -- 滑动切换 + 双指缩放
- 键盘方向键 -- 前进/后退
- ESC -- 关闭弹窗

### UI 元素
- 左上角: WXY + ETERNAL BLOSSOMS -- HUA HAI JI YI
- 右上角: 当前阶段名(中英文) + 进度百分比
- 顶部: 渐变色滚动进度条
- 底部: 操作提示文字
- 右下角: CONSTANT GLOW 开关
- 加载画面 + 进度条
- 浪漫诗句在场景切换时浮现

### CanvasTexture
使用 Canvas 2D 将卡片信息渲染为 Three.js 纹理，包含圆角边框、emoji、中英文标题、描述文字。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/cards | 获取所有卡片 |
| GET | /api/cards/:id | 获取单张卡片 |

### 响应格式

```json
{
  "success": true,
  "count": 24,
  "data": [
    {
      "id": 1,
      "title": "安静浅笑",
      "titleEn": "QUIET SMILE",
      "desc": "你在餐桌前安静浅笑的那一刻，时间仿佛静止成了永恒。",
      "emoji": "😊",
      "gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "color": "#667eea"
    }
  ]
}
```

## 自定义配置

修改 `data/cards.json` 可以自定义卡片内容。每张卡片需要以下字段：

- `id` -- 唯一标识
- `title` -- 中文标题
- `titleEn` -- 英文标题
- `desc` -- 诗意描述
- `emoji` -- 表情图标
- `gradient` -- CSS 渐变值
- `color` -- 主色调（十六进制）

## 浏览器兼容

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- 需要 WebGL 支持

## License

MIT
