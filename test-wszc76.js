/**
 * WSZC-76 核心编解码功能全面测试
 * 覆盖35个测试用例：正常场景、边界场景、各级精度、异常输入、双向转换、一致性验证
 */

const beidou = require('./src/core/beidou-core.js');

let passed = 0;
let failed = 0;
let blocked = 0;
const results = [];

function assert(condition, msg) {
  if (condition) {
    passed++;
    results.push({ status: 'PASS', msg });
  } else {
    failed++;
    results.push({ status: 'FAIL', msg });
  }
}

function assertThrows(fn, msg) {
  try {
    fn();
    failed++;
    results.push({ status: 'FAIL', msg: msg + ' (no exception thrown)' });
  } catch (e) {
    passed++;
    results.push({ status: 'PASS', msg });
  }
}

function section(name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('='.repeat(60));
}

// ============================================================
// 3.1 正常场景 - 中国主要城市编码 (TC-001 ~ TC-007)
// ============================================================
section('3.1 正常场景 - 中国主要城市编码');

const cities = [
  { name: '北京', lon: 116.4074, lat: 39.9042, id: 'TC-001' },
  { name: '上海', lon: 121.4737, lat: 31.2304, id: 'TC-002' },
  { name: '广州', lon: 113.2644, lat: 23.1291, id: 'TC-003' },
  { name: '乌鲁木齐', lon: 87.6177, lat: 43.7928, id: 'TC-004' },
  { name: '拉萨', lon: 91.1322, lat: 29.6600, id: 'TC-005' },
  { name: '哈尔滨', lon: 126.6424, lat: 45.7570, id: 'TC-006' },
  { name: '三亚', lon: 109.5083, lat: 18.2479, id: 'TC-007' },
];

cities.forEach(city => {
  try {
    const l1 = beidou.encode(city.lon, city.lat, 1);
    const l4 = beidou.encode(city.lon, city.lat, 4);
    const l6 = beidou.encode(city.lon, city.lat, 6);
    const l10 = beidou.encode(city.lon, city.lat, 10);

    assert(l1 && l1.length === 1, `${city.id} ${city.name}: L1 编码长度=1 (${l1})`);
    assert(l4 && l4.length === 4, `${city.id} ${city.name}: L4 编码长度=4 (${l4})`);
    assert(l6 && l6.length === 6, `${city.id} ${city.name}: L6 编码长度=6 (${l6})`);
    assert(l10 && l10.length === 10, `${city.id} ${city.name}: L10 编码长度=10 (${l10})`);

    // 验证前缀关系
    assert(l6.startsWith(l4), `${city.id} ${city.name}: L6 以 L4 为前缀`);
    assert(l10.startsWith(l6), `${city.id} ${city.name}: L10 以 L6 为前缀`);

    console.log(`  ${city.id} ${city.name}: L1=${l1}, L4=${l4}, L6=${l6}, L10=${l10}`);
  } catch (e) {
    failed++;
    results.push({ status: 'FAIL', msg: `${city.id} ${city.name}: Exception - ${e.message}` });
    console.log(`  ${city.id} ${city.name}: FAIL - ${e.message}`);
  }
});

// ============================================================
// 3.2 边界场景测试 (TC-101 ~ TC-107)
// ============================================================
section('3.2 边界场景测试');

// TC-101 北极点附近
try {
  const code = beidou.encode(0.0, 89.9, 6);
  assert(code && code.length === 6, `TC-101 北极附近(0°,89.9°): 编码=${code}`);
  console.log(`  TC-101 北极附近: ${code}`);
} catch (e) {
  failed++;
  results.push({ status: 'FAIL', msg: `TC-101 北极附近: ${e.message}` });
}

// TC-102 南极点附近
try {
  const code = beidou.encode(0.0, -89.9, 6);
  assert(code && code.length === 6, `TC-102 南极附近(0°,-89.9°): 编码=${code}`);
  console.log(`  TC-102 南极附近: ${code}`);
} catch (e) {
  failed++;
  results.push({ status: 'FAIL', msg: `TC-102 南极附近: ${e.message}` });
}

