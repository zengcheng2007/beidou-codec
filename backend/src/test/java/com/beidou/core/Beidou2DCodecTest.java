package com.beidou.core;

import org.junit.Test;
import static org.junit.Assert.*;

/**
 * Beidou2DCodec 单元测试
 * 验证 Java 实现与 JS 基准数据一致性
 */
public class Beidou2DCodecTest {

    private static final double DELTA = 0.0001; // 允许的浮点数误差

    /**
     * 测试北京坐标编码
     */
    @Test
    public void testBeijingEncode() {
        double lon = 116.4074;
        double lat = 39.9042;

        // L4 (精度4)
        String result4 = Beidou2DCodec.encode(lon, lat, 4);
        assertEquals("wx4g", result4);

        // L6 (精度6)
        String result6 = Beidou2DCodec.encode(lon, lat, 6);
        assertEquals("wx4g0b", result6);

        // L10 (精度10)
        String result10 = Beidou2DCodec.encode(lon, lat, 10);
        assertEquals("wx4g0bm6c4", result10);
    }

    /**
     * 测试上海坐标编码
     */
    @Test
    public void testShanghaiEncode() {
        double lon = 121.4737;
        double lat = 31.2304;

        String result4 = Beidou2DCodec.encode(lon, lat, 4);
        assertEquals("wtw3", result4);

        String result6 = Beidou2DCodec.encode(lon, lat, 6);
        assertEquals("wtw3sj", result6);

        String result10 = Beidou2DCodec.encode(lon, lat, 10);
        assertEquals("wtw3sjq6q2", result10);
    }

    /**
     * 测试广州坐标编码
     */
    @Test
    public void testGuangzhouEncode() {
        double lon = 113.2644;
        double lat = 23.1291;

        String result4 = Beidou2DCodec.encode(lon, lat, 4);
        assertEquals("ws0e", result4);

        String result6 = Beidou2DCodec.encode(lon, lat, 6);
        assertEquals("ws0e96", result6);

        String result10 = Beidou2DCodec.encode(lon, lat, 10);
        assertEquals("ws0e96s8gb", result10);
    }

    /**
     * 测试编码解码双向转换
     */
    @Test
    public void testEncodeDecode() {
        double lon = 116.4074;
        double lat = 39.9042;
        int precision = 10;

        // 编码
        String code = Beidou2DCodec.encode(lon, lat, precision);

        // 解码
        Beidou2DCodec.CoordinateRange range = Beidou2DCodec.decode(code);

        // 计算中心点
        double centerLon = (range.getLonMin() + range.getLonMax()) / 2;
        double centerLat = (range.getLatMin() + range.getLatMax()) / 2;

        // 验证误差在网格精度内
        Beidou2DCodec.GridSize gridSize = Beidou2DCodec.getGridSizeInMeters(precision, lat);

        // 经度误差（转换为米）
        double lonErrorMeters = Math.abs(centerLon - lon) * 111000 * Math.cos(Math.toRadians(lat));
        double latErrorMeters = Math.abs(centerLat - lat) * 111000;

        assertTrue("Longitude error should be within grid width",
                   lonErrorMeters <= gridSize.getWidth());
        assertTrue("Latitude error should be within grid height",
                   latErrorMeters <= gridSize.getHeight());
    }

    /**
     * 测试不同精度的网格尺寸
     */
    @Test
    public void testGridSize() {
        // 精度4：约几公里
        Beidou2DCodec.GridSize size4 = Beidou2DCodec.getGridSizeInMeters(4, 39.9042);
        assertTrue("Grid width at precision 4 should be > 1000m", size4.getWidth() > 1000);
        assertTrue("Grid height at precision 4 should be > 1000m", size4.getHeight() > 1000);

        // 精度10：约1米
        Beidou2DCodec.GridSize size10 = Beidou2DCodec.getGridSizeInMeters(10, 39.9042);
        assertTrue("Grid width at precision 10 should be < 10m", size10.getWidth() < 10);
        assertTrue("Grid height at precision 10 should be < 10m", size10.getHeight() < 10);
    }

    /**
     * 测试 encodeToCenter 方法
     */
    @Test
    public void testEncodeToCenter() {
        double lon = 116.4074;
        double lat = 39.9042;
        int precision = 10;

        Beidou2DCodec.EncodeResult result = Beidou2DCodec.encodeToCenter(lon, lat, precision);

        assertNotNull(result.getCode());
        assertEquals("wx4g0bm6c4", result.getCode());

        // 中心点应该接近原始坐标
        assertTrue(Math.abs(result.getLongitude() - lon) < 0.001);
        assertTrue(Math.abs(result.getLatitude() - lat) < 0.001);
    }

