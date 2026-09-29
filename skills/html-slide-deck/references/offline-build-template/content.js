// 簡報內容：每個物件一頁。type 決定版型，notes 為講者備註（按 N 顯示）
const tools = {
  hub: { name: '運動醫學影像學習站', url: 'https://imaging-course-hub.sportsmedicine.tw/', cat: 1,
    one: '整合肩、腕手、髖、膝、踝足、頸椎、腰椎七站的影像學習入口，附學習路徑與影片來源。',
    use: ['新進住院醫師第一週的自學地圖', '晨會前指定一站，會議只討論疑問', '影片皆標來源，示範教材引用的正確做法'] },
  shoulder: { name: '肩部影像課程', url: 'https://shoulder-imaging.sportsmedicine.tw/', cat: 1,
    one: 'X 光、超音波、MRI 系統化學習路徑，逐段筆記與掃描重點，涵蓋旋轉肌、盂唇與不穩定。',
    use: ['超音波實作課前的預習教材', '學員先練判讀，上課只處理錯誤', '同一病灶三種影像並排比較'] },
  knee: { name: '膝關節影像課程', url: 'https://knee-imaging.sportsmedicine.tw/', cat: 1,
    one: '影片、逐段筆記、知識檢核題與進階練習，學習膝部解剖、常見病理與影像報告重點。',
    use: ['內建檢核題可當形成性評量', '報告撰寫重點可接實際病例討論', '與肩部課程共用架構，複製即可做新部位'] },
  marathon: { name: '馬拉松完賽訓練', url: 'https://marathongame.sportsmedicine.tw/', cat: 2,
    one: '2D 橫向跑酷衛教遊戲：管理體力、配速與受傷風險，避開生病與過度訓練。',
    use: ['把「訓練負荷」抽象概念變成可操作的規則', '給病人或跑團的衛教，也適合醫學生入門', '遊戲規則本身就是可討論的教材'] },
  maze: { name: '恢復力迷宮', url: 'https://recoverymaze.sportsmedicine.tw/', cat: 2,
    one: '運動恢復教育迷宮：在六種風險追逐中收集睡眠、營養、水分，抵達晨光出口。',
    use: ['五分鐘可玩完，適合課堂破冰', '把恢復要素轉成遊戲道具，記憶點強', '學員可討論「哪個道具最重要」'] },
  antidoping: { name: '運動禁藥教育平台', url: 'https://antidopingplatform.sportsmedicine.tw/', cat: 3,
    one: 'WADA 禁用清單中文教學、情境測驗與 TUE 申請流程。',
    use: ['隨隊醫師、運動防護員的前測／後測', '情境題比背清單更接近臨床判斷', '流程圖直接對應實際 TUE 申請'] },
  athletetype: { name: 'AthleteType 運動人格', url: 'https://athletetype.sportsmedicine.tw/', cat: 3,
    one: '28 題運動情境測驗，附個性化項目建議、訓練方式與教練溝通指南。',
    use: ['示範如何把問卷變成即時回饋的網頁', '溝通教學：同一建議對不同類型怎麼說', '課堂當場掃碼，全班結果即時討論'] },
  rx: { name: 'AI 運動處方', url: 'https://exerciseprescription.sportsmedicine.tw/', cat: 4,
    one: '依 ACSM FITT-VP 原則與 WHO 身體活動指引，按年齡、體能、健康狀況產生運動處方。',
    use: ['學員先自己開處方，再與工具結果比對', '把指引的決策邏輯變成看得見的輸入與輸出', '討論工具「沒考慮到什麼」本身就是教學'] },
  review: { name: '運動醫學 Review 索引', url: 'https://review.sportsmedicine.tw/', cat: 5,
    one: '系統性回顧、統合分析與臨床指引索引，依部位／主題／族群瀏覽，標示期刊 IF 與免費全文。',
    use: ['Journal club 選題的起點', '教「先找 review 再找原始研究」的閱讀順序', '免費全文標示降低學員取得門檻'] },
  metacalc: { name: '統合分析計算器', url: 'https://metacalc.sportsmedicine.tw/', cat: 5,
    one: "效果值互轉（Cohen's d／r／OR）、信賴區間、樣本數與檢驗力估算，附 PDF 報告。",
    use: ['研究方法課當場算，概念立刻具體', '讀文獻時換算不同研究的效果值', '研究計畫的樣本數估算練習'] },
  reverse: { name: '反向工程搜尋', url: 'https://reverse-searcher.zeabur.app/', cat: 5,
    one: '從金標準文獻 PMID 反推 MeSH，產生敏感／平衡／精簡三版 PubMed 搜尋式。',
    use: ['教檢索策略：從已知好文獻倒推關鍵字', '比較三版搜尋式的命中差異', '部署在 Zeabur：需要後端運算的例子'] },
  injury: { name: '運動傷害影片圖鑑', url: 'https://injury.sportsmedicine.tw/', cat: 6,
    one: '依部位、項目與情境瀏覽真實傷害影片，整理受傷機轉、衛教重點與選手回場紀錄。',
    use: ['受傷機轉教學：看真實影片比看示意圖清楚', '回場紀錄可討論 return-to-play 決策', '公開 MIT 範本，可 fork 做自己的專科版'] },
  twmap: { name: '台灣運動地圖', url: 'https://twexercisemap.sportsmedicine.tw/', cat: 6,
    one: '運動部「運動城市調查」開放資料視覺化：全台 22 縣市運動現況、趨勢與排名。',
    use: ['公共衛生、預防醫學課的在地數據', '示範把政府開放資料變成教材', '學員可提出問題，當場在地圖上找答案'] },
};

