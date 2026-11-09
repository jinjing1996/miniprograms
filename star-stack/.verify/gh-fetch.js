// 抓取 GitHub 仓库公开元数据，落盘 gh.json 供人工整理文案
const https = require('https');
const fs = require('fs');

const repos = [
  'woqianfu/ppt-master', 'DietrichGebert/ponytail', 'colbymchenry/codegraph',
  'anthropics/skills', 'emilkowalski/skills', 'pbakaus/impeccable',
  'Leonxlnx/taste-skill', 'nextlevelbuilder/ui-ux-pro-max-skill',
  'openai/whisper', '2noise/ChatTTS', 'RVC-Boss/GPT-SoVITS',
  'browser-use/browser-use', 'microsoft/playwright', 'browser-act/skills',
  'cenglin123/computer-use-mcp', 'linshenkx/prompt-optimizer',
  'PaddlePaddle/PaddleOCR', 'opendatalab/MinerU',
  'Fei-Away/Codex-Dream-Skin', 'msitarzewski/agency-agents', 'D4Vinci/Scrapling',
  'langchain-ai/langchain', 'langchain-ai/langgraph', 'run-llama/llama_index',
  'BerriAI/litellm', 'instructor-ai/instructor',
  'spring-projects/spring-ai', 'langchain4j/langchain4j'
];

function get(url, headers) {
  return new Promise(res => {
    const t = setTimeout(() => res({ status: 'TIMEOUT' }), 15000);
    https.get(url, { headers: Object.assign({ 'user-agent': 'starstack-meta', accept: 'application/vnd.github+json' }, headers) }, r => {
      let buf = '';
      r.on('data', d => buf += d);
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, body: buf }); });
    }).on('error', e => { clearTimeout(t); res({ status: 'ERR ' + e.code }); });
  });
}

(async () => {
  const out = [];
  for (const r of repos) {
    const got = await get('https://api.github.com/repos/' + r);
    if (got.status !== 200) { out.push({ repo: r, error: got.status }); console.log(r, '->', got.status); continue; }
    const j = JSON.parse(got.body);
    const item = {
      repo: r,
      name: j.name,
      desc: j.description || '',
      stars: j.stargazers_count,
      lang: j.language || '',
      topics: (j.topics || []).slice(0, 8),
      homepage: j.homepage || '',
      updated: (j.pushed_at || '').slice(0, 10),
      archived: j.archived
    };
    if (!item.desc) {
      const rm = await get('https://api.github.com/repos/' + r + '/readme', { accept: 'application/vnd.github.raw' });
      item.readmeHead = rm.status === 200 ? rm.body.replace(/\s+/g, ' ').slice(0, 300) : 'README ' + rm.status;
    }
    out.push(item);
    console.log(r, '->', item.stars, '|', (item.desc || item.readmeHead || '').slice(0, 60));
  }
  fs.writeFileSync(__dirname + '/gh.json', JSON.stringify(out, null, 1), 'utf8');
  const rem = await get('https://api.github.com/rate_limit');
  if (rem.body) console.log('rate:', JSON.parse(rem.body).rate);
})();
