#!/usr/bin/env python3
"""實例（作者的 54 頁工作坊 v2）：以既有 reveal.js 單檔為底，套用講者在 PPTX 手改的文字、加第二張 QR、
fragment／auto-animate／3D 翻卡／GSAP／內嵌測驗／計時條／lightbox，升級 reveal.js 5.2.1，輸出離線單檔。
用法：python3 pptx-edits-back-to-html.py <stripped.html> <imgs.json> <libs-dir> <out.html>
  stripped.html／imgs.json：先把原 HTML 的 base64 圖片換成 __IMGn__ 占位符（見 README「實例」段）
  libs-dir：npm install reveal.js@5 gsap 的目錄
這支腳本綁定作者那份簡報的字串，直接跑不會成功；它的價值是示範每一種技巧怎麼用正則安全地套進既有 HTML。
"""

import io
import json
import random
import re
import sys

import segno

STRIPPED, IMGS, LIBS, OUT = sys.argv[1:5]
s = open(STRIPPED, encoding="utf8").read()
imgs = json.load(open(IMGS))["imgs"]


def rd(p):
    return open(f"{LIBS}/node_modules/{p}", encoding="utf8").read()


def strip_import(css):
    return re.sub(r"@import[^;]+;", "", css)


def rep(a, b, n=1):
    global s
    assert s.count(a) >= 1, ("NOT FOUND", a[:80])
    s = s.replace(a, b, n)


def qr_svg(url, data_url=True):
    buf = io.BytesIO()
    segno.make(url, error="m").save(
        buf,
        kind="svg",
        xmldecl=False,
        svgclass=None,
        lineclass=None,
        omitsize=True,
        dark="#0B1F2A",
        light="#fff",
        border=1,
    )
    return (
        buf.getvalue()
        .decode()
        .strip()
        .replace("<svg ", '<svg class="qrsvg" shape-rendering="crispEdges" ', 1)
    )


# ───────── 0. reveal.js 5.2.1 CSS ─────────
styles = list(re.finditer(r"<style>.*?</style>", s, re.S))
assert len(styles) == 4
new_css = "".join(
    f"<style>{strip_import(rd(p))}</style>"
    for p in [
        "reveal.js/dist/reset.css",
        "reveal.js/dist/reveal.css",
        "reveal.js/dist/theme/night.css",
    ]
)
s = s[: styles[0].start()] + new_css + s[styles[2].end() :]
rep(
    "<title>AI 輔助教學的應用｜GitHub・Cloudflare・Zeabur</title>",
    "<title>AI提升教學能力｜吳易澄醫師</title>",
)

# ───────── 1. 使用者的文字修改 ─────────
rep(
    '<div class="chip amber">臨床教師工作坊</div>\n        <h1>AI 輔助教學的應用</h1>\n        <p class="lead" style="font-size:0.8em;">用 GitHub、Cloudflare、Zeabur 把教學想法變成可以掃碼使用的工具</p>',
    '<div class="chip amber">實證師資工作坊</div>\n        <h1 data-stagger>AI提升教學能力</h1>\n        <p class="lead" style="font-size:0.8em;">把教學想法變成可以使用的工具</p>',
)
rep(
    "<li>超音波導引注射、運動傷害與回場評估</li>",
    "<li>超音波導引注射、運動傷害與回場評估、網絡統合分析</li>",
)
rep("<li>臨床之外，用 AI coding agent</li>", "")
rep("<li>今天介紹的 13 個工具都已上線</li>", "<li>10+ 工具都已上線</li>")
rep(
    '<p class="big" style="font-size:1.4em;line-height:1.5;margin:0;">你上一次想做一個教材，<br>卻因為「不會做」而放棄，<br>是什麼時候？</p>',
    '<p class="big" style="font-size:1.3em;line-height:1.45;margin:0;">在AI的協作中<br>距離造出原型產品自己用<br>可以拿出來給別人用<br>還離多遠？</p>',
)
rep(
    "<li>按用量計費；金鑰放 Variables，不寫進檔案</li>",
    "<li>按用量計費；金鑰不寫進檔案</li>",
)
rep(
    '<div style="flex:1"><h1>謝謝聆聽</h1><p class="lead" style="font-size:0.85em">讓會教的人，也能做出好工具</p>',
    '<div style="flex:1"><h1 class="r-fit-text" data-stagger style="line-height:1.3">AI讓會教的人<br>做出無限好用的工具</h1>',
)
rep("示範用題目建議直接用第 9 頁的判讀測驗", "示範用題目建議直接用第 11 頁的判讀測驗")

