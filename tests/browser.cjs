const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const server=require('node:http').createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(require('node:fs').readFileSync(path.resolve(__dirname,'../index.html')));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  const state=()=>page.evaluate(()=>({time,playing,v:sample(time).v,events:events.map(e=>({...e})),params:{...params}}));
  const slider=async(id,val)=>page.locator('#'+id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},val);
  await page.waitForTimeout(180);assert.ok((await state()).time>0);assert.equal((await state()).events.length,0);assert.ok(Math.abs((await state()).v+70)<.01);
  await page.click('#pause');const frozen=await page.locator('.grid').innerHTML();await page.waitForTimeout(180);assert.equal(await page.locator('.grid').innerHTML(),frozen);
  assert.equal(await page.locator('[data-channel="0"] [data-ion]').count(),0);
  const before=(await state()).time;await page.click('#step');assert.ok(Math.abs((await state()).time-before-.1)<1e-8);
  // More than ten ms elapse without an automatic pulse or a hard stop.
  await page.evaluate(()=>{time=12;ensureTime(time);render();});assert.equal((await state()).time,12);assert.ok(Math.abs((await state()).v+70)<.01);
  await page.click('#generate');assert.equal((await state()).time,12);assert.equal((await state()).events[0].t,12);assert.equal((await state()).playing,false);assert.ok(Math.abs((await state()).v+70)<.01);
  await page.click('#step');assert.equal((await state()).time,12.1);
  await page.evaluate(()=>{time=40;ensureTime(time);render();});
  assert.ok(await page.evaluate(()=>Math.max(...data.filter(s=>s.t>=12).map(s=>s.v))>25));assert.ok(Math.abs((await state()).v+70)<.1);
  // All displayed states agree with the gate; ions fit in an open pore.
  const checks=await page.evaluate(()=>{let openFrames=0,closedFrames=0;for(let t=12;t<20;t+=.025){time=t;render();for(const el of document.querySelectorAll('[data-channel]')){if(el.dataset.conducting==='false'){closedFrames++;if(el.querySelector('[data-ion]'))throw Error('Ione in un canale chiuso');}else openFrames++;}const stamps=['chart','membrane','circuit'].map(id=>$(id).dataset.time);if(new Set(stamps).size!==1)throw Error('Viste non sincronizzate');if(!$('circuit').textContent.includes($('voltageValue').textContent))throw Error('Tensioni diverse');}return {openFrames,closedFrames};});assert.ok(checks.openFrames>0&&checks.closedFrames>0);
  await slider('timeline',13.5);const rewind=await page.locator('.grid').innerHTML();await slider('timeline',22);await slider('timeline',13.5);assert.equal(await page.locator('.grid').innerHTML(),rewind);
  // New pulse in history branches from the actual state, without restoring rest.
  const pre=(await state()).v;await page.click('#generate');assert.equal((await state()).time,13.5);assert.ok(Math.abs((await state()).v-pre)<1e-9);assert.equal((await state()).events.length,2);
  await page.click('#pause');await page.waitForTimeout(180);assert.ok((await state()).time>13.5);await page.click('#pause');
  for(let i=0;i<5;i++){await slider('speed',i);assert.equal(await page.evaluate(()=>speed),[.1,.25,.5,1,2][i]);}
  await page.click('#experimentTab');assert.equal(await page.locator('#experiment').isVisible(),true);await page.click('#pause');
  for(const [id,v]of [['na',60],['k',50],['amp',5],['duration',1]]){await slider(id,v);assert.equal((await state()).params[id],v);assert.equal((await state()).events.length,0);await page.click('#pause');}
  await page.locator('#compare').uncheck();assert.equal(await page.locator('#refLegend').isVisible(),false);await page.locator('#compare').check();assert.equal(await page.locator('#refLegend').isVisible(),true);
  await page.click('#defaults');assert.deepEqual((await state()).params,{na:120,k:36,amp:20,duration:.5});await page.click('#pause');
  await slider('na',0);await page.click('#pause');await page.click('#generate');await page.evaluate(()=>{time=10;ensureTime(time);render();});assert.ok(await page.evaluate(()=>Math.max(...data.map(s=>s.v))<0));assert.ok(await page.evaluate(()=>Math.max(...reference.map(s=>s.v))>25));
  await page.click('#observe');assert.equal(await page.locator('#experiment').isVisible(),false);assert.equal((await state()).params.na,120);
  await page.click('#reset');assert.equal((await state()).events.length,0);assert.equal((await state()).playing,true);await page.click('#pause');
  await page.click('#generate');await page.evaluate(()=>{time=15;ensureTime(time);time=1.5;render();});await page.screenshot({path:path.join(require('node:os').tmpdir(),'neuro-lab-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(require('node:os').tmpdir(),'neuro-lab-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);
  console.log('PASS: tempo continuo oltre 10 ms, impulso al tempo corrente, recupero, impulsi ripetuti, canali coerenti per 320 fotogrammi, pausa, riavvolgimento, controlli, confronto e layout mobile.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