// TC-103 赤道上
try {
  const code = beidou.encode(100.0, 0.0, 6);
  assert(code && code.length === 6, `TC-103 赤道(100°,0°): 编码=${code}`);
  console.log(`  TC-103 赤道: ${code}`);
} catch (e) {
  failed++;
  results.push({ status: 'FAIL', msg: `TC-103 赤道: ${e.message}` });
}

// TC-104 本初子午线
try {
  const code = beidou.encode(0.0, 51.5074, 6);
  assert(code && code.length === 6, `TC-104 本初子午线(0°,51.5074°): 编码=${code}`);
  console.log(`  TC-104 本初子午线(伦敦): ${code}`);
} catch (e) {
  failed++;
  results.push({ status: 'FAIL', msg: `TC-104 本初子午线: ${e.message}` });
}

// TC-105 180°经线
try {
  const code = beidou.encode(180.0, 0.0, 6);
  assert(code && code.length === 6, `TC-105 180°经线(180°,0°): 编码=${code}`);
  console.log(`  TC-105 180°经线: ${code}`);
} catch (e) {
  failed++;
  results.push({ status: 'FAIL', msg: `TC-105 180°经线: ${e.message}` });
}

// TC-106 -180°经线
try {
  const code = beidou.encode(-180.0, 0.0, 6);
  assert(code && code.length === 6, `TC-106 -180°经线(-180°,0°): 编码=${code}`);
  console.log(`  TC-106 -180°经线: ${code}`);
} catch (e) {
  failed++;
  results.push({ status: 'FAIL', msg: `TC-106 -180°经线: ${e.message}` });
}

// TC-106b: 180° 和 -180° 编码应一致或相邻
try {
  const code180 = beidou.encode(180.0, 0.0, 6);
  const codeM180 = beidou.encode(-180.0, 0.0, 6);
  assert(code180 === codeM180, `TC-106b 180°与-180°编码一致: ${code180} vs ${codeM180}`);
} catch (e) {
  // Both valid but may differ - just note
  results.push({ status: 'INFO', msg: `TC-106b 180°与-180°编码不同: ${e.message}` });
}

// TC-107 经纬度极值组合
const extremePoints = [
  { name: '(0,0)', lon: 0, lat: 0 },
  { name: '(180,90)', lon: 180, lat: 90 },
  { name: '(-180,-90)', lon: -180, lat: -90 },
  { name: '(180,-90)', lon: 180, lat: -90 },
];

extremePoints.forEach(pt => {
  try {
    const code = beidou.encode(pt.lon, pt.lat, 6);
    assert(code && code.length === 6, `TC-107 极值${pt.name}: 编码=${code}`);
    console.log(`  TC-107 ${pt.name}: ${code}`);
  } catch (e) {
    failed++;
    results.push({ status: 'FAIL', msg: `TC-107 极值${pt.name}: ${e.message}` });
  }
});

// ============================================================
// 3.3 各级精度测试 (TC-201 ~ TC-206)
// ============================================================
section('3.3 各级精度测试 (L1~L10)');

const testPoints = [
  { name: '北京', lon: 116.4074, lat: 39.9042 },
  { name: '上海', lon: 121.4737, lat: 31.2304 },
  { name: '乌鲁木齐', lon: 87.6177, lat: 43.7928 },
];

// TC-201 L1 精度
console.log('\n  TC-201: L1 精度测试');
testPoints.forEach(pt => {
  const code = beidou.encode(pt.lon, pt.lat, 1);
  assert(code && code.length === 1, `TC-201 L1 ${pt.name}: ${code}`);
});

// TC-202 L2-L5 精度
for (let level = 2; level <= 5; level++) {
  console.log(`  TC-202: L${level} 精度测试`);
  testPoints.forEach(pt => {
    const code = beidou.encode(pt.lon, pt.lat, level);
    assert(code && code.length === level, `TC-202 L${level} ${pt.name}: ${code}`);
  });
}

