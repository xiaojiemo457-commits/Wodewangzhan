// 内置热榜抓取模块（无外部依赖）
// 移植自 DailyHotApi (github.com/imsyy/DailyHotApi) 各平台实现，适配主站统一输出
// 统一输出格式：{ title, hot, url, desc, tag? }

import { createHash } from 'node:crypto';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

async function fetchText(url, { headers = {}, timeout = 15000 } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, ...headers },
    signal: AbortSignal.timeout(timeout),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchJson(url, { headers = {}, timeout = 15000 } = {}) {
  const text = await fetchText(url, { headers, timeout });
  return JSON.parse(text);
}

// ===== B站（WBI 签名） =====
const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28,
  14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54,
  21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];

const getMixinKey = (orig) =>
  MIXIN_KEY_ENC_TAB.map((n) => orig[n]).join('').slice(0, 32);

function encWbi(params, img_key, sub_key) {
  const mixin_key = getMixinKey(img_key + sub_key);
  const curr_time = Math.round(Date.now() / 1000);
  const chr_filter = /[!'()*]/g;
  Object.assign(params, { wts: curr_time });
  const query = Object.keys(params)
    .sort()
    .map((key) => {
      const value = params[key].toString().replace(chr_filter, '');
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
  const wbi_sign = createHash('md5').update(query + mixin_key).digest('hex');
  return query + '&w_rid=' + wbi_sign;
}

let wbiCache = { query: '', at: 0 };
const WBI_TTL = 30 * 60 * 1000;

async function getBiliWbi() {
  const now = Date.now();
  if (wbiCache.query && now - wbiCache.at < WBI_TTL) return wbiCache.query;
  const nav = await fetchJson('https://api.bilibili.com/x/web-interface/nav', {
    headers: {
      Cookie: 'SESSDATA=xxxxxx',
      Referer: 'https://www.bilibili.com/',
    },
  });
  const img_url = nav?.data?.wbi_img?.img_url ?? '';
  const sub_url = nav?.data?.wbi_img?.sub_url ?? '';
  const img_key = img_url.slice(img_url.lastIndexOf('/') + 1, img_url.lastIndexOf('.'));
  const sub_key = sub_url.slice(sub_url.lastIndexOf('/') + 1, sub_url.lastIndexOf('.'));
  if (!img_key || !sub_key) throw new Error('B站 WBI 密钥获取失败');
  const query = encWbi({ foo: '114', bar: '514', baz: 1919810 }, img_key, sub_key);
  wbiCache = { query, at: now };
  return query;
}

async function fetchBilibili() {
  const wbi = await getBiliWbi();
  const headers = {
    Referer: 'https://www.bilibili.com/ranking/all',
    'Accept-Language': 'zh-CN,zh;q=0.9',
  };
  // 主接口（v2，WBI 签名）
  const mainUrl = `https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all&${wbi}`;
  // 主接口可能被风控（code != 0 或 list 为空），失败时走无 WBI 的备用接口
  for (const url of [mainUrl, 'https://api.bilibili.com/x/web-interface/ranking?jsonp=jsonp&rid=0&type=all']) {
    let json;
    try {
      json = await fetchJson(url, { headers });
    } catch {
      continue;
    }
    const isV2 = url.includes('/v2');
    const list = isV2 ? json?.data?.list : json?.data?.list;
    if (!Array.isArray(list) || list.length === 0) continue;
    return list.map((v) => ({
      title: v.title || '',
      hot: isV2 ? v.stat?.view || 0 : v.video_review || 0,
      url: v.short_link_v2 || `https://www.bilibili.com/video/${v.bvid}`,
      desc: v.desc || '该视频暂无简介',
    }));
  }
  throw new Error('B站热榜接口均被风控或返回为空');
}

// ===== 百度（抓 HTML s-data） =====
async function fetchBaidu() {
  const html = await fetchText('https://top.baidu.com/board?tab=realtime', {
    headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' },
  });
  const match = html.match(/<!--s-data:(.*?)-->/s);
  if (!match) throw new Error('百度页面未找到 s-data');
  let sData;
  try {
    sData = JSON.parse(match[1]);
  } catch (e) {
    throw new Error(`百度 s-data 解析失败: ${e.message}`);
  }
  const cardContent = sData?.data?.cards?.[0]?.content ?? sData?.cards?.[0]?.content;
  let items = [];
  if (Array.isArray(cardContent)) {
    if (cardContent.length > 0 && Array.isArray(cardContent[0]?.content)) {
      items = cardContent[0].content;
    } else {
      items = cardContent;
    }
  }
  return items.map((v) => {
    const title = v.word ?? v.title ?? '';
    return {
      title,
      hot: parseInt((v.hotScore ?? v.hotTag ?? '0').toString(), 10) || 0,
      url: `https://www.baidu.com/s?wd=${encodeURIComponent(v.query ?? title)}`,
      desc: v.desc ?? '',
    };
  });
}

// ===== 快手（抓 HTML APOLLO_STATE） =====
function parseChineseNumber(chineseNumber) {
  const units = { 亿: 1e8, 万: 1e4, 千: 1e3, 百: 1e2 };
  for (const unit in units) {
    if (chineseNumber.includes(unit)) {
      return parseFloat(chineseNumber.replace(unit, '')) * units[unit];
    }
  }
  return parseFloat(chineseNumber);
}

const APOLLO_STATE_PREFIX = 'window.__APOLLO_STATE__=';

async function fetchKuaishou() {
  const html = await fetchText('https://www.kuaishou.com/?isHome=1', {
    headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' },
  });
  const start = html.indexOf(APOLLO_STATE_PREFIX);
  if (start === -1) throw new Error('快手页面未找到 APOLLO_STATE');
  const scriptSlice = html.slice(start + APOLLO_STATE_PREFIX.length);
  const sentinelA = scriptSlice.indexOf(';(function(');
  const sentinelB = scriptSlice.indexOf('</script>');
  const cutIndex =
    sentinelA !== -1 && sentinelB !== -1 ? Math.min(sentinelA, sentinelB) : Math.max(sentinelA, sentinelB);
  if (cutIndex === -1) throw new Error('快手 APOLLO_STATE 结束标记未找到');
  const raw = scriptSlice.slice(0, cutIndex).trim().replace(/;$/, '');
  const lastBrace = raw.lastIndexOf('}');
  const cleanRaw = lastBrace !== -1 ? raw.slice(0, lastBrace + 1) : raw;
  let jsonObject;
  try {
    jsonObject = JSON.parse(cleanRaw)['defaultClient'];
  } catch (e) {
    throw new Error(`快手数据解析失败: ${e.message}`);
  }
  const allItems =
    jsonObject?.['$ROOT_QUERY.visionHotRank({"page":"home"})']?.items ||
    jsonObject?.['$ROOT_QUERY.visionHotRank({"page":"home","platform":"web"})']?.items ||
    [];
  const list = [];
  for (const item of allItems) {
    const hotItem = jsonObject?.[item.id];
    if (!hotItem) continue;
    const id = hotItem.photoIds?.json?.[0];
    if (!id) continue;
    list.push({
      title: hotItem.name || '',
      hot: parseChineseNumber(String(hotItem.hotValue ?? '0')) || 0,
      url: `https://www.kuaishou.com/short-video/${id}`,
      desc: '',
    });
  }
  if (!list.length) throw new Error('快手热榜为空');
  return list;
}

// ===== 头条 =====
async function fetchToutiao() {
  const json = await fetchJson('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc', {
    headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' },
  });
  const list = json?.data || [];
  return list.map((v) => ({
    title: v.Title || '',
    hot: Number(v.HotValue) || 0,
    url: `https://www.toutiao.com/trending/${v.ClusterIdStr}/`,
    desc: '',
  }));
}

// ===== 腾讯新闻 =====
async function fetchQQNews() {
  const json = await fetchJson('https://r.inews.qq.com/gw/event/hot_ranking_list?page_size=50', {
    headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' },
  });
  const list = json?.idlist?.[0]?.newslist?.slice(1) || [];
  return list.map((v) => ({
    title: v.title || '',
    hot: v.hotEvent?.hotScore || 0,
    url: `https://new.qq.com/rain/a/${v.id}`,
    desc: v.abstract || '',
  }));
}

// ===== 历史上的今天（用中国时区取日期） =====
function getChinaMonthDay() {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return { month: get('month'), day: get('day') };
}

const stripHtml = (s) =>
  (s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();

async function fetchHistory() {
  const { month, day } = getChinaMonthDay();
  const url = `https://baike.baidu.com/cms/home/eventsOnHistory/${month}.json?_=${Date.now()}`;
  const json = await fetchJson(url, { headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' } });
  const list = json?.[month]?.[month + day] || [];
  return list.map((v) => ({
    title: stripHtml(v.title),
    hot: '',
    url: v.link || '',
    desc: stripHtml(v.desc),
  }));
}

// 平台 -> 抓取函数映射（与 apiMiddleware.js 中 source='builtin' 的平台对应）
export const HOT_SOURCES = {
  bilibili: fetchBilibili,
  baidu: fetchBaidu,
  kuaishou: fetchKuaishou,
  toutiao: fetchToutiao,
  'qq-news': fetchQQNews,
  history: fetchHistory,
};

export default HOT_SOURCES;
