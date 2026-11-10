const fs=require('fs'),vm=require('vm'),assert=require('assert');
const {parseHTML}=require('linkedom');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
const script=fs.readFileSync(require('path').join(__dirname,'../script.js'),'utf8');
function setup(storageSeed,failStorage=false,hash='') {
  const parsedWindow=parseHTML(html).window;const {document}=parsedWindow; const window={Event:parsedWindow.Event};
  const listeners={};const stored=new Map(Object.entries(storageSeed||{}));
  const loc={hash};
  window.matchMedia=()=>({matches:false});window.scrollTo=()=>{};window.print=()=>{};
  window.addEventListener=(type,cb)=>(listeners[type]??=[]).push(cb);
  const store={getItem:k=>{if(failStorage)throw Error('blocked');return stored.get(k)||null;},setItem:(k,v)=>{if(failStorage)throw Error('blocked');stored.set(k,v);},removeItem:k=>{if(failStorage)throw Error('blocked');stored.delete(k);}};
  for(const el of document.querySelectorAll('*')) {el.scrollIntoView=()=>{};el.focus=()=>{};}
  const context={window,document,location:loc,localStorage:store,requestAnimationFrame:f=>f(),setTimeout:f=>f(),URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},Blob,console};
  vm.runInNewContext(script,context,{timeout:3000});
  return {window,document,listeners,stored,loc,$:id=>document.getElementById(id),input(id,value){const e=this.$(id);e.value=String(value);e.dispatchEvent(new window.Event('input'));},click(id){this.$(id).dispatchEvent(new window.Event('click'));}};
}
let t=setup();
assert(t.document.documentElement.classList.contains('js'));
assert.equal(t.document.querySelectorAll('.chapter.active').length,1);
assert(t.$('budget-output').textContent.includes('actual'));
t.click('budget-example');
assert(t.$('budget-output').textContent.includes('10,000'));
assert(t.$('budget-output').textContent.includes('18 months'));
t.input('net-income',10000);assert(t.$('budget-output').textContent.includes('shortfall'));assert(t.$('budget-output').textContent.includes('30,000'));
t.input('net-income','');assert(t.$('budget-output').textContent.includes('valid'));
t.input('net-income','-10');assert(t.$('budget-output').textContent.includes('valid'));
t.input('net-income',50000);t.input('essential-cost',0);assert(t.$('budget-output').textContent.includes('realistic essential'));
t.input('reserve-months',1.5);assert(t.$('budget-output').textContent.includes('valid'));
t.input('monthly-saving',5000);t.input('saving-years',20);t.input('real-return',0);assert(t.$('wealth-output').textContent.includes('12,00,000'));
t.input('monthly-saving',0);assert(t.$('wealth-output').textContent.includes('৳0'));
t.input('monthly-saving',5000);t.input('real-return',-2);assert(!t.$('wealth-output').textContent.includes('NaN'));
t.input('saving-years',0);assert(t.$('wealth-output').textContent.includes('whole years'));
t.input('saving-years',40);t.input('real-return',12);t.input('monthly-saving',10000000);assert(!t.$('wealth-output').textContent.includes('Infinity'));
t.input('source-search','unmatchable-violet-rabbit');assert.equal(t.document.querySelectorAll('.source:not([hidden])').length,0);assert.equal(t.$('source-empty').hidden,false);
t.loc.hash='#source-12';t.listeners.hashchange.forEach(f=>f());assert(t.$('sources').classList.contains('active'));assert.equal(t.$('source-search').value,'');assert.equal(t.$('source-12').hidden,false);
for(const filter of ['now','next','later','all']) {const btn=t.document.querySelector('[data-filter="'+filter+'"]');btn.dispatchEvent(new t.window.Event('click'));assert.equal(t.document.querySelectorAll('.opportunity:not([hidden])').length,{now:2,next:2,later:3,all:7}[filter]);}
t.input('guide-search','degree');assert(t.$('search-results').querySelector('a'));
t.input('guide-search','<script>alert(1)</script>');assert.equal(t.$('search-results').querySelectorAll('script').length,0);
t.input('journal-decision','Test <script> as literal text');assert(t.stored.get('the-long-view-public-v1').includes('literal text'));
let cb=t.document.querySelector('[data-check]');cb.checked=true;cb.dispatchEvent(new t.window.Event('change'));assert(t.$('sidebar-progress').textContent.startsWith('1 /'));
let reloaded=setup(Object.fromEntries(t.stored));assert.equal(reloaded.$('journal-decision').value,'Test <script> as literal text');assert.equal(reloaded.document.querySelector('[data-check]').checked,true);
t.click('reset-notes');assert.equal(t.$('reset-confirm').hidden,false);t.click('cancel-reset');assert.equal(t.$('reset-confirm').hidden,true);assert(t.$('journal-decision').value.length);
t.click('reset-notes');t.click('confirm-reset');assert.equal(t.$('journal-decision').value,'');assert(!t.stored.has('the-long-view-public-v1'));
t=setup({},true);t.input('journal-decision','Unsaved');assert(t.$('storage-status').textContent.includes('unavailable'));
t=setup({'the-long-view-public-v1':'{bad json'});assert(t.document.documentElement.classList.contains('js'));
t=setup({},false,'#%ZZ');assert(t.$('start').classList.contains('active'));
t=setup({},false,'#not-real');assert(t.$('start').classList.contains('active'));
t.click('export-notes'); assert(t.$('storage-status').textContent.includes('export created')); const det=t.document.querySelector('details'); det.open=false; t.listeners.beforeprint.forEach(f=>f()); assert(det.open); t.listeners.afterprint.forEach(f=>f()); assert(!det.open);
const ids=[...t.document.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
for(const a of t.document.querySelectorAll('a[href^="#"]'))assert(ids.includes(a.getAttribute('href').slice(1)),'Broken anchor '+a.getAttribute('href'));
for(const input of t.document.querySelectorAll('input:not([type="checkbox"]),textarea,select'))assert(t.document.querySelector('label[for="'+input.id+'"]')||input.closest('label'),'Unlabelled input '+input.id);
assert.equal(t.document.querySelectorAll('[data-check]').length,14);
assert.equal(t.document.querySelectorAll('.source').length,31);
assert.equal(t.document.querySelectorAll('.chapter').length,12);
assert.equal(t.document.querySelectorAll('script[src],link[rel=stylesheet],img[src]').length,0);
const wordCount=t.document.querySelector('main').textContent.split(/\s+/).length;
console.log('PASS: initialization, chapter navigation, sources, filters, search, calculator boundaries, persistence, reset, storage failure, corrupted data, anchors, labels and offline asset independence.');
console.log('Chapters: 12. Sources: 31. Checklist items: 14. Approximate main-content words:',wordCount);
console.log('Browser visual/layout QA is not included in this DOM test.');

// Revision calculators: test outputs and edge cases, not just absence of exceptions.
t=setup();
assert(t.$('degree-output').textContent.includes('remaining credits'));
t.click('degree-example');
assert(t.$('degree-output').textContent.includes('2,00,000'));
assert(t.$('degree-output').textContent.includes('8,333'));
t.input('degree-benefit',10000);assert(t.$('degree-output').textContent.includes('20 months'));
t.input('degree-benefit',0);assert(t.$('degree-output').textContent.includes('no income-based payback'));
t.input('degree-credits',0.5);assert(t.$('degree-output').textContent.includes('whole credits'));
t.input('degree-credits',40);t.input('degree-months',0);assert(t.$('degree-output').textContent.includes('whole months'));
t.click('hours-example');assert(t.$('hours-output').textContent.includes('25 hours'));
t.input('hours-job',40);assert(t.$('hours-output').textContent.includes('15 hours over'));
t.input('hours-job','');assert(t.$('hours-output').textContent.includes('Enter all five'));
assert(!t.$('runway-output').querySelector('table'));
t.click('runway-example');
let rows=[...t.$('runway-output').querySelectorAll('tbody tr')];
assert.equal(rows.length,4);
assert(rows[0].textContent.includes('Month 5'));assert(rows[0].textContent.includes('70,000'));assert(rows[0].textContent.includes('−70,000') || rows[0].textContent.includes('-70,000'));
assert(rows[1].textContent.includes('Month 6'));assert(rows[1].textContent.includes('10,000'));
assert(rows[2].textContent.includes('None in model'));assert(rows[2].textContent.includes('35,000'));
assert(rows[3].textContent.includes('80,000'));
assert.equal(t.$('runway-monthly').querySelectorAll('tbody tr').length,6);
t.input('runway-support-months',1.5);assert(!t.$('runway-output').querySelector('table'));
t.input('runway-support-months',3);t.input('tuition-1',-1);assert(!t.$('runway-output').querySelector('table'));
t.click('runway-clear');assert.equal(t.$('runway-cash').value,'');assert(!t.$('runway-monthly').querySelector('table'));
for(const route of ['development','support','bridge','all']){const btn=t.document.querySelector('[data-learn="'+route+'"]');btn.dispatchEvent(new t.window.Event('click'));assert.equal(t.document.querySelectorAll('[data-learn-route]:not([hidden])').length,route==='all'?3:1);}
t.input('guide-search','payback');assert(t.$('search-results').querySelector('a').getAttribute('href').includes('degree-section-'));
t.click('export-json');assert(t.$('import-status').textContent.includes('JSON backup created'));
async function importFile(test,data,size){Object.defineProperty(test.$('import-notes'),'files',{configurable:true,value:[{size:size??data.length,text:async()=>data}]});test.$('import-notes').dispatchEvent(new test.window.Event('change'));await new Promise(resolve=>setImmediate(resolve));}
(async()=>{
  const test=setup();test.input('journal-decision','Original notes');
  await importFile(test,'{bad');assert(test.$('import-status').textContent.includes('not valid JSON'));assert.equal(test.$('journal-decision').value,'Original notes');
  await importFile(test,JSON.stringify({format:'Unknown',version:1,checks:{},journal:{}}));assert(test.$('import-status').textContent.includes('not a supported'));
  await importFile(test,'{}',262145);assert(test.$('import-status').textContent.includes('too large'));
  await importFile(test,JSON.stringify({format:'TheLongView',version:1,checks:{'first-budget':'yes'},journal:{}}));assert(test.$('import-status').textContent.includes('invalid checklist'));
  await importFile(test,JSON.stringify({format:'TheLongView',version:1,checks:{},journal:{decision:'x'.repeat(8001)}}));assert(test.$('import-status').textContent.includes('oversized'));
  const backup=JSON.stringify({format:'TheLongView',version:1,checks:{'first-budget':true},journal:{decision:'New <script>alert(1)</script> notes'}});
  await importFile(test,backup);assert.equal(test.$('import-preview').hidden,false);assert.equal(test.$('journal-decision').value,'Original notes');test.click('cancel-import');assert.equal(test.$('journal-decision').value,'Original notes');
  await importFile(test,backup);test.click('confirm-import');assert.equal(test.$('journal-decision').value,'New <script>alert(1)</script> notes');assert.equal(test.$('import-preview').hidden,true);assert(test.stored.get('the-long-view-public-v1').includes('New'));
  const blocked=setup({},true);await importFile(blocked,backup);blocked.click('confirm-import');assert(blocked.$('import-status').textContent.includes('storage is unavailable'));
  console.log('PASS: degree costs, optional payback, workload overcommitment, six-month cash scenarios, blank/invalid boundaries, route comparison, section search and JSON restore validation/confirmation.');
})().catch(e=>{console.error(e);process.exitCode=1;});

// Currency is a unit selector, never an exchange-rate conversion.
let unitTest=setup();unitTest.click('budget-example');unitTest.click('runway-example');
const unitSelect=unitTest.$('calculator-unit');for(const o of unitSelect.options){if(o.value==='USD')o.setAttribute('selected','');else o.removeAttribute('selected');}unitSelect.dispatchEvent(new unitTest.window.Event('change'));
assert.equal(unitTest.$('net-income').value,'50000');assert(unitTest.$('budget-output').textContent.includes('$10,000'));assert(unitTest.document.querySelector('label[for="net-income"]').textContent.includes('$'));
assert(unitTest.$('source-28').textContent.includes('25,000'));
unitTest.input('runway-rate-c',60000);let customRows=[...unitTest.$('runway-output').querySelectorAll('tbody tr')];assert(customRows[3].textContent.includes('$110,000'));
unitTest.input('runway-rate-c',-1);assert(!unitTest.$('runway-output').querySelector('table'));
console.log('PASS: calculator currency units leave numbers and cited evidence unchanged; editable cash scenarios recalculate and validate.');
