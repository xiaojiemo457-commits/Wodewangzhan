// 工具服务 - 工具 CRUD 与种子数据
// 文件存储：server/data/tools.json

import { readJSON, writeJSON, generateId } from './dataService.js';

const TOOLS_FILE = new URL('./data/tools.json', import.meta.url);

// 获取全部工具
export async function getAllTools() {
  let tools = await readJSON(TOOLS_FILE);
  if (!tools.length) {
    tools = await seedTools();
  }
  return tools;
}

// 创建工具
export async function createTool(data) {
  const tools = await getAllTools();
  const now = new Date().toISOString();
  const tool = {
    id: generateId('tool'),
    name: (data.name || '').trim(),
    description: (data.description || '').trim(),
    url: data.url || '',
    category: data.category || '其它',
    icon: data.icon || '🛠️',
    clicks: Number(data.clicks) || 0,
    created_at: data.created_at || now,
  };
  tools.push(tool);
  await writeJSON(TOOLS_FILE, tools);
  return tool;
}

// 更新工具
export async function updateTool(id, updates) {
  const tools = await getAllTools();
  const idx = tools.findIndex(t => String(t.id) === String(id));
  if (idx === -1) throw new Error('工具不存在');
  tools[idx] = { ...tools[idx], ...updates, id: tools[idx].id };
  await writeJSON(TOOLS_FILE, tools);
  return tools[idx];
}

// 删除工具
export async function deleteTool(id) {
  const tools = await getAllTools();
  const idx = tools.findIndex(t => String(t.id) === String(id));
  if (idx === -1) throw new Error('工具不存在');
  const [removed] = tools.splice(idx, 1);
  await writeJSON(TOOLS_FILE, tools);
  return removed;
}

// 增加点击数
export async function incrementClicks(id) {
  const tools = await getAllTools();
  const idx = tools.findIndex(t => String(t.id) === String(id));
  if (idx === -1) throw new Error('工具不存在');
  tools[idx].clicks = (Number(tools[idx].clicks) || 0) + 1;
  await writeJSON(TOOLS_FILE, tools);
  return tools[idx];
}

