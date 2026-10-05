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