# ───────── 2. 章節頁 zoom、截圖 lightbox ─────────
s = s.replace(
    '<section class="chapter" data-background-image=',
    '<section class="chapter" data-transition="zoom" data-background-image=',
)
s = re.sub(
    r'<img src="(__IMG\d+__)" alt="([^"]*)" style="display:block;width:100%;',
    r'<img src="\1" data-preview-image alt="\2" title="點一下放大" style="display:block;width:100%;cursor:zoom-in;',
    s,
)


# ───────── 3. fragments ─────────
def in_section(marker, fn):
    """對含 marker 的那個 <section> 套 fn"""
    global s
    i = s.index(marker)
    a = s.rfind("<section", 0, i)
    b = s.index("</section>", i) + len("</section>")
    s = s[:a] + fn(s[a:b]) + s[b:]


# 三個瓶頸
in_section(
    "<h2>教材製作的三個瓶頸</h2>",
    lambda x: x.replace(
        '<div class="card center amber">',
        '<div class="card center amber fragment fade-up">',
    )
    .replace(
        '<div class="card center teal">',
        '<div class="card center teal fragment fade-up">',
    )
    .replace(
        '<div class="card center green">',
        '<div class="card center green fragment fade-up">',
    )
    .replace('<div class="note">今天的主題', '<div class="note fragment">今天的主題'),
)


# 從想法到網址：卡片與箭頭共用 index
def flow(x):
    k = [0]

    def card(m):
        k[0] += 1
        return f'<div class="card center {m.group(1)} fragment fade-up" data-fragment-index="{k[0]}">'

    x = re.sub(r'<div class="card center (amber|teal|green)">', card, x)
    j = [0]

    def arrow(m):
        j[0] += 1
        return f'<div class="arrow fragment" data-fragment-index="{j[0] + 1}">→</div>'

    x = re.sub(r'<div class="arrow">→</div>', arrow, x)
    return x.replace(
        '<div class="brace">', '<div class="brace fragment" data-fragment-index="7">'
    ).replace(
        '<div class="note">前三步',
        '<div class="note fragment" data-fragment-index="7">前三步',
    )


in_section("<h2>從想法到網址</h2>", flow)


# 決策樹：一列一個 index
def dtree(x):
    out, idx = [], -1
    for line in x.split("\n"):
        if '<div class="dq">' in line:
            idx += 1
            line = re.sub(
                r'<div class="(dq|da|do \w+)">',
                lambda m: f'<div class="{m.group(1)} fragment" data-fragment-index="{idx}">',
                line,
            )
        elif '<div class="dd">' in line:
            line = line.replace(
                '<div class="dd">',
                f'<div class="dd fragment" data-fragment-index="{idx + 1}">',
            )
        elif '<div class="do teal">' in line:
            idx += 1
            line = line.replace(
                '<div class="do teal">',
                f'<div class="do teal fragment" data-fragment-index="{idx}">',
            )
        out.append(line)
    return "\n".join(out)


in_section("<h2>我該用哪一階？</h2>", dtree)
# 交叉稽核、三條紅線、三件事
for mk in ("<h2>AI 會出錯：交叉稽核</h2>", "<h2>三條紅線</h2>"):
    in_section(mk, lambda x: x.replace("<li><b>", '<li class="fragment"><b>'))
in_section(
    "<h2>下週就能做的三件事</h2>",
    lambda x: re.sub(
        r'<div class="card center (amber|teal|green)">',
        r'<div class="card center \1 fragment fade-up">',
        x,
    ),
)