const cats = [
  null,
  { name: '影像判讀課程', pain: '判讀要大量看片，上課時間永遠不夠', keys: ['hub', 'shoulder', 'knee'] },
  { name: '遊戲化學習', pain: '抽象概念講完就忘，病人衛教更難留下印象', keys: ['marathon', 'maze'] },
  { name: '情境測驗與自我評估', pain: '背清單不等於會判斷，需要即時回饋', keys: ['antidoping', 'athletetype'] },
  { name: '臨床決策輔助', pain: '指引很長，學員看不出決策邏輯', keys: ['rx'] },
  { name: '研究方法教學', pain: '統計與檢索最難教，學員卡在第一步', keys: ['review', 'metacalc', 'reverse'] },
  { name: '真實案例與開放資料', pain: '課本案例不夠真實，在地數據找不到', keys: ['injury', 'twmap'] },
];

const slides = [];
const S = (o) => slides.push(o);

// ───────── 開場 ─────────
S({ type: 'title',
  kicker: '臨床教師工作坊',
  title: 'AI 輔助教學的應用',
  sub: '用 GitHub、Cloudflare、Zeabur 把教學想法變成可以掃碼使用的工具',
  who: '吳易澄 醫師　運動醫學科',
  notes: '開場。今天 40 分鐘，前半講工具與平台，後半看實際案例，最後現場示範從 prompt 到上線。' });

S({ type: 'about',
  title: '我是誰',
  lines: ['運動醫學科主治醫師', '超音波導引注射、運動傷害與回場評估', '國家隊隨隊醫師'],
  side: ['臨床之外，用 AI coding agent', '把運動醫學知識做成網頁工具', '今天介紹的 13 個工具都已上線'],
  qr: 'https://github.com/keanu77', qrLabel: 'github.com/keanu77',
  notes: '重點不是我會寫程式，而是我原本不是工程師。這些工具都是和 AI 一起做出來的。' });

S({ type: 'question',
  q: '你上一次想做一個教材，<br>卻因為「不會做」而放棄，<br>是什麼時候？',
  notes: '停 5 秒讓聽眾想。可以請一兩位分享：想做互動測驗、判讀練習、計算工具……' });

