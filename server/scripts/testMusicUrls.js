// 测试 music.json 里每个 URL 的可用性
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MUSIC_JSON = path.join(__dirname, '..', 'data', 'music.json');

function testUrl(rawUrl) {
  return new Promise((resolve) => {
    const lib = rawUrl.startsWith('https') ? https : http;
    const req = lib.get(rawUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://music.163.com',
      },
      timeout: 10000,
    }, (res) => {
      // 跟随重定向
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.destroy();
        resolve(testUrl(res.headers.location));
      } else {
        const ct = res.headers['content-type'] || '';
        const cl = res.headers['content-length'] || '?';
        resolve({
          status: res.statusCode,
          contentType: ct,
          isAudio: /audio|octet-stream/i.test(ct),
          isHtml: /html/i.test(ct),
          contentLength: cl,
        });
      }
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

async function main() {
  const list = JSON.parse(fs.readFileSync(MUSIC_JSON, 'utf-8'));
  console.log('测试所有歌曲 URL 可用性:\n');

  let fail = 0;
  for (const m of list) {
    if (!m.url) {
      console.log(`❌ ${m.title} - ${m.artist}: 无 URL`);
      fail++;
      continue;
    }
    const result = await testUrl(m.url);
    if (result.isAudio && result.status === 200) {
      console.log(`✅ ${m.title} - ${m.artist}: status=${result.status}, type=${result.contentType}`);
    } else {
      console.log(`❌ ${m.title} - ${m.artist}: status=${result.status}, type=${result.contentType}, len=${result.contentLength || '?'}`);
      if (result.error) console.log(`   ⚠ ${result.error}`);
      fail++;
    }
  }
  console.log(`\n总计: ${list.length} 首，失败 ${fail} 首`);
}

main().catch((e) => { console.error(e); process.exit(1); });
