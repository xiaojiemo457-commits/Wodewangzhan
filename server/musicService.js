// 音乐日记服务 - 音乐 CRUD 与种子数据
// 文件存储：server/data/music.json

import { readJSON, writeJSON, generateId } from './dataService.js';

const MUSIC_FILE = new URL('./data/music.json', import.meta.url);

// 获取全部音乐日记
export async function getAllMusic() {
  let music = await readJSON(MUSIC_FILE);
  if (!music.length) {
    music = await seedMusic();
  }
  return music;
}

// 创建音乐日记
export async function createMusic(data) {
  const music = await getAllMusic();
  const entry = {
    id: generateId('music'),
    title: (data.title || '').trim(),
    artist: (data.artist || '').trim(),
    cover: data.cover || '',
    url: data.url || '',
    diary: (data.diary || '').trim(),
    date: data.date || new Date().toISOString().slice(0, 10),
  };
  music.push(entry);
  await writeJSON(MUSIC_FILE, music);
  return entry;
}

// 更新音乐日记
export async function updateMusic(id, updates) {
  const music = await getAllMusic();
  const idx = music.findIndex(m => String(m.id) === String(id));
  if (idx === -1) throw new Error('音乐不存在');
  const allowed = ['title', 'artist', 'cover', 'url', 'diary', 'date'];
  const entry = { ...music[idx] };
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      entry[key] = typeof updates[key] === 'string' ? updates[key].trim() : updates[key];
    }
  }
  music[idx] = entry;
  await writeJSON(MUSIC_FILE, music);
  return entry;
}

// 删除音乐日记
export async function deleteMusic(id) {
  const music = await getAllMusic();
  const idx = music.findIndex(m => String(m.id) === String(id));
  if (idx === -1) throw new Error('音乐不存在');
  const [removed] = music.splice(idx, 1);
  await writeJSON(MUSIC_FILE, music);
  return removed;
}

// 种子数据：18 条音乐日记
async function seedMusic() {
  const seeds = [
    { title: '晴天', artist: '周杰伦', diary: '高中的夏天，骑车放学路上单曲循环。耳机里是《晴天》，眼前是被夕阳染金的操场。那时候以为喜欢一个人就是永远，现在才懂，永远的是那首歌。' },
    { title: '南山南', artist: '马頔', diary: '大学宿舍的深夜，舍友都睡了，我戴着耳机听这首歌。窗外的路灯一明一灭，像是和着旋律。那一年我失恋了，这首歌陪我熬过了很多个夜晚。' },
    { title: '海阔天空', artist: 'Beyond', diary: '毕业那年，和朋友在 KTV 嘶吼这首歌。我们都不知道未来在哪，但那一刻觉得，只要不放弃，就一定有海阔天空。十年过去，我们各奔东西，但这首歌一响，热血依旧。' },
    { title: '夜空中最亮的星', artist: '逃跑计划', diary: '加班到深夜，一个人走在空荡的街上，抬头看见一颗星。耳机里正好放这首歌，忽然眼眶热了。迷茫的时候，总需要一颗"星"指引方向。' },
    { title: '后来', artist: '刘若英', diary: '初恋结婚那天，我没有去。在房间里听了一整晚的《后来》。有些人是用来教会你爱的，然后转身离开。"后来，我总算学会了如何去爱"，可惜你已经不在。' },
    { title: '稻香', artist: '周杰伦', diary: '工作最累的那年，每天通勤都听这首歌。"功成名就不是目的，让自己快乐快乐这才叫做意义"。简单的词，却把我从焦虑里拉了回来。' },
    { title: '岁月神偷', artist: '金玟岐', diary: '爷爷去世那天，回到家放了这首歌。时间真的是个神偷，偷走了我们以为会一直在的人。"能够握紧的就别放了，能够拥抱的就别拉扯"。' },
    { title: '理想三旬', artist: '陈鸿宇', diary: '二十五岁那年，理想似乎远去。这首歌里唱"就老去吧，孤独别醒来"，听哭了。后来明白，三旬不是结束，是另一种开始。理想不急，慢慢来。' },
    { title: '平凡之路', artist: '朴树', diary: '辞职旅行的那段日子，在大巴上听这首歌。窗外是无尽的公路，心里是空荡的自由。"我曾经跨过山和大海，也穿过人山人海"，最后发现，平凡才是答案。' },
    { title: '成都', artist: '赵雷', diary: '在成都的小酒馆听人弹这首歌，玉林路的尽头真的有故事。那座城市慢得让人想留下，"和我在成都的街头走一走，直到所有的灯都熄灭了也不停留"。' },
    { title: '漂洋过海来看你', artist: '李宗盛', diary: '异地恋时，坐了十二个小时的火车去看她。车上听这首歌，每一句都像在说自己。"为你我用了半年的积蓄，漂洋过海地来看你"。后来我们没在一起，但那趟车我记了一辈子。' },
    { title: '山丘', artist: '李宗盛', diary: '三十岁生日那天听的。"也许我们从未成熟，还没能晓得，就快要老了"。李宗盛把中年人的无奈写得那么透。越过山丘，才发现无人等候，但还是要继续走。' },
    { title: '光年之外', artist: '邓紫棋', diary: '看《太空旅客》时听到的，那种在浩瀚宇宙中相遇的孤独与浪漫。"我没想到为了你我能疯狂到，山崩海啸没有你根本不想逃"。爱让人勇敢，也让人脆弱。' },
    { title: '遇见', artist: '孙燕姿', diary: '在一家旧书店翻到一张唱片，放出来就是这首歌。"我遇见谁会有怎样的对白，我等的人他在多远的未来"。有些遇见是命中注定，只是时间未到。' },
    { title: '蓝莲花', artist: '许巍', diary: '骑行川藏线时，下坡的风里吼着这首歌。"没有什么能够阻挡，你对自由的向往"。那一路的雪山、经幡、星空，和这首歌一起，成了我生命里最自由的记忆。' },
    { title: '一生所爱', artist: '卢冠廷', diary: '重看《大话西游》结尾，卢冠廷的声音一出来就泪崩。"苦海翻起爱恨，在世间难逃避命运"。长大后才懂，至尊宝戴上金箍的那一刻，是放弃了多少。' },
    { title: '起风了', artist: '买辣椒也用券', diary: '搬家那天，收拾旧物时找到高中的笔记本，上面抄着这首歌的歌词。"这一路上走走停停，顺着少年漂流的痕迹"。起风了，我们都要好好生活。' },
    { title: '送别', artist: '朴树', diary: '送别大学室友出国，机场里他转身那一刻，脑子里自动播放这首歌。"长亭外古道边，芳草碧连天"。人生就是一场场送别，但有些情谊，送不走。' },
  ];

  const music = seeds.map((s, i) => ({
    id: `music-${i + 1}`,
    title: s.title,
    artist: s.artist,
    cover: `https://picsum.photos/seed/music${i + 1}/300/300`,
    url: '',
    diary: s.diary,
    date: new Date(Date.now() - (seeds.length - i) * 5 * 86400000).toISOString().slice(0, 10),
  }));

  await writeJSON(MUSIC_FILE, music);
  console.log(`[musicService] 已生成 ${music.length} 条种子音乐日记`);
  return music;
}

export default { getAllMusic, createMusic, deleteMusic };