S({ type: 'three',
  title: '教材製作的三個瓶頸',
  items: [
    { h: '時間', p: '一份互動教材要做好幾個晚上', tag: 'AI 解決' },
    { h: '技術', p: '會教不代表會寫程式、會架網站', tag: 'AI 解決' },
    { h: '散佈與維護', p: '做好了放哪裡？怎麼更新？學員怎麼拿到？', tag: '平台解決' },
  ],
  foot: '今天的主題：<b>AI</b> 負責做出來，<b>GitHub／Cloudflare／Zeabur</b> 負責放上去',
  notes: '這頁是整場的架構：前兩個瓶頸由 AI 解決，第三個由平台解決。' });

// ───────── Part 1 觀念 ─────────
S({ type: 'section', num: '01', title: 'AI 改變了什麼', sub: '從「學會寫程式」到「講清楚你要什麼」', notes: '' });

S({ type: 'agents',
  title: 'AI coding agent：你描述，它寫程式',
  cols: [
    { h: '對話型', items: ['Claude（Artifacts）', 'ChatGPT', 'Gemini'], p: '在對話框裡直接產生網頁，適合單頁小工具' },
    { h: 'Agent 型', items: ['Claude Code', 'OpenAI Codex', 'Gemini CLI'], p: '在你的電腦上讀寫整個專案、執行指令、部署' },
  ],
  foot: '分工：<b>你</b>負責「教什麼、對不對」，<b>AI</b> 負責「怎麼寫」',
  notes: '臨床教師的價值在於內容正確與教學設計，這部分 AI 取代不了。' });

S({ type: 'flow',
  title: '從想法到網址',
  steps: [
    { h: '教學想法', p: '要解決什麼問題' },
    { h: 'Prompt', p: '對象、內容、形式' },
    { h: 'AI 產生程式', p: 'HTML／網頁專案' },
    { h: 'GitHub', p: '存放與版本紀錄' },
    { h: 'Cloudflare／Zeabur', p: '自動部署上線' },
    { h: '網址＋QR', p: '學員掃碼使用' },
  ],
  foot: '前三步是教學設計，後三步設定一次後就自動完成',
  notes: '第一次設定 GitHub 和 Cloudflare 大約 30 分鐘，之後每次更新只要推上 GitHub 就會自動上線。' });

S({ type: 'ladder',
  title: '四階梯：從零門檻到全端',
  steps: [
    { lv: 'Lv0', h: 'Claude Artifacts', p: '不用部署，對話中直接產生並分享連結', when: '今天回去就能試' },
    { lv: 'Lv1', h: 'GitHub ＋ Pages', p: '版本管理、fork 範本、免費上線', when: '想長期保存與修改' },
    { lv: 'Lv2', h: 'Cloudflare Pages', p: '自訂網域、自動部署、速度快', when: '要正式給學員使用' },
    { lv: 'Lv3', h: 'Zeabur', p: '後端程式、資料庫、Docker', when: '需要運算或存資料' },
  ],
  notes: '每位老師找到自己的起點即可，不需要一路走到 Lv3。我大部分工具停在 Lv2。' });

// ───────── Lv0 ─────────
S({ type: 'prompt', chip: 'Lv0　Claude Artifacts：不用部署、不用帳號設定',
  title: '30 秒做出一個判讀測驗',
  prompt: '請做一個單頁互動測驗，對象是 PGY 住院醫師，\n主題：肩關節超音波的旋轉肌袖撕裂判讀。\n5 題單選題，每題作答後立即顯示正解與解釋，\n最後顯示分數。解釋請附參考文獻，\n不確定的內容標示「待查證」。',
  tips: ['<b>對象</b>：決定難度與用詞', '<b>形式</b>：題數、回饋時機、計分', '<b>查證要求</b>：強迫 AI 標示不確定處'],
  notes: '好 prompt 的三要素。「不確定標示待查證」這句很重要，後面風險段會再提。' });

// ───────── GitHub ─────────
S({ type: 'section', num: '02', title: '三個平台', sub: 'GitHub・Cloudflare・Zeabur', notes: '' });