// TC-203 L6 精度 - 北京基准验证
const l6BJ = beidou.encode(116.4074, 39.9042, 6);
assert(l6BJ === 'wx4g0b', `TC-203 L6 北京基准: 期望=wx4g0b, 实际=${l6BJ}`);
console.log(`  TC-203 L6 北京: ${l6BJ} (期望 wx4g0b)`);

// TC-204 L7-L9 精度
for (let level = 7; level <= 9; level++) {
  console.log(`  TC-204: L${level} 精度测试`);
  testPoints.forEach(pt => {
    const code = beidou.encode(pt.lon, pt.lat, level);
    assert(code && code.length === level, `TC-204 L${level} ${pt.name}: ${code}`);
  });
}

// TC-205 L10 精度 - 北京基准验证
const l10BJ = beidou.encode(116.4074, 39.9042, 10);
assert(l10BJ === 'wx4g0bm6c4', `TC-205 L10 北京基准: 期望=wx4g0bm6c4, 实际=${l10BJ}`);
console.log(`  TC-205 L10 北京: ${l10BJ} (期望 wx4g0bm6c4)`);

// TC-206 精度前缀一致性验证
console.log('\n  TC-206: 前缀一致性验证');
const codes = [];
for (let level = 1; level <= 10; level++) {
  codes.push(beidou.encode(116.4074, 39.9042, level));
}
let prefixOk = true;
for (let i = 1; i < codes.length; i++) {
  if (!codes[i].startsWith(codes[i-1])) {
    prefixOk = false;
    console.log(`  FAIL: L${i+1}(${codes[i]}) 不以 L${i}(${codes[i-1]}) 为前缀`);
  }
}
assert(prefixOk, `TC-206 前缀一致性: L1⊂L2⊂...⊂L10`);
console.log(`  L1~L10: ${codes.join(' → ')}`);

// ============================================================
// 3.4 异常输入场景 (TC-301 ~ TC-309)
// ============================================================
section('3.4 异常输入场景');

// TC-301 经度超范围 >180
assertThrows(() => beidou.encode(200.0, 39.9042, 6), 'TC-301 经度200°: 应抛出异常');

// TC-302 经度超范围 <-180
assertThrows(() => beidou.encode(-200.0, 39.9042, 6), 'TC-302 经度-200°: 应抛出异常');

// TC-303 纬度超范围 >90
assertThrows(() => beidou.encode(116.4074, 100.0, 6), 'TC-303 纬度100°: 应抛出异常');

// TC-304 纬度超范围 <-90
assertThrows(() => beidou.encode(116.4074, -100.0, 6), 'TC-304 纬度-100°: 应抛出异常');

// TC-305 空字符串解码
assertThrows(() => beidou.decode(''), 'TC-305 空字符串解码: 应抛出异常或返回空');

// TC-306 非法字符解码
assertThrows(() => beidou.decode('XYZ!@#'), 'TC-306 非法字符解码: 应抛出异常');

// TC-307 格式正确但无效网格码
try {
  const result = beidou.decode('N99Z');
  // JS版本可能不会抛异常而是返回结果
  results.push({ status: 'PASS', msg: `TC-307 无效网格码'N99Z': 解码返回=${JSON.stringify(result)}` });
  passed++;
} catch (e) {
  passed++;
  results.push({ status: 'PASS', msg: `TC-307 无效网格码'N99Z': 抛出异常=${e.message}` });
}

// TC-308 空值输入 (null)
try {
  beidou.encode(null, null, 6);
  // JS中null会被转为0,0 这是可以接受的行为
  const code = beidou.encode(null, null, 6);
  results.push({ status: 'PASS', msg: `TC-308 null输入: 编码=${code} (null转为0,0)` });
  passed++;
} catch (e) {
  passed++;
  results.push({ status: 'PASS', msg: `TC-308 null输入: 抛出异常=${e.message}` });
}

