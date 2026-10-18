<div align="center">

# htmlpptskill

**Tell your AI coding agent "make me an HTML slide deck" and get a deck that plays offline, has every QR code verified, lets the audience vote from their phones, and ships with handout PPTX/PDF.**

Two Agent Skills (open `SKILL.md` format) for Claude Code, Codex CLI, Gemini CLI and Grok Build.

**[▶ Live Demo](https://keanu77.github.io/htmlpptskill/)** · [中文 README](README.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)

<img src="docs/demo.gif" width="760" alt="One prompt, then the deck: fragments, Auto-Animate, 3D flip cards, an in-slide quiz, a live audience poll, screenshot QA and three deliverables">

</div>

> The docs and slide templates are in Traditional Chinese, but the scripts are language-neutral: you can write your slides in any language.

## Why not just PowerPoint?

| Problem | What this repo does |
|---|---|
| No Wi-Fi at the venue: fonts, images and plugins break | `QA_OFFLINE=1` fails on any external request; reveal.js, images and QR codes are inlined into **one HTML file** |
| A misprinted QR code sends the audience to a 404 | QA screenshots **every QR code, decodes it** and compares it with `data-url`; a mismatch exits 1 |
| AI-generated slides overflow or miss speaker notes | Every slide is screenshotted into one `montage.png`; overflow, JS errors and missing notes are listed |
| The organizer wants PPTX, you only have HTML | `render-slides` → `build-handout`: one image per slide, speaker notes in the notes pane; PDF in one command |
| You want the whole room to answer, not one volunteer | **Live audience polling**: scan a QR, vote on the phone, results stream to the slide, press `A` to reveal on every phone |
| The speaker edited the PPTX by hand | A full worked example of pulling the edits back into HTML |

## The two skills

| Skill | What it does | Triggers |
|---|---|---|
| **`html-slide-deck`** | Outline → HTML → QA → delivery: layouts, images, QR codes, interactive pages, live polling, handout PPTX/PDF, native editable PPTX | "make an HTML deck", "reveal.js", "add QR codes", "live poll", "export to PPT/PDF", "offline deck" |
| **`html-slide-effects`** | Fragments, Auto-Animate, 3D flip cards, GSAP text, timer bar, lightbox, scroll view, with a STATIC switch for QA and PDF | "add animations", "flip cards", "make it more engaging" |

## Install (30 seconds)

```bash
git clone https://github.com/keanu77/htmlpptskill.git && cd htmlpptskill
./install.sh                # installs into every CLI it detects; existing skills are moved to skills-backup/
```

| CLI | Installed to | How to use |
|---|---|---|
| **Claude Code** | `~/.claude/skills/` | Type `/html-slide-deck`, or just ask for an HTML deck. As a plugin: `/plugin marketplace add keanu77/htmlpptskill` → `/plugin install htmlpptskill@keanu77` |
| **Codex CLI** | `~/.codex/skills/` | Describe the task, or `$html-slide-deck` |
| **Gemini CLI** | `~/.gemini/skills/` | `gemini skills list`; or `gemini skills link <repo>/skills/html-slide-deck` |
| **Grok Build** | `~/.grok/skills/` | Describe the task (it also reads `~/.claude/skills/`) |

One CLI only: `./install.sh codex`. Commit with your project: `./install.sh --project` (installs to `.agents/skills/`).

### Requirements

| Needed for | Install |
|---|---|
| All scripts | Node 20+ (Playwright does not support 18; Ubuntu 24.04's `apt install nodejs` is 18, use nvm or nodejs.org). Node 22+ for the poll load test |
| Screenshot QA, rendering, PDF | `npm i -D playwright && npx playwright install chromium` (Linux servers: also `npx playwright install-deps chromium`) |
| Handout PPTX | `npm i pptxgenjs` |
| QR generation, montage | Python 3 + `pip install -r requirements.txt` (segno, pillow, python-pptx; a venv is recommended) |
| CJK text on Linux | A CJK font, e.g. `fonts-noto-cjk` (otherwise screenshots show boxes) |
| Live polling (optional) | A free Cloudflare account |

Scripts look for `node_modules` **from the working directory upwards**, then in the global npm root; or set `SKILL_PKG_ROOT`.

| Platform | Support |
|---|---|
| macOS | Everything (`pptx-to-pdf.sh` needs Microsoft PowerPoint) |
| Linux | Everything except the native PowerPoint export (use `print-pdf.mjs`) |
| Windows | Run the scripts with `node`; use WSL for `install.sh` or copy `skills\*` manually; set `PYTHON=python` |

## First deck in 10 minutes

```bash
mkdir my-deck && cd my-deck && npm init -y
npm i -D playwright && npx playwright install chromium && npm i reveal.js@5 pptxgenjs
SKILL=~/.claude/skills/html-slide-deck                       # your CLI's skill path

cp $SKILL/references/reveal-template.html draft.html         # 9-slide template; 〈…〉 and example.com are placeholders
node $SKILL/scripts/inline-assets.mjs draft.html index.html  # inline reveal.js and images → one offline file
QA_OFFLINE=1 node $SKILL/scripts/qa-screenshots.mjs index.html qa/     # screenshots, QR, overflow → look at qa/montage.png
node $SKILL/scripts/render-slides.mjs index.html render/
node $SKILL/scripts/build-handout.mjs render/ handout.pptx "Speaker"   # image handout with notes
node $SKILL/scripts/print-pdf.mjs index.html handout.pdf               # PDF handout
```

Or just tell your agent:

> Use html-slide-deck to make a 20-slide deck on "XXX" for residents. No Wi-Fi at the venue; put a QR code on every tool slide.

It proposes an outline table first and waits for your OK, then writes the HTML, runs QA and delivers the files.

## Live audience polling

Used by 60 people at once at a medical conference talk in October 2026, and load-tested beforehand with 150 simulated phones (150 votes written and pushed to the slide in about 0.2–1.2 s).

- The audience scans a QR code: no app, no login, anonymous, answers can be changed until the reveal.
- The slide shows live percentages (multiple choice) or a histogram and median (guess-a-number), plus how many phones are connected.
- Press `A` to reveal: the slide marks the answer and every phone shows it. `Shift+R` clears the votes for that question.
- If the venue network drops, the slide shows a warning, falls back to polling, and `A` still reveals.
- Backend: a Cloudflare Worker + Durable Object (free plan). Deploy it once and then edit only `polls.json`.

```html
<section data-poll-join></section>        <!-- join slide: big QR + phones online -->
<section data-poll="warmup"></section>    <!-- one question per slide, defined in worker/src/polls.json -->
```
```bash
cp -R $SKILL/references/live-poll/worker my-poll && cd my-poll && npm install
npx wrangler login && npx wrangler secret put ADMIN_KEY && npx wrangler deploy   # put the same key in .dev.vars
node $SKILL/scripts/poll-slides.mjs index.html index-live.html --worker my-poll --url https://slide-poll.<subdomain>.workers.dev
```

> **The presenter file `index-live.html` contains the ADMIN_KEY.** Keep it on the presenter's computer only: never publish, email or commit it. See [SECURITY.md](SECURITY.md).

For a public demo, use simulation mode (no backend, no key, safe to publish). The Live Demo is built this way:

```bash
node $SKILL/scripts/poll-slides.mjs index.html demo.html --polls polls.json --sim 60
```

Full setup, question format, API and load test: [`live-poll/README.md`](skills/html-slide-deck/references/live-poll/README.md) (Chinese).

## Shortcuts, transitions and effects

While presenting: `→`/`Space` next, `S` speaker view, `O`/`Esc` overview, `F` fullscreen, `B` black screen, `G` go to slide, `A` reveal (poll slides), `?` all shortcuts. Append `?print-pdf` to print, `?view=scroll` to read on a phone.

All effects come with copy-paste code in [`docs/TECHNIQUES.md`](docs/TECHNIQUES.md) (Chinese): fragments, Auto-Animate, 3D flip cards, card-wall fly-in, GSAP letter-by-letter text, Three.js cover particles, spotlight, timer bar, lightbox, in-slide quiz, live polling, interactive map, and a STATIC switch so QA screenshots and PDFs capture the final state.

## Rules learned the hard way

- **Agree on the outline before any HTML.** Regenerating 50 slides costs ten times more than aligning an outline.
- **QA is mandatory, and you must look at the images.** Open `montage.png` first, then the flagged slides; verify again after fixing.
- **Every QR code needs a `data-url`.** Without it QA cannot compare; placeholder URLs (example.com) trigger warnings.
- **Assume the venue has no internet.** Run `QA_OFFLINE=1` before delivery; use system fonts instead of Google Fonts.
- **Ask before deploying or creating a repo.** The skills never push anything to the public web on their own.
- **The QA scripts execute the deck's JavaScript.** Run them only on HTML you generated.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Playwright requires Node.js 20 or higher` | Upgrade Node (nvm or nodejs.org); Ubuntu 24.04's apt package is 18 |
| `找不到套件 playwright` (package not found) | Run from a directory with `node_modules`, or `npm i -g playwright`, or set `SKILL_PKG_ROOT` |
| `缺 jsqr／pngjs` | Run `npm install` in the skill directory, or set `QA_SKIP_QR=1` explicitly |
| Chromium not downloaded | `npx playwright install chromium`; or point `CHROMIUM_PATH` at an existing Chromium/Chrome |
| Chinese text renders as boxes (Linux) | Install Noto Sans CJK |
| Sites like PubMed return 403 to headless browsers | Ask the user for a screenshot |
| PDF has more pages than slides | `pdfSeparateFragments: false` in `Reveal.initialize` (already set in the templates) |
| Poll votes stay at 0 in your own tests | Voter IDs must be 8–64 characters `[a-z0-9-]` |
| `wrangler dev` will not start | `compatibility_date` is newer than your local workerd; move it back |

## Repository layout

```
skills/html-slide-deck/       main workflow: SKILL.md, scripts/, references/ (templates, live-poll/, pitfalls, design principles)
skills/html-slide-effects/    effects skill
demo/                         Live Demo source → docs/index.html (GitHub Pages)
examples/                     a 50-slide workshop deck, PPTX-edits-back-to-HTML example, Three.js particles
docs/                         TECHNIQUES.md, images, Live Demo build
```

## About

The author is a sports medicine physician who built these skills while preparing workshop and conference talks, then had four models (Codex, Claude, Grok, Gemini) review them. MIT licensed. The template text, URLs and screenshots in `examples/` are samples to replace.
