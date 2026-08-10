// 照片服务 - 照片 CRUD 与种子数据
// 文件存储：server/data/photos.json

import { readJSON, writeJSON, generateId } from './dataService.js';

const PHOTOS_FILE = new URL('./data/photos.json', import.meta.url);

// 获取全部照片
export async function getAllPhotos() {
  let photos = await readJSON(PHOTOS_FILE);
  if (!photos.length) {
    photos = await seedPhotos();
  }
  return photos;
}

// 创建照片
export async function createPhoto(data) {
  const photos = await getAllPhotos();
  const now = new Date().toISOString();
  const photo = {
    id: generateId('photo'),
    title: (data.title || '').trim(),
    url: data.url || '',
    description: (data.description || '').trim(),
    year: Number(data.year) || new Date().getFullYear(),
    created_at: data.created_at || now,
  };
  photos.push(photo);
  await writeJSON(PHOTOS_FILE, photos);
  return photo;
}

// 删除照片
export async function deletePhoto(id) {
  const photos = await getAllPhotos();
  const idx = photos.findIndex(p => String(p.id) === String(id));
  if (idx === -1) throw new Error('照片不存在');
  const [removed] = photos.splice(idx, 1);
  await writeJSON(PHOTOS_FILE, photos);
  return removed;
}

// 种子数据：36 张照片（使用 picsum.photos）
async function seedPhotos() {
  const titles = [
    '清晨的湖面', '小巷深处', '雨后街道', '山顶云海', '海边日落', '城市夜色',
    '老街烟火', '樱花树下', '雪后山林', '咖啡馆一角', '书店的光', '地铁众生',
    '田园晨雾', '码头渔船', '教堂彩窗', '市集喧嚣', '秋日银杏', '冬日暖阳',
    '林间小径', '河畔黄昏', '屋顶星空', '街角花店', '旧物市集', '海浪拍岸',
    '山间溪流', '古镇晨曦', '霓虹街头', '田野麦浪', '湖心孤舟', '窗外风景',
    '桥梁夜景', '公园长椅', '沙漠驼影', '海岛灯塔', '雪山倒影', '落叶满地',
  ];
  const years = [2021, 2022, 2023, 2024, 2025];
  const photos = titles.map((title, i) => {
    const seed = 100 + i;
    return {
      id: `photo-${i + 1}`,
      title,
      url: `https://picsum.photos/seed/${seed}/1200/800`,
      description: `${title}——记录生活中的一个瞬间，光影流转间，时间被定格。`,
      year: years[i % years.length],
      created_at: new Date(Date.now() - (titles.length - i) * 86400000).toISOString(),
    };
  });

  await writeJSON(PHOTOS_FILE, photos);
  console.log(`[photoService] 已生成 ${photos.length} 张种子照片`);
  return photos;
}

export default { getAllPhotos, createPhoto, deletePhoto };
