# 北斗位置网格编解码库 (Beidou Grid Codec)

基于 GBT 39409-2020 标准的北斗位置网格编解码实现，提供 Java 和 JavaScript 双版本。

## 功能特性

- ✅ 二维坐标编解码（经度、纬度 → 网格编码）
- ✅ 三维坐标编解码（经度、纬度、高度 → 网格编码）
- ✅ 双向转换（编码 → 解码 → 坐标，偏差 < 网格精度）
- ✅ 多精度级别支持（L1 ~ L10）
- ✅ Java 和 JavaScript 版本输出完全一致

## 算法说明

采用标准 geohash 算法：
- Base32 编码字符集：`0123456789bcdefghjkmnpqrstuvwxyz`
- 经纬度交替二分编码
- 每个字符编码 5 位信息

### 精度对照表

| 精度级别 | 字符数 | 网格尺寸（约） | 应用场景 |
|---------|--------|--------------|---------|
| L1 | 1 | ~1000km | 大区域 |
| L4 | 4 | ~35km | 城市级 |
| L6 | 6 | ~1.1km | 街区级 |
| L8 | 8 | ~38m | 建筑物级 |
| L10 | 10 | ~1.2m | 亚米级 |

## 使用方法

### JavaScript 版本

```javascript
const beidou = require('./src/core/beidou-core.js');

// 编码
const code = beidou.encode(116.4074, 39.9042, 10); // 北京坐标
console.log(code); // 输出: wx4g0bm6c4

// 解码
const decoded = beidou.decode(code);
const center = beidou.rangesToCenter(decoded);
console.log(center); // { longitude: 116.407405, latitude: 39.904203 }

// 获取网格尺寸（米）
const gridSize = beidou.getGridSizeInMeters(10, 39.9042);
console.log(gridSize); // { width: 0.9136, height: 0.5955 }
```

### Java 版本

```java
// 二维编码
String code = Beidou2DCodec.encode(116.4074, 39.9042, 10);
System.out.println(code); // 输出: wx4g0bm6c4

// 二维解码
Beidou2DCodec.CoordinateRange range = Beidou2DCodec.decode(code);
Beidou2DCodec.Coordinate center = Beidou2DCodec.rangesToCenter(range);

// 三维编码（含高度）
String code3D = Beidou3DCodec.encode(116.4074, 39.9042, 100.0);
```

## 编译与测试

### JavaScript

```bash
# 运行基准测试
node test-codec.js

# 运行完整测试套件（126 项）
node test-wszc76.js
```

### Java

```bash
cd backend
mvn clean test
```

## 测试覆盖

- ✅ 正常场景：7 个中国主要城市
- ✅ 边界场景：极点、赤道、本初子午线、180° 经线
- ✅ 各级精度：L1 ~ L10 全级别验证
- ✅ 双向转换：编码→解码→偏差验证
- ✅ 一致性：Java 与 JS 版本完全一致
- ✅ 异常处理：超范围坐标、无效输入

**测试结果**: 126 项测试，119 项通过（94.4%），P0 通过率 100%

## 已知问题

1. **JS 版本缺少输入校验** — 不检查经纬度范围（Java 版本已修复）
2. **180°/-180° 编码不一致** — 同一子午线产生不同编码（geohash 固有问题）

## 项目结构

```
beidou-codec/
├── src/core/
│   └── beidou-core.js          # JavaScript 二维编解码
├── backend/
│   ├── pom.xml                 # Maven 配置
│   └── src/
│       ├── main/java/com/beidou/core/
│       │   ├── Beidou2DCodec.java   # Java 二维编解码
│       │   └── Beidou3DCodec.java   # Java 三维编解码
│       └── test/java/com/beidou/core/
│           └── Beidou2DCodecTest.java # Java 单元测试
├── test-codec.js               # JavaScript 基准测试
└── test-wszc76.js              # 完整测试套件
```

## 参考标准

- GBT 39409-2020《北斗卫星导航系统位置网格编码》

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request。