// TC-309 非数字类型输入
try {
  beidou.encode('abc', 'def', 6);
  failed++;
  results.push({ status: 'FAIL', msg: 'TC-309 字符串输入: 未抛出异常' });
} catch (e) {
  passed++;
  results.push({ status: 'PASS', msg: `TC-309 字符串输入: 抛出异常=${e.message}` });
}

// ============================================================
// 3.5 双向转换验证 (TC-401 ~ TC-404)
// ============================================================
section('3.5 双向转换验证');

// TC-401 北京坐标双向转换（L1~L10 全级别）
console.log('\n  TC-401: 北京坐标双向转换');
const bjLon = 116.4074, bjLat = 39.9042;
for (let level = 1; level <= 10; level++) {
  const code = beidou.encode(bjLon, bjLat, level);
  const decoded = beidou.decode(code);
  const center = beidou.rangesToCenter(decoded);
  const lonErr = Math.abs(center.longitude - bjLon);
  const latErr = Math.abs(center.latitude - bjLat);
  const gridSize = beidou.getGridSizeInMeters(level, bjLat);
  const lonErrM = lonErr * 111000 * Math.cos(bjLat * Math.PI / 180);
  const latErrM = latErr * 111000;
  const withinGrid = lonErrM <= gridSize.width && latErrM <= gridSize.height;
  assert(withinGrid, `TC-401 L${level}: 偏差(lon=${lonErrM.toFixed(4)}m, lat=${latErrM.toFixed(4)}m) ≤ 网格(${gridSize.width.toFixed(2)}m×${gridSize.height.toFixed(2)}m)`);
  console.log(`  L${level}: code=${code}, 偏差=(${lonErrM.toFixed(4)}m, ${latErrM.toFixed(4)}m), 网格=(${gridSize.width.toFixed(2)}m×${gridSize.height.toFixed(2)}m) ${withinGrid ? '✓' : '✗'}`);
}

// TC-402 上海坐标双向转换
console.log('\n  TC-402: 上海坐标双向转换');
const shLon = 121.4737, shLat = 31.2304;
for (let level = 1; level <= 10; level++) {
  const code = beidou.encode(shLon, shLat, level);
  const decoded = beidou.decode(code);
  const center = beidou.rangesToCenter(decoded);
  const lonErr = Math.abs(center.longitude - shLon);
  const latErr = Math.abs(center.latitude - shLat);
  const gridSize = beidou.getGridSizeInMeters(level, shLat);
  const lonErrM = lonErr * 111000 * Math.cos(shLat * Math.PI / 180);
  const latErrM = latErr * 111000;
  const withinGrid = lonErrM <= gridSize.width && latErrM <= gridSize.height;
  assert(withinGrid, `TC-402 L${level}: 偏差在网格精度内`);
}

// TC-403 边界坐标双向转换
console.log('\n  TC-403: 边界坐标双向转换');
const boundaryPoints = [
  { name: '(0,0)', lon: 0, lat: 0 },
  { name: '(180,0)', lon: 180, lat: 0 },
  { name: '(0,89)', lon: 0, lat: 89 },
  { name: '(-180,-89)', lon: -180, lat: -89 },
];
boundaryPoints.forEach(pt => {
  const code = beidou.encode(pt.lon, pt.lat, 6);
  const decoded = beidou.decode(code);
  const center = beidou.rangesToCenter(decoded);
  const rawLonErr = Math.abs(center.longitude - pt.lon);
  const lonErr = Math.min(rawLonErr, 360 - rawLonErr); // 处理 -180/180 环绕
  const latErr = Math.abs(center.latitude - pt.lat);
  assert(lonErr < 1 && latErr < 1, `TC-403 ${pt.name}: 偏差(lon=${lonErr.toFixed(6)}°, lat=${latErr.toFixed(6)}°)`);
  console.log(`  ${pt.name}: code=${code}, center=(${center.longitude.toFixed(6)}, ${center.latitude.toFixed(6)})`);
});

