const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(name, mocks = {}) {
  const filename = path.resolve(root, name);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const localRequire = id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('@/')) return load(id.slice(2) + '.ts', mocks);
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename),id)) + '.ts', mocks);
    return require(id);
  };
  vm.runInThisContext('(function(require,module,exports){' + source + '\n})', { filename })(localRequire,module,module.exports);
  return module.exports;
}
const options = load('lib/booking-options.ts');
const { bookingSchema } = load('lib/booking-validation.ts');
const customer = { name:'Isolated QA',phone:'5735550100',email:'qa@example.test',address:'123 Test Lane',city:'Rolla',state:'MO',zip:'65401' };
function response() { return { code:200, body:null, status(n){this.code=n;return this;},json(body){this.body=body;return this;} }; }

test('all advertised service categories map to saved request fields, including free inspections and WDI', () => {
  assert.equal(options.CATEGORIES.length,8);
  const picks={};
  for(const cat of options.CATEGORIES){ picks[cat.id]=cat.groups.flatMap(g=>g.options).map(o=>o.value); }
  const selected=options.selectedServices(picks);
  for(const cat of options.CATEGORIES) for(const group of cat.groups) for(const option of group.options) assert.ok(selected[cat.field].includes(option.label),option.label);
  assert.match(selected.vaporBarrier,/Vapor Barrier Installation/);
  assert.match(selected.service,/Free Moisture Inspection/);
  assert.match(selected.service,/Free Termite Inspection/);
  assert.match(selected.service,/Termite \(WDI\) Inspection Reports/);
  assert.doesNotMatch(JSON.stringify(options.CATEGORIES),/real estate/i);
  assert.doesNotMatch(JSON.stringify(options.CATEGORIES),/Lawn Mowing/);
});
test('multiple categories retain independent selections and cleared categories do not submit',()=>{
  const selected=options.selectedServices({inspection:['free-moisture-inspection'],termite:['termite-wdi-inspection-reports'],vapor:['vapor-barrier-installation'],lighting:['govee-permanent'],pest:[]});
  assert.match(selected.service,/Free Moisture Inspection; Termite \(WDI\) Inspection Reports/);
  assert.equal(selected.vaporBarrier,'Vapor Barrier Installation');
  assert.equal(selected.holidayLighting,'Govee Permanent Outdoor Lights');
});
test('optional date, no time preference and vapor-only request are valid',()=>{
  const result=bookingSchema.safeParse({customer,vaporBarrier:'Vapor Barrier Installation',date:''});
  assert.equal(result.success,true);assert.equal(result.data.time,'No preference');
});
test('invalid contact, absent service, bad date and untrusted photo URLs are rejected',()=>{
  for(const data of [
    {customer,service:''},
    {customer:{...customer,email:'bad'},service:'General Pest Control'},
    {customer:{...customer,name:'  '},service:'General Pest Control'},
    {customer,service:'General Pest Control',date:'2026-02-30'},
    {customer,service:'General Pest Control',photoUrls:['javascript:alert(1)']},
  ]) assert.equal(bookingSchema.safeParse(data).success,false);
});
test('photo constraints reject unsupported, oversized and excess uploads without silently truncating',()=>{
  assert.equal(options.photoError([{size:100,type:'image/jpeg'}]),'');
  assert.match(options.photoError([{size:100,type:'image/heic'}]),/JPG/);
  assert.match(options.photoError([{size:options.MAX_PHOTO_BYTES+1,type:'image/png'}]),/3 MB/);
  assert.match(options.photoError(Array(4).fill({size:10,type:'image/jpeg'})),/3 photos/);
});
test('appointment API rejects invalid requests before any database or notification call',async()=>{
  let calls=0;
  const handler=load('pages/api/appointments.ts',{'@/lib/db':{initializeDatabase:async()=>{calls++;},pool:{query:async()=>{calls++;}}},'@/lib/notifier':{notifyNewRequest:async()=>{calls++;}}}).default;
  const res=response();await handler({method:'POST',body:{customer}},res);
  assert.equal(res.code,400);assert.equal(calls,0);
  const get=response();await handler({method:'GET'},get);assert.equal(get.code,405);assert.equal(calls,0);
});
test('vapor and inspection requests persist and reach notifications; API returns the saved receipt',async()=>{
  let written,notification;
  const handler=load('pages/api/appointments.ts',{'@/lib/db':{initializeDatabase:async()=>{},pool:{query:async(sql,values)=>{written={sql,values};return {rows:[{id:42,date:values[12],time:values[13],service:values[7],vapor_barrier:values[19],photo_urls:values[18]}]};}}},'@/lib/notifier':{notifyNewRequest:async data=>{notification=data;return {messageId:'isolated'};}}}).default;
  const res=response();await handler({method:'POST',body:{customer,service:'Free Termite Inspection',vaporBarrier:'Vapor Barrier Installation'}},res);
  assert.equal(res.code,200);assert.equal(res.body.id,'42');assert.equal(res.body.vaporBarrier,'Vapor Barrier Installation');
  assert.match(written.sql,/vapor_barrier/);assert.equal(written.values[19],'Vapor Barrier Installation');
  assert.equal(notification.service,'Free Termite Inspection');assert.equal(notification.vaporBarrier,'Vapor Barrier Installation');
});
test('office and customer notification text include vapor barriers and retain unconfirmed appointment wording',async()=>{
  const sent=[];const previous=process.env.SMTP_HOST;process.env.SMTP_HOST='isolated.invalid';
  try {
    const notifier=load('lib/notifier.ts',{nodemailer:{createTransport:()=>({sendMail:async message=>{sent.push(message);return {messageId:'isolated'};}})}});
    await notifier.notifyNewRequest({customer,vaporBarrier:'Vapor Barrier Installation',service:'Free Moisture Inspection'});
    assert.equal(sent.length,2);
    for(const mail of sent){assert.match(mail.text,/Vapor Barriers: Vapor Barrier Installation/);assert.match(mail.text,/Free Moisture Inspection/);assert.match(mail.text,/confirm/);}
  } finally { if(previous===undefined)delete process.env.SMTP_HOST;else process.env.SMTP_HOST=previous; }
});
test('photo API rejects disguised files before storage and accepts supported photo bytes',async()=>{
  let stored=0;
  const handler=load('pages/api/upload-photo.ts',{'@vercel/blob':{put:async()=>{stored++;return {url:'https://qa.public.blob.vercel-storage.com/photo.png'};}}}).default;
  const invalid=response();await handler({method:'POST',body:{fileName:'fake.png',base64:'data:image/png;base64,SGVsbG8='}},invalid);
  assert.equal(invalid.code,400);assert.equal(stored,0);
  const good=response();await handler({method:'POST',body:{fileName:'qa.png',base64:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg=='}},good);
  assert.equal(good.code,200);assert.equal(stored,1);
});
test('install manifest starts at booking and offline worker does not cache customer data',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'public/manifest.json'),'utf8'));
  assert.ok(manifest.start_url.startsWith('/booking'));assert.equal(manifest.display,'standalone');
  for(const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root,'public',icon.src)));
  const sw=fs.readFileSync(path.join(root,'public/sw.js'),'utf8');assert.doesNotMatch(sw,/caches\.open|cache\.put/);assert.match(sw,/No request has been sent while offline/);
});

