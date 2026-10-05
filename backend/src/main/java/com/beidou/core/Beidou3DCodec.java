package com.beidou.core;

/**
 * 北斗三维编解码核心类
 * 在二维基础上增加高度维度支持
 */
public class Beidou3DCodec {

    // 高度范围（米）：-10000m 到 50000m
    private static final double HEIGHT_MIN = -10000.0;
    private static final double HEIGHT_MAX = 50000.0;

    /**
     * 将三维坐标编码为北斗网格编码
     * 编码格式：2D编码 + 高度编码
     * @param longitude 经度 [-180, 180]
     * @param latitude 纬度 [-90, 90]
     * @param height 高度（米）[-10000, 50000]
     * @param precision2D 2D编码精度（字符长度）
     * @param precisionHeight 高度编码精度（字符长度）
     * @return 编码字符串
     */
    public static String encode(double longitude, double latitude, double height,
                                 int precision2D, int precisionHeight) {
        // 先编码2D部分
        String code2D = Beidou2DCodec.encode(longitude, latitude, precision2D);

        // 再编码高度部分
        String codeHeight = encodeHeight(height, precisionHeight);

        return code2D + codeHeight;
    }

    /**
     * 将三维坐标编码为北斗网格编码（使用默认精度）
     * @param longitude 经度
     * @param latitude 纬度
     * @param height 高度（米）
     * @return 编码字符串
     */
    public static String encode(double longitude, double latitude, double height) {
        return encode(longitude, latitude, height, 10, 4);
    }

    /**
     * 将高度编码为字符串
     * @param height 高度（米）
     * @param precision 编码精度（字符长度）
     * @return 高度编码字符串
     */
    private static String encodeHeight(double height, int precision) {
        if (height < HEIGHT_MIN || height > HEIGHT_MAX) {
            throw new IllegalArgumentException("Height must be in range [-10000, 50000]");
        }

        double[] heightRange = {HEIGHT_MIN, HEIGHT_MAX};
        StringBuilder result = new StringBuilder();
        int bit = 0;
        int ch = 0;

        // 使用与2D相同的base32字符集
        String base32Chars = "0123456789bcdefghjkmnpqrstuvwxyz";

        while (result.length() < precision) {
            double mid = (heightRange[0] + heightRange[1]) / 2;
            if (height >= mid) {
                ch |= (1 << (4 - bit));
                heightRange[0] = mid;
            } else {
                heightRange[1] = mid;
            }

            bit++;

            if (bit == 5) {
                result.append(base32Chars.charAt(ch));
                bit = 0;
                ch = 0;
            }
        }

        return result.toString();
    }

    /**
     * 将北斗网格编码解码为三维坐标范围
     * @param code 编码字符串
     * @param precision2D 2D编码精度
     * @return 三维坐标范围对象
     */
    public static CoordinateRange3D decode(String code, int precision2D) {
        if (code == null || code.length() <= precision2D) {
            throw new IllegalArgumentException("Code is too short for the specified 2D precision");
        }

        // 分离2D和高度编码
        String code2D = code.substring(0, precision2D);
        String codeHeight = code.substring(precision2D);

        // 解码2D部分
        Beidou2DCodec.CoordinateRange range2D = Beidou2DCodec.decode(code2D);

        // 解码高度部分
        HeightRange heightRange = decodeHeight(codeHeight);

        return new CoordinateRange3D(
            range2D.getLonMin(), range2D.getLonMax(),
            range2D.getLatMin(), range2D.getLatMax(),
            heightRange.getMin(), heightRange.getMax()
        );
    }

    /**
     * 将北斗网格编码解码为三维坐标范围（自动检测2D精度）
     * @param code 编码字符串
     * @return 三维坐标范围对象
     */
    public static CoordinateRange3D decode(String code) {
        // 默认2D精度为10
        return decode(code, 10);
    }

