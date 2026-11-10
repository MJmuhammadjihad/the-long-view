"""Build a portable HTML decision toolkit using only the Python standard library."""
from pathlib import Path
from html import escape
import json, re, math, shutil
ROOT = Path(__file__).resolve().parent
CONFIG = json.loads((ROOT / 'site.json').read_text())
CHAPTERS = [
 ('start', 'Start here'), ('routes', 'Choose your route'), ('skills', 'Learning & proof'),
 ('degree', 'The degree decision'), ('roadmap', '24-week decision path'),
 ('business', 'Jobs & first clients'), ('money', 'Cash & investments'),
 ('opportunities', 'Opportunity watchlist'), ('land', 'Land & long-term assets'),
 ('principles', 'First principles'), ('decisions', 'Your decision journal'),
 ('sources', 'Sources & evidence')]
sources = json.loads((ROOT / 'research-sources.json').read_text())
source_articles = []
for number, source in enumerate(sources, 1):
    publisher, date, scope, title, link, note = (source[k] for k in ['publisher','date','scope','title','url','limitations'])
    search = escape((' '.join([publisher,scope,title,note])).lower())
    source_articles.append(f'<article class="source" id="source-{number}" data-source-text="{search}"><span class="source-number">[{number:02}]</span> <span class="source-category">{escape(scope)}</span><h3><a href="{escape(link)}" target="_blank" rel="noopener">{escape(title)} ↗</a></h3><p><strong>{escape(publisher)}</strong> · {escape(date)}</p><p>{escape(note)}</p></article>')
parts = []
for i, (key, label) in enumerate(CHAPTERS):
    chapter = (ROOT / 'content' / f'{key}.html').read_text().replace('{{SOURCES}}', ''.join(source_articles))
    if key != 'start':
        toc = []
        def heading(match):
            existing, inner = match.groups()
            section_id = existing or f'{key}-section-{len(toc)+1}'
            text = re.sub('<[^>]+>', '', inner)
            toc.append((section_id, text))
            return f'<h2 id="{section_id}">{inner}</h2>'
        chapter = re.sub(r'<h2(?: id="([^"]+)")?>(.*?)</h2>', heading, chapter)
        minutes = max(1, math.ceil(len(re.sub('<[^>]+>', ' ', chapter).split()) / 220))
        links = ''.join(f'<li><a href="#{k}">{v}</a></li>' for k, v in toc)
        outline = f'<div class="chapter-tools no-print"><span class="reading-time">{minutes} min read · tools take longer</span><details class="chapter-outline"><summary>In this chapter</summary><ul>{links}</ul></details></div>'
        split = chapter.index('</p>') + 4
        chapter = chapter[:split] + outline + chapter[split:]
        chapter = re.sub(r'<div class="eyebrow">[^<]*</div>', f'<div class="eyebrow">{i:02} / {escape(label)}</div>', chapter, count=1)
    nxt, nxt_label = CHAPTERS[(i+1) % len(CHAPTERS)]
    footer = f'<div class="chapter-footer"><span class="small">The Long View · Chapter {i+1} of {len(CHAPTERS)}</span><a class="button" href="#{nxt}">Next: {escape(nxt_label)} →</a></div>'
    parts.append(chapter.replace('</section>', footer + '</section>'))