S({ type: 'platform',
  lv: 'Lv1', title: 'GitHub', sub: '教材的雲端資料夾，而且每次修改都有紀錄',
  shot: 'shot-github-repo', shotUrl: 'github.com/keanu77/reverse-engineer-searcher',
  pros: ['每次修改都留紀錄，可隨時回到舊版', '可以 fork 別人的範本直接改', 'GitHub Pages 免費上線公開網站'],
  cons: ['預設選私人：有病人資料、未核對的教材不公開', '公開過就收不回，別人可能已複製'],
  notes: 'GitHub 原本是給工程師管理程式碼的，但對教師來說，就是一個有版本紀錄的雲端資料夾。' });

S({ type: 'terms',
  title: '只要懂四個詞',
  items: [
    { t: 'Repository', z: '專案資料夾', p: '一個教材一個 repo' },
    { t: 'Commit', z: '存檔紀錄', p: '每次修改附一句說明' },
    { t: 'Fork', z: '複製別人的專案', p: '從範本開始，不從零開始' },
    { t: 'README', z: '說明書', p: '這個教材是什麼、怎麼用' },
  ],
  foot: '其他指令交給 AI：「幫我 commit 並推上 GitHub」',
  notes: '實際上用 Claude Code 時，這些 git 指令 AI 都會代勞，老師只需要知道概念。' });

S({ type: 'fork',
  title: 'Fork：站在別人的肩膀上',
  p: '我把「運動傷害影片圖鑑」的架構整理成公開範本（MIT 授權），任何人都可以 fork 後改成自己的專科版本。',
  ideas: ['骨科：骨折機轉影片圖鑑', '急診：創傷處置影片圖鑑', '復健：治療性運動示範圖鑑'],
  qr: 'https://github.com/keanu77/sports-injury-atlas-starter', qrLabel: '公開範本 repo',
  notes: '這是開放原始碼對教學最大的價值：好的架構可以被重複使用。' });

S({ type: 'steps',
  title: '操作步驟：GitHub Pages 上線',
  steps: [
    { h: '註冊帳號', p: 'github.com，建議用常用 email' },
    { h: '建立 repo', p: 'New repository → 命名 → Public' },
    { h: '上傳檔案', p: 'Add file → Upload → 拖入 index.html' },
    { h: '開啟 Pages', p: 'Settings → Pages → Branch: main' },
    { h: '取得網址', p: '帳號.github.io/專案名稱' },
  ],
  foot: 'GitHub Pages 免費方案需要公開 repo；要保密的教材改用下一段的 Cloudflare 上傳',
  notes: '全程在網頁上完成，不需要安裝任何軟體。' });

// ───────── Cloudflare ─────────
S({ type: 'platform',
  lv: 'Lv2', title: 'Cloudflare Pages', sub: '把網頁資料夾放上去，任何人打網址就看得到',
  shot: 'shot-cloudflare-home', shotUrl: 'pages.cloudflare.com',
  pros: ['免費方案對靜態網站已足夠', '全球 CDN，學員開啟速度快', '自訂網域與子網域管理方便'],
  cons: ['多一個平台帳號要管理', '自訂網域需要先購買網域', '只放前端，後端要用 Workers'],
  notes: '我所有 sportsmedicine.tw 子網域的網站都是這個架構。' });

S({ type: 'autodeploy',
  title: '連結 GitHub：改完就自動上線',
  steps: ['修改教材', 'Push 到 GitHub', 'Cloudflare 自動偵測', '約 1 分鐘後上線'],
  foot: '學員的 QR code 永遠不用換，掃到的永遠是最新版',
  notes: '這是 Lv1 到 Lv2 最關鍵的差別：發現錯字改完推上去，學員手上的連結自動更新。' });

S({ type: 'domains',
  title: '一個網域，無限個工具',
  root: 'sportsmedicine.tw',
  subs: ['imaging-course-hub', 'shoulder-imaging', 'knee-imaging', 'marathongame', 'recoverymaze', 'antidopingplatform', 'athletetype', 'exerciseprescription', 'review', 'metacalc', 'injury', 'twexercisemap'],
  foot: '買一個網域（每年數百元），每個教材一個子網域，好記又專業',
  notes: '子網域不用另外付費，在 Cloudflare 後台新增即可。' });

