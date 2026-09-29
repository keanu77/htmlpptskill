// 簡報內容：每個物件一頁。type 決定版型（渲染函式在 build.js），notes 為講者備註（播放時按 S 開講者視窗）。
// 這是中性的起手範本（8 頁）；50 頁完整實例在 repo 的 examples/workshop-2026/content.js，複製過來即可 build。
const meta = { title: '〈簡報標題〉', author: '〈講者姓名・單位〉' };

// tools／cats 給 tool、cat、catoverview 三種版型用；不用可留空物件。
const tools = {
  demo: { name: '〈工具名稱〉', url: 'https://example.com/replace-me', cat: 1,
    one: '〈一句話說明這個工具做什麼、給誰用〉',
    use: ['〈教學用法一〉', '〈教學用法二〉', '〈教學用法三〉'] },
};
const cats = [null, { name: '〈工具分類〉', pain: '〈這一類要解決的教學痛點〉', keys: ['demo'] }];

const slides = [];
const S = (o) => slides.push(o);

S({ type: 'title', kicker: '〈場合〉', title: meta.title, sub: '〈副標：一句話說今天要帶走什麼〉', who: meta.author,
  notes: '開場備註。' });

S({ type: 'question', q: '〈開場問一個讓聽眾停下來想的問題？〉', notes: '停 5 秒。' });

S({ type: 'three', title: '〈三個重點〉',
  items: [{ h: '〈一〉', p: '〈說明〉', tag: '〈標籤〉' }, { h: '〈二〉', p: '〈說明〉', tag: '〈標籤〉' }, { h: '〈三〉', p: '〈說明〉', tag: '〈標籤〉' }],
  foot: '〈一句總結〉', notes: '' });

S({ type: 'section', num: '01', title: '〈章節標題〉', sub: '〈章節副標〉', bg: 'bg-cover', notes: '' });  // bg → assets/bg-cover.jpg，沒有就純色

S({ type: 'steps', title: '〈操作步驟〉',
  steps: [{ h: '〈步驟一〉', p: '〈細節〉' }, { h: '〈步驟二〉', p: '〈細節〉' }, { h: '〈步驟三〉', p: '〈細節〉' }],
  foot: '〈提醒〉', notes: '' });

S({ type: 'decision', title: '〈決策樹〉',
  rows: [
    { q: '〈問題一？〉', yes: '是', to: { c: 'green', lv: 'A', t: '〈選項 A〉' }, down: '否' },
    { q: '〈問題二？〉', yes: '是', to: { c: 'amber', lv: 'B', t: '〈選項 B〉' }, down: '否' },
  ],
  last: { c: 'teal', lv: 'C', t: '〈選項 C〉' }, notes: '' });

S({ type: 'tool', key: 'demo', notes: '請聽眾掃碼。截圖放 shots/demo.png 後重新 build。' });

S({ type: 'end', title: '謝謝聆聽', sub: '〈一句收尾〉', who: meta.author, qr: 'https://example.com/replace-me', qrLabel: 'example.com', notes: 'Q&A' });

module.exports = { slides, tools, cats, meta };
