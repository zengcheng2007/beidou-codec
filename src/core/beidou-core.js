/**
 * 北斗二维编解码核心模块
 * 实现坐标与网格编码的双向转换
 */

// 编码字符集 (Base32)
const BASE32_CHARS = '0123456789bcdefghjkmnpqrstuvwxyz';

// 经纬度范围
const LON_RANGE = [-180, 180];
const LAT_RANGE = [-90, 90];

/**
 * 计算指定精度下的网格大小
 * @param {number} precision - 编码长度
 * @returns {object} { lonWidth, latHeight }
 */
function calculateGridSize(precision) {
  // 每个字符编码5位信息（base32）
  // 经度和纬度交替编码
  const totalBits = precision * 5;
  const lonBits = Math.ceil(totalBits / 2);
  const latBits = Math.floor(totalBits / 2);

  const lonWidth = (LON_RANGE[1] - LON_RANGE[0]) / Math.pow(2, lonBits);
  const latHeight = (LAT_RANGE[1] - LAT_RANGE[0]) / Math.pow(2, latBits);

  return { lonWidth, latHeight };
}

/**
 * 将十进制坐标编码为北斗网格编码
 * @param {number} longitude - 经度 [-180, 180]
 * @param {number} latitude - 纬度 [-90, 90]
 * @param {number} precision - 编码精度（字符长度）
 * @returns {string} 编码字符串
 */
function encode(longitude, latitude, precision) {
  if (precision <= 0) {
    throw new Error('Precision must be positive');
  }

  let lonRange = [...LON_RANGE];
  let latRange = [...LAT_RANGE];
  let result = '';
  let bit = 0;
  let ch = 0;
  let isLon = true; // 经度和纬度交替编码

  const targetBits = precision * 5;

  while (result.length < precision) {
    if (isLon) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (longitude >= mid) {
        ch |= (1 << (4 - bit));
        lonRange[0] = mid;
      } else {
        lonRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (latitude >= mid) {
        ch |= (1 << (4 - bit));
        latRange[0] = mid;
      } else {
        latRange[1] = mid;
      }
    }

    isLon = !isLon;
    bit++;

    if (bit === 5) {
      result += BASE32_CHARS[ch];
      bit = 0;
      ch = 0;
    }
  }

  return result;
}

/**
 * 将北斗网格编码解码为坐标范围
 * @param {string} code - 编码字符串
 * @returns {object} { longitude: [min, max], latitude: [min, max] }
 */
