const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const module = {exports:{}};
  const localRequire = id => id.startsWith('.') ? load(path.resolve(path.dirname(file), id + '.ts')) : require(id);
  vm.runInThisContext('(function(require,module,exports){' + source + '\n})', {filename:file})(localRequire,module,module.exports);
  return module.exports;
}
const {mergePhotoSelection,contactFieldError} = load(path.resolve(__dirname,'../lib/booking-ui.ts'));
const photo = (name, extra={}) => ({name,size:100,type:'image/png',lastModified:1,...extra});

test('adding photos in separate picker visits retains earlier choices',()=>{
  const first=photo('first.png'),second=photo('second.png');
  assert.deepEqual(mergePhotoSelection([first],[second]),{photos:[first,second],message:''});
});
test('unsupported, oversized and empty new photos never erase valid attachments',()=>{
  const existing=[photo('first.png')];
  for(const invalid of [photo('bad.heic',{type:'image/heic'}),photo('large.png',{size:3*1024*1024+1}),photo('empty.png',{size:0})]) {
    const result=mergePhotoSelection(existing,[invalid]);
    assert.deepEqual(result.photos,existing);assert.match(result.message,/No new photos were added/);
  }
});
test('exceeding the attachment limit preserves the complete prior selection',()=>{
  const current=[photo('one.png'),photo('two.png'),photo('three.png')];
  const result=mergePhotoSelection(current,[photo('four.png')]);
  assert.deepEqual(result.photos,current);assert.match(result.message,/Remove a photo/);
});
test('reselecting the same files does not create duplicate attachments or consume slots',()=>{
  const first=photo('same.png');
  assert.deepEqual(mergePhotoSelection([first],[{...first},photo('next.png'),photo('next.png')]).photos,[first,photo('next.png')]);
});
test('distinct files with the same name remain distinct; picker cancellation keeps choices',()=>{
  const first=photo('photo.png'),changed=photo('photo.png',{lastModified:2});
  assert.deepEqual(mergePhotoSelection([first],[changed]).photos,[first,changed]);
  assert.deepEqual(mergePhotoSelection([first],[]).photos,[first]);
});
test('contact validation catches blank details and incomplete state abbreviations',()=>{
  for(const field of ['name','address','city']) assert.notEqual(contactFieldError(field,'   '),'');
  for(const state of ['','M','1A']) assert.notEqual(contactFieldError('state',state),'');
  for(const [field,value] of [['name',"O’Neill"],['address','12½ Main St'],['city','St. Robert'],['state','MO']]) assert.equal(contactFieldError(field,value),'');
});
test('phone validation accepts common formatting and extensions while rejecting unusable input',()=>{
  for(const number of ['5733683333','(573) 368-3333','+1 573 368 3333','368-3333','573-368-3333 ext. 12','5733683333 x12','+44 20 7946 0958']) assert.equal(contactFieldError('phone',number),'',number);
  for(const number of ['abcdefg','123456','123456 ext 9999','   ','abc1234567']) assert.notEqual(contactFieldError('phone',number),'',number);
});
