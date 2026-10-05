/**
 * 北斗编解码测试文件
 * 用于验证 JS 和 Java 实现的一致性
 */

const beidou = require('./src/core/beidou-core.js');

// 测试基准数据
const TEST_CASES = [
  {
    name: '北京坐标',
    longitude: 116.4074,
    latitude: 39.9042,
    expected: {
      L4: 'wx4g',
      L6: 'wx4g0b',
      L10: 'wx4g0bm6c4'
    }
  },
  {
    name: '上海坐标',
    longitude: 121.4737,
    latitude: 31.2304,
    expected: {
      L4: 'wtw3',
      L6: 'wtw3sj',
      L10: 'wtw3sjq6q2'
    }
  },
  {
    name: '广州坐标',
    longitude: 113.2644,
    latitude: 23.1291,
    expected: {
      L4: 'ws0e',
      L6: 'ws0e96',
      L10: 'ws0e96s8gb'
    }
  }
];

console.log('=== 北斗编解码测试 ===\n');

TEST_CASES.forEach(testCase => {
  console.log(`测试: ${testCase.name}`);
  console.log(`坐标: (${testCase.longitude}, ${testCase.latitude})\n`);

  // 测试不同精度的编码
  const precisions = [
    { level: 'L4', precision: 4, expected: testCase.expected.L4 },
    { level: 'L6', precision: 6, expected: testCase.expected.L6 },
    { level: 'L10', precision: 10, expected: testCase.expected.L10 }
  ];

  precisions.forEach(({ level, precision, expected }) => {
    const result = beidou.encode(testCase.longitude, testCase.latitude, precision);
    const match = result === expected ? '✓' : '✗';

    console.log(`${match} ${level} (精度${precision}):`);
    console.log(`  期望: ${expected}`);
    console.log(`  实际: ${result}`);
    console.log(`  匹配: ${match === '✓' ? '通过' : '失败'}\n`);
  });

  // 测试双向转换
  console.log('双向转换测试:');
  const testPrecision = 10;
  const encoded = beidou.encode(testCase.longitude, testCase.latitude, testPrecision);
  const decoded = beidou.decode(encoded);
  const center = beidou.rangesToCenter(decoded);

  const lonError = Math.abs(center.longitude - testCase.longitude);
  const latError = Math.abs(center.latitude - testCase.latitude);

  console.log(`  编码: ${encoded}`);
  console.log(`  解码后中心: (${center.longitude.toFixed(6)}, ${center.latitude.toFixed(6)})`);
  console.log(`  经度误差: ${lonError.toFixed(8)}°`);
  console.log(`  纬度误差: ${latError.toFixed(8)}°`);

  // 计算网格尺寸
  const gridSize = beidou.getGridSizeInMeters(testPrecision, testCase.latitude);
  console.log(`  ${testPrecision}位精度网格尺寸: ${gridSize.width.toFixed(4)}m × ${gridSize.height.toFixed(4)}m`);

  const withinPrecision = lonError <= gridSize.width / 111000 && latError <= gridSize.height / 111000;
  console.log(`  误差在网格精度内: ${withinPrecision ? '✓ 通过' : '✗ 失败'}\n`);
});

// ==================== 可视化功能测试 ====================

console.log('=== 网格边界可视化测试 ===\n');

// 测试 1: getPolygon - 多边形顶点生成
console.log('测试 1: getPolygon 多边形生成');
const testCode = 'wx4g0b';
const decoded1 = beidou.decode(testCode);
const polygon1 = beidou.getPolygon(decoded1);

console.log(`网格码: ${testCode}`);
console.log(`多边形顶点数: ${polygon1.length}`);
console.log(`首尾闭合: ${polygon1[0][0] === polygon1[4][0] && polygon1[0][1] === polygon1[4][1] ? '✓' : '✗'}`);
console.log('顶点坐标:');
polygon1.forEach((point, idx) => {
  const labels = ['左下(SW)', '右下(SE)', '右上(NE)', '左上(NW)', '闭合'];
  console.log(`  ${labels[idx]}: [${point[0].toFixed(6)}, ${point[1].toFixed(6)}]`);
});
console.log();

