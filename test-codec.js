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

// 导出测试函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TEST_CASES };
}