# ───────── 4. 四階梯 auto-animate：前一頁只有 Lv0 ─────────
i = s.index("<h2>四階梯：從零門檻到全端</h2>")
a = s.rfind("<section", 0, i)
b = s.index("</section>", i) + len("</section>")
ladder = s[a:b]
lv0 = re.search(
    r'<div class="rung coral" style="margin-top:132px">.*?<div class="when">今天回去就能試</div></div>',
    ladder,
).group(0)
lv0_a = lv0.replace(
    '<div class="rung coral" style="margin-top:132px">',
    '<div class="rung coral" data-id="lv0" style="margin-top:40px;width:560px;">',
)
pre = (
    '<section data-auto-animate><div class="chip">01 AI 改變了什麼</div><h2>四階梯：從零門檻到全端</h2>\n'
    f'      <div class="ladder" style="grid-template-columns:1fr;justify-items:center;">{lv0_a}</div>\n'
    '      <aside class="notes">先只看 Lv0：今天回去就能試。按下一頁，這張卡會自己滑到左邊、長出整個階梯（reveal.js Auto-Animate，兩頁之間相同元素自動補間）。</aside></section>\n\n    '
)
ladder = ladder.replace("<section>", "<section data-auto-animate>", 1).replace(
    '<div class="rung coral" style="margin-top:132px">',
    '<div class="rung coral" data-id="lv0" style="margin-top:132px">',
)
s = s[:a] + pre + ladder + s[b:]

# ───────── 5. 第 9 頁後：內嵌可作答測驗 ─────────
QUIZ = [
    {
        "q": "超音波下「全層撕裂」最典型的表現組合是？",
        "a": 0,
        "o": [
            "肌腱局部缺損不顯影，三角肌下滑囊往下凹陷，並見軟骨界面徵象",
            "肌腱均勻增厚、回音降低",
            "肌腱內點狀強回音伴後方聲影",
            "肱二頭肌長頭腱位於結節間溝內",
        ],
        "e": "全層撕裂＝纖維連續性從滑囊面到關節面中斷；滑囊與三角肌向下填入缺損（sagging），缺損下方的肱骨頭軟骨出現明亮線狀回音（cartilage interface sign）。",
    },
    {
        "q": "棘上肌腱的「部分撕裂」最常發生在哪一側？",
        "a": 0,
        "o": [
            "關節面側（articular side）",
            "滑囊面側（bursal side）",
            "肌肉肌腱交界處",
            "各側機率相同",
        ],
        "e": "關節面側部分撕裂比滑囊面側常見；超音波呈局部低回音或無回音缺損，但未貫穿全層。",
    },
    {
        "q": "掃描時肌腱出現一片低回音，調整探頭傾斜角度後消失。最可能是？",
        "a": 0,
        "o": [
            "各向異性（anisotropy）造成的假影",
            "部分撕裂",
            "鈣化性肌腱炎",
            "肌腱炎併滑囊積液",
        ],
        "e": "肌腱纖維與聲束不垂直時會呈假性低回音，探頭擺正就消失；真正的撕裂不會因角度改變而消失。",
    },
    {
        "q": "要把棘上肌腱從肩峰下方拉出來完整掃描，建議的擺位是？",
        "a": 0,
        "o": [
            "修正 Crass 位：手掌貼同側後口袋，手肘向後",
            "手臂自然下垂、掌心朝前",
            "肩外展 90 度、手肘伸直",
            "手臂前舉過頭",
        ],
        "e": "修正 Crass 位讓棘上肌腱向前外側移出肩峰遮蔽、肌腱較不扭轉，是常規掃描姿勢。",
    },
    {
        "q": "下列何者最能提高「全層撕裂」的診斷信心？",
        "a": 0,
        "o": [
            "長軸與短軸兩個切面都看到同一處缺損",
            "只在長軸看到一次低回音",
            "病人按壓時疼痛",
            "三角肌下滑囊少量積液",
        ],
        "e": "任何缺損都應在兩個正交切面重複確認；壓痛與少量積液不具特異性。",
    },
]
random.seed(7)
for q in QUIZ:  # 打散選項順序
    order = list(range(4))
    random.shuffle(order)
    q["o"] = [q["o"][k] for k in order]
    q["a"] = order.index(q["a"])