// 种子数据：25 个实用工具
async function seedTools() {
  const now = new Date().toISOString();
  const seeds = [
    { name: 'VS Code', description: '微软出品的强大代码编辑器，插件生态丰富。', url: 'https://code.visualstudio.com/', category: '开发工具', icon: '💻' },
    { name: 'GitHub', description: '全球最大的代码托管平台，版本控制与协作必备。', url: 'https://github.com/', category: '开发工具', icon: '🐙' },
    { name: 'Vite', description: '下一代前端构建工具，极速冷启动与热更新。', url: 'https://vitejs.dev/', category: '开发工具', icon: '⚡' },
    { name: 'ChatGPT', description: 'OpenAI 的对话式 AI，写作、编程、答疑利器。', url: 'https://chat.openai.com/', category: 'AI 工具', icon: '🤖' },
    { name: 'Claude', description: 'Anthropic 出品的 AI 助手，擅长长文本与代码。', url: 'https://claude.ai/', category: 'AI 工具', icon: '🧠' },
    { name: 'Notion', description: '一站式笔记、文档与数据库管理工具。', url: 'https://www.notion.so/', category: '效率工具', icon: '📝' },
    { name: 'Obsidian', description: '基于本地 Markdown 的知识管理工具，支持双向链接。', url: 'https://obsidian.md/', category: '效率工具', icon: '🗂️' },
    { name: 'Figma', description: '协作式界面设计工具，矢量编辑与原型一体。', url: 'https://www.figma.com/', category: '设计工具', icon: '🎨' },
    { name: 'Excalidraw', description: '手绘风格的白板绘图工具，适合草图与流程图。', url: 'https://excalidraw.com/', category: '设计工具', icon: '✏️' },
    { name: 'Postman', description: 'API 调试与测试工具，支持自动化测试。', url: 'https://www.postman.com/', category: '开发工具', icon: '📮' },
    { name: 'Homebrew', description: 'macOS 上的包管理器，一键安装各类软件。', url: 'https://brew.sh/', category: '开发工具', icon: '🍺' },
    { name: 'Docker', description: '容器化部署工具，环境一致性与隔离。', url: 'https://www.docker.com/', category: '开发工具', icon: '🐳' },
    { name: 'Raycast', description: 'macOS 上的可扩展启动器，替代 Spotlight。', url: 'https://www.raycast.com/', category: '效率工具', icon: '🚀' },
    { name: 'RectNote', description: '番茄工作法计时与任务管理，专注力提升。', url: 'https://pomofocus.io/', category: '效率工具', icon: '🍅' },
    { name: 'Trello', description: '看板式任务管理工具，可视化项目进度。', url: 'https://trello.com/', category: '效率工具', icon: '📋' },
    { name: '滴答清单', description: '跨平台的待办事项与日程管理应用。', url: 'https://dida365.com/', category: '效率工具', icon: '✅' },
    { name: 'Snipaste', description: '截图与贴图工具，提高屏幕信息处理效率。', url: 'https://www.snipaste.com/', category: '效率工具', icon: '📸' },
    { name: 'Everything', description: 'Windows 上极速的文件搜索工具，秒级定位。', url: 'https://www.voidtools.com/', category: '效率工具', icon: '🔍' },
    { name: 'Typora', description: '所见即所得的 Markdown 编辑器，写作利器。', url: 'https://typora.io/', category: '效率工具', icon: '📄' },
    { name: 'StackEdit', description: '在线 Markdown 编辑器，支持同步与导出。', url: 'https://stackedit.io/', category: '效率工具', icon: '📃' },
    { name: 'Carbon', description: '生成精美的代码片段图片，分享代码更优雅。', url: 'https://carbon.now.sh/', category: '设计工具', icon: '🖼️' },
    { name: 'TinyPNG', description: '智能压缩 PNG/JPEG 图片，体积更小画质不减。', url: 'https://tinypng.com/', category: '设计工具', icon: '🖼️' },
    { name: 'removebg', description: '一键去除图片背景的 AI 工具。', url: 'https://www.remove.bg/', category: 'AI 工具', icon: '✂️' },
    { name: 'DeepL', description: '更准确的机器翻译，适合长文与专业内容。', url: 'https://www.deepl.com/', category: 'AI 工具', icon: '🌐' },
    { name: 'Regex101', description: '正则表达式在线测试与调试工具，附解释。', url: 'https://regex101.com/', category: '开发工具', icon: '🔎' },
    { name: '粥.Pro', description: 'GPT Pro账号专营中转站，首创"用户可见号池"和"重置返额机制"。', url: 'https://congee.pro', category: 'AI 工具', icon: '🍜' },
    { name: 'CUN.AI', description: 'AI工具中转站，提供GPT、Claude套餐，新用户注册送8.8美元。', url: 'https://www.cun.ai/overseas', category: 'AI 工具', icon: '🔮' },
    { name: 'AIHUB', description: 'Token中转站，聚合十几家源头渠道，Codex低至0.03x倍率。', url: 'https://aihub.top', category: 'AI 工具', icon: '🔗' },
    { name: '智谱清言', description: '智谱AI的大模型对话工具，国内AI助手。', url: 'https://chatglm.cn/', category: 'AI 工具', icon: '💬' },
    { name: 'Leonardo AI', description: 'AI图像/视频生成平台，支持Seedance 2.0视频生成，8K画质。', url: 'https://app.leonardo.ai/', category: 'AI 工具', icon: '🎨' },
    { name: 'opencode', description: 'AI编程工具，支持Claude Code和Codex使用的路由接入。', url: 'https://opencode.ai/', category: 'AI 工具', icon: '💻' },
    { name: 'Dify', description: 'AI应用开发平台，用于构建和运营LLM应用。', url: 'https://dify.ai/', category: 'AI 工具', icon: '🧩' },
    { name: 'Cloudflare Worker', description: 'Serverless平台，可用于建立API镜像号池等。', url: 'https://workers.cloudflare.com/', category: '开发工具', icon: '☁️' },
    { name: 'Windsurf', description: 'AI编程辅助工具，Codeium出品，代码生成与补全。', url: 'https://codeium.com/windsurf', category: 'AI 工具', icon: '🌊' },
    { name: 'Grok', description: 'xAI旗下AI对话工具，支持自定义模型。', url: 'https://grok.com/', category: 'AI 工具', icon: '🌀' },
    { name: 'Kimi', description: '月之暗面开发的AI大模型，性能强大。', url: 'https://kimi.ai/', category: 'AI 工具', icon: '🌙' },
    { name: 'Deepseek', description: '国产AI大模型，V4 Pro版本。', url: 'https://deepseek.com/', category: 'AI 工具', icon: '🐋' },
    { name: 'Qoder', description: 'AI编程工具，CN版个人专业版，支持代码生成。', url: 'https://www.qoder.cn/', category: 'AI 工具', icon: '⚡' },
    { name: 'Fiat24', description: '虚拟信用卡服务，可用于AI服务订阅支付。', url: 'https://fiat24.com/', category: '效率工具', icon: '💳' },
    { name: 'Privcy', description: '虚拟美国信用卡生成服务，可绑定Wise美元账户。', url: 'https://privcy.com/', category: '效率工具', icon: '💳' },
    { name: 'Rikkahub', description: 'AI安全服务提供商，为多个AI服务提供商提供免费Business接入。', url: 'https://rikka-ai.com/', category: 'AI 工具', icon: '🛡️' },
  ];

  const tools = seeds.map((s, i) => ({
    id: `tool-${i + 1}`,
    ...s,
    clicks: 10 + Math.floor(Math.random() * 5000),
    created_at: new Date(Date.now() - (seeds.length - i) * 86400000).toISOString(),
  }));

  await writeJSON(TOOLS_FILE, tools);
  console.log(`[toolService] 已生成 ${tools.length} 个种子工具`);
  return tools;
}

export default { getAllTools, createTool, updateTool, deleteTool, incrementClicks };