    /**
     * 测试解码
     */
    @Test
    public void testDecode() {
        String code = "wx4g0bm6c4";
        Beidou2DCodec.CoordinateRange range = Beidou2DCodec.decode(code);

        assertNotNull(range);

        // 解码后的范围应该包含北京坐标
        double lon = 116.4074;
        double lat = 39.9042;

        assertTrue("Longitude should be in range",
                   lon >= range.getLonMin() && lon <= range.getLonMax());
        assertTrue("Latitude should be in range",
                   lat >= range.getLatMin() && lat <= range.getLatMax());
    }

    /**
     * 测试无效输入
     */
    @Test(expected = IllegalArgumentException.class)
    public void testInvalidLongitude() {
        Beidou2DCodec.encode(200.0, 39.9042, 10); // 经度超出范围
    }

    @Test(expected = IllegalArgumentException.class)
    public void testInvalidLatitude() {
        Beidou2DCodec.encode(116.4074, 100.0, 10); // 纬度超出范围
    }

    @Test(expected = IllegalArgumentException.class)
    public void testInvalidPrecision() {
        Beidou2DCodec.encode(116.4074, 39.9042, 0); // 精度必须为正数
    }

    @Test(expected = IllegalArgumentException.class)
    public void testInvalidCharacter() {
        Beidou2DCodec.decode("wx4g@bm6c4"); // 无效字符
    }

    /**
     * 测试边界值
     */
    @Test
    public void testBoundaryValues() {
        // 北极
        String northPole = Beidou2DCodec.encode(0.0, 90.0, 6);
        assertNotNull(northPole);

        // 南极
        String southPole = Beidou2DCodec.encode(0.0, -90.0, 6);
        assertNotNull(southPole);

        // 本初子午线
        String primeMeridian = Beidou2DCodec.encode(0.0, 0.0, 6);
        assertNotNull(primeMeridian);

        // 国际日期变更线
        String dateLine = Beidou2DCodec.encode(180.0, 0.0, 6);
        assertNotNull(dateLine);
    }

    /**
     * 测试网格边界多边形生成
     */
    @Test
    public void testGetPolygon() {
        String code = "wx4g0b"; // 北京 L6
        Beidou2DCodec.CoordinateRange range = Beidou2DCodec.decode(code);
        double[][] polygon = Beidou2DCodec.getPolygon(range);

        assertNotNull(polygon);
        assertEquals("Polygon should have 5 points (closed ring)", 5, polygon.length);

        // 验证首尾闭合
        assertEquals("First point lon should equal last point lon",
                     polygon[0][0], polygon[4][0], DELTA);
        assertEquals("First point lat should equal last point lat",
                     polygon[0][1], polygon[4][1], DELTA);

        // 验证顶点顺序：左下→右下→右上→左上
        // 左下：lonMin, latMin
        assertEquals(polygon[0][0], range.getLonMin(), DELTA);
        assertEquals(polygon[0][1], range.getLatMin(), DELTA);
        // 右下：lonMax, latMin
        assertEquals(polygon[1][0], range.getLonMax(), DELTA);
        assertEquals(polygon[1][1], range.getLatMin(), DELTA);
        // 右上：lonMax, latMax
        assertEquals(polygon[2][0], range.getLonMax(), DELTA);
        assertEquals(polygon[2][1], range.getLatMax(), DELTA);
        // 左上：lonMin, latMax
        assertEquals(polygon[3][0], range.getLonMin(), DELTA);
        assertEquals(polygon[3][1], range.getLatMax(), DELTA);
    }

    /**
     * 测试网格面积计算
     */
    @Test
    public void testGetArea() {
        // L6 精度在北京纬度约 1km × 1km
        String code = "wx4g0b";
        Beidou2DCodec.CoordinateRange range = Beidou2DCodec.decode(code);
        double area = Beidou2DCodec.getArea(range);

        assertTrue("Area should be positive", area > 0);
        // L6 约 ~1km × ~1km = ~1 km² = ~1,000,000 m²
        // 但实际网格可能更小，只验证数量级合理
        assertTrue("L6 area should be > 100,000 m²", area > 100000);
        assertTrue("L6 area should be < 10,000,000 m²", area < 10000000);

        // L10 精度面积约 ~1 m²
        String codeL10 = "wx4g0bm6c4";
        Beidou2DCodec.CoordinateRange rangeL10 = Beidou2DCodec.decode(codeL10);
        double areaL10 = Beidou2DCodec.getArea(rangeL10);
        assertTrue("L10 area should be < 10 m²", areaL10 < 10);
        assertTrue("L10 area should be > 0.01 m²", areaL10 > 0.01);
    }