// 测试 2: getArea - 面积计算
console.log('测试 2: getArea 面积计算');
const levels = [
  { code: 'wx', label: 'L2' },
  { code: 'wx4g', label: 'L4' },
  { code: 'wx4g0b', label: 'L6' },
  { code: 'wx4g0bm6', label: 'L8' },
  { code: 'wx4g0bm6c4', label: 'L10' }
];

levels.forEach(({ code, label }) => {
  const ranges = beidou.decode(code);
  const area = beidou.getArea(ranges);
  const gridSize = beidou.getGridSizeInMeters(code.length, 39.9042);
  console.log(`${label} (${code}): 面积=${area.toFixed(2)} m², 网格尺寸=${gridSize.width.toFixed(2)}m × ${gridSize.height.toFixed(2)}m`);
});
console.log();

// 测试 3: decodeWithBoundary - 完整边界信息
console.log('测试 3: decodeWithBoundary 完整边界信息');
const boundary1 = beidou.decodeWithBoundary('wx4g0b');
console.log(`网格码: ${boundary1.code}`);
console.log(`层级: L${boundary1.level}`);
console.log(`中心点: [${boundary1.center.longitude.toFixed(6)}, ${boundary1.center.latitude.toFixed(6)}]`);
console.log(`面积: ${boundary1.area.toFixed(2)} m²`);
console.log(`多边形顶点数: ${boundary1.polygon.length}`);
console.log(`坐标范围: lon=[${boundary1.ranges.longitude[0].toFixed(6)}, ${boundary1.ranges.longitude[1].toFixed(6)}], lat=[${boundary1.ranges.latitude[0].toFixed(6)}, ${boundary1.ranges.latitude[1].toFixed(6)}]`);
console.log();

// 测试 4: encodeWithBoundary - 编码并返回完整边界
console.log('测试 4: encodeWithBoundary 编码+边界');
const boundary2 = beidou.encodeWithBoundary(116.4074, 39.9042, 6);
console.log(`输入坐标: (116.4074, 39.9042)`);
console.log(`网格码: ${boundary2.code}`);
console.log(`层级: L${boundary2.level}`);
console.log(`中心点: [${boundary2.center.longitude.toFixed(6)}, ${boundary2.center.latitude.toFixed(6)}]`);
console.log(`面积: ${boundary2.area.toFixed(2)} m²`);
console.log();

// 测试 5: 验证多边形闭合和 GeoJSON 兼容
console.log('测试 5: GeoJSON Polygon 兼容性验证');
const geojsonPolygon = beidou.getPolygon(beidou.decode('wx4g0bm6c4'));
const isClosed = geojsonPolygon[0][0] === geojsonPolygon[geojsonPolygon.length - 1][0] &&
                  geojsonPolygon[0][1] === geojsonPolygon[geojsonPolygon.length - 1][1];
console.log(`多边形闭合: ${isClosed ? '✓' : '✗'}`);
console.log(`顶点数: ${geojsonPolygon.length} (GeoJSON 要求 >= 5)`);
console.log(`可直接用于 GeoJSON: ${isClosed && geojsonPolygon.length >= 5 ? '✓' : '✗'}`);

// 输出 GeoJSON 格式示例
const geojsonExample = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [geojsonPolygon]
  },
  properties: {
    code: 'wx4g0bm6c4',
    level: 10,
    area: beidou.getArea(beidou.decode('wx4g0bm6c4'))
  }
};
console.log('\nGeoJSON Feature 示例:');
console.log(JSON.stringify(geojsonExample, null, 2));

console.log('\n=== 可视化测试完成 ===');

// 导出测试函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TEST_CASES };
}