quiz_html = (
    '<section><div class="chip amber">Lv0　示範：就是那個 prompt 做出來的測驗</div><h2>肩關節超音波：旋轉肌袖撕裂判讀</h2>\n'
    '      <div class="quiz" id="quiz1"></div>\n'
    '      <aside class="notes">現場請一位聽眾用鍵盤或滑鼠答題。這一頁就是前一頁 prompt 的產物：5 題單選、即時回饋、最後計分、參考文獻標「待查證」。強調最後一點：AI 自己標出不確定，老師才知道要查哪裡。</aside></section>'
)
i = s.index("<h2>30 秒做出一個判讀測驗</h2>")
b = s.index("</section>", i) + len("</section>")
s = s[:b] + "\n\n    " + quiz_html + s[b:]

# ───────── 6. 七種教學型態：3D 翻卡 ─────────
TOOLS = {
    "①": "運動醫學影像學習站<br>肩部影像課程",
    "②": "馬拉松完賽訓練<br>恢復力迷宮",
    "③": "運動禁藥教育平台<br>AthleteType 運動人格",
    "④": "AI 運動處方",
    "⑤": "運動醫學 Review 索引<br>統合分析計算器<br>反向工程搜尋",
    "⑥": "運動傷害影片圖鑑<br>台灣運動地圖",
    "⑦": "Classlido",
}


def flipgrid(x):
    def card(m):
        col, k, d, cnt = m.groups()
        num = k[0]
        return (
            f'<div class="flip"><div class="inner"><div class="front card {col}"><span class="k">{k}</span><div class="d">{d}</div><div class="cnt">{cnt}</div></div>'
            f'<div class="back card {col}"><span class="k">{k}</span><div class="tl">{TOOLS[num]}</div><div class="cnt">點卡片可翻回</div></div></div></div>'
        )

    x, n = re.subn(
        r'<div class="card (\w+)"><span class="k">(.*?)</span><div class="d">(.*?)</div><div class="cnt">(.*?)</div></div>',
        card,
        x,
    )
    assert n == 7, n
    return x.replace(
        '<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:14px;">',
        '<div class="grid fragment custom flipall" style="grid-template-columns:repeat(4,1fr);gap:14px;">',
    )


in_section("<h2>我的教學工具：七種教學型態</h2>", flipgrid)

# ───────── 7. 工具頁：網站 QR＋repo QR 同大小上下排 ─────────
REPOS = {
    "imaging-course-hub.sportsmedicine.tw": "https://github.com/keanu77/imaging-course-hub",
    "shoulder-imaging.sportsmedicine.tw": "https://github.com/keanu77/shoulder-imaging-course",
    "marathongame.sportsmedicine.tw": "https://github.com/keanu77/marathongame",
    "recoverymaze.sportsmedicine.tw": "https://github.com/keanu77/recoverymaze",
    "antidopingplatform.sportsmedicine.tw": "https://github.com/keanu77/antidoping-platform",
    "athletetype.sportsmedicine.tw": "https://github.com/keanu77/athletetype",
    "exerciseprescription.sportsmedicine.tw": "https://github.com/keanu77/exercise-prescription-recommendation",
    "review.sportsmedicine.tw": "https://github.com/keanu77/review.sportsmedicine",
    "metacalc.sportsmedicine.tw": "https://github.com/keanu77/Meta-Analysis-Calculator",
    "reverse-searcher.zeabur.app": "https://github.com/keanu77/reverse-engineer-searcher",
    "injury.sportsmedicine.tw": "https://github.com/keanu77/sports-injury-atlas-starter",
    "twexercisemap.sportsmedicine.tw": "https://github.com/keanu77/twexercisemap",
}
for host, repo in REPOS.items():
    pat = re.compile(
        r'<div class="qrcard l">(<svg class="qrsvg".*?</svg>\s*)<div class="qrl">'
        + re.escape(host)
        + r"</div></div>",
        re.S,
    )
    site = "https://" + host + "/"

    def two(m, site=site, repo=repo, host=host):
        return (
            f'<div class="qrstack"><div class="qrcard l" data-url="{site}">{m.group(1)}<div class="qrl">{host}</div></div>'
            f'<div class="qrcard l" data-url="{repo}">{qr_svg(repo)}<div class="qrl">GitHub 公開 repo<br>{repo.replace("https://github.com/", "")}</div></div></div>'
        )

    s, n = pat.subn(two, s)
    assert n == 1, (host, n)
    in_section(
        f'data-url="{repo}"',
        lambda x: x.replace(
            "grid-template-columns:1fr 270px;", "grid-template-columns:1fr 205px;"
        ),
    )
