"""Package the built offline guide, license and checksums without extra dependencies."""
from pathlib import Path
import hashlib,json,zipfile
ROOT=Path(__file__).resolve().parents[1]
config=json.loads((ROOT/'site.json').read_text())
out=ROOT/'release';out.mkdir(exist_ok=True)
html=(ROOT/'dist/guide.html').read_bytes()
(out/'the-long-view.html').write_bytes(html)
year,month,day=map(int,config['release_date'].split('-'))
with zipfile.ZipFile(out/'the-long-view-offline.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for name,data in [
        ('the-long-view.html',html),
        ('LICENSE',(ROOT/'LICENSE').read_bytes()),
        ('README.txt',('Open the-long-view.html in a modern browser. All application assets are embedded. External sources need internet. Notes stay in local browser storage; export a JSON backup before switching browsers.\nSource and limitations: '+config['repository']+'\n').encode())]:
        info=zipfile.ZipInfo(name,date_time=(year,month,day,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;archive.writestr(info,data)
files=['the-long-view.html','the-long-view-offline.zip']
(out/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256((out/name).read_bytes()).hexdigest()+'  '+name+'\n' for name in files))
print('Packaged standalone HTML, offline ZIP and SHA-256 checksums.')
