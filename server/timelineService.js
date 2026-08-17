import { readJSON, writeJSON, generateId } from './dataService.js';

const TIMELINE_FILE = new URL('./data/timeline.json', import.meta.url);

export async function getAllTimeline() {
  let timeline = await readJSON(TIMELINE_FILE);
  if (!timeline.length) {
    timeline = await seedTimeline();
  }
  return timeline.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

export async function createTimeline(data) {
  const timeline = await readJSON(TIMELINE_FILE);
  const entry = {
    id: generateId('timeline'),
    age: Number(data.age) || 0,
    year: (data.year || '').trim(),
    title: (data.title || '').trim(),
    description: (data.description || '').trim(),
    icon: data.icon || '📍',
    color: data.color || '#667eea',
    sort_order: Number(data.sort_order) || timeline.length + 1,
  };
  timeline.push(entry);
  await writeJSON(TIMELINE_FILE, timeline);
  return entry;
}

export async function updateTimeline(id, updates) {
  const timeline = await readJSON(TIMELINE_FILE);
  const idx = timeline.findIndex(t => String(t.id) === String(id));
  if (idx === -1) throw new Error('时间轴事件不存在');
  const allowed = ['age', 'year', 'title', 'description', 'icon', 'color', 'sort_order'];
  const entry = { ...timeline[idx] };
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      entry[key] = key === 'age' || key === 'sort_order'
        ? Number(updates[key])
        : (typeof updates[key] === 'string' ? updates[key].trim() : updates[key]);
    }
  }
  timeline[idx] = entry;
  await writeJSON(TIMELINE_FILE, timeline);
  return entry;
}

export async function deleteTimeline(id) {
  const timeline = await readJSON(TIMELINE_FILE);
  const idx = timeline.findIndex(t => String(t.id) === String(id));
  if (idx === -1) throw new Error('时间轴事件不存在');
  const [removed] = timeline.splice(idx, 1);
  await writeJSON(TIMELINE_FILE, timeline);
  return removed;
}

async function seedTimeline() {
  const seeds = [
    { age: 4, year: '幼儿园', title: '第一次上学', description: '第一天哭着不想去，第二天就和小朋友玩成一片了。', icon: '🎒', color: '#f093fb', sort_order: 1 },
    { age: 5, year: '幼儿园', title: '学会骑自行车', description: '摔了无数次，终于在一个下午掌握了平衡，从此解锁了自由的快乐。', icon: '🚲', color: '#f5576c', sort_order: 2 },
    { age: 6, year: '小学一年级', title: '成为少先队员', description: '戴着红领巾在国旗下宣誓，那时候觉得这是世界上最光荣的事。', icon: '🎖️', color: '#4facfe', sort_order: 3 },
    { age: 7, year: '小学二年级', title: '第一次考试得满分', description: '数学考了100分，爸妈奖励了我一个梦寐以求的变形金刚。', icon: '💯', color: '#43e97b', sort_order: 4 },
    { age: 8, year: '小学三年级', title: '养了一只小猫', description: '它叫"咪咪"，陪伴了我整整六年，是童年最好的朋友。', icon: '🐱', color: '#fa709a', sort_order: 5 },
    { age: 9, year: '小学四年级', title: '第一次学游泳', description: '在泳池里呛了无数水，最终学会了自由泳，感受到水的温柔。', icon: '🏊', color: '#30cfd0', sort_order: 6 },
    { age: 10, year: '小学五年级', title: '担任班长', description: '第一次当"领导"，学着帮老师分担事务，也学会了责任。', icon: '👔', color: '#a18cd1', sort_order: 7 },
    { age: 12, year: '初中一年级', title: '开始住校', description: '第一次离开家独立生活，和室友们度过了无数个卧谈会的夜晚。', icon: '🏠', color: '#fbc2eb', sort_order: 8 },
    { age: 13, year: '初中二年级', title: '迷上篮球', description: '下课就冲向操场，从投篮都不会到能打半场，篮球教会我坚持。', icon: '🏀', color: '#ff9a9e', sort_order: 9 },
    { age: 15, year: '高中一年级', title: '文理分科', description: '纠结了很久最终选择了理科，从此和公式、试卷成为亲密战友。', icon: '📚', color: '#a1c4fd', sort_order: 10 },
    { age: 17, year: '高三', title: '高考冲刺', description: '那段时间每天只睡五小时，桌上的试卷堆成小山，只为了心中的那个目标。', icon: '🔥', color: '#ffecd2', sort_order: 11 },
    { age: 18, year: '2021', title: '考入桂林的大学', description: '漓江畔的山水，象鼻山的夕阳，梦想开始的地方。离开家乡，独自在山水间开启新篇章。', icon: '🏔️', color: '#84fab0', sort_order: 12 },
    { age: 19, year: '2022', title: '加入社团，自学编程', description: '大学加入了技术社团，第一次接触代码，从此一发不可收拾。熬夜写的第一个Hello World，现在想起来还会笑。', icon: '💻', color: '#8fd3f4', sort_order: 13 },
    { age: 20, year: '2023', title: '第一次独立开发项目', description: '和几个朋友一起做了一个校园小程序，从需求到上线全流程参与，真正体会到了创造的快乐。', icon: '🚀', color: '#c1dfc4', sort_order: 14 },
    { age: 21, year: '2024', title: '本科毕业', description: '穿上学士服，拍了无数张合照。四年一晃而过，那些熬夜写代码的日子、和朋友在漓江边散步的傍晚，都成了最珍贵的回忆。', icon: '🎓', color: '#d4fc79', sort_order: 15 },
    { age: 22, year: '2025', title: '独自旅行一年', description: '毕业后没有急着找工作，背着背包走了大半个中国。从云南的苍山洱海到新疆的喀纳斯，一个人在路上的这一年，想清楚了很多事情。', icon: '🎒', color: '#fddb92', sort_order: 16 },
    { age: 23, year: '2026', title: '开始做自己的网站', description: '旅行归来，决定把生活的点滴记录下来，于是有了这个小小的个人空间。用心记录，慢慢生活。', icon: '🌱', color: '#e0c3fc', sort_order: 17 },
  ];

  const timeline = seeds.map((s, i) => ({
    id: `timeline-${i + 1}`,
    age: s.age,
    year: s.year,
    title: s.title,
    description: s.description,
    icon: s.icon,
    color: s.color,
    sort_order: s.sort_order,
  }));

  await writeJSON(TIMELINE_FILE, timeline);
  console.log(`[timelineService] 已生成 ${timeline.length} 条种子时间轴事件`);
  return timeline;
}

export default { getAllTimeline, createTimeline, updateTimeline, deleteTimeline };