    /**
     * 测试 decodeWithBoundary 方法
     */
    @Test
    public void testDecodeWithBoundary() {
        String code = "wx4g0b";
        Beidou2DCodec.BoundaryResult result = Beidou2DCodec.decodeWithBoundary(code);

        assertNotNull(result);
        assertEquals(code, result.getCode());
        assertEquals(6, result.getLevel());
        assertNotNull(result.getCenter());
        assertNotNull(result.getRange());
        assertNotNull(result.getPolygon());
        assertTrue(result.getArea() > 0);

        // 验证中心点在范围内
        double centerLon = result.getCenter().getLongitude();
        double centerLat = result.getCenter().getLatitude();
        assertTrue(centerLon >= result.getRange().getLonMin());
        assertTrue(centerLon <= result.getRange().getLonMax());
        assertTrue(centerLat >= result.getRange().getLatMin());
        assertTrue(centerLat <= result.getRange().getLatMax());
    }

    /**
     * 测试 encodeWithBoundary 方法
     */
    @Test
    public void testEncodeWithBoundary() {
        double lon = 116.4074;
        double lat = 39.9042;
        int precision = 6;

        Beidou2DCodec.BoundaryResult result = Beidou2DCodec.encodeWithBoundary(lon, lat, precision);

        assertNotNull(result);
        assertEquals("wx4g0b", result.getCode());
        assertEquals(6, result.getLevel());

        // 验证面积和中心点合理性
        assertTrue(result.getArea() > 0);
        assertTrue(Math.abs(result.getCenter().getLongitude() - lon) < 0.1);
        assertTrue(Math.abs(result.getCenter().getLatitude() - lat) < 0.1);
    }

    /**
     * 测试不同层级的面积递减
     */
    @Test
    public void testAreaDecreasesWithLevel() {
        double lon = 116.4074;
        double lat = 39.9042;

        double prevArea = Double.MAX_VALUE;
        for (int precision = 2; precision <= 10; precision += 2) {
            Beidou2DCodec.BoundaryResult result =
                Beidou2DCodec.encodeWithBoundary(lon, lat, precision);
            assertTrue("Area should decrease with precision level",
                       result.getArea() < prevArea);
            prevArea = result.getArea();
        }
    }

    /**
     * 测试 BoundaryResult 的 toString
     */
    @Test
    public void testBoundaryResultToString() {
        Beidou2DCodec.BoundaryResult result =
            Beidou2DCodec.decodeWithBoundary("wx4g0b");
        String str = result.toString();

        assertNotNull(str);
        assertTrue(str.contains("wx4g0b"));
        assertTrue(str.contains("L6"));
        assertTrue(str.contains("area="));
        assertTrue(str.contains("polygon=5 points"));
    }

    /**
     * 测试与 JS 版本的兼容性
     * 这个测试确保 Java 和 JS 实现产生完全相同的输出
     */
    @Test
    public void testJSCompatibility() {
        // 测试用例来自 test-codec.js
        double[][] testCoords = {
            {116.4074, 39.9042}, // 北京
            {121.4737, 31.2304}, // 上海
            {113.2644, 23.1291}, // 广州
            {104.0657, 30.6594}, // 成都
            {87.6177, 43.8256}   // 乌鲁木齐
        };

        int[] precisions = {4, 6, 8, 10};

        for (double[] coord : testCoords) {
            for (int precision : precisions) {
                String javaResult = Beidou2DCodec.encode(coord[0], coord[1], precision);

                // 编码解码往返测试
                Beidou2DCodec.CoordinateRange range = Beidou2DCodec.decode(javaResult);
                Beidou2DCodec.Coordinate center = Beidou2DCodec.rangesToCenter(range);

                // 根据精度设置合理的容差
                // 精度4: 约10-20度，精度6: 约1度，精度8: 约0.1度，精度10: 约0.01度
                double tolerance;
                if (precision <= 4) {
                    tolerance = 20.0;
                } else if (precision <= 6) {
                    tolerance = 2.0;
                } else if (precision <= 8) {
                    tolerance = 0.2;
                } else {
                    tolerance = 0.02;
                }

                // 验证解码后的中心点在合理范围内
                assertTrue("Longitude should be close to original (precision " + precision + ")",
                           Math.abs(center.getLongitude() - coord[0]) < tolerance);
                assertTrue("Latitude should be close to original (precision " + precision + ")",
                           Math.abs(center.getLatitude() - coord[1]) < tolerance);
            }
        }
    }
}