# 其他 QR 補 data-url（供 QA 解碼比對）
for label, url in {
    "github.com/keanu77": "https://github.com/keanu77",
    "sportsmedicine.tw/lab": "https://sportsmedicine.tw/lab",
    "AI 技能導覽站": "https://github.com/keanu77/AIskillsintro",
    "從這裡開始逛": "https://imaging-course-hub.sportsmedicine.tw/",
    "classlido.sportsmedicine.tw/live/join": "https://classlido.sportsmedicine.tw/live/join",
    "classlido.sportsmedicine.tw": "https://classlido.sportsmedicine.tw/",
    "reverse-searcher.zeabur.app": "https://reverse-searcher.zeabur.app/",
    "公開範本 repo": "https://github.com/keanu77/sports-injury-atlas-starter",
}.items():
    s = re.sub(
        r'<div class="qrcard (\w)">(?=<svg class="qrsvg"(?:(?!</div></div>).)*?<div class="qrl">'
        + re.escape(label)
        + r"</div>)",
        rf'<div class="qrcard \1" data-url="{url}">',
        s,
        flags=re.S,
    )
s = (
    s.replace(
        '<div class="qrcard m"><svg',
        '<div class="qrcard m" data-url="https://sportsmedicine.tw"><svg',
        1,
    )
    if s.count('<div class="qrcard m"><svg') == 1
    else s
)

# ───────── 8. CSS ─────────
EXTRA_CSS = r"""
/* ===== v2：效果與互動 ===== */
.reveal .fragment.fade-up { transition-duration: .5s; }
.reveal .fragment.custom.flipall { opacity: 1; visibility: inherit; }
.flip { perspective: 1100px; height: 196px; cursor: pointer; }
.flip .inner { position: relative; width: 100%; height: 100%; transition: transform .9s cubic-bezier(.4,.2,.2,1); transform-style: preserve-3d; }
.flip .front, .flip .back { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.flip .back { transform: rotateY(180deg); }
.flip.on .inner, .flipall.visible .flip:not(.off) .inner { transform: rotateY(180deg); }
.flip .front .d, .flip .back .d { font-size: 0.5em; }
.flip .back .tl { font-size: 0.6em; font-weight: 700; line-height: 1.5; margin-top: 6px; color: var(--text); }
.flip:nth-child(2) .inner { transition-delay: .07s } .flip:nth-child(3) .inner { transition-delay: .14s } .flip:nth-child(4) .inner { transition-delay: .21s }
.flip:nth-child(5) .inner { transition-delay: .28s } .flip:nth-child(6) .inner { transition-delay: .35s } .flip:nth-child(7) .inner { transition-delay: .42s }
.flip.on .inner { transition-delay: 0s !important; }
.qrstack { display: flex; flex-direction: column; gap: 12px; }
.qrstack .qrcard .qrl { font-size: 0.36em; }
.quiz { margin-top: 0.2em; }
.quiz .qz-top { display: flex; justify-content: space-between; font-size: 0.48em; color: var(--muted); margin-bottom: 8px; }
.quiz .qz-top b { color: var(--amber); }
.quiz .qz-q { font-size: 0.7em; font-weight: 700; line-height: 1.5; margin: 0 0 14px 0; }
.quiz .qz-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.quiz button.qz-o { text-align: left; font: inherit; font-size: 0.55em; line-height: 1.45; padding: 12px 16px; border-radius: 12px; border: 1.5px solid var(--line); background: var(--card); color: var(--text); cursor: pointer; }
.quiz button.qz-o:hover:not(:disabled) { border-color: var(--teal); }
.quiz button.qz-o.ok { border-color: var(--green); background: #12382E; }
.quiz button.qz-o.bad { border-color: var(--coral); background: #3A2222; }
.quiz button.qz-o:disabled { cursor: default; }
.quiz .qz-fb { margin-top: 12px; font-size: 0.52em; line-height: 1.55; color: var(--muted); background: var(--card2); border-radius: 12px; padding: 12px 16px; display: none; }
.quiz .qz-fb b { color: var(--text); }
.quiz .qz-fb.show { display: block; }
.quiz .qz-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
.quiz .qz-ref { font-size: 0.4em; color: var(--dim); }
.quiz .btnx { display: none; background: var(--amber); color: var(--bg); font-weight: 700; font-size: 0.52em; padding: 8px 20px; border-radius: 999px; border: none; cursor: pointer; font-family: inherit; }
.quiz .btnx.show { display: inline-block; }
.quiz .qz-done { text-align: center; padding: 30px 0; }
.quiz .qz-done .sc { font-size: 2.2em; font-weight: 900; color: var(--amber); line-height: 1.1; }
.quiz .qz-done p { font-size: 0.6em; color: var(--muted); }
.timebar { position: fixed; top: 0; left: 0; height: 5px; width: 0; background: var(--amber); z-index: 50; transition: width 1s linear; opacity: .9; }
.timebar.over { background: var(--coral); }
.reveal .r-fit-text { white-space: nowrap; }
.reveal h1 .ch, .reveal h1 .ch { display: inline-block; }
@media print { .timebar { display: none; } }
html.static .flip .inner, html.static .reveal .fragment { transition: none !important; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition-duration: .01ms !important; } }
"""
rep("</style>\n</head>", EXTRA_CSS + "</style>\n</head>")