    /**
     * 将高度编码解码为高度范围
     * @param code 高度编码字符串
     * @return 高度范围对象
     */
    private static HeightRange decodeHeight(String code) {
        double[] heightRange = {HEIGHT_MIN, HEIGHT_MAX};
        String base32Chars = "0123456789bcdefghjkmnpqrstuvwxyz";

        for (int i = 0; i < code.length(); i++) {
            char c = Character.toLowerCase(code.charAt(i));
            int ch = base32Chars.indexOf(c);
            if (ch == -1) {
                throw new IllegalArgumentException("Invalid character: " + c);
            }

            for (int bit = 4; bit >= 0; bit--) {
                int mask = 1 << bit;
                double mid = (heightRange[0] + heightRange[1]) / 2;
                if ((ch & mask) != 0) {
                    heightRange[0] = mid;
                } else {
                    heightRange[1] = mid;
                }
            }
        }

        return new HeightRange(heightRange[0], heightRange[1]);
    }

    /**
     * 将编码范围转换为中心点坐标
     * @param range 三维坐标范围对象
     * @return 中心点坐标
     */
    public static Coordinate3D rangesToCenter(CoordinateRange3D range) {
        double lon = (range.getLonMin() + range.getLonMax()) / 2;
        double lat = (range.getLatMin() + range.getLatMax()) / 2;
        double height = (range.getHeightMin() + range.getHeightMax()) / 2;
        return new Coordinate3D(lon, lat, height);
    }

    /**
     * 编码并返回中心点坐标
     * @param longitude 经度
     * @param latitude 纬度
     * @param height 高度（米）
     * @param precision2D 2D编码精度
     * @param precisionHeight 高度编码精度
     * @return 编码结果对象
     */
    public static EncodeResult3D encodeToCenter(double longitude, double latitude, double height,
                                                  int precision2D, int precisionHeight) {
        String code = encode(longitude, latitude, height, precision2D, precisionHeight);
        CoordinateRange3D range = decode(code, precision2D);
        Coordinate3D center = rangesToCenter(range);
        return new EncodeResult3D(code, center.getLongitude(), center.getLatitude(), center.getHeight());
    }

    /**
     * 三维坐标范围类
     */
    public static class CoordinateRange3D {
        private final double lonMin;
        private final double lonMax;
        private final double latMin;
        private final double latMax;
        private final double heightMin;
        private final double heightMax;

        public CoordinateRange3D(double lonMin, double lonMax, double latMin, double latMax,
                                  double heightMin, double heightMax) {
            this.lonMin = lonMin;
            this.lonMax = lonMax;
            this.latMin = latMin;
            this.latMax = latMax;
            this.heightMin = heightMin;
            this.heightMax = heightMax;
        }

        public double getLonMin() { return lonMin; }
        public double getLonMax() { return lonMax; }
        public double getLatMin() { return latMin; }
        public double getLatMax() { return latMax; }
        public double getHeightMin() { return heightMin; }
        public double getHeightMax() { return heightMax; }
    }

    /**
     * 高度范围类
     */
    public static class HeightRange {
        private final double min;
        private final double max;

        public HeightRange(double min, double max) {
            this.min = min;
            this.max = max;
        }

        public double getMin() { return min; }
        public double getMax() { return max; }
    }

    /**
     * 三维坐标类
     */
    public static class Coordinate3D {
        private final double longitude;
        private final double latitude;
        private final double height;

        public Coordinate3D(double longitude, double latitude, double height) {
            this.longitude = longitude;
            this.latitude = latitude;
            this.height = height;
        }

        public double getLongitude() { return longitude; }
        public double getLatitude() { return latitude; }
        public double getHeight() { return height; }
    }

    /**
     * 三维编码结果类
     */
    public static class EncodeResult3D {
        private final String code;
        private final double longitude;
        private final double latitude;
        private final double height;

        public EncodeResult3D(String code, double longitude, double latitude, double height) {
            this.code = code;
            this.longitude = longitude;
            this.latitude = latitude;
            this.height = height;
        }

        public String getCode() { return code; }
        public double getLongitude() { return longitude; }
        public double getLatitude() { return latitude; }
        public double getHeight() { return height; }
    }
}