function decode(code) {
  let lonRange = [...LON_RANGE];
  let latRange = [...LAT_RANGE];
  let isLon = true;

  for (let i = 0; i < code.length; i++) {
    const ch = BASE32_CHARS.indexOf(code[i].toLowerCase());
    if (ch === -1) {
      throw new Error(`Invalid character: ${code[i]}`);
    }

    for (let bit = 4; bit >= 0; bit--) {
      const mask = 1 << bit;
      if (isLon) {
        const mid = (lonRange[0] + lonRange[1]) / 2;
        if (ch & mask) {
          lonRange[0] = mid;
        } else {
          lonRange[1] = mid;
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (ch & mask) {
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }
      isLon = !isLon;
    }
  }

  return {
    longitude: lonRange,
    latitude: latRange
  };
}

/**
 * 将编码范围转换为中心点坐标
 * @param {object} ranges - decode() 返回的范围对象
 * @returns {object} { longitude, latitude }
 */
function rangesToCenter(ranges) {
  return {
    longitude: (ranges.longitude[0] + ranges.longitude[1]) / 2,
    latitude: (ranges.latitude[0] + ranges.latitude[1]) / 2
  };
}

/**
 * 编码并返回中心点坐标
 * @param {number} longitude - 经度
 * @param {number} latitude - 纬度
 * @param {number} precision - 编码精度
 * @returns {object} { code, longitude, latitude }
 */
function encodeToCenter(longitude, latitude, precision) {
  const code = encode(longitude, latitude, precision);
  const ranges = decode(code);
  const center = rangesToCenter(ranges);
  return {
    code,
    longitude: center.longitude,
    latitude: center.latitude
  };
}

/**
 * 计算指定精度下的网格尺寸（米）
 * @param {number} precision - 编码精度
 * @param {number} latitude - 纬度（用于计算经度方向的的实际距离）
 * @returns {object} { width, height } 网格宽度和高度（米）
 */
function getGridSizeInMeters(precision, latitude = 0) {
  const gridSize = calculateGridSize(precision);

  // 纬度方向：1度 ≈ 111km
  const heightMeters = gridSize.latHeight * 111000;

  // 经度方向：1度 ≈ 111km * cos(纬度)
  const widthMeters = gridSize.lonWidth * 111000 * Math.cos(latitude * Math.PI / 180);

  return {
    width: widthMeters,
    height: heightMeters
  };
}

/**
 * 计算网格面积（平方米）
 * 使用梯形近似：考虑经度方向随纬度变化的实际距离
 *
 * @param {object} ranges - decode() 返回的范围对象
 * @returns {number} 面积（平方米）
 */
function getArea(ranges) {
  const latCenter = (ranges.latitude[0] + ranges.latitude[1]) / 2;
  const lonWidth = ranges.longitude[1] - ranges.longitude[0];
  const latHeight = ranges.latitude[1] - ranges.latitude[0];

  // 纬度方向：1度 ≈ 111000米
  const heightMeters = latHeight * 111000;

  // 经度方向：1度 ≈ 111000米 * cos(中心纬度)
  const widthMeters = lonWidth * 111000 * Math.cos(latCenter * Math.PI / 180);

  return widthMeters * heightMeters;
}

/**
 * 根据坐标范围生成网格边界多边形顶点（闭合环）
 * 返回 5 个点（首尾闭合），顺序为：左下→右下→右上→左上→左下
 * 可直接用于 GeoJSON Polygon 或地图绘制
 *
 * @param {object} ranges - decode() 返回的范围对象
 * @returns {Array} 多边形顶点数组，每个元素为 [longitude, latitude]
 */
function getPolygon(ranges) {
  const lonMin = ranges.longitude[0];
  const lonMax = ranges.longitude[1];
  const latMin = ranges.latitude[0];
  const latMax = ranges.latitude[1];

  return [
    [lonMin, latMin],  // 左下 (Southwest)
    [lonMax, latMin],  // 右下 (Southeast)
    [lonMax, latMax],  // 右上 (Northeast)
    [lonMin, latMax],  // 左上 (Northwest)
    [lonMin, latMin]   // 闭合 (Close ring)
  ];
}

/**
 * 解码网格码并返回完整的边界信息（用于可视化）
 * 包含：网格码、中心点、坐标范围、多边形顶点、面积
 *
 * @param {string} code - 网格编码字符串
 * @returns {object} 完整边界信息对象
 */
function decodeWithBoundary(code) {
  const ranges = decode(code);
  const center = rangesToCenter(ranges);
  const polygon = getPolygon(ranges);
  const area = getArea(ranges);

  return {
    code,
    center,
    ranges,
    polygon,
    area,
    level: code.length
  };
}

/**
 * 编码并返回完整的边界信息（用于可视化）
 *
 * @param {number} longitude - 经度
 * @param {number} latitude - 纬度
 * @param {number} precision - 编码精度
 * @returns {object} 完整边界信息对象
 */
function encodeWithBoundary(longitude, latitude, precision) {
  const code = encode(longitude, latitude, precision);
  return decodeWithBoundary(code);
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    encode,
    decode,
    rangesToCenter,
    encodeToCenter,
    calculateGridSize,
    getGridSizeInMeters,
    getArea,
    getPolygon,
    decodeWithBoundary,
    encodeWithBoundary,
    BASE32_CHARS
  };
}
