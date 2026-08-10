// 填充 music.json 的 url 字段
// 策略：
// 1. 优先网易云 outer/url
// 2. 网易云失败时回退到 Apple iTunes 预览音频（30秒试听，跨域友好）
// 3. 验证每个 URL 是否返回 audio/* 类型
// 用法: node server/scripts/fillMusicUrls.js

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MUSIC_JSON = path.join(__dirname, '..', 'data', 'music.json');

function httpGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers,
      },
      ...options,
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ body: JSON.parse(data), raw: data, res }); }
        catch { resolve({ body: null, raw: data, res }); }
      });
    }).on('error', reject);
  });
}

// 测试 URL 是否返回音频流
function isAudioUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://music.163.com',
      },
      timeout: 10000,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.destroy();
        resolve(isAudioUrl(res.headers.location));
      } else {
        const ct = res.headers['content-type'] || '';
        resolve(res.statusCode === 200 && /audio|octet-stream/i.test(ct));
      }
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

// 网易云搜索
async function searchNetease(keyword) {
  try {
    const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(keyword)}&type=1&limit=1&offset=0`;
    const { body } = await httpGet(url);
    if (body && body.code === 200 && body.result?.songs?.length > 0) {
      return body.result.songs[0];
    }
  } catch {}
  return null;
}

// Apple iTunes 搜索（回退源，提供 30s 预览）
async function searchITunes(keyword) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&limit=1&entity=song`;
    const { body } = await httpGet(url);
    if (body && body.resultCount > 0 && body.results[0]) {
      return body.results[0];
    }
  } catch {}
  return null;
}

async function main() {
  const list = JSON.parse(fs.readFileSync(MUSIC_JSON, 'utf-8'));
  console.log(`共 ${list.length} 首歌\n`);

  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const keyword = `${m.title} ${m.artist}`;
    process.stdout.write(`[${i + 1}/${list.length}] ${keyword} ... `);

    let url = '';
    let source = '';

    // 源1: 网易云 outer/url
    const song = await searchNetease(keyword);
    if (song) {
      const candidate = `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`;
      const valid = await isAudioUrl(candidate);
      if (valid) {
        url = candidate;
        source = '网易云';
      }
    }

    // 源2: Apple iTunes 回退
    if (!url) {
      const track = await searchITunes(keyword);
      if (track && track.previewUrl) {
        url = track.previewUrl;
        source = 'iTunes预览';
      }
    }

    if (url) {
      m.url = url;
      console.log(`✅ ${source}`);
    } else {
      m.url = '';
      console.log('❌ 未找到可用音源');
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  fs.writeFileSync(MUSIC_JSON, JSON.stringify(list, null, 2), 'utf-8');
  console.log('\n已写入 music.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