# ───────── 9. scripts ─────────
QUIZ_JSON = json.dumps(QUIZ, ensure_ascii=False)
tail_start = s.index("<script>__BLOB0__</script>")
s = s[:tail_start]
scripts = f"""<script>{rd('reveal.js/dist/reveal.js')}</script>
<script>{rd('reveal.js/plugin/notes/notes.js')}</script>
<script>{rd('gsap/dist/gsap.min.js')}</script>
<script>
var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
var STATIC = navigator.webdriver || location.search.indexOf('print-pdf') >= 0;  // QA 截圖／列印時不跑動畫
if (STATIC) document.documentElement.classList.add('static');
Reveal.initialize({{ width: 1280, height: 720, margin: 0.06, hash: true, transition: REDUCE ? 'fade' : 'slide', backgroundTransition: 'fade',
  autoAnimateDuration: STATIC ? 0 : 0.9, autoAnimateEasing: 'cubic-bezier(.4,.2,.2,1)',
  center: true, progress: true, controls: true, slideNumber: 'c/t', pdfSeparateFragments: false, plugins: [ RevealNotes ] }});
</script>
<script>
(function(){{
  var KEY='classlido_code';
  function render(){{ var v=''; try{{ v=localStorage.getItem(KEY)||''; }}catch(e){{}}
    document.querySelectorAll('.cl-code').forEach(function(el){{ el.textContent = v ? v : (el.textContent.length>3?'——————':'——'); }});
    document.querySelectorAll('.cl-code-input').forEach(function(i){{ if(i.value!==v) i.value=v; }}); }}
  document.querySelectorAll('.cl-code-input').forEach(function(i){{ i.addEventListener('input', function(){{ var v=this.value.replace(/[^0-9]/g,'').slice(0,6); try{{ localStorage.setItem(KEY,v); }}catch(e){{}} render(); }});
    i.addEventListener('keydown', function(e){{ e.stopPropagation(); }}); }});
  render();
}})();
</script>
<script>
// ── 封面／封底標題逐字浮現（GSAP）──
(function(){{
  function split(el){{ if(el.dataset.split) return; el.dataset.split='1';
    Array.prototype.slice.call(el.childNodes).forEach(function(n){{ if(n.nodeType!==3) return; var f=document.createDocumentFragment();
      Array.from(n.textContent).forEach(function(ch){{ var sp=document.createElement('span'); sp.className='ch'; sp.textContent=ch===' '?'\\u00a0':ch; f.appendChild(sp); }}); n.parentNode.replaceChild(f,n); }}); }}
  function play(slide){{ var h=slide&&slide.querySelector('h1[data-stagger]'); if(!h||REDUCE||STATIC||!window.gsap) return; split(h);
    gsap.fromTo(h.querySelectorAll('.ch'),{{y:46,opacity:0,rotateX:-70}},{{y:0,opacity:1,rotateX:0,duration:.7,stagger:.05,ease:'back.out(1.7)',overwrite:true}}); }}
  Reveal.on('ready',function(e){{ play(e.currentSlide); }}); Reveal.on('slidechanged',function(e){{ play(e.currentSlide); }});
}})();
// ── 七種教學型態：3D 翻卡（fragment 一次全翻；點單張可翻回／翻開）──
document.querySelectorAll('.flip').forEach(function(c){{ c.addEventListener('click',function(){{ var grid=c.parentNode; if(grid.classList.contains('visible')) c.classList.toggle('off'); else c.classList.toggle('on'); }}); }});
// ── 講者計時條：40 分鐘，按 T 重計 ──
(function(){{ if(STATIC) return; var ALLOT=40*60*1000, bar=document.createElement('div'); bar.className='timebar'; bar.title='40 分鐘計時，按 T 重新開始'; document.body.appendChild(bar);
  var start=Date.now(); function tick(){{ var p=Math.min(1,(Date.now()-start)/ALLOT); bar.style.width=(p*100)+'%'; bar.classList.toggle('over',p>=1); }}
  setInterval(tick,1000); tick(); document.addEventListener('keydown',function(e){{ if((e.key==='t'||e.key==='T')&&!e.metaKey&&!e.ctrlKey){{ start=Date.now(); tick(); }} }}); }})();
// ── 內嵌測驗 ──
(function(){{
  var Q={QUIZ_JSON}; var box=document.getElementById('quiz1'); if(!box) return; var i=0, score=0;
  function esc(t){{ return t.replace(/&/g,'&amp;').replace(/</g,'&lt;'); }}
  function show(){{ if(i>=Q.length){{ box.innerHTML='<div class="qz-done"><div class="sc">'+score+' / '+Q.length+'</div><p>'+(score===Q.length?'全對。可以直接拿去當課前測驗。':'答錯的題目，解釋裡都有回查的線索。')+'</p><button class="btnx show" id="qz-again">再做一次</button></div>';
      document.getElementById('qz-again').onclick=function(){{ i=0; score=0; show(); }}; return; }}
    var q=Q[i]; box.innerHTML='<div class="qz-top"><span>第 <b>'+(i+1)+'</b> / '+Q.length+' 題</span><span>目前 '+score+' 分</span></div><div class="qz-q">'+esc(q.q)+'</div><div class="qz-opts">'+
      q.o.map(function(o,k){{ return '<button class="qz-o" data-k="'+k+'">'+'ABCD'[k]+'. '+esc(o)+'</button>'; }}).join('')+'</div><div class="qz-fb"></div>'+
      '<div class="qz-bar"><div class="qz-ref">參考文獻：Jacobson JA. Fundamentals of Musculoskeletal Ultrasound. Elsevier.（版次與年份待查證）</div><button class="btnx" id="qz-next">'+(i+1<Q.length?'下一題 →':'看分數')+'</button></div>';
    box.querySelectorAll('.qz-o').forEach(function(b){{ b.onclick=function(){{ var k=+b.dataset.k; box.querySelectorAll('.qz-o').forEach(function(x){{ x.disabled=true; if(+x.dataset.k===q.a) x.classList.add('ok'); }});
      if(k===q.a) score++; else b.classList.add('bad'); var fb=box.querySelector('.qz-fb'); fb.innerHTML='<b>'+(k===q.a?'答對。':'答錯，正解是 '+'ABCD'[q.a]+'。')+'</b> '+esc(q.e); fb.classList.add('show');
      document.getElementById('qz-next').classList.add('show'); }}; }});
    document.getElementById('qz-next').onclick=function(){{ i++; show(); }}; }}
  show();
}})();
</script>
</body></html>
"""
s += scripts

# ───────── 10. 圖片還原、檢查、輸出 ─────────
s = re.sub(r"__IMG(\d+)__", lambda m: imgs[int(m.group(1))], s)
assert "__IMG" not in s and "__BLOB" not in s
for bad in ('src="http', "@import", "fonts.googleapis", 'href="http'):
    n = len(
        re.findall(
            re.escape(bad)
            + r"(?!s://classlido\.sportsmedicine\.tw/quick|s://ebm|s://classlido)",
            s,
        )
    )
    assert n == 0 or bad == 'href="http', (bad, n)
open(OUT, "w", encoding="utf8").write(s)
print(
    "wrote", OUT, round(len(s.encode()) / 1e6, 2), "MB", "sections", s.count("<section")
)