S({ type: 'steps',
  title: '操作步驟：Cloudflare Pages',
  steps: [
    { h: '註冊帳號', p: 'dash.cloudflare.com' },
    { h: '建立專案', p: 'Workers & Pages → Create → Pages' },
    { h: '上傳資料夾', p: 'Upload assets → 拖入含 index.html 的資料夾' },
    { h: '取得網址', p: 'Deploy → 專案名.pages.dev' },
    { h: '進階', p: '改連 GitHub 自動部署；Custom domains 設子網域' },
  ],
  foot: '先用免費網址確認沒問題，再換成自己的網址',
  notes: '新手用拖拉上傳就夠。我自己用 wrangler pages deploy 指令，效果相同。更新時再拖一次就是新的一筆部署，可一鍵退回。' });

// ───────── Zeabur ─────────
S({ type: 'backend',
  title: '什麼時候需要後端？',
  no: ['測驗、計算器、互動圖表', '影像課程、衛教頁', '遊戲', '→ 全部在瀏覽器執行，Lv2 就夠'],
  yes: ['需要伺服器端運算（例如呼叫 PubMed API）', '需要存學員資料、登入', '需要執行 Python、Docker', '→ Lv3'],
  notes: '我 13 個工具裡只有反向工程搜尋需要後端，大部分教學工具其實不需要。' });

S({ type: 'platform',
  lv: 'Lv3', title: 'Zeabur', sub: '租一台永遠開著的電腦，需要「算」的工具住這裡',
  shot: 'shot-zeabur-home', shotUrl: 'zeabur.com',
  pros: ['中文介面；連 GitHub repo 自動建置', '支援 Node.js、Python、Docker'],
  cons: ['按用量計費；金鑰放 Variables，不寫進檔案'],
  example: { name: '實例：反向工程搜尋', url: 'https://reverse-searcher.zeabur.app/', p: '後端呼叫 PubMed API 分析 MeSH，靜態網站做不到' },
  notes: '費用與方案請以官網最新資訊為準。' });

S({ type: 'compare',
  title: '後端方案比較',
  head: ['', 'Zeabur', 'Supabase', 'Cloudflare Workers'],
  rows: [
    ['定位', '通用部署平台', '資料庫＋登入服務', '輕量伺服器函式'],
    ['適合', '跑完整後端程式', '存學員成績、帳號', 'API 轉接、小邏輯'],
    ['語言', 'Node／Python／Docker', '搭配任何前端', 'JavaScript'],
    ['中文介面', '有', '無', '部分'],
    ['上手難度', '中', '中', '中'],
  ],
  notes: 'Vercel、Netlify 與 Cloudflare Pages 功能重疊，今天不另外介紹。' });

S({ type: 'decision',
  title: '我該用哪一階？',
  notes: '這張圖可以拍照帶走。大部分老師會停在 Lv0 或 Lv2。' });

// ───────── Part 3 案例 ─────────
S({ type: 'catoverview', title: '我的教學工具：六種教學型態', notes: '以下依教學型態分類，每個工具附 QR code，歡迎現場掃碼試用。' });

for (let c = 1; c <= 6; c++) {
  S({ type: 'cat', c, notes: `第 ${c} 類：${cats[c].name}。` });
  for (const k of cats[c].keys) S({ type: 'tool', key: k, notes: `請聽眾掃碼。截圖可放入 shots/${k}.png 後重新 build。` });
}

// ───────── Demo ─────────
S({ type: 'section', num: '04', title: '現場示範', sub: '用 prompt 做一份 HTML 實證簡報，並部署到 Cloudflare', notes: '若現場網路不穩，改播預錄影片。' });