nav = ''.join(f'<a href="#{key}"'+(' aria-current="page"' if i == 0 else '')+f'><span>{i:02}</span>{escape(label)}</a>' for i, (key, label) in enumerate(CHAPTERS))
css = (ROOT / 'styles.css').read_text()
js = (ROOT / 'script.js').read_text()
repo, url = CONFIG['repository'], CONFIG['url']
meta = {"@context":"https://schema.org", "@type":"WebApplication", "name":CONFIG['name'], "url":url, "description":CONFIG['tagline'], "applicationCategory":"EducationalApplication", "operatingSystem":"Any", "isAccessibleForFree":True, "browserRequirements":"Modern browser; JavaScript for interactive tools", "license":repo+'/blob/main/LICENSE', "author":{"@type":"Person","name":CONFIG['author']}}
icon = (ROOT / 'assets/favicon.svg').read_text()
from urllib.parse import quote
icon_url = 'data:image/svg+xml,' + quote(icon)
license_notice = (ROOT / 'LICENSE').read_text()
html = f'''<!doctype html><!--\n{license_notice}\n--><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f6f5ef"><meta name="color-scheme" content="light"><meta name="description" content="An open-source career and money decision toolkit. Compare learning paths, price education, stress-test cash flow and keep a private decision journal."><title>The Long View — Career decisions, with the numbers attached</title><link rel="icon" href="{icon_url}"><link rel="canonical" href="{url}"><meta property="og:type" content="website"><meta property="og:title" content="The Long View — Career decisions, with the numbers attached"><meta property="og:description" content="Five practical tools. Inspectable evidence. A plan that changes when the facts do. Free, open source and usable offline."><meta property="og:url" content="{url}"><meta property="og:image" content="{url}assets/social-card.png"><meta property="og:image:width" content="1280"><meta property="og:image:height" content="640"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="The Long View — Career decisions, with the numbers attached"><meta name="twitter:description" content="Compare routes, stress-test cash flow and keep a private decision journal."><meta name="twitter:image" content="{url}assets/social-card.png"><script type="application/ld+json">{json.dumps(meta)}</script><style>{css}</style></head><body><a class="skip" href="#main">Skip to the toolkit</a><aside class="sidebar" id="sidebar" aria-label="Guide contents"><a class="brand" href="#start"><span class="brand-mark">{icon}</span><div><div class="brand-name">The Long View</div><div class="brand-sub">A toolkit for the next move</div></div></a><div class="nav-label">Explore the guide</div><nav class="nav">{nav}</nav><div class="sidebar-bottom"><div class="progress-label"><span>Your private checklist</span><span id="sidebar-progress">0 / 14</span></div><div class="track"><i id="progress-bar"></i></div><p class="sidebar-note">Build useful capability.<br>Keep room to adapt.</p><a class="repo-link" href="{repo}" target="_blank" rel="noopener">View project on GitHub ↗</a><p class="small">PUBLIC EDITION · v{CONFIG['version']}</p></div></aside><div class="mobile-shade" id="mobile-shade"></div><div class="shell"><header class="topbar"><button class="menu-button" id="menu-button" aria-label="Open guide contents" aria-controls="sidebar" aria-expanded="false">☰</button><div class="breadcrumb"><span class="edition">THE LONG VIEW / </span><b id="current-chapter">Start here</b></div><div class="toolbar"><button id="search-button" aria-expanded="false" aria-controls="guide-search-panel">Search</button><button id="print-button" class="print-button">Print guide</button><a class="button" href="guide.html" download="the-long-view.html">↓ <span class="download-label">Download </span>HTML</a></div></header><main class="main" id="main"><noscript><p class="nojs">All chapters are available below. Enable JavaScript for calculators, filtering and saved notes.</p></noscript><div class="search-panel no-print" id="guide-search-panel" hidden><label for="guide-search"><strong>Find a tool, topic or source</strong></label><input type="search" id="guide-search" placeholder="Try: degree, income, land, payback…"><div id="search-results" aria-live="polite"></div></div><div class="currency-bar no-print"><label for="calculator-unit">Calculator unit</label><select id="calculator-unit"><option value="BDT">BDT ৳</option><option value="USD">USD $</option><option value="EUR">EUR €</option><option value="GBP">GBP £</option><option value="INR">INR ₹</option></select><span>Unit only; no exchange-rate conversion. Cited figures retain their original currency.</span></div>{''.join(parts)}<footer class="site-footer"><span>The Long View · Original code & writing: MIT · <a href="{repo}" target="_blank" rel="noopener">Source & contributions</a></span><span>Research checked 9 Nov 2026 · Published 10 Nov 2026</span></footer></main></div><script>{js}</script></body></html>'''
output = ROOT / 'dist'
output.mkdir(exist_ok=True)
for name in ('index.html', 'guide.html'):
    (output / name).write_text(html)
shutil.copytree(ROOT / 'assets', output / 'assets', dirs_exist_ok=True)
(output / '.nojekyll').write_text('')
(output / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {url}sitemap.xml\n')
(output / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{escape(url)}</loc><lastmod>{CONFIG["release_date"]}</lastmod></url></urlset>')
(output / '404.html').write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found — The Long View</title><body style="background:#f6f5ef;color:#203c34;font:18px/1.7 system-ui;max-width:680px;margin:12vh auto;padding:24px"><h1>Let’s get you back to the guide.</h1><p>This page does not exist.</p><p><a href="{url}">Open The Long View →</a></p></body></html>')
print(f'Built {len(CHAPTERS)} chapters and {len(json.loads((ROOT / "research-sources.json").read_text()))} references; standalone HTML {len(html.encode()):,} bytes.')
