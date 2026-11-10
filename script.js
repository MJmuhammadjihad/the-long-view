'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const chapters = [...document.querySelectorAll('.chapter')];
  const navLinks = [...document.querySelectorAll('.nav a')];
  if (location.protocol === 'file:') document.querySelector('a[download]').href = location.href.split('#')[0];
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  let menuOpen = false;
  function setMenu(open, restoreFocus = false) {
    menuOpen = !!open && !!narrow();
    $('sidebar').classList.toggle('open', menuOpen);
    $('mobile-shade').classList.toggle('open', menuOpen);
    $('menu-button').setAttribute('aria-expanded', String(menuOpen));
    $('menu-button').setAttribute('aria-label', menuOpen ? 'Close guide contents' : 'Open guide contents');
    $('sidebar').inert = !!narrow() && !menuOpen;
    if (restoreFocus) $('menu-button').focus();
  }
  function navigate() {
    let hash;
    try { hash = decodeURIComponent(location.hash.slice(1)); } catch { hash = ''; }
    const target = hash ? $(hash) : null;
    const section = target?.closest('.chapter') || chapters[0];
    chapters.forEach(c => c.classList.toggle('active', c === section));
    navLinks.forEach(a => {
      if (a.getAttribute('href') === '#' + section.id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const navLink = navLinks.find(a => a.getAttribute('href') === '#' + section.id);
    $('current-chapter').textContent = navLink ? navLink.textContent.replace(/^\d+\s*/, '').trim() : section.dataset.title;
    document.title = section.dataset.title + ' — The Long View';
    setMenu(false);
    if (target && hash !== 'main') {
      const focusTarget = target === section ? section.querySelector('h1') : target;
      if (focusTarget) { focusTarget.setAttribute('tabindex','-1'); focusTarget.focus({preventScroll:true}); }
    }
    if (target?.classList.contains('source')) {
      $('source-search').value = '';
      filterSources();
    }
    if (target && target !== section) {
      let parent = target.parentElement;
      while(parent && parent !== section) { if(parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
      requestAnimationFrame(() => target.scrollIntoView({behavior: reduced() ? 'instant' : 'smooth', block:'start'}));
    } else if (hash && hash !== 'main') {
      window.scrollTo({top: 0, behavior:'instant'});
    }
  }
  window.addEventListener('hashchange', navigate);
  $('menu-button').addEventListener('click', () => {
    setMenu(!menuOpen);
    if (menuOpen) navLinks[0].focus();
  });
  $('mobile-shade').addEventListener('click', () => setMenu(false, true));
  window.addEventListener('resize', () => setMenu(menuOpen));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (menuOpen) setMenu(false, true);
      if (!$('guide-search-panel').hidden) toggleSearch(false);
    }
    if (e.key === 'Tab' && menuOpen) {
      const focusable = [...$('sidebar').querySelectorAll('a,button,input,textarea,select')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // Allow activating an already selected chapter to return to its beginning.
  navLinks.forEach(a => a.addEventListener('click', () => {
    if (location.hash === a.getAttribute('href')) { navigate(); setMenu(false); }
  }));
  function toggleSearch(open) {
    $('guide-search-panel').hidden = !open;
    $('search-button').setAttribute('aria-expanded', String(open));
    if (open) { window.scrollTo({top:0,behavior:'instant'}); $('guide-search').focus(); }
    else $('search-button').focus();
  }
  $('search-button').addEventListener('click', () => toggleSearch($('guide-search-panel').hidden));
  const searchIndex=[];
  chapters.forEach(c=>{
    let current={id:c.id,title:c.dataset.title,text:''};searchIndex.push(current);
    for(const el of c.children){
      if(el.tagName==='H2' && el.id){current={id:el.id,title:c.dataset.title+' / '+el.textContent,text:''};searchIndex.push(current);}
      if(!el.classList.contains('chapter-tools') && !el.classList.contains('chapter-footer'))current.text+=' '+el.textContent.replace(/\s+/g,' ');
    }
  });
  $('guide-search').addEventListener('input', () => {
    const q=$('guide-search').value.trim().toLowerCase(),results=$('search-results');results.replaceChildren();
    if(q.length<2){results.textContent='Enter at least two characters.';return;}
    const matches=searchIndex.filter(item=>(item.title+' '+item.text).toLowerCase().includes(q));
    const count=document.createElement('p');count.className='small';count.textContent=matches.length?'Showing '+Math.min(matches.length,12)+' of '+matches.length+' matching sections. Refine your words to narrow the results.':'No matching sections. Try a broader word, such as income, degree or land.';results.append(count);
    for(const result of matches.slice(0,12)){
      const a=document.createElement('a');a.className='search-result';a.href='#'+result.id;
      const strong=document.createElement('strong');strong.textContent=result.title;
      const snippet=document.createElement('small'),start=Math.max(0,result.text.toLowerCase().indexOf(q)-55);
      snippet.textContent=(start?'…':'')+result.text.slice(start,start+190)+'…';a.append(strong,snippet);
      a.addEventListener('click',()=>{toggleSearch(false);if(location.hash===a.getAttribute('href'))navigate();});results.append(a);
    }
  });
  const opportunities = [...document.querySelectorAll('.opportunity')];
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    opportunities.forEach(card=>card.hidden=filter !== 'all' && card.dataset.category !== filter);
    const count = opportunities.filter(c=>!c.hidden).length;
    $('opp-count').textContent = count + (count===1?' opportunity':' opportunities') + ' · hypotheses to investigate, not promised returns';
  }));
  const sourceItems = [...document.querySelectorAll('.source')];
  function filterSources() {
    const q = $('source-search').value.trim().toLowerCase();
    sourceItems.forEach(s=>s.hidden=!s.dataset.sourceText.includes(q));
    const count=sourceItems.filter(s=>!s.hidden).length;
    $('source-count').textContent=count+' of '+sourceItems.length+' research and learning references';
    $('source-empty').hidden=count!==0;
  }
  $('source-search').addEventListener('input',filterSources);
  const currencySymbols={BDT:'৳',USD:'$',EUR:'€',GBP:'£',INR:'₹'};
  let currency='BDT';
  const money=value=>currencySymbols[currency]+Math.round(value).toLocaleString(currency==='BDT'||currency==='INR'?'en-IN':'en-US');
  function readNumber(id,min,max,integer=false) {
    const raw=$(id).value.trim(); const n=Number(raw);
    return raw!=='' && Number.isFinite(n) && n>=min && n<=max && (!integer || Number.isInteger(n)) ? n : null;
  }
  function budget() {
    const income=readNumber('net-income',0,100000000), essentials=readNumber('essential-cost',0,100000000), study=readNumber('study-cost',0,100000000), months=readNumber('reserve-months',1,24,true);
    const out=$('budget-output');
    if(['net-income','essential-cost','study-cost'].every(id=>$(id).value.trim()==='')){out.innerHTML='<p>Enter actual monthly income and costs, or load the clearly labelled illustration.</p>';return;}
    if([income,essentials,study,months].includes(null)) { out.innerHTML='<p class="error">Enter valid nonnegative amounts and a whole-number reserve goal from 1 to 24 months.</p>';return; }
    const surplus=income-essentials-study, goal=essentials*months;
    let status=essentials===0?'Enter realistic essential spending to calculate a meaningful household reserve.':surplus<=0?'No reserve-building capacity at these amounts. Reduce costs, adjust education funding or increase income before allocating money to risky investments.':'Starting from zero, about '+Math.ceil(goal/surplus)+' months to fund this reserve if all surplus is saved.';
    out.innerHTML='<span class="eyebrow">'+(surplus<0?'Monthly shortfall':'Available monthly surplus')+'</span><b>'+money(Math.abs(surplus))+'</b><p>Reserve target: '+money(goal)+' ('+months+' months of essentials).</p><p>'+status+'</p>';
  }
  ['net-income','essential-cost','study-cost','reserve-months'].forEach(id=>$(id).addEventListener('input',budget));
  function enhanceTables(){document.querySelectorAll('.table-wrap').forEach(el=>{el.setAttribute('tabindex','0');el.setAttribute('role','region');el.setAttribute('aria-label','Data table; scroll horizontally if needed');});}
  function futureValue(monthly,years,annual) {
    const months=years*12, rate=Math.pow(1+annual/100,1/12)-1;
    return Math.abs(rate)<1e-12?monthly*months:monthly*Math.expm1(months*Math.log1p(rate))/rate;
  }
  function wealth() {
    const monthly=readNumber('monthly-saving',0,10000000),years=readNumber('saving-years',1,40,true),annual=readNumber('real-return',-10,12);
    if([monthly,years,annual].includes(null)) { $('wealth-output').innerHTML='<p class="error">Use a nonnegative monthly contribution, whole years from 1–40, and a real return assumption from −10% to 12%.</p>';$('wealth-chart').replaceChildren();$('wealth-scenarios').replaceChildren();return; }
    const value=futureValue(monthly,years,annual),paid=monthly*12*years;
    $('wealth-output').innerHTML='<span class="eyebrow">Illustrative ending value · today’s purchasing power</span><b>'+money(value)+'</b><p>Contributed: '+money(paid)+' over '+years+' years. Assumed real return: '+annual+'% per year.</p>';
    const max=Math.max(value,paid,1),w=405;
    $('wealth-chart').innerHTML='<title>Illustrative contributions and ending value</title><desc>Contributions '+money(paid)+'. Ending value '+money(value)+'. Values are hypothetical and in today’s purchasing power.</desc><text x="5" y="29" fill="#52634d" font-size="13">Total contributed</text><rect x="5" y="42" width="'+(paid/max*w)+'" height="25" rx="4" fill="#b9cbaa"/><text x="5" y="91" fill="#52634d" font-size="13">'+money(paid)+'</text><text x="5" y="121" fill="#52634d" font-size="13">Illustrative ending value</text><rect x="5" y="134" width="'+(value/max*w)+'" height="25" rx="4" fill="#315c43"/><text x="5" y="183" fill="#52634d" font-size="13">'+money(value)+'</text>';
    $('wealth-chart').setAttribute('aria-label','Illustrative contributions '+money(paid)+' and ending value '+money(value));
    const rates=[...new Set([-2,0,annual,5])].sort((a,b)=>a-b);
    $('wealth-scenarios').innerHTML='<div class="table-wrap"><table><caption>Return sensitivity · scenarios, not probabilities</caption><thead><tr><th>Annual real return</th><th>Ending value</th></tr></thead><tbody>'+rates.map(r=>'<tr><td>'+r+'%'+(r===annual?' · your assumption':'')+'</td><td>'+money(futureValue(monthly,years,r))+'</td></tr>').join('')+'</tbody></table></div>';
  }
  const rawWealth=wealth;wealth=()=>{rawWealth();enhanceTables();};
  ['monthly-saving','saving-years','real-return'].forEach(id=>$(id).addEventListener('input',wealth));
  const storageKey='the-long-view-public-v1';
  const checkboxes=[...document.querySelectorAll('[data-check]')];
  const journals=[...document.querySelectorAll('[data-journal]')];
  let saved={checks:{},journal:{}}, storageAvailable=true;
  try { const raw=localStorage.getItem(storageKey); if(raw) { const parsed=JSON.parse(raw); if(parsed && typeof parsed==='object') { if(parsed.checks && typeof parsed.checks==='object') saved.checks=parsed.checks; if(parsed.journal && typeof parsed.journal==='object') saved.journal=parsed.journal; } } } catch { storageAvailable=false; }
  checkboxes.forEach(c=>c.checked=saved.checks[c.dataset.check]===true);
  journals.forEach(j=>j.value=typeof saved.journal[j.dataset.journal]==='string'?saved.journal[j.dataset.journal].slice(0,8000):'');
  function updateProgress() {
    const count=checkboxes.filter(c=>c.checked).length;
    $('sidebar-progress').textContent=count+' / '+checkboxes.length;
    $('progress-bar').style.width=(count/checkboxes.length*100)+'%';
    $('check-completion').textContent=count+' of '+checkboxes.length+' completed';
  }
  function currentNotes() {
    return {edition:'Public 1.0 · 10 November 2026',exportedAt:new Date().toISOString(),checks:Object.fromEntries(checkboxes.map(c=>[c.dataset.check,c.checked])),journal:Object.fromEntries(journals.map(j=>[j.dataset.journal,j.value]))};
  }
  function save() {
    updateProgress();
    try { localStorage.setItem(storageKey,JSON.stringify(currentNotes())); storageAvailable=true;$('storage-status').textContent='Saved in this browser. Export your notes for a backup.'; }
    catch { storageAvailable=false;$('storage-status').textContent='Browser storage is unavailable or full. Your entries work for this session; export them before closing.'; }
  }
  checkboxes.forEach(c=>c.addEventListener('change',save));
  journals.forEach(j=>j.addEventListener('input',save));
  if(!storageAvailable) $('storage-status').textContent='Browser storage is unavailable. Export your notes to keep a copy.';
  else if(Object.keys(saved.journal).length || Object.keys(saved.checks).length) $('storage-status').textContent='Loaded your saved entries from this browser.';
  $('export-notes').addEventListener('click',()=>{
    const data=currentNotes();
    let text='THE LONG VIEW — MY WORKING NOTES\nEdition: '+data.edition+'\nExported: '+data.exportedAt+'\n\nCHECKLIST\n';
    checkboxes.forEach(c=>text+=(c.checked?'[x] ':'[ ] ')+c.parentElement.textContent.trim()+'\n');
    text+='\nDECISION JOURNAL\n';journals.forEach(j=>text+='\n'+document.querySelector('label[for="'+j.id+'"]').textContent+'\n'+(j.value||'(Not yet entered)')+'\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})); const a=document.createElement('a');a.href=url;a.download='the-long-view-my-notes.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('storage-status').textContent='Notes export created. Keep the downloaded file somewhere private.';
  });
  $('reset-notes').addEventListener('click',()=>{$('reset-confirm').hidden=false;$('confirm-reset').focus();});
  $('cancel-reset').addEventListener('click',()=>{$('reset-confirm').hidden=true;$('reset-notes').focus();});
  $('confirm-reset').addEventListener('click',()=>{
    checkboxes.forEach(c=>c.checked=false);journals.forEach(j=>j.value='');updateProgress();
    try { localStorage.removeItem(storageKey);$('storage-status').textContent='This toolkit’s saved journal and checklist were cleared from this browser.'; }
    catch {$('storage-status').textContent='Entries cleared for this session. Browser storage could not be accessed.';}
    $('reset-confirm').hidden=true;$('reset-notes').focus();
  });
  let originallyOpen=[];
  window.addEventListener('beforeprint',()=>{originallyOpen=[...document.querySelectorAll('details')].filter(d=>d.open);document.querySelectorAll('details').forEach(d=>d.open=true);});
  window.addEventListener('afterprint',()=>{document.querySelectorAll('details').forEach(d=>d.open=originallyOpen.includes(d));});
  $('print-button').addEventListener('click',()=>window.print());
  // Edition 02 adds decision tools; household inputs deliberately stay out of storage.
  document.querySelectorAll('[data-learn]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-learn]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.querySelectorAll('[data-learn-route]').forEach(card=>card.hidden=button.dataset.learn!=='all' && card.dataset.learnRoute!==button.dataset.learn);
  }));
  $('budget-example').addEventListener('click',()=>{['net-income','essential-cost','study-cost'].forEach((id,i)=>$(id).value=[50000,30000,10000][i]);$('reserve-months').value=6;budget();});
  function degreeCost() {
    const credits=readNumber('degree-credits',0,300,true),price=readNumber('degree-price',0,1000000),extras=readNumber('degree-extras',0,100000000),months=readNumber('degree-months',1,120,true);
    const benefit=$('degree-benefit').value.trim()===''?undefined:readNumber('degree-benefit',0,1000000);
    if(['degree-credits','degree-price'].every(id=>$(id).value.trim()==='')){$('degree-output').innerHTML='<p>Enter remaining credits and tuition, or load a clearly labelled illustration.</p>';return;}
    if([credits,price,extras,months,benefit].includes(null)){$('degree-output').innerHTML='<p class="error">Enter valid nonnegative costs, whole credits (0–300), and whole months (1–120). Extra monthly income is optional and must be nonnegative.</p>';return;}
    const cost=credits*price+extras;
    const payback=benefit===undefined?'Add an optional assumed income difference to see simple payback.':benefit===0?'At zero additional income, there is no income-based payback; nonfinancial benefits are separate.':'Simple payback: '+Math.ceil(cost/benefit)+' months of the assumed extra income, after it starts.';
    $('degree-output').innerHTML='<span class="eyebrow">Remaining cost entered · not a return estimate</span><b>'+money(cost)+'</b><p>Average provision over '+months+' months: '+money(cost/months)+' / month. Actual bills may come earlier.</p><p>'+payback+'</p>';
  }
  ['degree-credits','degree-price','degree-extras','degree-months','degree-benefit'].forEach(id=>$(id).addEventListener('input',degreeCost));
  $('degree-example').addEventListener('click',()=>{['degree-credits','degree-price','degree-extras','degree-months'].forEach((id,i)=>$(id).value=[40,5000,0,24][i]);$('degree-benefit').value='';degreeCost();});
  function workload(){
    const ids=['hours-total','hours-study','hours-job','hours-travel','hours-market'];
    const values=ids.map(id=>readNumber(id,0,80));
    if(values.includes(null)){$('hours-output').innerHTML='<p>Enter all five weekly amounts (0–80 hours each). Use zero where a commitment does not apply.</p>';return;}
    const allocated=values.slice(1).reduce((a,b)=>a+b,0),left=values[0]-allocated;
    $('hours-output').innerHTML='<span class="eyebrow">'+(left<0?'The week is overcommitted':'Remaining for practice and buffer')+'</span><b>'+Math.abs(Math.round(left*10)/10)+' hours'+(left<0?' over your ceiling':'')+'</b><p>'+allocated+' hours already assigned out of '+values[0]+'. '+(left<0?'Reduce or reschedule commitments before adding a learning plan.':left===0?'There is no capacity left under this ceiling. Make a deliberate tradeoff.':'Keep some of the remainder unallocated for illness, interruptions and recovery.')+'</p>';
  }
  ['hours-total','hours-study','hours-job','hours-travel','hours-market'].forEach(id=>$(id).addEventListener('input',workload));
  $('hours-example').addEventListener('click',()=>{['hours-total','hours-study','hours-job','hours-travel','hours-market'].forEach((id,i)=>$(id).value=[60,20,0,8,7][i]);workload();});
  const runwayInputs=['runway-rate-a','runway-rate-b','runway-rate-c','runway-cash','runway-expenses','runway-support','runway-support-months','runway-start',...Array.from({length:6},(_,i)=>'tuition-'+(i+1))];
  function runway(){
    const cash=readNumber('runway-cash',0,100000000),expenses=readNumber('runway-expenses',0,100000000),support=readNumber('runway-support',0,100000000),duration=readNumber('runway-support-months',0,6,true),start=readNumber('runway-start',1,6,true);
    const rates=[0,...['a','b','c'].map(key=>readNumber('runway-rate-'+key,0,100000000))];
    [...$('runway-detail').options].forEach((o,i)=>{if(rates[i]!==null)o.textContent=money(rates[i])+' net income / month';});
    const bills=Array.from({length:6},(_,i)=>readNumber('tuition-'+(i+1),0,100000000));
    if([cash,expenses,support,duration,start,...bills,...rates].includes(null)){$('runway-output').innerHTML='<p class="note">Complete the cash, spending and support facts. Use nonnegative amounts, a support duration of 0–6 whole months and an income start month of 1–6. Check every exceptional bill and scenario income field.</p>';$('runway-monthly').replaceChildren();return;}

    const scenarios=rates.map(rate=>{
      let balance=cash,low=cash,first=null;
      const rows=Array.from({length:6},(_,i)=>{const month=i+1,income=month>=start?rate:0,help=month<=duration?support:0;balance+=income+help-expenses-bills[i];low=Math.min(low,balance);if(balance<0 && first===null)first=month;return {month,income,help,bill:bills[i],balance};});
      return {rate,rows,balance,gap:Math.max(0,-low),first};
    });
    $('runway-output').innerHTML='<div class="table-wrap"><table><caption>Six-month stress cases · monthly net income begins in month '+start+'</caption><thead><tr><th>Assumed monthly income</th><th>First negative month-end</th><th>Largest funding gap</th><th>Month-six balance</th></tr></thead><tbody>'+scenarios.map(s=>'<tr><th scope="row">'+money(s.rate)+'</th><td>'+(s.first===null?'None in model':'Month '+s.first)+'</td><td>'+money(s.gap)+'</td><td class="'+(s.balance<0?'cash-negative':'')+'">'+money(s.balance)+'</td></tr>').join('')+'</tbody></table></div><p class="small">“Largest funding gap” is the extra starting cash that would prevent a negative month-end balance under that scenario. It is not a recommendation to borrow. A positive final balance does not erase an earlier shortfall.'+(expenses===0?' You entered zero essentials: check that someone else reliably covers all costs omitted here.':'')+'</p>';
    const selected=scenarios[Number($('runway-detail').value)]||scenarios[0];
    $('runway-monthly').innerHTML='<div class="table-wrap"><table><caption>Monthly detail · '+money(selected.rate)+' scenario · starting cash '+money(cash)+'</caption><thead><tr><th>Month</th><th>Collected income</th><th>Family support</th><th>Essentials + bills</th><th>End balance</th></tr></thead><tbody>'+selected.rows.map(r=>'<tr><th scope="row">'+r.month+'</th><td>'+money(r.income)+'</td><td>'+money(r.help)+'</td><td>'+money(expenses+r.bill)+'</td><td class="'+(r.balance<0?'cash-negative':'')+'">'+money(r.balance)+'</td></tr>').join('')+'</tbody></table></div>';
  }
  const rawRunway=runway;runway=()=>{rawRunway();enhanceTables();};
  runwayInputs.forEach(id=>$(id).addEventListener('input',runway));$('runway-detail').addEventListener('change',runway);
  $('runway-example').addEventListener('click',()=>{
    ['runway-cash','runway-expenses','runway-support','runway-support-months','runway-start'].forEach((id,i)=>$(id).value=[60000,30000,30000,3,4][i]);
    for(let i=1;i<=6;i++)$('tuition-'+i).value=i===2 || i===5?20000:0;
    ['a','b','c'].forEach((key,i)=>$('runway-rate-'+key).value=[20000,35000,50000][i]);
    runway();
  });
  $('runway-clear').addEventListener('click',()=>{
    ['runway-cash','runway-expenses','runway-support','runway-support-months'].forEach(id=>$(id).value='');$('runway-start').value=4;
    for(let i=1;i<=6;i++)$('tuition-'+i).value=0;
    runway();$('runway-cash').focus();
  });
  function downloadData(data,name,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('export-json').addEventListener('click',()=>{downloadData(JSON.stringify({format:'TheLongView',version:1,...currentNotes()},null,2),'the-long-view-backup.json','application/json');$('import-status').textContent='JSON backup created. Keep this file private; restore it with the button above.';});
  let pendingImport=null,importSequence=0;
  function validateBackup(parsed){
    if(!parsed || parsed.format!=='TheLongView' || parsed.version!==1 || !parsed.checks || !parsed.journal || typeof parsed.checks!=='object' || typeof parsed.journal!=='object' || Array.isArray(parsed.checks) || Array.isArray(parsed.journal))throw Error('This is not a supported Long View JSON backup. Text exports cannot be restored automatically.');
    const clean={checks:{},journal:{}};
    checkboxes.forEach(c=>{const key=c.dataset.check,v=Object.hasOwn(parsed.checks,key)?parsed.checks[key]:false;if(typeof v!=='boolean')throw Error('The backup contains an invalid checklist value.');clean.checks[key]=v;});
    journals.forEach(j=>{const key=j.dataset.journal,v=Object.hasOwn(parsed.journal,key)?parsed.journal[key]:'';if(typeof v!=='string' || v.length>8000)throw Error('The backup contains an invalid or oversized journal field.');clean.journal[key]=v;});
    return clean;
  }
  $('import-notes').addEventListener('change',async()=>{
    const sequence=++importSequence;pendingImport=null;$('import-preview').hidden=true;
    const file=$('import-notes').files?.[0];if(!file){$('import-status').textContent='No backup selected.';return;}
    try{
      if(file.size>262144)throw Error('This file is too large. Choose a Long View JSON backup under 256 KB.');
      const parsed=validateBackup(JSON.parse(await file.text()));if(sequence!==importSequence)return;
      pendingImport=parsed;$('import-summary').textContent='Ready to restore '+Object.values(parsed.checks).filter(Boolean).length+' completed checklist items and '+Object.values(parsed.journal).filter(x=>x.trim()).length+' nonempty journal fields.';
      $('import-preview').hidden=false;$('import-status').textContent='Backup checked. Your existing entries have not changed.';$('confirm-import').focus();
    }catch(error){if(sequence!==importSequence)return;pendingImport=null;$('import-status').textContent=error instanceof SyntaxError?'The file is not valid JSON. Choose the original downloaded backup.':error.message;}
  });
  $('cancel-import').addEventListener('click',()=>{pendingImport=null;importSequence++;$('import-preview').hidden=true;$('import-notes').value='';$('import-status').textContent='Restore cancelled. Your entries are unchanged.';$('import-notes').focus();});
  $('confirm-import').addEventListener('click',()=>{
    if(!pendingImport)return;
    checkboxes.forEach(c=>c.checked=pendingImport.checks[c.dataset.check]);journals.forEach(j=>j.value=pendingImport.journal[j.dataset.journal]);save();
    pendingImport=null;importSequence++;$('import-preview').hidden=true;$('import-notes').value='';$('import-status').textContent=storageAvailable?'Backup restored and saved in this browser.':'Backup restored for this session. Browser storage is unavailable; keep your backup.';$('journal-decision').focus();
  });
  document.addEventListener('keydown',e=>{if(e.key==='/' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target?.closest('input,textarea,select,[contenteditable="true"]')){e.preventDefault();toggleSearch(true);}});
  const unitLabels=[...document.querySelectorAll('.field label')].filter(el=>el.textContent.includes('৳'));
  unitLabels.forEach(el=>el.dataset.originalLabel=el.textContent);
  $('calculator-unit').addEventListener('change',()=>{
    currency=Object.hasOwn(currencySymbols,$('calculator-unit').value)?$('calculator-unit').value:'BDT';
    unitLabels.forEach(el=>el.textContent=el.dataset.originalLabel.replaceAll('৳',currencySymbols[currency]));
    degreeCost();budget();wealth();runway();
  });
  degreeCost();workload();runway();

  budget();wealth();updateProgress();setMenu(false);navigate();
  enhanceTables();
  document.documentElement.classList.add('js');
})();