S({ type: 'prompt', chip: '現場示範',
  title: 'Demo：實證簡報的 prompt',
  prompt: '請做一份單一 HTML 檔的實證簡報。\n主題：PRP 注射治療膝退化性關節炎\n對象：PGY 住院醫師，10 頁\n內容：PICO、搜尋策略、近五年統合分析重點、\n　　　證據等級、臨床應用、限制\n要求：每個數據標註 PMID；無法確認的標示\n　　　「待查證」；方向鍵翻頁；可離線播放',
  tips: ['<b>PMID</b>：讓每個數字都能回查', '<b>待查證</b>：AI 不確定時要說出來', '<b>可離線</b>：演講現場不怕斷網'],
  notes: '現場貼上 prompt，約 2 分鐘產生。接著一定要示範核對 PMID，這是實證教學的重點。' });

S({ type: 'demosteps',
  title: 'Demo：從 prompt 到上線',
  steps: [
    { t: '2 分', h: 'AI 產生', p: 'Claude 產出 index.html' },
    { t: '1 分', h: '核對', p: '抽查 PMID、修正待查證處' },
    { t: '1 分', h: '推上 GitHub', p: '「幫我建 repo 並 push」' },
    { t: '1 分', h: 'Cloudflare', p: '上傳資料夾，拿到 pages.dev' },
    { t: '即時', h: 'QR code', p: '全場掃碼看剛做好的簡報' },
  ],
  foot: '備案：預錄影片＋已部署好的版本',
  notes: '總共約 5 分鐘。這份簡報本身也是用同樣流程做出來的。' });

// ───────── 原則與收尾 ─────────
S({ type: 'risk',
  title: 'AI 會出錯：交叉稽核',
  items: [
    { h: '編造文獻', p: 'AI 可能產生不存在的 PMID 或錯誤數據，每一筆都要回查' },
    { h: '多個 AI 分工檢查', p: '用不同 AI 各查不同面向（引用、數據、用詞），而不是同一問題問三次' },
    { h: '老師最後把關', p: '臨床內容的正確性，責任永遠在老師' },
  ],
  notes: '我的做法：Claude 寫、Codex 查引用、Gemini 查數據，各查不重疊的面向再交叉比對。' });

S({ type: 'risk',
  title: '三條紅線',
  items: [
    { h: '個資', p: '病人影像與資料必須去識別化，才能交給 AI 或放上公開 repo' },
    { h: '著作權', p: '影片、圖片標註來源；引用他人素材確認授權' },
    { h: '醫療法規', p: '對病人公開的衛教內容，須符合《醫療法》第 85 條醫療廣告規範' },
  ],
  notes: '公開 repo 等於全世界都看得到，上傳前再檢查一次。' });

S({ type: 'three',
  title: '下週就能做的三件事',
  items: [
    { h: '① 試 Lv0', p: '把下週要教的主題，請 AI 做成 5 題互動測驗', tag: '15 分鐘' },
    { h: '② 開 GitHub', p: '註冊帳號，fork 一個範本看看結構', tag: '20 分鐘' },
    { h: '③ 上線一次', p: '把一份舊教材改成 HTML，部署到 Cloudflare', tag: '1 小時' },
  ],
  foot: '先做一個，比規劃十個有用',
  notes: '' });

S({ type: 'resources',
  title: '資源',
  items: [
    { h: 'GitHub', url: 'https://github.com/keanu77', label: 'github.com/keanu77' },
    { h: 'Vibe coding 作品集', url: 'https://sportsmedicine.tw/lab', label: 'sportsmedicine.tw/lab' },
    { h: 'Claude Code Skills 目錄', url: 'https://github.com/keanu77/AIskillsintro', label: 'AI 技能導覽站' },
    { h: '影像學習站', url: 'https://imaging-course-hub.sportsmedicine.tw/', label: '從這裡開始逛' },
  ],
  notes: '' });

S({ type: 'end',
  title: '謝謝聆聽',
  sub: '讓會教的人，也能做出好工具',
  who: '吳易澄醫師・運動醫學科',
  qr: 'https://sportsmedicine.tw', qrLabel: 'sportsmedicine.tw',
  notes: 'Q&A' });

module.exports = { slides, tools, cats };
