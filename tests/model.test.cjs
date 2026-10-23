const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8').split('<script>')[1].split('let params=')[0];
const model=vm.runInNewContext(source+'; ({simulate,DEFAULTS,rates})');
const run=p=>model.simulate({...model.DEFAULTS,...p});
const peak=d=>Math.max(...d.map(s=>s.v));
test('riposo stabile senza stimolo',()=>{assert.ok(run({amp:0}).every(s=>Math.abs(s.v+70)<.01));});
test('impulso normale: picco, iperpolarizzazione e recupero',()=>{const d=run({});assert.equal(d.length,2001);assert.equal(d.at(-1).t,10);assert.ok(peak(d)>25&&peak(d)<40);assert.ok(Math.min(...d.map(s=>s.v))<-78);assert.ok(Math.abs(d.at(-1).v+70)<2);const na=d.reduce((a,b)=>a.gna>b.gna?a:b),k=d.reduce((a,b)=>a.gk>b.gk?a:b);assert.ok(na.t<k.t);});
test('stimolo sottosoglia e blocco sodio non generano un impulso',()=>{assert.ok(peak(run({amp:5}))<-60);assert.ok(peak(run({na:0}))<0);});
test('correnti coerenti con conduttanza e tensione',()=>{for(const s of run({})){assert.ok(Math.abs(s.ina-s.gna*(s.v-45))<1e-9);assert.ok(Math.abs(s.ik-s.gk*(s.v+82))<1e-9);}});
test('estremi degli slider numericamente stabili',()=>{for(const na of [0,120,200])for(const k of [0,36,80])for(const amp of [0,50])for(const duration of [.1,3])for(const s of run({na,k,amp,duration})){assert.ok(Number.isFinite(s.v));for(const gate of ['m','h','n','c'])assert.ok(s[gate]>=0&&s[gate]<=1);}});
test('singolarità rimovibili finite',()=>{assert.ok(model.rates(-45).every(Number.isFinite));assert.ok(model.rates(-60).every(Number.isFinite));});
test('convergenza dimezzando il passo numerico',()=>{const fine=vm.runInNewContext(source.replace('DT=.005, COUNT=2000','DT=.0025, COUNT=4000')+'; simulate(DEFAULTS)');const coarse=run({});assert.ok(Math.max(...coarse.map((s,i)=>Math.abs(s.v-fine[2*i].v)))<.02);});
const engine=vm.runInNewContext(source+'; ({createRun,extendRun,activity})');
test('stimolo ritardato, recupero e indipendenza dai blocchi di avanzamento',()=>{
 const events=[{t:12,amp:20,duration:.5}],a=engine.createRun(model.DEFAULTS),b=engine.createRun(model.DEFAULTS);
 engine.extendRun(a,40,events);for(let t=1;t<=40;t++)engine.extendRun(b,t,events);
 assert.equal(a.rows.length,b.rows.length);for(let i=0;i<a.rows.length;i++)assert.equal(a.rows[i].v,b.rows[i].v);
 assert.ok(a.rows.filter(s=>s.t<12).every(s=>Math.abs(s.v+70)<.01));assert.ok(peak(a.rows)>25);assert.ok(Math.abs(a.rows.at(-1).v+70)<.01);
});
test('correnti basali presenti ma canali visivamente chiusi senza flusso animato',()=>{
 const r=engine.createRun(model.DEFAULTS);engine.extendRun(r,1,[]);const s=r.rows.at(-1),v=engine.activity(s,model.DEFAULTS);
 assert.ok(Math.abs(s.ina)>0);assert.equal(v[0].conducting,false);assert.equal(s.motion[0],0);
});
test('impulsi ravvicinati mantengono lo stato refrattario',()=>{
 const a=engine.createRun(model.DEFAULTS),b=engine.createRun(model.DEFAULTS);
 engine.extendRun(a,15,[{t:1,amp:20,duration:.5},{t:3,amp:20,duration:.5}]);engine.extendRun(b,15,[{t:1,amp:20,duration:.5}]);
 for(let i=0;i<=600;i++)assert.equal(a.rows[i].v,b.rows[i].v);
 assert.ok(Math.abs(a.rows[600].v+70)>10);
 assert.ok(a.rows.some((s,i)=>s.t>3&&Math.abs(s.v-b.rows[i].v)>.1));
});
test('registrazione lunga mantiene uno storico limitato senza interrompersi',()=>{
 const r=engine.createRun(model.DEFAULTS);engine.extendRun(r,130,[]);assert.equal(r.rows.length,24001);assert.equal(r.rows.at(-1).t,130);assert.equal(r.rows[0].t,10);assert.ok(Math.abs(r.rows.at(-1).v+70)<.01);
});
