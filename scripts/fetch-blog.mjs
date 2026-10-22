/* =========================================================
   네이버 블로그 최신 글 → data/blog.json
   - GitHub Actions(.github/workflows/update-blog.yml)에서 매일 실행 · 로컬 실행 : node scripts/fetch-blog.mjs
   - 최신 글 3개의 제목 · 링크 · 작성일 · 카테고리 저장 (HTML 태그 · 특수문자 엔티티 정리)
   - 글 목록이 바뀌었을 때만 파일을 다시 씀 / RSS 를 불러오지 못하면 기존 파일 유지
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RSS_URL = 'https://rss.blog.naver.com/wants24.xml';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'blog.json');
const COUNT = 3;

// 특수문자 엔티티 → 문자, 태그 제거, 공백 정리
const clean = (str) => String(str || '')
  .replace(/^<!\[CDATA\[|\]\]>$/g, '')
  .replace(/<[^>]*>/g, '')
  .replace(/&#x([0-9a-f]+);/gi, (m, hex) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (m, dec) => String.fromCodePoint(Number(dec)))
  .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (m, name) => ({ nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" }[name]))
  .replace(/<[^>]*>/g, '') // 엔티티로 감싸져 있던 태그까지 제거
  .replace(/\s+/g, ' ')
  .trim();

const pick = (xml, tag) => {
  const m = xml.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
  return m ? m[1].trim() : '';
};

// 작성일 → 한국 시간 YYYY-MM-DD
const toDate = (str) => {
  const d = new Date(str);
  if (isNaN(d)) return '';
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
};

const fail = (msg) => {
  // 기존 blog.json 은 그대로 두고 경고만 남김 (워크플로는 성공으로 끝나고 커밋되지 않음)
  console.log('::warning::블로그 RSS 업데이트 건너뜀 - ' + msg);
  process.exit(0);
};

let xml;
try {
  const res = await fetch(RSS_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (wants-renewal blog updater)' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) fail('HTTP ' + res.status);
  xml = await res.text();
} catch (err) {
  fail(err.message);
}

const items = xml.split(/<item>/).slice(1, COUNT + 1).map((chunk) => {
  const raw = chunk.split('</item>')[0];
  const link = clean(pick(raw, 'guid')) || clean(pick(raw, 'link')).replace(/\?.*$/, ''); // 추적용 파라미터 제외
  return {
    title: clean(pick(raw, 'title')),
    link,
    date: toDate(clean(pick(raw, 'pubDate'))),
    category: clean(pick(raw, 'category'))
  };
}).filter((it) => it.title && /^https:\/\/blog\.naver\.com\//.test(it.link));

if (items.length < 1) fail('글 목록을 읽지 못함');

let prev = null;
try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (err) { prev = null; }
if (prev && JSON.stringify(prev.items) === JSON.stringify(items)) {
  console.log('변경 없음 - 최신 글 동일');
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), source: RSS_URL, items }, null, 2) + '\n');
console.log('blog.json 업데이트 : ' + items.map((it) => it.date + ' ' + it.title).join(' / '));