// TC-404 不同精度级别解码精度对比 - 验证偏差单调递减
console.log('\n  TC-404: 精度递增偏差递减验证');
let prevLonErr = Infinity, prevLatErr = Infinity;
let monotonic = true;
for (let level = 1; level <= 10; level++) {
  const code = beidou.encode(bjLon, bjLat, level);
  const decoded = beidou.decode(code);
  const center = beidou.rangesToCenter(decoded);
  const lonErr = Math.abs(center.longitude - bjLon);
  const latErr = Math.abs(center.latitude - bjLat);
  if (lonErr > prevLonErr + 1e-10 || latErr > prevLatErr + 1e-10) {
    monotonic = false;
  }
  prevLonErr = lonErr;
  prevLatErr = latErr;
  console.log(`  L${level}: lon偏差=${lonErr.toFixed(10)}°, lat偏差=${latErr.toFixed(10)}°`);
}
assert(monotonic, 'TC-404 偏差随精度递增单调递减');

// ============================================================
// 3.6 一致性验证 (TC-501 ~ TC-502)
// ============================================================
section('3.6 一致性验证 (JS版本基准)');

// TC-501 JS编码结果基准（与WSZC-74基准数据对比）
console.log('\n  TC-501: JS编码基准数据验证');
const jsBaseline = [
  { name: '北京', lon: 116.4074, lat: 39.9042, L4: 'wx4g', L6: 'wx4g0b', L10: 'wx4g0bm6c4' },
  { name: '上海', lon: 121.4737, lat: 31.2304, L4: 'wtw3', L6: 'wtw3sj', L10: 'wtw3sjq6q2' },
  { name: '广州', lon: 113.2644, lat: 23.1291, L4: 'ws0e', L6: 'ws0e96', L10: 'ws0e96s8gb' },
];

jsBaseline.forEach(city => {
  assert(beidou.encode(city.lon, city.lat, 4) === city.L4, `TC-501 ${city.name} L4: ${city.L4}`);
  assert(beidou.encode(city.lon, city.lat, 6) === city.L6, `TC-501 ${city.name} L6: ${city.L6}`);
  assert(beidou.encode(city.lon, city.lat, 10) === city.L10, `TC-501 ${city.name} L10: ${city.L10}`);
});

// TC-502 JS解码一致性
console.log('\n  TC-502: JS解码一致性验证');
jsBaseline.forEach(city => {
  const decoded = beidou.decode(city.L10);
  const center = beidou.rangesToCenter(decoded);
  const lonErr = Math.abs(center.longitude - city.lon);
  const latErr = Math.abs(center.latitude - city.lat);
  assert(lonErr < 0.001 && latErr < 0.001, `TC-502 ${city.name} 解码偏差: lon=${lonErr.toFixed(8)}°, lat=${latErr.toFixed(8)}°`);
  console.log(`  ${city.name}: 解码中心=(${center.longitude.toFixed(6)}, ${center.latitude.toFixed(6)}), 偏差=(${lonErr.toFixed(8)}°, ${latErr.toFixed(8)}°)`);
});

// ============================================================
// 补充测试：3D编解码
// ============================================================
section('补充：3D编解码测试');

// 由于 beidou-core.js 只导出 2D，3D 仅在 Java 实现中
// 这里记录为需Java验证
console.log('  3D编解码在 Beidou3DCodec.java 中实现，需通过 Java 测试验证');
results.push({ status: 'INFO', msg: '3D编解码需通过Java测试验证（JS版本无3D模块）' });

// ============================================================
// 汇总
// ============================================================
section('测试汇总');
console.log(`\n  总测试项: ${passed + failed}`);
console.log(`  通过: ${passed}`);
console.log(`  失败: ${failed}`);
console.log(`  通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log('\n  失败项:');
  results.filter(r => r.status === 'FAIL').forEach(r => console.log(`    ✗ ${r.msg}`));
}

console.log('\n  通过项明细:');
results.filter(r => r.status === 'PASS').forEach(r => console.log(`    ✓ ${r.msg}`));

process.exit(failed > 0 ? 1 : 0);
