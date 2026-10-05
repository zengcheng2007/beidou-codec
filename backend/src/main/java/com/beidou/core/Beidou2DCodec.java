package com.beidou.core;

/**
 * 北斗二维编解码核心类
 * 实现坐标与网格编码的双向转换
 */
public class Beidou2DCodec {

    // 编码字符集 (Base32)
    private static final String BASE32_CHARS = "0123456789bcdefghjkmnpqrstuvwxyz";

    // 经纬度范围
    private static final double LON_MIN = -180.0;
    private static final double LON_MAX = 180.0;
    private static final double LAT_MIN = -90.0;
    private static final double LAT_MAX = 90.0;

    /**
     * 将十进制坐标编码为北斗网格编码
     * @param longitude 经度 [-180, 180]
     * @param latitude 纬度 [-90, 90]
     * @param precision 编码精度（字符长度）
     * @return 编码字符串
     */
    public static String encode(double longitude, double latitude, int precision) {
        if (precision <= 0) {
            throw new IllegalArgumentException("Precision must be positive");
        }

        if (longitude < LON_MIN || longitude > LON_MAX) {
            throw new IllegalArgumentException("Longitude must be in range [-180, 180]");
        }

        if (latitude < LAT_MIN || latitude > LAT_MAX) {
            throw new IllegalArgumentException("Latitude must be in range [-90, 90]");
        }

        double[] lonRange = {LON_MIN, LON_MAX};
        double[] latRange = {LAT_MIN, LAT_MAX};
        StringBuilder result = new StringBuilder();
        int bit = 0;
        int ch = 0;
        boolean isLon = true; // 经度和纬度交替编码

        while (result.length() < precision) {
            double mid;
            if (isLon) {
                mid = (lonRange[0] + lonRange[1]) / 2;
                if (longitude >= mid) {
                    ch |= (1 << (4 - bit));
                    lonRange[0] = mid;
                } else {
                    lonRange[1] = mid;
                }
            } else {
                mid = (latRange[0] + latRange[1]) / 2;
                if (latitude >= mid) {
                    ch |= (1 << (4 - bit));
                    latRange[0] = mid;
                } else {
                    latRange[1] = mid;
                }
            }

            isLon = !isLon;
            bit++;

            if (bit == 5) {
                result.append(BASE32_CHARS.charAt(ch));
                bit = 0;
                ch = 0;
            }
        }

        return result.toString();
    }

    /**
     * 将北斗网格编码解码为坐标范围
     * @param code 编码字符串
     * @return 坐标范围对象
     */
    public static CoordinateRange decode(String code) {
        if (code == null || code.isEmpty()) {
            throw new IllegalArgumentException("Code cannot be null or empty");
        }

        double[] lonRange = {LON_MIN, LON_MAX};
        double[] latRange = {LAT_MIN, LAT_MAX};
        boolean isLon = true;

        for (int i = 0; i < code.length(); i++) {
            char c = Character.toLowerCase(code.charAt(i));
            int ch = BASE32_CHARS.indexOf(c);
            if (ch == -1) {
                throw new IllegalArgumentException("Invalid character: " + c);
            }

            for (int bit = 4; bit >= 0; bit--) {
                int mask = 1 << bit;
                double mid;
                if (isLon) {
                    mid = (lonRange[0] + lonRange[1]) / 2;
                    if ((ch & mask) != 0) {
                        lonRange[0] = mid;
                    } else {
                        lonRange[1] = mid;
                    }
                } else {
                    mid = (latRange[0] + latRange[1]) / 2;
                    if ((ch & mask) != 0) {
                        latRange[0] = mid;
                    } else {
                        latRange[1] = mid;
                    }
                }
                isLon = !isLon;
            }
        }

        return new CoordinateRange(lonRange[0], lonRange[1], latRange[0], latRange[1]);
    }

    /**
     * 将编码范围转换为中心点坐标
     * @param range 坐标范围对象
     * @return 中心点坐标
     */
    public static Coordinate rangesToCenter(CoordinateRange range) {
        double lon = (range.getLonMin() + range.getLonMax()) / 2;
        double lat = (range.getLatMin() + range.getLatMax()) / 2;
        return new Coordinate(lon, lat);
    }

    /**
     * 编码并返回中心点坐标
     * @param longitude 经度
     * @param latitude 纬度
     * @param precision 编码精度
     * @return 编码结果对象
     */
    public static EncodeResult encodeToCenter(double longitude, double latitude, int precision) {
        String code = encode(longitude, latitude, precision);
        CoordinateRange range = decode(code);
        Coordinate center = rangesToCenter(range);
        return new EncodeResult(code, center.getLongitude(), center.getLatitude());
    }

    /**
     * 计算指定精度下的网格尺寸（米）
     * @param precision 编码精度
     * @param latitude 纬度（用于计算经度方向的实际距离）
     * @return 网格宽度和高度（米）
     */
    public static GridSize getGridSizeInMeters(int precision, double latitude) {
        int totalBits = precision * 5;
        int lonBits = (totalBits + 1) / 2;
        int latBits = totalBits / 2;

        double lonWidth = (LON_MAX - LON_MIN) / Math.pow(2, lonBits);
        double latHeight = (LAT_MAX - LAT_MIN) / Math.pow(2, latBits);

        // 纬度方向：1度 ≈ 111km
        double heightMeters = latHeight * 111000;

        // 经度方向：1度 ≈ 111km * cos(纬度)
        double widthMeters = lonWidth * 111000 * Math.cos(Math.toRadians(latitude));

        return new GridSize(widthMeters, heightMeters);
    }

    /**
     * 坐标范围类
     */
    public static class CoordinateRange {
        private final double lonMin;
        private final double lonMax;
        private final double latMin;
        private final double latMax;

        public CoordinateRange(double lonMin, double lonMax, double latMin, double latMax) {
            this.lonMin = lonMin;
            this.lonMax = lonMax;
            this.latMin = latMin;
            this.latMax = latMax;
        }

        public double getLonMin() { return lonMin; }
        public double getLonMax() { return lonMax; }
        public double getLatMin() { return latMin; }
        public double getLatMax() { return latMax; }
    }

    /**
     * 坐标类
     */
    public static class Coordinate {
        private final double longitude;
        private final double latitude;

        public Coordinate(double longitude, double latitude) {
            this.longitude = longitude;
            this.latitude = latitude;
        }

        public double getLongitude() { return longitude; }
        public double getLatitude() { return latitude; }
    }

    /**
     * 编码结果类
     */
    public static class EncodeResult {
        private final String code;
        private final double longitude;
        private final double latitude;

        public EncodeResult(String code, double longitude, double latitude) {
            this.code = code;
            this.longitude = longitude;
            this.latitude = latitude;
        }

        public String getCode() { return code; }
        public double getLongitude() { return longitude; }
        public double getLatitude() { return latitude; }
    }

    /**
     * 网格尺寸类
     */
    public static class GridSize {
        private final double width;
        private final double height;

        public GridSize(double width, double height) {
            this.width = width;
            this.height = height;
        }

        public double getWidth() { return width; }
        public double getHeight() { return height; }
    }
}
