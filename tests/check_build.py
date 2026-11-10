"""Check portable output, generated references, nesting and release privacy invariants."""
from pathlib import Path
from html.parser import HTMLParser
import json, re, hashlib, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
class Nesting(HTMLParser):
    def __init__(self): super().__init__(); self.stack=[]; self.errors=[]
    def handle_starttag(self,tag,attrs):
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}: self.stack.append(tag)
    def handle_endtag(self,tag):
        if not self.stack or self.stack[-1]!=tag: self.errors.append((self.getpos(),tag,self.stack[-3:])); return
        self.stack.pop()
html=(ROOT/'dist/index.html').read_text()
p=Nesting();p.feed(html)
assert not p.errors and not p.stack, (p.errors,p.stack)
assert (ROOT/'dist/index.html').read_bytes()==(ROOT/'dist/guide.html').read_bytes()
assert '{{SOURCES}}' not in html
sources=json.loads((ROOT/'research-sources.json').read_text())
assert len(sources)==31
assert len({s['url'] for s in sources})==len(sources)
assert all(s['url'].startswith('https://') for s in sources)
for key in ['runway-tool','degree-tool','capacity-tool','budget-tool','wealth-tool','tool-directory']:
    assert f'id="{key}"' in html
for marker in ['appgprj_', 'source_repository_credential', 'siwc_bypass', 'private-profile.json']:
    assert marker not in html, 'Private provenance leaked into the public artifact'
assert 'application/ld+json' in html and 'og:image' in html
assert (ROOT/'assets/social-card.png').read_bytes()[:8]==b'\x89PNG\r\n\x1a\n'
before=hashlib.sha256(html.encode()).digest()
subprocess.run([sys.executable,str(ROOT/'build.py')],check=True,stdout=subprocess.DEVNULL)
assert hashlib.sha256((ROOT/'dist/index.html').read_bytes()).digest()==before, 'Build is not deterministic'
print('PASS: HTML nesting, portable download, source registry, tool links, privacy invariants, social card and deterministic build.')
