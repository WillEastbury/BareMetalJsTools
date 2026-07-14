// BareMetal.PicoScript.js — PicoScript 16-opcode ISA compiler + VM bundle.
//
// Bundles the real PicoScript toolchain from github.com/WillEastbury/picoscript:
//   - pico_hooks.js   (533 hook codes, auto-generated)
//   - picocompress.js  (PicoCompress RLE codec)
//   - picobrotli.js    (Brotli encoder/decoder)
//   - picoc.js         (4-frontend compiler: C, BASIC, Python, English)
//   - picovm.js        (16-opcode deterministic VM with full host-hook surface)
//
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.PicoScript = (function () {
  'use strict';
  var _root = {};

// AUTO-GENERATED from picoscript_lang.py -- do not edit by hand.
(function (root) {
  var H = {
    HOST_HOOK_BASE: 0x7000,
    EXT_HOST_HOOK_BASE: 0x6000,
    NET_STATUS_BASE: 0x8000,
    NET_HEADER_BASE: 0x9000,
    NET_BODY_MARKER: 0xB000,
    NET_CLOSE_MARKER: 0xC000,
    CONTENT_TYPES: {
      0xA000: "text/html",
      0xA001: "text/plain",
      0xA002: "application/json",
      0xA003: "text/css",
      0xA004: "text/javascript",
      0xA005: "image/png",
      0xA006: "image/jpeg",
      0xA007: "application/octet-stream",
    },
    CONSTANTS: {"BITS_PER_BYTE": 8, "BYTES_PER_KIB": 1024, "BYTES_PER_MIB": 1048576, "CM_PER_METER": 100, "COLOR.BLACK": 0, "COLOR.BLUE": 255, "COLOR.CYAN": 65535, "COLOR.GRAY": 8421504, "COLOR.GREEN": 65280, "COLOR.GREY": 8421504, "COLOR.MAGENTA": 16711935, "COLOR.ORANGE": 16753920, "COLOR.RED": 16711680, "COLOR.WHITE": 16777215, "COLOR.YELLOW": 16776960, "COLOR_BLACK": 0, "COLOR_BLUE": 255, "COLOR_CYAN": 65535, "COLOR_GRAY": 8421504, "COLOR_GREEN": 65280, "COLOR_GREY": 8421504, "COLOR_MAGENTA": 16711935, "COLOR_ORANGE": 16753920, "COLOR_RED": 16711680, "COLOR_WHITE": 16777215, "COLOR_YELLOW": 16776960, "COUNTRY.AE": 784, "COUNTRY.AU": 36, "COUNTRY.BR": 76, "COUNTRY.CA": 124, "COUNTRY.CH": 756, "COUNTRY.CN": 156, "COUNTRY.DE": 276, "COUNTRY.DK": 208, "COUNTRY.ES": 724, "COUNTRY.FI": 246, "COUNTRY.FR": 250, "COUNTRY.GB": 826, "COUNTRY.HK": 344, "COUNTRY.IE": 372, "COUNTRY.IN": 356, "COUNTRY.IT": 380, "COUNTRY.JP": 392, "COUNTRY.KR": 410, "COUNTRY.MX": 484, "COUNTRY.NL": 528, "COUNTRY.NO": 578, "COUNTRY.NZ": 554, "COUNTRY.PL": 616, "COUNTRY.PT": 620, "COUNTRY.SE": 752, "COUNTRY.SG": 702, "COUNTRY.US": 840, "COUNTRY.ZA": 710, "COUNTRY_AE": 784, "COUNTRY_AU": 36, "COUNTRY_BR": 76, "COUNTRY_CA": 124, "COUNTRY_CH": 756, "COUNTRY_CN": 156, "COUNTRY_DE": 276, "COUNTRY_DK": 208, "COUNTRY_ES": 724, "COUNTRY_FI": 246, "COUNTRY_FR": 250, "COUNTRY_GB": 826, "COUNTRY_HK": 344, "COUNTRY_IE": 372, "COUNTRY_IN": 356, "COUNTRY_IT": 380, "COUNTRY_JP": 392, "COUNTRY_KR": 410, "COUNTRY_MX": 484, "COUNTRY_NL": 528, "COUNTRY_NO": 578, "COUNTRY_NZ": 554, "COUNTRY_PL": 616, "COUNTRY_PT": 620, "COUNTRY_SE": 752, "COUNTRY_SG": 702, "COUNTRY_US": 840, "COUNTRY_ZA": 710, "CURRENCY.AED": 784, "CURRENCY.AUD": 36, "CURRENCY.BRL": 986, "CURRENCY.CAD": 124, "CURRENCY.CHF": 756, "CURRENCY.CNY": 156, "CURRENCY.EUR": 978, "CURRENCY.GBP": 826, "CURRENCY.HKD": 344, "CURRENCY.INR": 356, "CURRENCY.JPY": 392, "CURRENCY.KRW": 410, "CURRENCY.MXN": 484, "CURRENCY.NOK": 578, "CURRENCY.NZD": 554, "CURRENCY.SEK": 752, "CURRENCY.SGD": 702, "CURRENCY.USD": 840, "CURRENCY.ZAR": 710, "CURRENCYMINOR.AED": 2, "CURRENCYMINOR.AUD": 2, "CURRENCYMINOR.BRL": 2, "CURRENCYMINOR.CAD": 2, "CURRENCYMINOR.CHF": 2, "CURRENCYMINOR.CNY": 2, "CURRENCYMINOR.EUR": 2, "CURRENCYMINOR.GBP": 2, "CURRENCYMINOR.HKD": 2, "CURRENCYMINOR.INR": 2, "CURRENCYMINOR.JPY": 0, "CURRENCYMINOR.KRW": 0, "CURRENCYMINOR.MXN": 2, "CURRENCYMINOR.NOK": 2, "CURRENCYMINOR.NZD": 2, "CURRENCYMINOR.SEK": 2, "CURRENCYMINOR.SGD": 2, "CURRENCYMINOR.USD": 2, "CURRENCYMINOR.ZAR": 2, "CURRENCY_AED": 784, "CURRENCY_AUD": 36, "CURRENCY_BRL": 986, "CURRENCY_CAD": 124, "CURRENCY_CHF": 756, "CURRENCY_CNY": 156, "CURRENCY_EUR": 978, "CURRENCY_GBP": 826, "CURRENCY_HKD": 344, "CURRENCY_INR": 356, "CURRENCY_JPY": 392, "CURRENCY_KRW": 410, "CURRENCY_MINOR_AED": 2, "CURRENCY_MINOR_AUD": 2, "CURRENCY_MINOR_BRL": 2, "CURRENCY_MINOR_CAD": 2, "CURRENCY_MINOR_CHF": 2, "CURRENCY_MINOR_CNY": 2, "CURRENCY_MINOR_EUR": 2, "CURRENCY_MINOR_GBP": 2, "CURRENCY_MINOR_HKD": 2, "CURRENCY_MINOR_INR": 2, "CURRENCY_MINOR_JPY": 0, "CURRENCY_MINOR_KRW": 0, "CURRENCY_MINOR_MXN": 2, "CURRENCY_MINOR_NOK": 2, "CURRENCY_MINOR_NZD": 2, "CURRENCY_MINOR_SEK": 2, "CURRENCY_MINOR_SGD": 2, "CURRENCY_MINOR_USD": 2, "CURRENCY_MINOR_ZAR": 2, "CURRENCY_MXN": 484, "CURRENCY_NOK": 578, "CURRENCY_NZD": 554, "CURRENCY_SEK": 752, "CURRENCY_SGD": 702, "CURRENCY_USD": 840, "CURRENCY_ZAR": 710, "DAY.FRIDAY": 5, "DAY.MONDAY": 1, "DAY.SATURDAY": 6, "DAY.SUNDAY": 7, "DAY.THURSDAY": 4, "DAY.TUESDAY": 2, "DAY.WEDNESDAY": 3, "DAYS_PER_WEEK": 7, "DAY_FRIDAY": 5, "DAY_MONDAY": 1, "DAY_SATURDAY": 6, "DAY_SUNDAY": 7, "DAY_THURSDAY": 4, "DAY_TUESDAY": 2, "DAY_WEDNESDAY": 3, "DEG_PER_RAD_Q16": 3754936, "DST.ACTIVE": 2, "DST.NONE": 0, "DST.OBSERVED": 1, "DST_ACTIVE": 2, "DST_NONE": 0, "DST_OBSERVED": 1, "GRAMS_PER_KILOGRAM": 1000, "HOURS_PER_DAY": 24, "HTTPMETHOD.CONNECT": 8, "HTTPMETHOD.DELETE": 4, "HTTPMETHOD.GET": 1, "HTTPMETHOD.HEAD": 5, "HTTPMETHOD.OPTIONS": 7, "HTTPMETHOD.PATCH": 6, "HTTPMETHOD.POST": 2, "HTTPMETHOD.PUT": 3, "HTTPMETHOD.TRACE": 9, "HTTPSTATUS.ACCEPTED": 202, "HTTPSTATUS.BAD_GATEWAY": 502, "HTTPSTATUS.BAD_REQUEST": 400, "HTTPSTATUS.CONFLICT": 409, "HTTPSTATUS.CREATED": 201, "HTTPSTATUS.FORBIDDEN": 403, "HTTPSTATUS.INTERNAL_SERVER_ERROR": 500, "HTTPSTATUS.NOT_FOUND": 404, "HTTPSTATUS.NOT_IMPLEMENTED": 501, "HTTPSTATUS.NO_CONTENT": 204, "HTTPSTATUS.OK": 200, "HTTPSTATUS.SERVICE_UNAVAILABLE": 503, "HTTPSTATUS.TOO_MANY_REQUESTS": 429, "HTTPSTATUS.UNAUTHORIZED": 401, "HTTPSTATUS.UNPROCESSABLE_ENTITY": 422, "HTTP_METHOD_CONNECT": 8, "HTTP_METHOD_DELETE": 4, "HTTP_METHOD_GET": 1, "HTTP_METHOD_HEAD": 5, "HTTP_METHOD_OPTIONS": 7, "HTTP_METHOD_PATCH": 6, "HTTP_METHOD_POST": 2, "HTTP_METHOD_PUT": 3, "HTTP_METHOD_TRACE": 9, "HTTP_STATUS_ACCEPTED": 202, "HTTP_STATUS_BAD_GATEWAY": 502, "HTTP_STATUS_BAD_REQUEST": 400, "HTTP_STATUS_CONFLICT": 409, "HTTP_STATUS_CREATED": 201, "HTTP_STATUS_FORBIDDEN": 403, "HTTP_STATUS_INTERNAL_SERVER_ERROR": 500, "HTTP_STATUS_NOT_FOUND": 404, "HTTP_STATUS_NOT_IMPLEMENTED": 501, "HTTP_STATUS_NO_CONTENT": 204, "HTTP_STATUS_OK": 200, "HTTP_STATUS_SERVICE_UNAVAILABLE": 503, "HTTP_STATUS_TOO_MANY_REQUESTS": 429, "HTTP_STATUS_UNAUTHORIZED": 401, "HTTP_STATUS_UNPROCESSABLE_ENTITY": 422, "INT16_MAX": 32767, "INT16_MIN": -32768, "INT24_MAX": 8388607, "INT24_MIN": -8388608, "INT32_MAX": 2147483647, "INT32_MIN": -2147483648, "INT8_MAX": 127, "INT8_MIN": -128, "MASK16": 65535, "MASK24": 16777215, "MASK32": 4294967295, "MASK8": 255, "METHOD_CONNECT": 8, "METHOD_DELETE": 4, "METHOD_GET": 1, "METHOD_HEAD": 5, "METHOD_OPTIONS": 7, "METHOD_PATCH": 6, "METHOD_POST": 2, "METHOD_PUT": 3, "METHOD_TRACE": 9, "MINUTES_PER_HOUR": 60, "MM_PER_METER": 1000, "MONTH.APRIL": 4, "MONTH.AUGUST": 8, "MONTH.DECEMBER": 12, "MONTH.FEBRUARY": 2, "MONTH.JANUARY": 1, "MONTH.JULY": 7, "MONTH.JUNE": 6, "MONTH.MARCH": 3, "MONTH.MAY": 5, "MONTH.NOVEMBER": 11, "MONTH.OCTOBER": 10, "MONTH.SEPTEMBER": 9, "MONTH_APRIL": 4, "MONTH_AUGUST": 8, "MONTH_DECEMBER": 12, "MONTH_FEBRUARY": 2, "MONTH_JANUARY": 1, "MONTH_JULY": 7, "MONTH_JUNE": 6, "MONTH_MARCH": 3, "MONTH_MAY": 5, "MONTH_NOVEMBER": 11, "MONTH_OCTOBER": 10, "MONTH_SEPTEMBER": 9, "MS_PER_SECOND": 1000, "PI_Q16": 205887, "RAD_PER_DEG_Q16": 1144, "SECONDS_PER_MINUTE": 60, "SIGN16": 32768, "SIGN24": 8388608, "SIGN32": 2147483648, "SIGN8": 128, "STATUS_ACCEPTED": 202, "STATUS_BAD_GATEWAY": 502, "STATUS_BAD_REQUEST": 400, "STATUS_CONFLICT": 409, "STATUS_CREATED": 201, "STATUS_FORBIDDEN": 403, "STATUS_INTERNAL_SERVER_ERROR": 500, "STATUS_NOT_FOUND": 404, "STATUS_NOT_IMPLEMENTED": 501, "STATUS_NO_CONTENT": 204, "STATUS_OK": 200, "STATUS_SERVICE_UNAVAILABLE": 503, "STATUS_TOO_MANY_REQUESTS": 429, "STATUS_UNAUTHORIZED": 401, "STATUS_UNPROCESSABLE_ENTITY": 422, "TIMEZONE.AMERICA_CHICAGO": 4, "TIMEZONE.AMERICA_DENVER": 5, "TIMEZONE.AMERICA_LOS_ANGELES": 6, "TIMEZONE.AMERICA_NEW_YORK": 3, "TIMEZONE.ASIA_DUBAI": 11, "TIMEZONE.ASIA_HONG_KONG": 9, "TIMEZONE.ASIA_SINGAPORE": 8, "TIMEZONE.ASIA_TOKYO": 7, "TIMEZONE.AUSTRALIA_SYDNEY": 10, "TIMEZONE.EUROPE_LONDON": 1, "TIMEZONE.EUROPE_PARIS": 2, "TIMEZONE.UTC": 0, "TZ.AMERICA_CHICAGO": 4, "TZ.AMERICA_DENVER": 5, "TZ.AMERICA_LOS_ANGELES": 6, "TZ.AMERICA_NEW_YORK": 3, "TZ.ASIA_DUBAI": 11, "TZ.ASIA_HONG_KONG": 9, "TZ.ASIA_SINGAPORE": 8, "TZ.ASIA_TOKYO": 7, "TZ.AUSTRALIA_SYDNEY": 10, "TZ.EUROPE_LONDON": 1, "TZ.EUROPE_PARIS": 2, "TZ.UTC": 0, "TZ_AMERICA_CHICAGO": 4, "TZ_AMERICA_DENVER": 5, "TZ_AMERICA_LOS_ANGELES": 6, "TZ_AMERICA_NEW_YORK": 3, "TZ_ASIA_DUBAI": 11, "TZ_ASIA_HONG_KONG": 9, "TZ_ASIA_SINGAPORE": 8, "TZ_ASIA_TOKYO": 7, "TZ_AUSTRALIA_SYDNEY": 10, "TZ_EUROPE_LONDON": 1, "TZ_EUROPE_PARIS": 2, "TZ_UTC": 0, "UINT16_MAX": 65535, "UINT24_MAX": 16777215, "UINT32_MAX": 4294967295, "UINT8_MAX": 255, "UOM.AMPERE": 4, "UOM.CANDELA": 7, "UOM.CELSIUS": 102, "UOM.GRAM": 101, "UOM.KELVIN": 5, "UOM.KILOGRAM": 2, "UOM.LITER": 100, "UOM.METER": 1, "UOM.MOLE": 6, "UOM.SECOND": 3, "UOM_AMPERE": 4, "UOM_CANDELA": 7, "UOM_CELSIUS": 102, "UOM_GRAM": 101, "UOM_KELVIN": 5, "UOM_KILOGRAM": 2, "UOM_LITER": 100, "UOM_METER": 1, "UOM_MOLE": 6, "UOM_SECOND": 3},
    CONSTANT_I18N: {"en": {"BITS_PER_BYTE": {"description": "Number of bits in one byte (8).", "label": "Bits per byte"}, "BYTES_PER_KIB": {"description": "Binary-size conversion constant (1024).", "label": "bytes per KiB"}, "BYTES_PER_MIB": {"description": "Binary-size conversion constant (1,048,576).", "label": "bytes per MiB"}, "CM_PER_METER": {"description": "Metric conversion constant (100).", "label": "centimetres per metre"}, "COLOR_BLACK": {"description": "24-bit RGB colour 0x000000.", "label": "Black"}, "COLOR_BLUE": {"description": "24-bit RGB colour 0x0000FF.", "label": "Blue"}, "COLOR_CYAN": {"description": "24-bit RGB colour 0x00FFFF.", "label": "Cyan"}, "COLOR_GRAY": {"description": "24-bit RGB colour 0x808080.", "label": "Gray"}, "COLOR_GREEN": {"description": "24-bit RGB colour 0x00FF00.", "label": "Green"}, "COLOR_MAGENTA": {"description": "24-bit RGB colour 0xFF00FF.", "label": "Magenta"}, "COLOR_ORANGE": {"description": "24-bit RGB colour 0xFFA500.", "label": "Orange"}, "COLOR_RED": {"description": "24-bit RGB colour 0xFF0000.", "label": "Red"}, "COLOR_WHITE": {"description": "24-bit RGB colour 0xFFFFFF.", "label": "White"}, "COLOR_YELLOW": {"description": "24-bit RGB colour 0xFFFF00.", "label": "Yellow"}, "COUNTRY_AE": {"description": "ISO-3166-1 numeric country code 784.", "label": "United Arab Emirates"}, "COUNTRY_AU": {"description": "ISO-3166-1 numeric country code 36.", "label": "Australia"}, "COUNTRY_BR": {"description": "ISO-3166-1 numeric country code 76.", "label": "Brazil"}, "COUNTRY_CA": {"description": "ISO-3166-1 numeric country code 124.", "label": "Canada"}, "COUNTRY_CH": {"description": "ISO-3166-1 numeric country code 756.", "label": "Switzerland"}, "COUNTRY_CN": {"description": "ISO-3166-1 numeric country code 156.", "label": "China"}, "COUNTRY_DE": {"description": "ISO-3166-1 numeric country code 276.", "label": "Germany"}, "COUNTRY_DK": {"description": "ISO-3166-1 numeric country code 208.", "label": "Denmark"}, "COUNTRY_ES": {"description": "ISO-3166-1 numeric country code 724.", "label": "Spain"}, "COUNTRY_FI": {"description": "ISO-3166-1 numeric country code 246.", "label": "Finland"}, "COUNTRY_FR": {"description": "ISO-3166-1 numeric country code 250.", "label": "France"}, "COUNTRY_GB": {"description": "ISO-3166-1 numeric country code 826.", "label": "United Kingdom"}, "COUNTRY_HK": {"description": "ISO-3166-1 numeric country code 344.", "label": "Hong Kong"}, "COUNTRY_IE": {"description": "ISO-3166-1 numeric country code 372.", "label": "Ireland"}, "COUNTRY_IN": {"description": "ISO-3166-1 numeric country code 356.", "label": "India"}, "COUNTRY_IT": {"description": "ISO-3166-1 numeric country code 380.", "label": "Italy"}, "COUNTRY_JP": {"description": "ISO-3166-1 numeric country code 392.", "label": "Japan"}, "COUNTRY_KR": {"description": "ISO-3166-1 numeric country code 410.", "label": "South Korea"}, "COUNTRY_MX": {"description": "ISO-3166-1 numeric country code 484.", "label": "Mexico"}, "COUNTRY_NL": {"description": "ISO-3166-1 numeric country code 528.", "label": "Netherlands"}, "COUNTRY_NO": {"description": "ISO-3166-1 numeric country code 578.", "label": "Norway"}, "COUNTRY_NZ": {"description": "ISO-3166-1 numeric country code 554.", "label": "New Zealand"}, "COUNTRY_PL": {"description": "ISO-3166-1 numeric country code 616.", "label": "Poland"}, "COUNTRY_PT": {"description": "ISO-3166-1 numeric country code 620.", "label": "Portugal"}, "COUNTRY_SE": {"description": "ISO-3166-1 numeric country code 752.", "label": "Sweden"}, "COUNTRY_SG": {"description": "ISO-3166-1 numeric country code 702.", "label": "Singapore"}, "COUNTRY_US": {"description": "ISO-3166-1 numeric country code 840.", "label": "United States"}, "COUNTRY_ZA": {"description": "ISO-3166-1 numeric country code 710.", "label": "South Africa"}, "CURRENCY_AED": {"description": "ISO-4217 numeric code 784.", "label": "UAE Dirham (AED)"}, "CURRENCY_AUD": {"description": "ISO-4217 numeric code 36.", "label": "Australian Dollar (AUD)"}, "CURRENCY_BRL": {"description": "ISO-4217 numeric code 986.", "label": "Brazilian Real (BRL)"}, "CURRENCY_CAD": {"description": "ISO-4217 numeric code 124.", "label": "Canadian Dollar (CAD)"}, "CURRENCY_CHF": {"description": "ISO-4217 numeric code 756.", "label": "Swiss Franc (CHF)"}, "CURRENCY_CNY": {"description": "ISO-4217 numeric code 156.", "label": "Chinese Yuan (CNY)"}, "CURRENCY_EUR": {"description": "ISO-4217 numeric code 978.", "label": "Euro (EUR)"}, "CURRENCY_GBP": {"description": "ISO-4217 numeric code 826.", "label": "Pound Sterling (GBP)"}, "CURRENCY_HKD": {"description": "ISO-4217 numeric code 344.", "label": "Hong Kong Dollar (HKD)"}, "CURRENCY_INR": {"description": "ISO-4217 numeric code 356.", "label": "Indian Rupee (INR)"}, "CURRENCY_JPY": {"description": "ISO-4217 numeric code 392.", "label": "Japanese Yen (JPY)"}, "CURRENCY_KRW": {"description": "ISO-4217 numeric code 410.", "label": "South Korean Won (KRW)"}, "CURRENCY_MXN": {"description": "ISO-4217 numeric code 484.", "label": "Mexican Peso (MXN)"}, "CURRENCY_NOK": {"description": "ISO-4217 numeric code 578.", "label": "Norwegian Krone (NOK)"}, "CURRENCY_NZD": {"description": "ISO-4217 numeric code 554.", "label": "New Zealand Dollar (NZD)"}, "CURRENCY_SEK": {"description": "ISO-4217 numeric code 752.", "label": "Swedish Krona (SEK)"}, "CURRENCY_SGD": {"description": "ISO-4217 numeric code 702.", "label": "Singapore Dollar (SGD)"}, "CURRENCY_USD": {"description": "ISO-4217 numeric code 840.", "label": "US Dollar (USD)"}, "CURRENCY_ZAR": {"description": "ISO-4217 numeric code 710.", "label": "South African Rand (ZAR)"}, "DAYS_PER_WEEK": {"description": "Unit conversion constant (7).", "label": "days per week"}, "DAY_FRIDAY": {"description": "ISO weekday index 5 (Friday).", "label": "Friday"}, "DAY_MONDAY": {"description": "ISO weekday index 1 (Monday).", "label": "Monday"}, "DAY_SATURDAY": {"description": "ISO weekday index 6 (Saturday).", "label": "Saturday"}, "DAY_SUNDAY": {"description": "ISO weekday index 7 (Sunday).", "label": "Sunday"}, "DAY_THURSDAY": {"description": "ISO weekday index 4 (Thursday).", "label": "Thursday"}, "DAY_TUESDAY": {"description": "ISO weekday index 2 (Tuesday).", "label": "Tuesday"}, "DAY_WEDNESDAY": {"description": "ISO weekday index 3 (Wednesday).", "label": "Wednesday"}, "DEG_PER_RAD_Q16": {"description": "Degrees-per-radian in Q16.16 format.", "label": "degrees per radian (Q16.16)"}, "DST_ACTIVE": {"description": "Current instant is inside the daylight saving period.", "label": "DST active now"}, "DST_NONE": {"description": "Zone does not observe daylight saving time.", "label": "No DST"}, "DST_OBSERVED": {"description": "Zone has daylight saving rules in its calendar.", "label": "DST observed"}, "GRAMS_PER_KILOGRAM": {"description": "Metric conversion constant (1000).", "label": "grams per kilogram"}, "HOURS_PER_DAY": {"description": "Unit conversion constant (24).", "label": "hours per day"}, "INT16_MAX": {"description": "Maximum signed 16-bit integer value.", "label": "i16 max"}, "INT16_MIN": {"description": "Minimum signed 16-bit integer value.", "label": "i16 min"}, "INT24_MAX": {"description": "Maximum signed 24-bit integer value.", "label": "i24 max"}, "INT24_MIN": {"description": "Minimum signed 24-bit integer value.", "label": "i24 min"}, "INT32_MAX": {"description": "Maximum signed 32-bit integer value.", "label": "i32 max"}, "INT32_MIN": {"description": "Minimum signed 32-bit integer value.", "label": "i32 min"}, "INT8_MAX": {"description": "Maximum signed 8-bit integer value.", "label": "i8 max"}, "INT8_MIN": {"description": "Minimum signed 8-bit integer value.", "label": "i8 min"}, "MASK16": {"description": "Bit mask for the low 16 bits (0xFFFF).", "label": "16-bit mask"}, "MASK24": {"description": "Bit mask for the low 24 bits (0xFFFFFF).", "label": "24-bit mask"}, "MASK32": {"description": "Bit mask for the low 32 bits (0xFFFFFFFF).", "label": "32-bit mask"}, "MASK8": {"description": "Bit mask for the low 8 bits (0xFF).", "label": "8-bit mask"}, "MINUTES_PER_HOUR": {"description": "Unit conversion constant (60).", "label": "minutes per hour"}, "MM_PER_METER": {"description": "Metric conversion constant (1000).", "label": "millimetres per metre"}, "MONTH_APRIL": {"description": "Month index 4 (April).", "label": "April"}, "MONTH_AUGUST": {"description": "Month index 8 (August).", "label": "August"}, "MONTH_DECEMBER": {"description": "Month index 12 (December).", "label": "December"}, "MONTH_FEBRUARY": {"description": "Month index 2 (February).", "label": "February"}, "MONTH_JANUARY": {"description": "Month index 1 (January).", "label": "January"}, "MONTH_JULY": {"description": "Month index 7 (July).", "label": "July"}, "MONTH_JUNE": {"description": "Month index 6 (June).", "label": "June"}, "MONTH_MARCH": {"description": "Month index 3 (March).", "label": "March"}, "MONTH_MAY": {"description": "Month index 5 (May).", "label": "May"}, "MONTH_NOVEMBER": {"description": "Month index 11 (November).", "label": "November"}, "MONTH_OCTOBER": {"description": "Month index 10 (October).", "label": "October"}, "MONTH_SEPTEMBER": {"description": "Month index 9 (September).", "label": "September"}, "MS_PER_SECOND": {"description": "Unit conversion constant (1000).", "label": "milliseconds per second"}, "PI_Q16": {"description": "Pi in fixed-point Q16.16 format.", "label": "pi (Q16.16)"}, "RAD_PER_DEG_Q16": {"description": "Radians-per-degree in Q16.16 format.", "label": "radians per degree (Q16.16)"}, "SECONDS_PER_MINUTE": {"description": "Unit conversion constant (60).", "label": "seconds per minute"}, "SIGN16": {"description": "Sign bit flag for signed 16-bit values (0x8000).", "label": "16-bit sign bit"}, "SIGN24": {"description": "Sign bit flag for signed 24-bit values (0x800000).", "label": "24-bit sign bit"}, "SIGN32": {"description": "Sign bit flag for signed 32-bit values (0x80000000).", "label": "32-bit sign bit"}, "SIGN8": {"description": "Sign bit flag for signed 8-bit values (0x80).", "label": "8-bit sign bit"}, "TZ_AMERICA_CHICAGO": {"description": "IANA zone America/Chicago (CST/CDT).", "label": "America/Chicago"}, "TZ_AMERICA_DENVER": {"description": "IANA zone America/Denver (MST/MDT).", "label": "America/Denver"}, "TZ_AMERICA_LOS_ANGELES": {"description": "IANA zone America/Los_Angeles (PST/PDT).", "label": "America/Los_Angeles"}, "TZ_AMERICA_NEW_YORK": {"description": "IANA zone America/New_York (EST/EDT).", "label": "America/New_York"}, "TZ_ASIA_DUBAI": {"description": "IANA zone Asia/Dubai (GST).", "label": "Asia/Dubai"}, "TZ_ASIA_HONG_KONG": {"description": "IANA zone Asia/Hong_Kong (HKT).", "label": "Asia/Hong_Kong"}, "TZ_ASIA_SINGAPORE": {"description": "IANA zone Asia/Singapore (SGT).", "label": "Asia/Singapore"}, "TZ_ASIA_TOKYO": {"description": "IANA zone Asia/Tokyo (JST).", "label": "Asia/Tokyo"}, "TZ_AUSTRALIA_SYDNEY": {"description": "IANA zone Australia/Sydney (AEST/AEDT).", "label": "Australia/Sydney"}, "TZ_EUROPE_LONDON": {"description": "IANA zone Europe/London (GMT/BST).", "label": "Europe/London"}, "TZ_EUROPE_PARIS": {"description": "IANA zone Europe/Paris (CET/CEST).", "label": "Europe/Paris"}, "TZ_UTC": {"description": "Coordinated Universal Time (no daylight saving transition).", "label": "UTC"}, "UINT16_MAX": {"description": "Maximum unsigned 16-bit integer value.", "label": "u16 max"}, "UINT24_MAX": {"description": "Maximum unsigned 24-bit integer value.", "label": "u24 max"}, "UINT32_MAX": {"description": "Maximum unsigned 32-bit integer value.", "label": "u32 max"}, "UINT8_MAX": {"description": "Maximum unsigned 8-bit integer value.", "label": "u8 max"}, "UOM_AMPERE": {"description": "SI base unit for electric current.", "label": "ampere (A)"}, "UOM_CANDELA": {"description": "SI base unit for luminous intensity.", "label": "candela (cd)"}, "UOM_CELSIUS": {"description": "Metric temperature scale in degrees Celsius.", "label": "degree Celsius (°C)"}, "UOM_GRAM": {"description": "Metric unit for mass (1/1000 kilogram).", "label": "gram (g)"}, "UOM_KELVIN": {"description": "SI base unit for temperature.", "label": "kelvin (K)"}, "UOM_KILOGRAM": {"description": "SI base unit for mass.", "label": "kilogram (kg)"}, "UOM_LITER": {"description": "Metric derived unit for volume.", "label": "liter (L)"}, "UOM_METER": {"description": "SI base unit for length.", "label": "meter (m)"}, "UOM_MOLE": {"description": "SI base unit for amount of substance.", "label": "mole (mol)"}, "UOM_SECOND": {"description": "SI base unit for time.", "label": "second (s)"}}},
    BY_CODE: {
      0x01: "Kernel.WaitIRQ",
      0x02: "Kernel.WaitSWIRQ",
      0x03: "Kernel.FireSWIRQ",
      0x04: "Kernel.ProfileStart",
      0x05: "Kernel.ProfileEnd",
      0x06: "Kernel.TracePoint",
      0x07: "Req.Seq",
      0x08: "Req.Principal",
      0x09: "Req.Method",
      0x0A: "Req.Path",
      0x0B: "Req.Header",
      0x0C: "Req.BodyMode",
      0x0D: "Req.BodyCount",
      0x0E: "Req.BodySpan",
      0x10: "Queue.Dequeue",
      0x11: "Queue.Enqueue",
      0x12: "Queue.Depth",
      0x13: "Queue.DequeueBatch",
      0x14: "Queue.EnqueueBatch",
      0x15: "Resp.Status",
      0x16: "Resp.Header",
      0x17: "Resp.Write",
      0x18: "Resp.Trailer",
      0x19: "Resp.Seal",
      0x1A: "Resp.End",
      0x1B: "Resp.Respond",
      0x1C: "Resp.Flush",
      0x1D: "Resp.Continue",
      0x1E: "Resp.EndStream",
      0x1F: "Resp.Upgrade",
      0x20: "Random.U32",
      0x21: "Utf8Writer.New",
      0x22: "Utf8Writer.Byte",
      0x23: "Utf8Writer.Int",
      0x24: "Utf8Writer.Span",
      0x25: "Utf8Writer.ToSpan",
      0x26: "Utf8Writer.Len",
      0x27: "Utf8Writer.Reset",
      0x28: "Utf8Reader.New",
      0x29: "Utf8Reader.Peek",
      0x2A: "Utf8Reader.Next",
      0x2B: "Utf8Reader.Int",
      0x2C: "Utf8Reader.SkipWs",
      0x2D: "Utf8Reader.Eof",
      0x2E: "Utf8Reader.Pos",
      0x2F: "Utf8Reader.Match",
      0x30: "Memory.ArenaInit",
      0x31: "Memory.ArenaAlloc",
      0x32: "Memory.ArenaReset",
      0x33: "Memory.ArenaStats",
      0x34: "Memory.Peek",
      0x35: "Memory.Poke",
      0x36: "Memory.Set",
      0x37: "Memory.Get",
      0x38: "Resp.Abort",
      0x39: "Resp.EarlyHints",
      0x3A: "Bits.And",
      0x3B: "Bits.Or",
      0x3C: "Bits.Xor",
      0x3D: "Bits.Shl",
      0x3E: "Bits.Shr",
      0x3F: "Bits.Sar",
      0x40: "Span.Make",
      0x41: "Span.Slice",
      0x42: "Span.Materialize",
      0x43: "Span.Len",
      0x44: "Span.Get",
      0x45: "Json.BeginObject",
      0x46: "Json.EndObject",
      0x47: "Json.BeginArray",
      0x48: "Json.EndArray",
      0x49: "Json.Key",
      0x4A: "Json.Str",
      0x4B: "Json.Int",
      0x4C: "Json.Bool",
      0x4D: "Json.Null",
      0x4E: "Json.Raw",
      0x4F: "Bits.Not",
      0x50: "Descriptor.Make",
      0x51: "Descriptor.SetFlags",
      0x52: "Descriptor.GetPtr",
      0x53: "Descriptor.GetLen",
      0x54: "Descriptor.GetFlags",
      0x55: "Descriptor.CopyBatch",
      0x56: "Dot8.Len",
      0x57: "Dot8.Of",
      0x58: "Lease.Acquire",
      0x59: "Lease.Release",
      0x5A: "Lease.Validate",
      0x5B: "Lease.CachedValidate",
      0x5C: "Lease.GetSpan",
      0x5D: "Lease.GetTypeHint",
      0x5E: "Status.Last",
      0x5F: "Memory.SetConst",
      0x60: "Storage.GetSchemaForPack",
      0x61: "Storage.SetSchemaForPack",
      0x62: "Storage.AddCard",
      0x63: "Storage.UpdateCard",
      0x64: "Storage.DeleteCard",
      0x65: "Storage.PatchCard",
      0x66: "Storage.ReadCard",
      0x67: "Storage.QueryCard",
      0x68: "Storage.UsePack",
      0x69: "Storage.EditCard",
      0x6A: "Storage.GetField",
      0x6B: "Storage.SetField",
      0x6C: "Storage.SetFieldStr",
      0x6D: "Storage.GetFieldStr",
      0x6E: "Storage.QueryResult",
      0x6F: "Storage.Ready",
      0x70: "Thread.YieldCounted",
      0x71: "Io.Write",
      0x72: "Io.WriteByte",
      0x73: "Xml.Open",
      0x74: "Xml.AttrName",
      0x75: "Xml.AttrValue",
      0x76: "Xml.OpenEnd",
      0x77: "Xml.Text",
      0x78: "Xml.Close",
      0x79: "Xml.Empty",
      0x7A: "Template.Compile",
      0x7B: "Template.Render",
      0x7C: "Arena.Mark",
      0x7D: "Arena.Rewind",
      0x7E: "Arena.Reset",
      0x80: "String.Concat",
      0x81: "String.Length",
      0x82: "String.Substring",
      0x83: "String.IndexOf",
      0x84: "String.Replace",
      0x85: "String.ToUpper",
      0x86: "String.ToLower",
      0x87: "String.Trim",
      0x88: "String.Split",
      0x89: "String.Join",
      0x8A: "String.StartsWith",
      0x8B: "String.EndsWith",
      0x8C: "String.SetReplace",
      0x8D: "String.Eq",
      0x90: "Number.Parse",
      0x91: "Number.ToString",
      0x92: "Number.ToHex",
      0x93: "Number.ToOctal",
      0x94: "Number.ToBinary",
      0x95: "Number.Abs",
      0x96: "Number.Floor",
      0x97: "Number.Ceiling",
      0x98: "Number.Round",
      0x99: "Number.Min",
      0x9A: "Number.Max",
      0xA0: "Maths.Sin",
      0xA1: "Maths.Cos",
      0xA2: "Maths.Tan",
      0xA3: "Maths.Sqrt",
      0xA4: "Maths.Power",
      0xA5: "Maths.Log",
      0xA6: "Maths.Log10",
      0xA7: "Maths.Exp",
      0xA8: "Maths.Random",
      0xA9: "Maths.RandomRange",
      0xAA: "Maths.Clamp",
      0xAB: "Maths.Lerp",
      0xB0: "DateTime.Now",
      0xB1: "DateTime.UtcNow",
      0xB2: "DateTime.Parse",
      0xB3: "DateTime.Format",
      0xB4: "DateTime.AddSeconds",
      0xB5: "DateTime.AddMinutes",
      0xB6: "DateTime.AddHours",
      0xB7: "DateTime.AddDays",
      0xB8: "DateTime.GetDayOfWeek",
      0xB9: "DateTime.GetDayOfYear",
      0xBA: "DateTime.UnixTimestamp",
      0xBB: "DateTime.DiffDays",
      0xBC: "DateTime.Year",
      0xBD: "DateTime.Month",
      0xBE: "DateTime.Day",
      0xC0: "Locale.GetCurrentLocale",
      0xC1: "Locale.SetLocale",
      0xC2: "Locale.FormatCurrency",
      0xC3: "Locale.FormatNumber",
      0xC4: "Locale.FormatDate",
      0xC5: "Locale.FormatTime",
      0xC6: "Locale.Translate",
      0xD0: "Environment.GetOsVersion",
      0xD1: "Environment.GetCpuCount",
      0xD2: "Environment.GetMemoryTotal",
      0xD3: "Environment.GetMemoryFree",
      0xD4: "Environment.GetHostname",
      0xD5: "Environment.GetTimeZone",
      0xD6: "Environment.GetProcessId",
      0xD7: "Environment.GetThreadId",
      0xD8: "Environment.GetElapsedTime",
      0xE0: "Context.GetVerb",
      0xE1: "Context.GetPath",
      0xE2: "Context.GetHost",
      0xE3: "Context.GetPort",
      0xE4: "Context.GetRemoteAddr",
      0xE5: "Context.GetUser",
      0xE6: "Context.GetPermissions",
      0xE7: "Context.GetHeaders",
      0xE8: "Context.GetQueryString",
      0xE9: "Context.GetBody",
      0xEA: "Context.SetScratchValue",
      0xEB: "Context.GetScratchValue",
      0xEC: "Context.GetRequestId",
      0xED: "Context.GetClientCert",
      0xEE: "Context.GetTraceId",
      0xF0: "Crypto.Sha256",
      0xF1: "Crypto.Sha512",
      0xF2: "Crypto.Blake2b",
      0xF3: "Crypto.Blake3",
      0xF4: "Crypto.HmacSha256",
      0xF5: "Crypto.HmacSha512",
      0xF6: "Crypto.Sign",
      0xF7: "Crypto.Verify",
      0xF8: "Crypto.Encrypt",
      0xF9: "Crypto.Decrypt",
      0xFA: "Crypto.GenerateKeyPair",
      0xFB: "Crypto.DeriveKey",
      0xFC: "Crypto.RandomBytes",
      0xFD: "Crypto.Md5",
      0xFE: "Crypto.Sha1",
      0x100: "Compress.BrotliCompress",
      0x101: "Compress.BrotliDecompress",
      0x102: "Compress.PicoCompress",
      0x103: "Compress.PicoDecompress",
      0x104: "Compress.GzipCompress",
      0x105: "Compress.GzipDecompress",
      0x106: "Compress.DeflateCompress",
      0x107: "Compress.DeflateDecompress",
      0x110: "X509.FetchCertificate",
      0x111: "X509.StoreCertificate",
      0x112: "X509.GenerateCSR",
      0x113: "X509.GenerateKeyPair",
      0x114: "X509.VerifyCertChain",
      0x115: "X509.GetCertInfo",
      0x116: "X509.IsCertValid",
      0x117: "X509.GetKeyHandle",
      0x120: "Auth.GetUserCredentials",
      0x121: "Auth.ValidateCredentials",
      0x122: "Auth.SwitchUserContext",
      0x123: "Auth.GetUserPermissions",
      0x124: "Auth.RequestToken",
      0x125: "Auth.GetToken",
      0x126: "Auth.ValidateToken",
      0x127: "Auth.SwitchTokenContext",
      0x128: "Auth.RefreshToken",
      0x129: "Auth.RevokeToken",
      0x130: "Http.ReadHeader",
      0x131: "Http.ReadBody",
      0x132: "Http.GenerateHeaders",
      0x133: "Http.GenerateResponse",
      0x134: "Http.ParseQuery",
      0x135: "Http.ParseForm",
      0x136: "Http.ParseJson",
      0x137: "Http.EncodeJson",
      0x138: "Http.Request",
      0x139: "Http.RespStatus",
      0x13A: "Http.RespHeaders",
      0x13B: "Http.RespBody",
      0x140: "Html.CreateNode",
      0x141: "Html.AddChildNode",
      0x142: "Html.RemoveChildNode",
      0x143: "Html.SetAttribute",
      0x144: "Html.GetAttribute",
      0x145: "Html.ParseTree",
      0x146: "Html.Encode",
      0x147: "Html.Decode",
      0x148: "Html.Serialize",
      0x149: "Html.QuerySelector",
      0x150: "Gpio.Count",
      0x151: "Gpio.SetDir",
      0x152: "Gpio.GetDir",
      0x153: "Gpio.SetPull",
      0x154: "Gpio.GetPull",
      0x155: "Gpio.Write",
      0x156: "Gpio.Read",
      0x160: "Pack.Use",
      0x161: "Card.Read",
      0x162: "Card.Write",
      0x163: "Card.Address",
      0x164: "Fifo.Open",
      0x165: "Fifo.Send",
      0x166: "Fifo.Recv",
      0x167: "Fifo.Poll",
      0x168: "Device.Open",
      0x169: "Device.Caps",
      0x16A: "Device.Close",
      0x16B: "Device.Status",
      0x170: "Stream.Open",
      0x171: "Stream.Next",
      0x172: "Stream.Span",
      0x173: "Stream.Submit",
      0x174: "Stream.Release",
      0x175: "Stream.Close",
      0x176: "Stream.SetSlice",
      0x177: "Stream.Slice",
      0x178: "Assert.Eq",
      0x179: "Assert.True",
      0x17A: "Assert.Count",
      0x17B: "Assert.Failed",
      0x17C: "Assert.Reset",
      0x180: "Event.Post",
      0x181: "Event.Next",
      0x182: "Event.Type",
      0x183: "Event.Target",
      0x184: "Event.Data",
      0x185: "Event.SetData",
      0x186: "Event.Count",
      0x188: "Ui.Window",
      0x189: "Ui.Panel",
      0x18A: "Ui.Label",
      0x18B: "Ui.Button",
      0x18C: "Ui.TextBox",
      0x18D: "Ui.Checkbox",
      0x18E: "Ui.Pos",
      0x18F: "Ui.Size",
      0x190: "Ui.SetText",
      0x191: "Ui.SetId",
      0x192: "Ui.SetValue",
      0x193: "Ui.Serialize",
      0x1A0: "Storage.SetSlice",
      0x1A1: "Storage.CardLen",
      0x1A2: "Storage.ReadSlice",
      0x1A3: "Storage.WriteSlice",
      0x1A4: "Storage.IsUserPack",
      0x1B0: "Req.SetSlice",
      0x1B1: "Req.BodySlice",
      0x1B2: "Req.BodyLen",
      0x1B3: "Event.SetSlice",
      0x1B4: "Event.DataSlice",
      0x1B5: "Event.DataLen",
      0x1B6: "Req.Param",
      0x1B7: "Req.ParamCount",
      0x1C0: "Query.BuildLookupFilter",
      0x1C1: "Query.BuildManyToManyMap",
      0x1D0: "Search.Clear",
      0x1D1: "Search.UpsertText",
      0x1D2: "Search.Delete",
      0x1D3: "Search.IndexPack",
      0x1D4: "Search.QueryText",
      0x1D5: "Search.SetVector",
      0x1D6: "Search.QueryHybrid",
      0x1D7: "Search.Result",
      0x1D8: "Search.Score",
      0x1D9: "Search.Plan",
      0x1DA: "Search.SetSemanticWeight",
      0x1DB: "Search.Configure",
      0x1DC: "Search.Compatible",
      0x1DD: "Search.Rebuild",
      0x1DE: "Search.SetFacet",
      0x1DF: "Search.SetNumber",
      0x1E0: "Tensor.SetShape",
      0x1E1: "Tensor.DotI8",
      0x1E2: "Tensor.MatVecI8",
      0x1E3: "Tensor.AddI32",
      0x1E4: "Tensor.MulI32",
      0x1E5: "Tensor.ScaleI32",
      0x1E6: "Tensor.ReluI32",
      0x1E7: "Tensor.RmsNormI32",
      0x1E8: "Tensor.RoPEI32",
      0x1E9: "Tensor.SoftmaxI32",
      0x1EA: "Tensor.ArgMaxI32",
      0x1EB: "Tensor.HasAccel",
      0x1F0: "BitLinear.SetShape",
      0x1F1: "BitLinear.MatVecTernary",
      0x1F2: "BitLinear.MatVecBitmap",
      0x1F3: "BitLinear.MatVecBase3",
      0x1F4: "BitLinear.HasFormat",
      0x200: "Search.ClearFields",
      0x201: "Search.Facets",
      0x202: "Search.FacetValue",
      0x203: "Search.FacetCount",
      0x204: "Search.Range",
      0x205: "Search.Save",
      0x206: "Search.Load",
      0x207: "Search.JournalUpsert",
      0x208: "Search.JournalDelete",
      0x209: "Search.JournalFacet",
      0x20A: "Search.JournalNumber",
      0x20B: "Search.JournalReplay",
      0x210: "Tokenizer.SetVocab",
      0x211: "Tokenizer.EncodeBytes",
      0x212: "Tokenizer.EncodeTrie",
      0x213: "Tokenizer.DecodeBytes",
      0x214: "Tokenizer.DecodeTrie",
      0x215: "Tokenizer.Count",
      0x216: "Tokenizer.Token",
      0x220: "Model.SetConfig",
      0x221: "Model.GetConfig",
      0x222: "Model.TensorView",
      0x223: "Model.TensorOffset",
      0x224: "Model.TensorRows",
      0x225: "Model.TensorCols",
      0x226: "Model.TensorFormat",
      0x227: "Model.ReadTensor",
      0x228: "Quant.AbsMax",
      0x229: "Quant.QuantI8",
      0x22A: "Quant.DequantI8",
      0x22B: "Quant.ApplyScale",
      0x22C: "Quant.GroupScale",
      0x230: "Kv.SetShape",
      0x231: "Kv.WriteK",
      0x232: "Kv.WriteV",
      0x233: "Kv.ReadK",
      0x234: "Kv.ReadV",
      0x235: "Kv.Len",
      0x236: "Kv.Clear",
      0x237: "Kv.SetHead",
      0x238: "Kv.WriteKH",
      0x239: "Kv.WriteVH",
      0x23A: "Kv.ReadKH",
      0x23B: "Kv.ReadVH",
      0x240: "Sampling.ArgMax",
      0x241: "Sampling.TopK",
      0x242: "Sampling.Temperature",
      0x243: "Sampling.ArgMaxRows",
      0x250: "Attention.SetShape",
      0x251: "Attention.Scores",
      0x252: "Attention.Mix",
      0x253: "Attention.Attend",
      0x260: "TextRender.Raw",
      0x261: "TextRender.Text",
      0x262: "TextRender.Open",
      0x263: "TextRender.Attr",
      0x264: "TextRender.OpenEnd",
      0x265: "TextRender.Close",
      0x266: "TextRender.Empty",
      0x267: "TextRender.Hole",
      0x268: "TextRender.Br",
      0x270: "Model.ReadTensorRow",
      0x271: "Model.SetBlock",
      0x272: "Model.ReadTensorBlock",
      0x273: "Model.MatVecI8Block",
      0x274: "BitLinear.MatVecTernaryBlock",
      0x275: "BitLinear.MatVecBitmapBlock",
      0x276: "BitLinear.MatVecBase3Block",
      0x280: "Process.Self",
      0x281: "Process.Parent",
      0x282: "Process.Spawn",
      0x283: "Process.Exit",
      0x284: "Process.Kill",
      0x285: "Process.Status",
      0x286: "Process.Wait",
      0x287: "Process.Args",
      0x288: "Env.Get",
      0x289: "Env.Set",
      0x28A: "Env.Count",
      0x28B: "Env.Key",
      0x290: "Timer.After",
      0x291: "Timer.Every",
      0x292: "Timer.Cancel",
      0x293: "Timer.Elapsed",
      0x294: "Scheduler.Tick",
      0x2A0: "Principal.Current",
      0x2A1: "Principal.HasRole",
      0x2A2: "Principal.Claims",
      0x2A3: "Capability.Has",
      0x2A4: "Capability.Request",
      0x2A5: "Capability.Drop",
      0x2A6: "Sandbox.Deny",
      0x2B0: "Error.SetHandler",
      0x2B1: "Error.HasHandler",
      0x2B2: "Error.Code",
      0x2B3: "Error.Detail",
      0x2B4: "Error.Resume",
      0x2B5: "Error.Clear",
      0x2C0: "Capsule.Call",
      0x2C1: "Capsule.Schedule",
      0x2C2: "Capsule.Jump",
      0x2C3: "Capsule.LoadModule",
      0x2C4: "Capsule.RunModule",
      0x2D0: "Base64.Encode",
      0x2D1: "Base64.Decode",
      0x2D2: "Base64.UrlDecode",
      0x2D3: "Base64.UrlEncode",
      0x2E0: "Net.Listen",
      0x2E1: "Net.Accept",
      0x2E2: "Net.Read",
      0x2E3: "Net.Write",
      0x2E4: "Net.Shutdown",
      0x2E5: "Net.PoolSize",
      0x2E6: "Net.Register",
      0x300: "Data.Lookup",
      0x301: "Data.FieldNum",
      0x302: "Data.FieldStr",
      0x310: "Encoding.AsciiEncode",
      0x311: "Encoding.AsciiDecode",
      0x312: "Encoding.Utf8Encode",
      0x313: "Encoding.Utf8Decode",
      0x314: "Encoding.Utf16LEEncode",
      0x315: "Encoding.Utf16LEDecode",
      0x316: "Encoding.Utf16BEEncode",
      0x317: "Encoding.Utf16BEDecode",
      0x318: "Encoding.Utf7Encode",
      0x319: "Encoding.Utf7Decode",
      0x31A: "Encoding.HexEncode",
      0x31B: "Encoding.HexDecode",
      0x320: "Map.New",
      0x321: "Map.Free",
      0x322: "Map.Clear",
      0x323: "Map.Count",
      0x324: "Map.Hash",
      0x325: "Map.PutII",
      0x326: "Map.GetII",
      0x327: "Map.HasI",
      0x328: "Map.DelI",
      0x329: "Map.PutIS",
      0x32A: "Map.GetIS",
      0x32B: "Map.PutNullI",
      0x32C: "Map.IsNullI",
      0x32D: "Map.PutSI",
      0x32E: "Map.GetSI",
      0x32F: "Map.HasS",
      0x330: "Map.DelS",
      0x331: "Map.PutSS",
      0x332: "Map.GetSS",
      0x333: "Map.PutNullS",
      0x334: "Map.IsNullS",
      0x335: "Map.KeyAt",
      0x336: "Map.KeySpanAt",
      0x337: "Map.ValAt",
      0x338: "Map.ValSpanAt",
      0x339: "Map.ValIsSpan",
      0x33A: "Map.Use",
      0x340: "Json.Parse",
      0x341: "Binary.ParseCard",
      0x342: "Binary.SerializeCard",
      0x343: "Binary.ParseEntity",
      0x344: "Binary.SerializeEntity",
      0x345: "Binary.SetKey",
      0x346: "Binary.Verify",
    }
  };
  function _canonConstant(name) {
    if (name == null) return null;
    var key = String(name).trim().toUpperCase();
    if (key.indexOf("METHOD_") === 0) return "HTTP_" + key;
    if (key.indexOf("STATUS_") === 0) return "HTTP_" + key;
    if (key.indexOf("HTTPMETHOD.") === 0) return "HTTP_METHOD_" + key.split(".", 2)[1];
    if (key.indexOf("HTTPSTATUS.") === 0) return "HTTP_STATUS_" + key.split(".", 2)[1];
    if (key.indexOf("DAY.") === 0) return "DAY_" + key.split(".", 2)[1];
    if (key.indexOf("MONTH.") === 0) return "MONTH_" + key.split(".", 2)[1];
    if (key.indexOf("TZ.") === 0) return "TZ_" + key.split(".", 2)[1];
    if (key.indexOf("TIMEZONE.") === 0) return "TZ_" + key.split(".", 2)[1];
    if (key.indexOf("DST.") === 0) return "DST_" + key.split(".", 2)[1];
    if (key.indexOf("CURRENCY.") === 0) return "CURRENCY_" + key.split(".", 2)[1];
    if (key.indexOf("CURRENCYMINOR.") === 0) return "CURRENCY_MINOR_" + key.split(".", 2)[1];
    if (key.indexOf("COUNTRY.") === 0) return "COUNTRY_" + key.split(".", 2)[1];
    if (key.indexOf("UOM.") === 0) return "UOM_" + key.split(".", 2)[1];
    if (key.indexOf("COLOR.") === 0) return "COLOR_" + key.split(".", 2)[1];
    return key;
  }
  function _titleConstant(key) {
    return String(key).replace(/[._]/g, ' ').toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  function _defaultEnMeta(canonical, value) {
    if (canonical.indexOf("CURRENCY_MINOR_") === 0) {
      var cmi = canonical.slice("CURRENCY_MINOR_".length);
      return { label: cmi + ' minor units', description: 'Decimal places used by ' + cmi + ' currency amounts.' };
    }
    if (canonical.indexOf("CURRENCY_") === 0) {
      var cur = canonical.slice("CURRENCY_".length);
      return { label: cur + ' currency', description: 'ISO-4217 numeric currency code for ' + cur + '.' };
    }
    if (canonical.indexOf("COUNTRY_") === 0) {
      var co = canonical.slice("COUNTRY_".length);
      return { label: co + ' country', description: 'ISO-3166-1 numeric country code for ' + co + '.' };
    }
    return { label: _titleConstant(canonical), description: 'Named constant value ' + value + '.' };
  }
  function _normalizeMetaEntry(entry) {
    if (entry && typeof entry === 'object') {
      var out = {};
      if (entry.label != null) out.label = String(entry.label);
      if (entry.description != null) out.description = String(entry.description);
      return out;
    }
    if (typeof entry === 'string') return { label: entry };
    return {};
  }
  function _userLocaleEntries(userDict, localeKey) {
    var out = {};
    if (!userDict || typeof userDict !== 'object') return out;
    Object.keys(userDict).forEach(function (k) {
      var v = userDict[k];
      if (typeof v === 'string') out[String(k).trim().toUpperCase()] = _normalizeMetaEntry(v);
      else if (v && typeof v === 'object' && (v.label != null || v.description != null)) out[String(k).trim().toUpperCase()] = _normalizeMetaEntry(v);
    });
    var base = String(localeKey || 'en').split('-', 2)[0];
    [String(localeKey || 'en'), base].forEach(function (lk) {
      var scoped = userDict[lk];
      if (!scoped || typeof scoped !== 'object') return;
      Object.keys(scoped).forEach(function (k) {
        out[String(k).trim().toUpperCase()] = _normalizeMetaEntry(scoped[k]);
      });
    });
    return out;
  }
  H.describeConstant = function (name, locale, userDictionary) {
    if (name == null) return null;
    var raw = String(name).trim().toUpperCase();
    if (!Object.prototype.hasOwnProperty.call(H.CONSTANTS, raw)) return null;
    var value = Number(H.CONSTANTS[raw]);
    var canonical = _canonConstant(raw);
    var localeKey = String(locale || 'en');
    var localeBase = localeKey.split('-', 2)[0];
    var meta = _defaultEnMeta(canonical, value);
    var en = (H.CONSTANT_I18N && H.CONSTANT_I18N.en && H.CONSTANT_I18N.en[canonical]) || {};
    var loc = (H.CONSTANT_I18N && (H.CONSTANT_I18N[localeKey] || H.CONSTANT_I18N[localeBase]) && (H.CONSTANT_I18N[localeKey] || H.CONSTANT_I18N[localeBase])[canonical]) || {};
    Object.assign(meta, en, loc);
    var userEntries = _userLocaleEntries(userDictionary, localeKey);
    Object.assign(meta, userEntries[canonical] || {}, userEntries[raw] || {});
    return {
      name: canonical,
      value: value,
      label: meta.label || canonical,
      description: meta.description || ('Named constant value ' + value + '.'),
      locale: localeKey
    };
  };
  H.toLocale = function (name, locale, userDictionary, includeDescription) {
    var m = H.describeConstant(name, locale, userDictionary);
    if (!m) return null;
    if (includeDescription === false) return m.label + ' (' + m.value + ')';
    return m.label + ' (' + m.value + '): ' + m.description;
  };
  root.PV_HOOKS = H;
})(_root);

// picocompress — JavaScript port (ES module)
// Byte-identical to the C reference implementation.
// Pure JavaScript, zero dependencies, works in Node.js 18+ and modern browsers.
//
// Vendored into picoscript from C:/source/picocompress/ports/javascript and
// UMD-wrapped so the browser (inlined) and Node (require) both expose
// `PicoCompress`. The compress/decompress logic is unmodified.
(function (root, factory) {
  root.PicoCompress = factory();
})(_root, function () {
  "use strict";

const PC_BLOCK_SIZE = 508;
const PC_LITERAL_MAX = 64;
const PC_MATCH_MIN = 2;
const PC_MATCH_CODE_BITS = 5;
const PC_MATCH_MAX = PC_MATCH_MIN + ((1 << PC_MATCH_CODE_BITS) - 1); // 33
const PC_OFFSET_SHORT_BITS = 9;
const PC_OFFSET_SHORT_MAX = (1 << PC_OFFSET_SHORT_BITS) - 1; // 511
const PC_LONG_MATCH_MIN = 2;
const PC_LONG_MATCH_MAX = 17;
const PC_OFFSET_LONG_MAX = 65535;
const PC_DICT_COUNT = 96;
const PC_GOOD_MATCH = 8;
const PC_REPEAT_CACHE_SIZE = 3;
const PC_BLOCK_MAX_COMPRESSED = PC_BLOCK_SIZE + Math.ceil(PC_BLOCK_SIZE / PC_LITERAL_MAX) + 16;

// Default profile constants (can be overridden via options)
const DEFAULT_HASH_BITS = 9;
const DEFAULT_HASH_CHAIN_DEPTH = 2;
const DEFAULT_HISTORY_SIZE = 504;
const DEFAULT_LAZY_STEPS = 1;

// ---- Static dictionary (96 entries, identical to C) ----

const DICT = [
  /* 0  */ [0x22, 0x3A, 0x20, 0x22],                         // ": "
  /* 1  */ [0x7D, 0x2C, 0x0A, 0x22],                         // },\n"
  /* 2  */ [0x3C, 0x2F, 0x64, 0x69, 0x76],                   // </div
  /* 3  */ [0x74, 0x69, 0x6F, 0x6E],                         // tion
  /* 4  */ [0x6D, 0x65, 0x6E, 0x74],                         // ment
  /* 5  */ [0x6E, 0x65, 0x73, 0x73],                         // ness
  /* 6  */ [0x61, 0x62, 0x6C, 0x65],                         // able
  /* 7  */ [0x69, 0x67, 0x68, 0x74],                         // ight
  /* 8  */ [0x22, 0x3A, 0x22],                               // ":"
  /* 9  */ [0x3C, 0x2F, 0x64, 0x69],                         // </di
  /* 10 */ [0x3D, 0x22, 0x68, 0x74],                         // ="ht
  /* 11 */ [0x74, 0x68, 0x65],                               // the
  /* 12 */ [0x69, 0x6E, 0x67],                               // ing
  /* 13 */ [0x2C, 0x22, 0x2C],                               // ","
  /* 14 */ [0x22, 0x3A, 0x7B],                               // ":{
  /* 15 */ [0x22, 0x3A, 0x5B],                               // ":[
  /* 16 */ [0x69, 0x6F, 0x6E],                               // ion
  /* 17 */ [0x65, 0x6E, 0x74],                               // ent
  /* 18 */ [0x74, 0x65, 0x72],                               // ter
  /* 19 */ [0x61, 0x6E, 0x64],                               // and
  /* 20 */ [0x2F, 0x3E, 0x0D, 0x0A],                         // />\r\n
  /* 21 */ [0x22, 0x7D, 0x2C],                               // "},
  /* 22 */ [0x22, 0x5D, 0x2C],                               // "],
  /* 23 */ [0x68, 0x61, 0x76, 0x65],                         // have
  /* 24 */ [0x6E, 0x6F, 0x22, 0x3A],                         // no":
  /* 25 */ [0x74, 0x72, 0x75, 0x65],                         // true
  /* 26 */ [0x6E, 0x75, 0x6C, 0x6C],                         // null
  /* 27 */ [0x6E, 0x61, 0x6D, 0x65],                         // name
  /* 28 */ [0x64, 0x61, 0x74, 0x61],                         // data
  /* 29 */ [0x74, 0x69, 0x6D, 0x65],                         // time
  /* 30 */ [0x74, 0x79, 0x70, 0x65],                         // type
  /* 31 */ [0x6D, 0x6F, 0x64, 0x65],                         // mode
  /* 32 */ [0x68, 0x74, 0x74, 0x70],                         // http
  /* 33 */ [0x74, 0x69, 0x6F, 0x6E],                         // tion
  /* 34 */ [0x63, 0x6F, 0x64, 0x65],                         // code
  /* 35 */ [0x73, 0x69, 0x7A, 0x65],                         // size
  /* 36 */ [0x6D, 0x65, 0x6E, 0x74],                         // ment
  /* 37 */ [0x6C, 0x69, 0x73, 0x74],                         // list
  /* 38 */ [0x69, 0x74, 0x65, 0x6D],                         // item
  /* 39 */ [0x74, 0x65, 0x78, 0x74],                         // text
  /* 40 */ [0x66, 0x61, 0x6C, 0x73, 0x65],                   // false
  /* 41 */ [0x65, 0x72, 0x72, 0x6F, 0x72],                   // error
  /* 42 */ [0x76, 0x61, 0x6C, 0x75, 0x65],                   // value
  /* 43 */ [0x73, 0x74, 0x61, 0x74, 0x65],                   // state
  /* 44 */ [0x61, 0x6C, 0x65, 0x72, 0x74],                   // alert
  /* 45 */ [0x69, 0x6E, 0x70, 0x75, 0x74],                   // input
  /* 46 */ [0x61, 0x74, 0x69, 0x6F, 0x6E],                   // ation
  /* 47 */ [0x6F, 0x72, 0x64, 0x65, 0x72],                   // order
  /* 48 */ [0x73, 0x74, 0x61, 0x74, 0x75, 0x73],             // status
  /* 49 */ [0x6E, 0x75, 0x6D, 0x62, 0x65, 0x72],             // number
  /* 50 */ [0x61, 0x63, 0x74, 0x69, 0x76, 0x65],             // active
  /* 51 */ [0x64, 0x65, 0x76, 0x69, 0x63, 0x65],             // device
  /* 52 */ [0x72, 0x65, 0x67, 0x69, 0x6F, 0x6E],             // region
  /* 53 */ [0x73, 0x74, 0x72, 0x69, 0x6E, 0x67],             // string
  /* 54 */ [0x72, 0x65, 0x73, 0x75, 0x6C, 0x74],             // result
  /* 55 */ [0x6C, 0x65, 0x6E, 0x67, 0x74, 0x68],             // length
  /* 56 */ [0x6D, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65],       // message
  /* 57 */ [0x63, 0x6F, 0x6E, 0x74, 0x65, 0x6E, 0x74],       // content
  /* 58 */ [0x72, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74],       // request
  /* 59 */ [0x64, 0x65, 0x66, 0x61, 0x75, 0x6C, 0x74],       // default
  /* 60 */ [0x6E, 0x75, 0x6D, 0x62, 0x65, 0x72, 0x22, 0x3A], // number":
  /* 61 */ [0x6F, 0x70, 0x65, 0x72, 0x61, 0x74, 0x6F, 0x72], // operator
  /* 62 */ [0x68, 0x74, 0x74, 0x70, 0x73, 0x3A, 0x2F, 0x2F], // https://
  /* 63 */ [0x72, 0x65, 0x73, 0x70, 0x6F, 0x6E, 0x73, 0x65], // response
  /* 64 */ [0x2E, 0x20, 0x54, 0x68, 0x65, 0x20],             // . The
  /* 65 */ [0x2E, 0x20, 0x49, 0x74, 0x20],                   // . It
  /* 66 */ [0x2E, 0x20, 0x54, 0x68, 0x69, 0x73, 0x20],       // . This
  /* 67 */ [0x2E, 0x20, 0x41, 0x20],                         // . A
  /* 68 */ [0x48, 0x54, 0x54, 0x50],                         // HTTP
  /* 69 */ [0x4A, 0x53, 0x4F, 0x4E],                         // JSON
  /* 70 */ [0x54, 0x68, 0x65, 0x20],                         // The
  /* 71 */ [0x4E, 0x6F, 0x6E, 0x65],                         // None
  /* 72 */ [0x6D, 0x65, 0x6E, 0x74],                         // ment
  /* 73 */ [0x6E, 0x65, 0x73, 0x73],                         // ness
  /* 74 */ [0x61, 0x62, 0x6C, 0x65],                         // able
  /* 75 */ [0x69, 0x67, 0x68, 0x74],                         // ight
  /* 76 */ [0x61, 0x74, 0x69, 0x6F, 0x6E],                   // ation
  /* 77 */ [0x6F, 0x75, 0x6C, 0x64, 0x20],                   // ould
  /* 78 */ [0x22, 0x3A, 0x20, 0x22],                         // ": "
  /* 79 */ [0x22, 0x2C, 0x20, 0x22],                         // ", "
  /* 80 */ [0x44, 0x49, 0x4D],                               // DIM
  /* 81 */ [0x46, 0x4F, 0x52],                               // FOR
  /* 82 */ [0x45, 0x4E, 0x44],                               // END
  /* 83 */ [0x52, 0x45, 0x4C],                               // REL
  /* 84 */ [0x45, 0x41, 0x43, 0x48],                         // EACH
  /* 85 */ [0x4C, 0x4F, 0x41, 0x44],                         // LOAD
  /* 86 */ [0x53, 0x41, 0x56, 0x45],                         // SAVE
  /* 87 */ [0x43, 0x41, 0x52, 0x44],                         // CARD
  /* 88 */ [0x4A, 0x55, 0x4D, 0x50],                         // JUMP
  /* 89 */ [0x50, 0x52, 0x49, 0x4E, 0x54],                   // PRINT
  /* 90 */ [0x49, 0x4E, 0x50, 0x55, 0x54],                   // INPUT
  /* 91 */ [0x47, 0x4F, 0x53, 0x55, 0x42],                   // GOSUB
  /* 92 */ [0x53, 0x54, 0x52, 0x45, 0x41, 0x4D],             // STREAM
  /* 93 */ [0x52, 0x45, 0x54, 0x55, 0x52, 0x4E],             // RETURN
  /* 94 */ [0x53, 0x57, 0x49, 0x54, 0x43, 0x48],             // SWITCH
  /* 95 */ [0x50, 0x52, 0x4F, 0x47, 0x52, 0x41, 0x4D],       // PROGRAM
];

// Convert to Uint8Array for fast comparison
const DICT_U8 = DICT.map(d => new Uint8Array(d));

// ---- Hash function (portable, matches C) ----

function hash3(buf, pos, hashSize) {
  return ((buf[pos] * 251 + buf[pos + 1] * 11 + buf[pos + 2] * 3) & 0xFFFFFFFF) & (hashSize - 1);
}

// ---- Match length ----

function matchLen(a, aOff, b, bOff, limit) {
  let m = 0;
  while (m < limit && a[aOff + m] === b[bOff + m]) ++m;
  return m;
}

// ---- Emit literals ----

function emitLiterals(src, srcOff, srcLen, dst, op) {
  let pos = 0;
  while (pos < srcLen) {
    let chunk = srcLen - pos;
    if (chunk > PC_LITERAL_MAX) chunk = PC_LITERAL_MAX;
    dst[op++] = (chunk - 1) & 0xFF; // 0x00..0x3F
    dst.set(src.subarray(srcOff + pos, srcOff + pos + chunk), op);
    op += chunk;
    pos += chunk;
  }
  return op;
}

// ---- Hash table insert ----

function headInsert(head, depth, hashSize, h, pos) {
  for (let d = depth - 1; d > 0; --d) {
    head[d * hashSize + h] = head[(d - 1) * hashSize + h];
  }
  head[h] = pos;
}

// ---- Find best match (repeat-cache, dict, LZ) ----

function findBest(vbuf, vbufLen, vpos, head, depth, hashSize,
                  repOffsets, goodMatch, skipDict, out) {
  let bestSavings = 0;
  const remaining = vbufLen - vpos;

  out.len = 0;
  out.off = 0;
  out.dict = 0xFFFF;
  out.isRepeat = 0;

  // 1. Repeat-offset cache
  if (remaining >= PC_MATCH_MIN) {
    const maxRep = remaining > PC_MATCH_MAX ? PC_MATCH_MAX : remaining;
    for (let d = 0; d < PC_REPEAT_CACHE_SIZE; ++d) {
      const off = repOffsets[d];
      if (off === 0 || off > vpos) continue;
      if (vbuf[vpos] !== vbuf[vpos - off]) continue;
      if (remaining >= 2 && vbuf[vpos + 1] !== vbuf[vpos - off + 1]) continue;
      const len = matchLen(vbuf, vpos - off, vbuf, vpos, maxRep);
      if (len < PC_MATCH_MIN) continue;

      const isRep = (d === 0 && len <= 17) ? 1 : 0;
      const tokenCost = isRep ? 1 : (off <= PC_OFFSET_SHORT_MAX ? 2 : 3);
      const s = len - tokenCost;

      if (s > bestSavings) {
        bestSavings = s;
        out.len = len;
        out.off = off;
        out.dict = 0xFFFF;
        out.isRepeat = isRep;
        if (len >= goodMatch) return bestSavings;
      }
    }
  }

  // 2. Dictionary match
  if (!skipDict) {
    const firstByte = vbuf[vpos];
    for (let d = 0; d < PC_DICT_COUNT; ++d) {
      const entry = DICT_U8[d];
      const dlen = entry.length;
      if (dlen > remaining) continue;
      if (dlen - 1 <= bestSavings) continue;
      if (entry[0] !== firstByte) continue;
      let match = true;
      for (let k = 1; k < dlen; ++k) {
        if (vbuf[vpos + k] !== entry[k]) { match = false; break; }
      }
      if (!match) continue;
      bestSavings = dlen - 1;
      out.dict = d;
      out.len = dlen;
      out.off = 0;
      out.isRepeat = 0;
      if (dlen >= goodMatch) return bestSavings;
    }
  }

  // 3. LZ hash-chain match
  if (remaining >= 3) {
    const h = hash3(vbuf, vpos, hashSize);
    const maxLenShort = remaining > PC_MATCH_MAX ? PC_MATCH_MAX : remaining;
    const maxLenLong = remaining > PC_LONG_MATCH_MAX ? PC_LONG_MATCH_MAX : remaining;
    const firstByte = vbuf[vpos];

    for (let d = 0; d < depth; ++d) {
      const prev = head[d * hashSize + h];
      if (prev < 0) continue;
      if (prev >= vpos) continue;
      const off = vpos - prev;
      if (off === 0 || off > PC_OFFSET_LONG_MAX) continue;
      if (vbuf[prev] !== firstByte) continue;

      const maxLen = (off <= PC_OFFSET_SHORT_MAX) ? maxLenShort : maxLenLong;
      const len = matchLen(vbuf, prev, vbuf, vpos, maxLen);
      if (len < PC_MATCH_MIN) continue;

      const tokenCost = (off <= PC_OFFSET_SHORT_MAX) ? 2 : 3;
      const s = len - tokenCost;

      if (s > bestSavings
          || (s === bestSavings && len > out.len)
          || (s === bestSavings && len === out.len && off < out.off)
          || (s === bestSavings - 1 && len >= out.len + 2)) {
        bestSavings = len - tokenCost;
        out.len = len;
        out.off = off;
        out.dict = 0xFFFF;
        out.isRepeat = 0;
        if (len >= goodMatch) return bestSavings;
      }
    }
  }

  return bestSavings;
}

// ---- Compress a single block ----

function compressBlock(vbuf, histLen, blockLen, out, hashBits, chainDepth, lazySteps) {
  const hashSize = 1 << hashBits;
  const head = new Int16Array(chainDepth * hashSize);
  head.fill(-1);
  const repOffsets = new Uint16Array(PC_REPEAT_CACHE_SIZE);
  const vbufLen = histLen + blockLen;
  let op = 0;

  // Seed hash table from history
  if (histLen >= 3) {
    for (let p = 0; p + 2 < histLen; ++p) {
      headInsert(head, chainDepth, hashSize, hash3(vbuf, p, hashSize), p);
    }
    // Boundary-boost: re-inject last 64 history positions into slot 0
    const tailStart = histLen > 64 ? histLen - 64 : 0;
    for (let p = tailStart; p + 2 < histLen; ++p) {
      const h = hash3(vbuf, p, hashSize);
      if (head[h] !== p) {
        const save = head[(chainDepth - 1) * hashSize + h];
        headInsert(head, chainDepth, hashSize, h, p);
        head[(chainDepth - 1) * hashSize + h] = save;
      }
    }
  }

  // Self-disabling dictionary check
  let dictSkip = false;
  if (blockLen >= 1) {
    const b0 = vbuf[histLen];
    if (b0 === 0x7B || b0 === 0x5B || b0 === 0x3C || b0 === 0xEF) {
      dictSkip = false;
    } else {
      const checkLen = blockLen < 4 ? blockLen : 4;
      for (let ci = 0; ci < checkLen; ++ci) {
        const c = vbuf[histLen + ci];
        if (c < 0x20 || c > 0x7E) { dictSkip = true; break; }
      }
    }
  }

  let anchor = histLen;
  let vpos = histLen;
  const bestOut = { len: 0, off: 0, dict: 0xFFFF, isRepeat: 0 };
  const lazyOut = { len: 0, off: 0, dict: 0xFFFF, isRepeat: 0 };

  while (vpos < vbufLen) {
    if (vbufLen - vpos < PC_MATCH_MIN) break;

    let bestSavings;

    // retry_pos loop (for lazy matching)
    for (;;) {
      bestSavings = findBest(vbuf, vbufLen, vpos, head, chainDepth, hashSize,
                             repOffsets, PC_GOOD_MATCH, dictSkip, bestOut);

      // Insert current position into hash table
      if (vbufLen - vpos >= 3) {
        headInsert(head, chainDepth, hashSize, hash3(vbuf, vpos, hashSize), vpos);
      }

      // Literal run extension
      if (bestSavings <= 1 && bestOut.dict === 0xFFFF && anchor < vpos) {
        bestSavings = 0;
      }

      // Lazy matching
      if (bestSavings > 0 && bestOut.len < PC_GOOD_MATCH) {
        let improved = false;
        for (let step = 1; step <= lazySteps; ++step) {
          const npos = vpos + step;
          if (npos >= vbufLen || vbufLen - npos < PC_MATCH_MIN) break;
          const nSav = findBest(vbuf, vbufLen, npos, head, chainDepth, hashSize,
                                repOffsets, PC_GOOD_MATCH, dictSkip, lazyOut);
          if (nSav > bestSavings) {
            // Insert skipped positions
            for (let s = 0; s < step; ++s) {
              const sp = vpos + s;
              if (vbufLen - sp >= 3) {
                headInsert(head, chainDepth, hashSize, hash3(vbuf, sp, hashSize), sp);
              }
            }
            vpos = npos;
            improved = true;
            break;
          }
        }
        if (improved) continue; // retry_pos
      }
      break; // no lazy improvement, proceed to emit
    }

    // Emit
    if (bestSavings > 0) {
      const litLen = vpos - anchor;
      if (litLen > 0) {
        op = emitLiterals(vbuf, anchor, litLen, out, op);
      }

      if (bestOut.dict !== 0xFFFF) {
        const idx = bestOut.dict;
        if (idx < 64) {
          out[op++] = 0x40 | (idx & 0x3F);
        } else if (idx < 80) {
          out[op++] = 0xE0 | ((idx - 64) & 0x0F);
        } else {
          out[op++] = 0xD0 | ((idx - 80) & 0x0F);
        }
      } else if (bestOut.isRepeat) {
        out[op++] = 0xC0 | ((bestOut.len - PC_MATCH_MIN) & 0x0F);
      } else if (bestOut.off <= PC_OFFSET_SHORT_MAX && bestOut.len <= PC_MATCH_MAX) {
        out[op++] = 0x80
          | (((bestOut.len - PC_MATCH_MIN) & 0x1F) << 1)
          | ((bestOut.off >>> 8) & 0x01);
        out[op++] = bestOut.off & 0xFF;
      } else {
        let elen = bestOut.len > PC_LONG_MATCH_MAX ? PC_LONG_MATCH_MAX : bestOut.len;
        out[op++] = 0xF0 | ((elen - PC_LONG_MATCH_MIN) & 0x0F);
        out[op++] = (bestOut.off >>> 8) & 0xFF;
        out[op++] = bestOut.off & 0xFF;
        bestOut.len = elen;
      }

      // Update repeat-offset cache
      if (!bestOut.isRepeat && bestOut.off !== 0 && bestOut.dict === 0xFFFF) {
        repOffsets[2] = repOffsets[1];
        repOffsets[1] = repOffsets[0];
        repOffsets[0] = bestOut.off;
      }

      // Insert match positions into hash table
      for (let k = 1; k < bestOut.len && vpos + k + 2 < vbufLen; ++k) {
        headInsert(head, chainDepth, hashSize, hash3(vbuf, vpos + k, hashSize), vpos + k);
      }

      vpos += bestOut.len;
      anchor = vpos;
    } else {
      ++vpos;
    }
  }

  // Trailing literals
  if (anchor < vbufLen) {
    op = emitLiterals(vbuf, anchor, vbufLen - anchor, out, op);
  }

  return op;
}

// ---- History management ----

function updateHistory(hist, histLen, data, dataOff, len, historySize) {
  if (len >= historySize) {
    hist.set(data.subarray(dataOff + len - historySize, dataOff + len));
    return historySize;
  }
  if (histLen + len <= historySize) {
    hist.set(data.subarray(dataOff, dataOff + len), histLen);
    return histLen + len;
  }
  const keep = Math.min(historySize - len, histLen);
  hist.copyWithin(0, histLen - keep, histLen);
  hist.set(data.subarray(dataOff, dataOff + len), keep);
  return keep + len;
}

// ---- Copy match (decompress helper) ----

function copyMatch(out, op, hist, histLen, off, matchLen) {
  if (off <= op) {
    const src = op - off;
    for (let j = 0; j < matchLen; ++j) {
      out[op++] = out[src + j];
    }
  } else {
    const histBack = off - op;
    const histStart = histLen - histBack;
    for (let j = 0; j < matchLen; ++j) {
      const src = histStart + j;
      if (src < histLen) {
        out[op++] = hist[src];
      } else {
        out[op++] = out[src - histLen];
      }
    }
  }
  return op;
}

// ---- Decompress a single block ----

function decompressBlock(hist, histLen, input, inLen, out, outLen) {
  let ip = 0;
  let op = 0;
  let lastOffset = 0;

  while (ip < inLen) {
    const token = input[ip++];

    // 0x00..0x3F: short literal
    if (token < 0x40) {
      const litLen = (token & 0x3F) + 1;
      if (ip + litLen > inLen || op + litLen > outLen) throw new Error('corrupt');
      out.set(input.subarray(ip, ip + litLen), op);
      ip += litLen;
      op += litLen;
      continue;
    }

    // 0x40..0x7F: dictionary ref (0..63)
    if (token < 0x80) {
      const idx = token & 0x3F;
      if (idx >= PC_DICT_COUNT) throw new Error('corrupt');
      const entry = DICT_U8[idx];
      if (op + entry.length > outLen) throw new Error('corrupt');
      out.set(entry, op);
      op += entry.length;
      continue;
    }

    // 0x80..0xBF: LZ match (short offset)
    if (token < 0xC0) {
      if (ip >= inLen) throw new Error('corrupt');
      const ml = ((token >>> 1) & 0x1F) + PC_MATCH_MIN;
      const off = ((token & 0x01) << 8) | input[ip++];
      if (off === 0 || off > op + histLen || op + ml > outLen) throw new Error('corrupt');
      op = copyMatch(out, op, hist, histLen, off, ml);
      lastOffset = off;
      continue;
    }

    // 0xC0..0xCF: repeat-offset match
    if (token < 0xD0) {
      const ml = (token & 0x0F) + PC_MATCH_MIN;
      if (lastOffset === 0 || lastOffset > op + histLen || op + ml > outLen) throw new Error('corrupt');
      op = copyMatch(out, op, hist, histLen, lastOffset, ml);
      continue;
    }

    // 0xD0..0xDF: dictionary ref (80..95)
    if (token < 0xE0) {
      const idx = 80 + (token & 0x0F);
      if (idx >= PC_DICT_COUNT) throw new Error('corrupt');
      const entry = DICT_U8[idx];
      if (op + entry.length > outLen) throw new Error('corrupt');
      out.set(entry, op);
      op += entry.length;
      continue;
    }

    // 0xE0..0xEF: dictionary ref (64..79)
    if (token < 0xF0) {
      const idx = 64 + (token & 0x0F);
      if (idx >= PC_DICT_COUNT) throw new Error('corrupt');
      const entry = DICT_U8[idx];
      if (op + entry.length > outLen) throw new Error('corrupt');
      out.set(entry, op);
      op += entry.length;
      continue;
    }

    // 0xF0..0xFF: long-offset LZ match
    {
      const ml = (token & 0x0F) + PC_LONG_MATCH_MIN;
      if (ip + 2 > inLen) throw new Error('corrupt');
      const off = (input[ip] << 8) | input[ip + 1];
      ip += 2;
      if (off === 0 || off > op + histLen || op + ml > outLen) throw new Error('corrupt');
      op = copyMatch(out, op, hist, histLen, off, ml);
      lastOffset = off;
    }
  }

  if (op !== outLen) throw new Error('corrupt');
}

// ---- Profiles ----

const PROFILES = {
  micro:      { blockSize: 192, hashBits: 8,  chainDepth: 1, historySize: 64,   lazySteps: 1 },
  minimal:    { blockSize: 508, hashBits: 8,  chainDepth: 1, historySize: 128,  lazySteps: 1 },
  balanced:   { blockSize: 508, hashBits: 9,  chainDepth: 2, historySize: 504,  lazySteps: 1 },
  aggressive: { blockSize: 508, hashBits: 8,  chainDepth: 4, historySize: 504,  lazySteps: 1 },
  q3:         { blockSize: 508, hashBits: 10, chainDepth: 2, historySize: 1024, lazySteps: 2 },
  q4:         { blockSize: 508, hashBits: 11, chainDepth: 2, historySize: 2048, lazySteps: 2 },
};

// ---- Public API ----

/**
 * Compress input bytes.
 * @param {Uint8Array} input
 * @param {object} [options]
 * @param {string} [options.profile] - 'micro'|'minimal'|'balanced'|'aggressive'|'q3'|'q4'
 * @param {number} [options.blockSize]
 * @param {number} [options.hashBits]
 * @param {number} [options.chainDepth]
 * @param {number} [options.historySize]
 * @param {number} [options.lazySteps]
 * @returns {Uint8Array}
 */
function compress(input, options) {
  if (!(input instanceof Uint8Array)) throw new TypeError('input must be Uint8Array');
  if (input.length === 0) return new Uint8Array(0);

  // Resolve profile
  let profile = PROFILES.balanced;
  if (options?.profile && PROFILES[options.profile]) {
    profile = PROFILES[options.profile];
  }

  const blockSize   = options?.blockSize   ?? profile.blockSize;
  const hashBits    = options?.hashBits    ?? profile.hashBits;
  const chainDepth  = options?.chainDepth  ?? profile.chainDepth;
  const historySize = options?.historySize ?? profile.historySize;
  const lazySteps   = options?.lazySteps   ?? profile.lazySteps;

  if (blockSize < 1 || blockSize > PC_OFFSET_SHORT_MAX) {
    throw new RangeError(`blockSize must be 1..${PC_OFFSET_SHORT_MAX}`);
  }

  const maxComp = blockSize + Math.ceil(blockSize / PC_LITERAL_MAX) + 16;
  const hist = new Uint8Array(historySize);
  let histLen = 0;
  const combined = new Uint8Array(historySize + blockSize);
  const tmp = new Uint8Array(maxComp);

  // Output buffer — worst case: 4-byte header per block + raw data
  const blocks = Math.ceil(input.length / blockSize);
  const outBuf = new Uint8Array(input.length + blocks * 4 + 4);
  let outPos = 0;

  let pos = 0;
  while (pos < input.length) {
    const rawLen = Math.min(blockSize, input.length - pos);

    // Build virtual buffer: [history | block]
    combined.set(hist.subarray(0, histLen));
    combined.set(input.subarray(pos, pos + rawLen), histLen);

    const compLen = compressBlock(combined, histLen, rawLen, tmp, hashBits, chainDepth, lazySteps);

    // Write 4-byte LE header
    if (compLen < rawLen) {
      outBuf[outPos++] = rawLen & 0xFF;
      outBuf[outPos++] = (rawLen >>> 8) & 0xFF;
      outBuf[outPos++] = compLen & 0xFF;
      outBuf[outPos++] = (compLen >>> 8) & 0xFF;
      outBuf.set(tmp.subarray(0, compLen), outPos);
      outPos += compLen;
    } else {
      // Raw fallback
      outBuf[outPos++] = rawLen & 0xFF;
      outBuf[outPos++] = (rawLen >>> 8) & 0xFF;
      outBuf[outPos++] = 0;
      outBuf[outPos++] = 0;
      outBuf.set(input.subarray(pos, pos + rawLen), outPos);
      outPos += rawLen;
    }

    // Update history
    histLen = updateHistory(hist, histLen, input, pos, rawLen, historySize);
    pos += rawLen;
  }

  return outBuf.subarray(0, outPos);
}

/**
 * Decompress picocompress data.
 * @param {Uint8Array} compressed
 * @returns {Uint8Array}
 */
function decompress(compressed) {
  if (!(compressed instanceof Uint8Array)) throw new TypeError('input must be Uint8Array');
  if (compressed.length === 0) return new Uint8Array(0);

  // First pass: compute total output size by scanning headers
  let totalOut = 0;
  let scanPos = 0;
  while (scanPos < compressed.length) {
    if (scanPos + 4 > compressed.length) throw new Error('truncated header');
    const rawLen = compressed[scanPos] | (compressed[scanPos + 1] << 8);
    const compLen = compressed[scanPos + 2] | (compressed[scanPos + 3] << 8);
    scanPos += 4;
    if (rawLen === 0 && compLen === 0) continue;
    if (rawLen === 0) throw new Error('corrupt');
    const payloadLen = compLen === 0 ? rawLen : compLen;
    if (scanPos + payloadLen > compressed.length) throw new Error('truncated payload');
    totalOut += rawLen;
    scanPos += payloadLen;
  }

  const output = new Uint8Array(totalOut);
  let outPos = 0;

  // We need a generous history buffer for decompression — use max possible
  // (the encoder could have used any history size; the decoder just needs enough)
  const maxHistSize = 2048;
  const hist = new Uint8Array(maxHistSize);
  let histLen = 0;

  let ip = 0;
  while (ip < compressed.length) {
    const rawLen = compressed[ip] | (compressed[ip + 1] << 8);
    const compLen = compressed[ip + 2] | (compressed[ip + 3] << 8);
    ip += 4;

    if (rawLen === 0 && compLen === 0) continue;

    if (compLen === 0) {
      // Stored raw
      output.set(compressed.subarray(ip, ip + rawLen), outPos);
      histLen = updateHistory(hist, histLen, compressed, ip, rawLen, maxHistSize);
      outPos += rawLen;
      ip += rawLen;
    } else {
      // Decompress
      const blockOut = output.subarray(outPos, outPos + rawLen);
      decompressBlock(hist, histLen, compressed.subarray(ip, ip + compLen), compLen, blockOut, rawLen);
      histLen = updateHistory(hist, histLen, output, outPos, rawLen, maxHistSize);
      outPos += rawLen;
      ip += compLen;
    }
  }

  return output;
}

/**
 * Compute worst-case compressed size bound.
 * @param {number} inputLen
 * @returns {number}
 */
function compressBound(inputLen) {
  if (inputLen === 0) return 0;
  const blocks = Math.ceil(inputLen / PC_BLOCK_SIZE);
  return inputLen + blocks * 4;
}

  return { compress: compress, decompress: decompress, compressBound: compressBound, PROFILES: PROFILES };
});

// picobrotli.js -- minimal RFC 7932 (Brotli) encoder + decoder.
//
// Byte-identical JS port of vm/picobrotli.c / picobrotli.py (vendored from the
// picoweb codec). Produces valid Brotli streams decodable by any browser / zlib
// / Node, using LZ77 + canonical Huffman, a single meta-block (WBITS=16, no
// static dictionary, no context modeling), with an uncompressed meta-block
// fallback. The decoder reads the subset this encoder emits.
//
// Kept byte-for-byte in lockstep with vm/picobrotli.c and picobrotli.py so
// Compress.Brotli* is identical on the Python, JS and C VMs. UMD-wrapped so the
// browser (inlined) and Node (require) both expose `PicoBrotli`.
(function (root, factory) {
  root.PicoBrotli = factory();
})(_root, function () {
  "use strict";

  var MAX_HUFF_BITS = 15;
  var HASH_BITS = 15;
  var HASH_SIZE = 1 << HASH_BITS;
  var WIN_SIZE = 1 << 16;
  var MIN_MATCH = 4;
  var MAX_MATCH = 258;
  var MAX_CHAIN = 32;

  var kCLOrder = [1, 2, 3, 4, 0, 5, 17, 6, 16, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  var kCLCL_val = [0, 7, 3, 2, 1, 15];
  var kCLCL_len = [2, 4, 3, 2, 2, 4];

  var kInsLen = [
    [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 1], [8, 1],
    [10, 2], [14, 2], [18, 3], [26, 3], [34, 4], [50, 4], [66, 5], [98, 5],
    [130, 6], [194, 7], [322, 8], [578, 9], [1090, 10], [2114, 12],
    [6210, 14], [22594, 24]
  ];
  var kCopyLen = [
    [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0],
    [10, 1], [12, 1], [14, 2], [18, 2], [22, 3], [30, 3], [38, 4], [54, 4],
    [70, 5], [102, 5], [134, 6], [198, 7], [326, 8], [582, 9],
    [1094, 10], [2118, 24]
  ];

  var POW2 = [];
  for (var _i = 0; _i <= 32; _i++) POW2.push(Math.pow(2, _i));

  // ---- Bit writer (LSB-first, 32-bit safe) ----
  function BitW() {
    this.out = [];
    this.accum = 0; // < 2^31, always
    this.nbits = 0; // < 8 between puts
  }
  BitW.prototype.put = function (val, n) {
    this.accum += val * POW2[this.nbits];
    this.nbits += n;
    while (this.nbits >= 8) {
      this.out.push(this.accum & 0xFF);
      this.accum = Math.floor(this.accum / 256);
      this.nbits -= 8;
    }
  };
  BitW.prototype.align = function () {
    if (this.nbits > 0) {
      var pad = 8 - (this.nbits % 8);
      if (pad < 8) this.put(0, pad);
    }
  };
  BitW.prototype.finish = function () {
    if (this.nbits > 0) {
      this.out.push(this.accum & 0xFF);
      this.accum = 0;
      this.nbits = 0;
    }
  };

  function countUsed(freq, n) {
    var c = 0;
    for (var i = 0; i < n; i++) if (freq[i]) c++;
    return c;
  }

  function buildLengthsEx(freq, nsym, maxBits) {
    var lens = new Array(nsym).fill(0);
    var sorted = [];
    for (var i = 0; i < nsym; i++) if (freq[i]) sorted.push(i);
    var nused = sorted.length;
    if (nused === 0) return lens;
    if (nused === 1) { lens[sorted[0]] = 1; return lens; }

    // Insertion sort by frequency ascending (stable)
    for (i = 1; i < nused; i++) {
      var key = sorted[i];
      var kf = freq[key];
      var j = i - 1;
      while (j >= 0 && freq[sorted[j]] > kf) { sorted[j + 1] = sorted[j]; j--; }
      sorted[j + 1] = key;
    }

    var cap = 2 * nused;
    var nf = new Array(cap).fill(0);
    var par = new Array(cap).fill(-1);
    for (i = 0; i < nused; i++) { nf[i] = freq[sorted[i]]; par[i] = -1; }

    var nn = nused, q1 = 0;
    var q2buf = new Array(cap).fill(0);
    var q2h = 0, q2t = 0;

    for (var m = 0; m < nused - 1; m++) {
      var pick = [0, 0];
      for (var p = 0; p < 2; p++) {
        var h1 = q1 < nused, h2 = q2h < q2t;
        if (h1 && h2) {
          if (nf[q1] <= nf[q2buf[q2h]]) { pick[p] = q1; q1++; }
          else { pick[p] = q2buf[q2h]; q2h++; }
        } else if (h1) { pick[p] = q1; q1++; }
        else { pick[p] = q2buf[q2h]; q2h++; }
      }
      nf[nn] = nf[pick[0]] + nf[pick[1]];
      par[nn] = -1;
      par[pick[0]] = nn;
      par[pick[1]] = nn;
      q2buf[q2t] = nn; q2t++;
      nn++;
    }

    for (i = 0; i < nused; i++) {
      var d = 0, cur = i;
      while (par[cur] !== -1) { cur = par[cur]; d++; }
      if (d > maxBits) d = maxBits;
      lens[sorted[i]] = d;
    }

    for (var it = 0; it < 50; it++) {
      var kraft = 0;
      for (i = 0; i < nsym; i++) if (lens[i]) kraft += (1 << (maxBits - lens[i]));
      var target = (1 << maxBits);
      if (kraft === target) break;
      if (kraft > target) {
        for (var l = 1; l < maxBits && kraft > target; l++)
          for (i = 0; i < nsym && kraft > target; i++)
            if (lens[i] === l) {
              lens[i]++;
              kraft -= (1 << (maxBits - l));
              kraft += (1 << (maxBits - l - 1));
            }
      } else {
        for (var l2 = maxBits; l2 > 1 && kraft < target; l2--)
          for (i = nsym - 1; i >= 0 && kraft < target; i--)
            if (lens[i] === l2) {
              lens[i]--;
              kraft -= (1 << (maxBits - l2));
              kraft += (1 << (maxBits - l2 + 1));
            }
      }
    }
    return lens;
  }

  function buildLengths(freq, nsym) { return buildLengthsEx(freq, nsym, MAX_HUFF_BITS); }

  function assignCodes(lens, nsym) {
    var blCount = new Array(MAX_HUFF_BITS + 1).fill(0);
    for (var i = 0; i < nsym; i++) if (lens[i]) blCount[lens[i]]++;
    var next = new Array(MAX_HUFF_BITS + 1).fill(0);
    var c = 0;
    for (var b = 1; b <= MAX_HUFF_BITS; b++) { c = (c + blCount[b - 1]) << 1; next[b] = c & 0xFFFF; }
    var codes = [];
    for (i = 0; i < nsym; i++) {
      if (lens[i]) { codes.push([next[lens[i]], lens[i]]); next[lens[i]] = (next[lens[i]] + 1) & 0xFFFF; }
      else codes.push([0, 0]);
    }
    return codes;
  }

  function bwHuff(w, code) {
    var cCode = code[0], cLen = code[1];
    var rev = 0;
    for (var i = 0; i < cLen; i++) rev |= (((cCode >> i) & 1) << (cLen - 1 - i));
    w.put(rev & 0xFFFF, cLen);
  }

  function writeSimpleCode(w, lens, nsym, alphaBits) {
    var used = [];
    for (var i = 0; i < nsym && used.length < 4; i++) if (lens[i]) used.push(i);
    if (used.length === 0) used = [0];
    used.sort(function (a, b) { return a - b; });
    var nu = used.length;
    w.put(1, 2);
    w.put(nu - 1, 2);
    for (i = 0; i < nu; i++) w.put(used[i], alphaBits);
    if (nu === 4) w.put(lens[used[0]] === 1 ? 1 : 0, 1);
  }

  function writeComplexCode(w, lens, nsym) {
    var clSyms = [], clExtra = [];
    var lastNz = nsym - 1;
    while (lastNz > 0 && lens[lastNz] === 0) lastNz--;
    var clEnd = lastNz + 1;

    var i = 0;
    while (i < clEnd) {
      if (lens[i] === 0) {
        var run = 0;
        while (i + run < clEnd && lens[i + run] === 0) run++;
        var prevWas17 = false;
        while (run > 0) {
          if (run >= 3 && !prevWas17) {
            var r = run > 10 ? 10 : run;
            clSyms.push(17); clExtra.push(r - 3);
            run -= r; i += r; prevWas17 = true;
          } else {
            clSyms.push(0); clExtra.push(0);
            run--; i++; prevWas17 = false;
          }
        }
      } else {
        clSyms.push(lens[i]); clExtra.push(0); i++;
      }
    }
    var clN = clSyms.length;

    var clFreq = new Array(18).fill(0);
    for (i = 0; i < clN; i++) clFreq[clSyms[i]]++;

    var clUsed = 0;
    for (i = 0; i < 18; i++) if (clFreq[i]) clUsed++;
    if (clUsed === 1) {
      var dummy = (clFreq[0] === 0) ? 0 : ((clFreq[1] === 0) ? 1 : 2);
      clFreq[dummy] = 1;
    }

    var clLens = buildLengthsEx(clFreq, 18, 5);
    var clCodes = assignCodes(clLens, 18);

    var numCl = 18;
    while (numCl > 4 && clLens[kCLOrder[numCl - 1]] === 0) numCl--;

    var hskip = 0;
    if (numCl > 3 && clLens[kCLOrder[0]] === 0 && clLens[kCLOrder[1]] === 0) {
      if (clLens[kCLOrder[2]] === 0) hskip = 3; else hskip = 2;
    }
    if (hskip === 1) hskip = 0;

    w.put(hskip, 2);
    for (i = hskip; i < numCl; i++) {
      var v = clLens[kCLOrder[i]];
      w.put(kCLCL_val[v], kCLCL_len[v]);
    }
    for (i = 0; i < clN; i++) {
      bwHuff(w, clCodes[clSyms[i]]);
      if (clSyms[i] === 17) w.put(clExtra[i], 3);
    }
  }

  function writePrefix(w, freq, lens, nsym, alphaBits, codes) {
    var nu = countUsed(freq, nsym);
    if (nu <= 4) {
      writeSimpleCode(w, lens, nsym, alphaBits);
      var used = [];
      for (var i = 0; i < nsym && used.length < 4; i++) if (freq[i]) used.push(i);
      used.sort(function (a, b) { return a - b; });
      var n = used.length;

      for (i = 0; i < nsym; i++) { codes[i][0] = 0; codes[i][1] = 0; lens[i] = 0; }

      if (n === 1) {
        lens[used[0]] = 0; codes[used[0]] = [0, 0];
      } else if (n === 2) {
        lens[used[0]] = 1; codes[used[0]] = [0, 1];
        lens[used[1]] = 1; codes[used[1]] = [1, 1];
      } else if (n === 3) {
        lens[used[0]] = 1; codes[used[0]] = [0, 1];
        lens[used[1]] = 2; codes[used[1]] = [2, 2];
        lens[used[2]] = 2; codes[used[2]] = [3, 2];
      } else if (n === 4) {
        var treeSel = (lens[used[0]] === 1);
        if (treeSel) {
          lens[used[0]] = 1; codes[used[0]] = [0, 1];
          lens[used[1]] = 2; codes[used[1]] = [2, 2];
          lens[used[2]] = 3; codes[used[2]] = [6, 3];
          lens[used[3]] = 3; codes[used[3]] = [7, 3];
        } else {
          lens[used[0]] = 2; codes[used[0]] = [0, 2];
          lens[used[1]] = 2; codes[used[1]] = [1, 2];
          lens[used[2]] = 2; codes[used[2]] = [2, 2];
          lens[used[3]] = 2; codes[used[3]] = [3, 2];
        }
      }
    } else {
      writeComplexCode(w, lens, nsym);
    }
  }

  // ---- LZ77 ----
  function hash4(b, p) {
    var v = (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24));
    return (Math.imul(v, 0x1E35A7BD) >>> (32 - HASH_BITS));
  }

  function lzParse(data) {
    var n = data.length;
    if (n === 0) return [];
    var head = new Int32Array(HASH_SIZE).fill(-1);
    var prev = new Int32Array(n);
    var cmds = [];

    var ip = 0, litStart = 0;
    while (ip < n) {
      var bestLen = 0, bestDist = 0;
      if (ip + MIN_MATCH <= n) {
        var h = hash4(data, ip);
        var chain = head[h];
        var cc = 0;
        while (chain >= 0 && cc < MAX_CHAIN) {
          var dist = ip - chain;
          if (dist > WIN_SIZE) break;
          var maxl = n - ip;
          if (maxl > MAX_MATCH) maxl = MAX_MATCH;
          var ml = 0;
          while (ml < maxl && data[chain + ml] === data[ip + ml]) ml++;
          if (ml > bestLen && ml >= MIN_MATCH) {
            bestLen = ml; bestDist = dist;
            if (bestLen >= MAX_MATCH) break;
          }
          chain = prev[chain]; cc++;
        }
        prev[ip] = head[h];
        head[h] = ip;
      }
      if (bestLen >= MIN_MATCH) {
        cmds.push([ip - litStart, bestLen, bestDist]);
        var k = 1;
        while (k < bestLen && ip + k + MIN_MATCH <= n) {
          var hk = hash4(data, ip + k);
          prev[ip + k] = head[hk];
          head[hk] = ip + k;
          k++;
        }
        ip += bestLen;
        litStart = ip;
      } else {
        ip++;
      }
    }
    if (litStart < n) cmds.push([n - litStart, 0, 0]);
    return cmds;
  }

  function findInsCode(v) {
    for (var i = 23; i >= 0; i--) if (v >= kInsLen[i][0]) return [i, v - kInsLen[i][0], kInsLen[i][1]];
    return [0, 0, 0];
  }
  function findCopyCode(v) {
    for (var i = 23; i >= 0; i--) if (v >= kCopyLen[i][0]) return [i, v - kCopyLen[i][0], kCopyLen[i][1]];
    return [0, 0, 0];
  }

  function icSymbol(ic, cc, useDist) {
    var icOff = ic % 8, ccOff = cc % 8;
    var val = icOff * 8 + ccOff;
    if (!useDist) { if (cc < 8) return 0 + val; return 64 + val; }
    if (ic < 8) { if (cc < 8) return 128 + val; if (cc < 16) return 192 + val; return 384 + val; }
    if (ic < 16) { if (cc < 8) return 256 + val; if (cc < 16) return 320 + val; return 512 + val; }
    if (cc < 8) return 448 + val; if (cc < 16) return 576 + val; return 640 + val;
  }

  function findDistCode(dist) {
    if (dist === 0) return [0, 0, 0];
    var d = dist - 1;
    for (var hcode = 0; hcode < 48; hcode++) {
      var nb = 1 + (hcode >> 1);
      var off = ((2 + (hcode & 1)) << nb) - 4;
      if (d >= off && d - off < (1 << nb)) return [16 + hcode, d - off, nb];
    }
    return [16, 0, 0];
  }

  function encodeStored(data) {
    var n = data.length;
    if (n > 0xFFFFFF) throw new Error("too large for stored");
    var w = new BitW();
    w.put(0, 1);
    var remaining = n, ptr = 0;
    while (remaining > 0) {
      var chunk = remaining;
      if (chunk > (1 << 24) - 1) chunk = (1 << 24) - 1;
      w.put(0, 1);
      var mlen = chunk - 1;
      var mn = (mlen < (1 << 16)) ? 4 : (mlen < (1 << 20)) ? 5 : 6;
      w.put(mn - 4, 2);
      w.put(mlen, mn * 4);
      w.put(1, 1);
      w.align();
      w.finish();
      for (var i = 0; i < chunk; i++) w.out.push(data[ptr + i]);
      ptr += chunk;
      remaining -= chunk;
    }
    w.put(1, 1);
    w.put(1, 1);
    w.finish();
    return Uint8Array.from(w.out);
  }

  function encode(input) {
    var data = (input instanceof Uint8Array) ? input : Uint8Array.from(input);
    var n = data.length;
    if (n === 0) return Uint8Array.from([0x06]);
    if (n > 16 * 1024 * 1024) throw new Error("input too large");

    var cmds = lzParse(data);

    var litFreq = new Array(256).fill(0);
    var icFreq = new Array(704).fill(0);
    var distFreq = new Array(64).fill(0);

    var lp = 0, i, cmd, insLen, copyLen, distance, icode, ccode, hasDist, sym, dc, j;
    for (i = 0; i < cmds.length; i++) {
      cmd = cmds[i]; insLen = cmd[0]; copyLen = cmd[1]; distance = cmd[2];
      icode = findInsCode(insLen)[0];
      ccode = 0;
      if (copyLen) ccode = findCopyCode(copyLen)[0];
      hasDist = copyLen > 0;
      sym = icSymbol(icode, ccode, hasDist);
      if (sym >= 0 && sym < 704) icFreq[sym]++;
      for (j = 0; j < insLen && lp < n; j++) litFreq[data[lp++]]++;
      if (copyLen) {
        dc = findDistCode(distance)[0];
        if (dc < 64) distFreq[dc]++;
        lp += copyLen;
      }
    }

    var litLens = buildLengths(litFreq, 256);
    var icLens = buildLengths(icFreq, 704);
    var distLens = buildLengths(distFreq, 64);

    var litCodes = assignCodes(litLens, 256);
    var icCodes = assignCodes(icLens, 704);
    var distCodes = assignCodes(distLens, 64);

    var w = new BitW();
    w.put(0, 1); w.put(1, 1); w.put(0, 1);

    var mlen = n - 1;
    var mn = (mlen < (1 << 16)) ? 4 : (mlen < (1 << 20)) ? 5 : 6;
    w.put(mn - 4, 2);
    w.put(mlen, mn * 4);

    w.put(0, 1); w.put(0, 1); w.put(0, 1);
    w.put(0, 2); w.put(0, 4);
    w.put(0, 2);
    w.put(0, 1); w.put(0, 1);

    writePrefix(w, litFreq, litLens, 256, 8, litCodes);
    writePrefix(w, icFreq, icLens, 704, 10, icCodes);
    writePrefix(w, distFreq, distLens, 64, 6, distCodes);

    lp = 0;
    for (i = 0; i < cmds.length; i++) {
      cmd = cmds[i]; insLen = cmd[0]; copyLen = cmd[1]; distance = cmd[2];
      var ins = findInsCode(insLen);
      icode = ins[0];
      var ie = ins[1], ieb = ins[2];
      ccode = 0; var ce = 0, ceb = 0;
      if (copyLen) { var cp = findCopyCode(copyLen); ccode = cp[0]; ce = cp[1]; ceb = cp[2]; }
      hasDist = copyLen > 0;
      sym = icSymbol(icode, ccode, hasDist);

      bwHuff(w, icCodes[sym]);
      if (ieb > 0) w.put(ie, ieb);
      if (hasDist && ceb > 0) w.put(ce, ceb);

      for (j = 0; j < insLen && lp < n; j++) bwHuff(w, litCodes[data[lp++]]);

      if (hasDist) {
        var dd = findDistCode(distance);
        dc = dd[0]; var de = dd[1], deb = dd[2];
        bwHuff(w, distCodes[dc]);
        if (deb > 0) w.put(de, deb);
        lp += copyLen;
      }
    }

    w.finish();

    if (w.out.length >= n) return encodeStored(data);
    return Uint8Array.from(w.out);
  }

  function bound(inputLen) { return inputLen + ((inputLen / 64) | 0) + 64; }

  // ---- Decoder ----
  function BitR(data) { this.p = data; this.len = data.length; this.bit = 0; }
  BitR.prototype.read = function (n) {
    if (n < 0 || n > 24 || this.bit + n > this.len * 8) return -1;
    var v = 0;
    for (var i = 0; i < n; i++) {
      var bi = this.bit++;
      v |= (((this.p[bi >> 3] >> (bi & 7)) & 1) << i);
    }
    return v >>> 0;
  };
  BitR.prototype.alignByte = function () { this.bit = (this.bit + 7) & ~7; };

  function bitReverse(v, n) {
    var r = 0;
    for (var i = 0; i < n; i++) { r = ((r << 1) | (v & 1)) & 0xFFFF; v >>= 1; }
    return r;
  }

  function hdecBuild(lens, nsym) {
    var h = { len: new Array(nsym).fill(0), code: new Array(nsym).fill(0), nsym: nsym, single: -1 };
    var blCount = new Array(16).fill(0);
    for (var i = 0; i < nsym; i++) {
      if (lens[i] > 15) return null;
      h.len[i] = lens[i];
      if (lens[i]) blCount[lens[i]]++;
    }
    var next = new Array(16).fill(0);
    var c = 0;
    for (var b = 1; b < 16; b++) { c = ((c + blCount[b - 1]) << 1) & 0xFFFF; next[b] = c; }
    for (i = 0; i < nsym; i++) {
      if (h.len[i]) { var canon = next[h.len[i]]; next[h.len[i]] = (next[h.len[i]] + 1) & 0xFFFF; h.code[i] = bitReverse(canon, h.len[i]); }
    }
    return h;
  }

  function hdecSymbol(r, h) {
    if (h.single >= 0) return h.single;
    var code = 0;
    for (var len = 1; len <= 15; len++) {
      var bit = r.read(1);
      if (bit < 0) return -1;
      code |= (bit << (len - 1));
      for (var s = 0; s < h.nsym; s++) if (h.len[s] === len && h.code[s] === code) return s;
    }
    return -1;
  }

  function readClclSymbol(r) {
    var code = 0;
    for (var len = 1; len <= 4; len++) {
      var bit = r.read(1);
      if (bit < 0) return -1;
      code |= (bit << (len - 1));
      for (var v = 0; v <= 5; v++) if (kCLCL_len[v] === len && kCLCL_val[v] === code) return v;
    }
    return -1;
  }

  function readPrefixCode(r, nsym, alphaBits) {
    var lens = new Array(nsym).fill(0);
    var hskip = r.read(2);
    if (hskip < 0) return null;

    if (hskip === 1) {
      var nsymM1 = r.read(2);
      if (nsymM1 < 0) return null;
      var nn = nsymM1 + 1;
      var used = [0, 0, 0, 0];
      for (var i = 0; i < nn; i++) {
        var sym = r.read(alphaBits);
        if (sym < 0 || sym >= nsym) return null;
        used[i] = sym;
      }
      if (nn === 1) { var h1 = hdecBuild(lens, nsym); if (!h1) return null; h1.single = used[0]; return h1; }
      else if (nn === 2) { lens[used[0]] = 1; lens[used[1]] = 1; }
      else if (nn === 3) { lens[used[0]] = 1; lens[used[1]] = 2; lens[used[2]] = 2; }
      else {
        var treeSel = r.read(1);
        if (treeSel < 0) return null;
        if (treeSel) { lens[used[0]] = 1; lens[used[1]] = 2; lens[used[2]] = 3; lens[used[3]] = 3; }
        else { lens[used[0]] = 2; lens[used[1]] = 2; lens[used[2]] = 2; lens[used[3]] = 2; }
      }
      return hdecBuild(lens, nsym);
    }

    if (hskip > 3) return null;
    var clLens = new Array(18).fill(0);
    var space = 0;
    for (var ii = hskip; ii < 18; ii++) {
      var vv = readClclSymbol(r);
      if (vv < 0) return null;
      clLens[kCLOrder[ii]] = vv;
      if (vv) space += 1 << (5 - vv);
      if (ii + 1 >= 4 && space === 32) break;
      if (space > 32) return null;
    }

    var clh = hdecBuild(clLens, 18);
    if (!clh) return null;

    var pos = 0, codeSpace = 0;
    while (pos < nsym && codeSpace < (1 << 15)) {
      var sym2 = hdecSymbol(r, clh);
      if (sym2 < 0) return null;
      if (sym2 === 17) {
        var extra = r.read(3);
        if (extra < 0) return null;
        var run = 3 + extra;
        if (pos + run > nsym) return null;
        pos += run;
      } else if (sym2 >= 0 && sym2 <= 15) {
        lens[pos++] = sym2;
        if (sym2) { codeSpace += 1 << (15 - sym2); if (codeSpace > (1 << 15)) return null; }
      } else return null;
    }
    if (codeSpace !== (1 << 15)) return null;
    return hdecBuild(lens, nsym);
  }

  function decodeIcSymbol(sym) {
    if (sym < 0 || sym >= 704) return null;
    var base;
    if (sym < 64) { base = sym; return [base >> 3, base & 7, false]; }
    if (sym < 128) { base = sym - 64; return [base >> 3, 8 + (base & 7), false]; }
    if (sym < 192) { base = sym - 128; return [base >> 3, base & 7, true]; }
    if (sym < 256) { base = sym - 192; return [base >> 3, 8 + (base & 7), true]; }
    if (sym < 320) { base = sym - 256; return [8 + (base >> 3), base & 7, true]; }
    if (sym < 384) { base = sym - 320; return [8 + (base >> 3), 8 + (base & 7), true]; }
    if (sym < 448) { base = sym - 384; return [base >> 3, 16 + (base & 7), true]; }
    if (sym < 512) { base = sym - 448; return [16 + (base >> 3), base & 7, true]; }
    if (sym < 576) { base = sym - 512; return [8 + (base >> 3), 16 + (base & 7), true]; }
    if (sym < 640) { base = sym - 576; return [16 + (base >> 3), 8 + (base & 7), true]; }
    base = sym - 640; return [16 + (base >> 3), 16 + (base & 7), true];
  }

  function decodeDistance(r, dc) {
    if (dc < 16 || dc >= 64) return -1;
    var hcode = dc - 16;
    var nb = 1 + (hcode >> 1);
    var extra = r.read(nb);
    if (extra < 0) return -1;
    var off = ((2 + (hcode & 1)) << nb) - 4;
    return off + extra + 1;
  }

  function decode(input) {
    var data = (input instanceof Uint8Array) ? input : Uint8Array.from(input);
    var r = new BitR(data);
    var out = [];

    var v = r.read(1);
    if (v !== 0) throw new Error("bad WBITS");

    for (;;) {
      var islast = r.read(1);
      if (islast < 0) throw new Error("truncated");
      if (islast) {
        var islastempty = r.read(1);
        if (islastempty < 0) throw new Error("truncated");
        if (islastempty) return Uint8Array.from(out);
      }
      var mn = r.read(2);
      if (mn < 0 || mn > 2) throw new Error("bad MNIBBLES");
      var nibbles = 4 + mn;
      var mlenM1 = r.read(nibbles * 4);
      if (mlenM1 < 0) throw new Error("truncated");
      var mlen = mlenM1 + 1;

      if (!islast) {
        var isuncompressed = r.read(1);
        if (isuncompressed < 0) throw new Error("truncated");
        if (isuncompressed) {
          r.alignByte();
          var start = r.bit >> 3;
          if (start + mlen > r.len) throw new Error("truncated stored");
          for (var s = 0; s < mlen; s++) out.push(data[start + s]);
          r.bit += mlen * 8;
          continue;
        }
      }

      decodeCompressedMeta(r, mlen, out);
      if (islast) return Uint8Array.from(out);
    }
  }

  function decodeCompressedMeta(r, mlen, out) {
    var widths = [1, 1, 1, 2, 4, 2, 1, 1];
    for (var k = 0; k < 8; k++) {
      var v = r.read(widths[k]);
      if (v !== 0) throw new Error("unsupported meta-block");
    }
    var litH = readPrefixCode(r, 256, 8);
    if (!litH) throw new Error("bad literal code");
    var icH = readPrefixCode(r, 704, 10);
    if (!icH) throw new Error("bad ic code");
    var distH = readPrefixCode(r, 64, 6);
    if (!distH) throw new Error("bad dist code");

    var end = out.length + mlen;
    while (out.length < end) {
      var sym = hdecSymbol(r, icH);
      var dec = decodeIcSymbol(sym);
      if (!dec) throw new Error("bad ic symbol");
      var ic = dec[0], cc = dec[1], explicitDist = dec[2];
      var extra = r.read(kInsLen[ic][1]);
      if (extra < 0) throw new Error("truncated ins");
      var insLen = kInsLen[ic][0] + extra;
      var copyLen = 0;
      if (explicitDist) {
        extra = r.read(kCopyLen[cc][1]);
        if (extra < 0) throw new Error("truncated copy");
        copyLen = kCopyLen[cc][0] + extra;
      }
      if (out.length + insLen > end) throw new Error("ins overflow");
      for (var i = 0; i < insLen; i++) {
        var lit = hdecSymbol(r, litH);
        if (lit < 0 || lit > 255) throw new Error("bad literal");
        out.push(lit);
      }
      if (explicitDist) {
        var dc = hdecSymbol(r, distH);
        var dist = decodeDistance(r, dc);
        if (dist < 0) throw new Error("bad distance");
        if (dist === 0 || dist > out.length) throw new Error("bad back-distance");
        var src = out.length - dist;
        for (i = 0; i < copyLen; i++) out.push(out[src + i]);
        if (out.length > end) throw new Error("copy overflow");
      }
    }
  }

  return {
    encode: encode,
    decode: decode,
    compress: encode,
    decompress: decode,
    bound: bound
  };
});

// picoc.js -- PicoScript compiler in JavaScript (browser + Node).
//
// Faithful port of picoscript_il.py + picoscript_cfront.py + picoscript_basic.py
// + picoscript_python.py + picoscript_english.py.
// Lets the browser compile C-syntax, BASIC-like, Python-style and natural-English
// source to the *identical* bytecode the Python toolchain produces, so you can
// compile AND debug in-browser.
//
//   PicoCompile.compile(src, "c" | "basic" | "python" | "english") -> { words, il }
//
// Verified against the Python compiler (byte-for-byte) by tests/test_jscompiler.js.
(function (root, factory) {
  var P = factory(root.PV_HOOKS);
  root.PicoCompile = P;
})(_root, function (PV_HOOKS) {
  "use strict";

  // ── ISA constants ────────────────────────────────────────────────────────
  var OP = { NOOP:0, LOAD:1, SAVE:2, PIPE:3, ADD:4, SUB:5, MUL:6, DIV:7,
             INC:8, JUMP:9, BRANCH:10, CALL:11, RETURN:12, WAIT:13, RAISE:14, DSP:15 };
  var ADDR_REG = 1;
  var ADDR_REG_OFF = 3;
  var COND = { EQ:0, NE:1, LT:2, GT:3, LE:4, GE:5, Z:6, NZ:7, EOF:8, ERR:9 };
  var COND_NEGATE = { EQ:"NE", NE:"EQ", LT:"GE", GE:"LT", GT:"LE", LE:"GT" };
  var ARITH = { add:OP.ADD, sub:OP.SUB, mul:OP.MUL, div:OP.DIV };
  var H = PV_HOOKS;

  // host-hook name<->code tables from the generated map
  var HOOK_BY_NAME = {}, HOOK_CANON = {}, CT_BY_NAME = {};
  Object.keys(H.BY_CODE).forEach(function (code) {
    var name = H.BY_CODE[code];            // "Ns.Method"
    HOOK_BY_NAME[name] = parseInt(code, 10);
    var dot = name.indexOf(".");
    var ns = name.slice(0, dot), m = name.slice(dot + 1);
    HOOK_CANON[(ns + "." + m).toLowerCase()] = [ns, m];
  });
  Object.keys(H.CONTENT_TYPES).forEach(function (v) {
    CT_BY_NAME[H.CONTENT_TYPES[v]] = parseInt(v, 10);
  });
  var NAMED_CONSTANTS = {
    // HTTP methods (Req.Method)
    "HTTP_METHOD_GET": 1, "HTTP_METHOD_POST": 2, "HTTP_METHOD_PUT": 3,
    "HTTP_METHOD_DELETE": 4, "HTTP_METHOD_HEAD": 5, "HTTP_METHOD_PATCH": 6,
    "HTTP_METHOD_OPTIONS": 7, "HTTP_METHOD_CONNECT": 8, "HTTP_METHOD_TRACE": 9,
    "METHOD_GET": 1, "METHOD_POST": 2, "METHOD_PUT": 3,
    "METHOD_DELETE": 4, "METHOD_HEAD": 5, "METHOD_PATCH": 6,
    "METHOD_OPTIONS": 7, "METHOD_CONNECT": 8, "METHOD_TRACE": 9,
    "HTTPMETHOD.GET": 1, "HTTPMETHOD.POST": 2, "HTTPMETHOD.PUT": 3,
    "HTTPMETHOD.DELETE": 4, "HTTPMETHOD.HEAD": 5, "HTTPMETHOD.PATCH": 6,
    "HTTPMETHOD.OPTIONS": 7, "HTTPMETHOD.CONNECT": 8, "HTTPMETHOD.TRACE": 9,
    // HTTP statuses (Resp.Status)
    "HTTP_STATUS_OK": 200, "HTTP_STATUS_CREATED": 201, "HTTP_STATUS_ACCEPTED": 202,
    "HTTP_STATUS_NO_CONTENT": 204, "HTTP_STATUS_BAD_REQUEST": 400,
    "HTTP_STATUS_UNAUTHORIZED": 401, "HTTP_STATUS_FORBIDDEN": 403,
    "HTTP_STATUS_NOT_FOUND": 404, "HTTP_STATUS_CONFLICT": 409,
    "HTTP_STATUS_UNPROCESSABLE_ENTITY": 422, "HTTP_STATUS_TOO_MANY_REQUESTS": 429,
    "HTTP_STATUS_INTERNAL_SERVER_ERROR": 500, "HTTP_STATUS_NOT_IMPLEMENTED": 501,
    "HTTP_STATUS_BAD_GATEWAY": 502, "HTTP_STATUS_SERVICE_UNAVAILABLE": 503,
    "STATUS_OK": 200, "STATUS_CREATED": 201, "STATUS_ACCEPTED": 202,
    "STATUS_NO_CONTENT": 204, "STATUS_BAD_REQUEST": 400, "STATUS_UNAUTHORIZED": 401,
    "STATUS_FORBIDDEN": 403, "STATUS_NOT_FOUND": 404, "STATUS_CONFLICT": 409,
    "STATUS_UNPROCESSABLE_ENTITY": 422, "STATUS_TOO_MANY_REQUESTS": 429,
    "STATUS_INTERNAL_SERVER_ERROR": 500, "STATUS_NOT_IMPLEMENTED": 501,
    "STATUS_BAD_GATEWAY": 502, "STATUS_SERVICE_UNAVAILABLE": 503,
    "HTTPSTATUS.OK": 200, "HTTPSTATUS.CREATED": 201, "HTTPSTATUS.ACCEPTED": 202,
    "HTTPSTATUS.NO_CONTENT": 204, "HTTPSTATUS.BAD_REQUEST": 400,
    "HTTPSTATUS.UNAUTHORIZED": 401, "HTTPSTATUS.FORBIDDEN": 403,
    "HTTPSTATUS.NOT_FOUND": 404, "HTTPSTATUS.CONFLICT": 409,
    "HTTPSTATUS.UNPROCESSABLE_ENTITY": 422, "HTTPSTATUS.TOO_MANY_REQUESTS": 429,
    "HTTPSTATUS.INTERNAL_SERVER_ERROR": 500, "HTTPSTATUS.NOT_IMPLEMENTED": 501,
    "HTTPSTATUS.BAD_GATEWAY": 502, "HTTPSTATUS.SERVICE_UNAVAILABLE": 503
  };
  Object.keys(H.CONSTANTS || {}).forEach(function (k) { NAMED_CONSTANTS[k.toUpperCase()] = H.CONSTANTS[k] | 0; });
  function namedConstant(name) {
    if (name == null) return null;
    var key = String(name).toUpperCase();
    return Object.prototype.hasOwnProperty.call(NAMED_CONSTANTS, key) ? (NAMED_CONSTANTS[key] | 0) : null;
  }
  function canonHost(ns, m) {
    return HOOK_CANON[(ns + "." + m).toLowerCase()] || [ns, m];
  }

  function enc(op, rd, rs1, rs2, imm) {
    rd = rd || 0; rs1 = rs1 || 0; rs2 = rs2 || 0; imm = imm || 0;
    return (((op << 28) | (rd << 24) | (rs1 << 20) | (rs2 << 16) | (imm & 0xFFFF)) >>> 0);
  }
  function encodeCardAddr(tenant, pack, card) {
    return ((tenant << 11) | (pack << 5) | card) & 0xFFFF;
  }

  // ── operand + instruction model ─────────────────────────────────────────
  var _vid = 0;
  function VReg(name, pinned) { this.id = _vid++; this.name = name || ("v" + this.id); this.pinned = !!pinned; }
  function Imm(v) { this.value = v; }
  function isImm(x) { return x instanceof Imm; }
  function isVReg(x) { return x instanceof VReg; }

  // Inst is a plain object: { op, dst, a, b, cond, label, ns, method, args, imm, text }
  function Inst(op, f) { f = f || {}; f.op = op; if (!f.args) f.args = []; return f; }

  function ILBuilder() { this.insts = []; this._ln = 0; this.curPos = -1; }
  ILBuilder.prototype = {
    vreg: function (n) { return new VReg(n); },
    newLabel: function (h) { this._ln++; return (h || "L") + this._ln; },
    _push: function (ins) { ins.pos = this.curPos; this.insts.push(ins); return ins; },   // INV-25: stamp source offset
    const_: function (d, v) { this._push(Inst("const", { dst: d, imm: v })); },
    mov: function (d, s) { this._push(Inst("mov", { dst: d, a: s })); },
    arith: function (op, d, a, b) { this._push(Inst(op, { dst: d, a: a, b: b })); },
    inc: function (d) { this._push(Inst("inc", { dst: d })); },
    cmpbr: function (c, a, b, l) { this._push(Inst("cmpbr", { cond: c, a: a, b: b, label: l })); },
    jmp: function (l) { this._push(Inst("jmp", { label: l })); },
    jmptab: function (sel, targets, def) { this._push(Inst("jmptab", { a: sel, targets: targets, label: def })); },
    label: function (n) { this._push(Inst("label", { label: n })); },
    call: function (l) { this._push(Inst("call", { label: l })); },
    ret: function () { this._push(Inst("ret", {})); },
    host: function (ns, m, args, d) { this._push(Inst("host", { ns: ns, method: m, args: args || [], dst: d || null })); },
    load: function (d, a) { this._push(Inst("load", { dst: d, imm: a })); },
    save: function (s, a) { this._push(Inst("save", { a: s, imm: a })); },
    pipe: function (s, a) { this._push(Inst("pipe", { a: s, imm: a })); },
    net: function (k, v) { this._push(Inst("net", { method: k, imm: (typeof v === "number" ? v : 0), text: (typeof v === "string" ? v : "") })); }
  };

  function operandVRegs(ins) {
    var out = [];
    [ins.dst, ins.a, ins.b].forEach(function (x) { if (isVReg(x)) out.push(x); });
    (ins.args || []).forEach(function (x) { if (isVReg(x)) out.push(x); });
    return out;
  }

  // ── optimizer ────────────────────────────────────────────────────────────
  function optimize(insts) {
    var out = [];
    insts.forEach(function (ins) {
      if (ARITH[ins.op] !== undefined && isImm(ins.a) && isImm(ins.b)) {
        var av = ins.a.value, bv = ins.b.value, r;
        if (ins.op === "add") r = av + bv;
        else if (ins.op === "sub") r = av - bv;
        else if (ins.op === "mul") r = av * bv;
        else r = bv !== 0 ? ((av / bv) | 0) : 0;   // trunc toward zero + 2's-comp wrap (matches VM/C)
        out.push(Inst("const", { dst: ins.dst, imm: r, pos: ins.pos })); return;
      }
      if (ins.op === "add" && isVReg(ins.a) && ins.dst === ins.a && isImm(ins.b) && ins.b.value === 1) {
        out.push(Inst("inc", { dst: ins.dst, pos: ins.pos })); return;
      }
      if (ins.op === "mov" && isVReg(ins.a) && ins.dst === ins.a) return;
      out.push(ins);
    });
    return out;
  }

  // ── register allocation (loop-aware linear scan) ──────────────────────────
  // Mirrors picoscript_il.allocate. `spill` reserves 3 shuttle regs (usable=13) and
  // records overflow vregs in `spilled` instead of throwing -- the spill-decision pass.
  function allocate(insts, spill) {
    var first = {}, last = {}, order = [], vregs = {};
    insts.forEach(function (ins, i) {
      operandVRegs(ins).forEach(function (v) {
        if (!(v.id in first)) { first[v.id] = i; order.push(v.id); vregs[v.id] = v; }
        last[v.id] = i;
      });
    });
    var labelPos = {};
    insts.forEach(function (ins, i) { if (ins.op === "label") labelPos[ins.label] = i; });
    insts.forEach(function (ins, i) {
      if ((ins.op === "jmp" || ins.op === "cmpbr") && (ins.label in labelPos)) {
        var t = labelPos[ins.label];
        if (t <= i) {
          Object.keys(first).forEach(function (vid) {
            if (first[vid] < t && t <= last[vid] && last[vid] < i) last[vid] = i;
          });
        }
      }
    });
    var n = Math.max(1, insts.length);
    var callIdx = [];
    insts.forEach(function (ins, i) { if (ins.op === "call") callIdx.push(i); });
    Object.keys(vregs).forEach(function (vid) {
      var spansCall = callIdx.some(function (ci) { return first[vid] <= ci && ci <= last[vid]; });
      if (vregs[vid].pinned || spansCall) { first[vid] = 0; last[vid] = n; }
    });

    var usable = spill ? 13 : 16;   // NUM_REGS-3 shuttle headroom during spill decision
    var free = []; for (var k = 0; k < usable; k++) free.push(k);
    var active = [];           // [endIndex, vid]
    var mapping = {};
    var spilled = {}, nextSlot = 0;
    function expire(at) {
      var keep = [];
      active.forEach(function (e) {
        if (e[0] < at) free.push(mapping[e[1]]);
        else keep.push(e);
      });
      keep.sort(function (a, b) { return a[0] - b[0]; });
      active = keep;
    }
    var ord = order.slice().sort(function (a, b) { return first[a] - first[b]; });
    ord.forEach(function (vid) {
      expire(first[vid]);
      if (free.length) {
        free.sort(function (a, b) { return a - b; });
        var reg = free.shift();
        mapping[vid] = reg;
        active.push([last[vid], vid]);
        active.sort(function (a, b) { return a[0] - b[0]; });
      } else if (spill) {
        spilled[vid] = nextSlot++;
      } else {
        throw new Error("register pressure exceeds 16 live values; simplify the program");
      }
    });
    return { mapping: mapping, spilled: spilled };
  }

  // ── automatic register spilling (mirrors picoscript_il._legalize_spills) ───
  // Ops whose `dst` is a written destination, and ops that read `dst` as input.
  var DST_WRITTEN = { const: 1, mov: 1, add: 1, sub: 1, mul: 1, div: 1, host: 1, load: 1, inc: 1 };
  var DST_READ_OPS = { cmpbr: 1, inc: 1 };
  var SPILL_CARD_BASE = 0xF000;   // reserved scratch-card region: one card per spilled vreg

  function legalizeSpills(insts, spilledSet) {
    var vids = Object.keys(spilledSet);
    if (vids.length === 0) return insts;
    // Home scratch card per spilled vreg, assigned in ascending vreg-id order.
    var sorted = vids.map(Number).sort(function (a, b) { return a - b; });
    var slot = {};
    sorted.forEach(function (vid, i) { slot[vid] = SPILL_CARD_BASE + i; });
    function sp(x) { return isVReg(x) && (x.id in spilledSet); }
    function clone(ins, over) { var c = {}; for (var k in ins) c[k] = ins[k]; for (var k2 in over) c[k2] = over[k2]; return c; }
    var out = [];
    insts.forEach(function (ins) {
      if (!operandVRegs(ins).some(sp)) { out.push(ins); return; }
      var newA = ins.a, newB = ins.b, newArgs = (ins.args || []).slice();
      if (sp(ins.a)) { var sa = new VReg("spill"); out.push(Inst("load", { dst: sa, imm: slot[ins.a.id] })); newA = sa; }
      if (sp(ins.b)) { var sb = new VReg("spill"); out.push(Inst("load", { dst: sb, imm: slot[ins.b.id] })); newB = sb; }
      for (var i = 0; i < newArgs.length; i++) {
        if (sp(newArgs[i])) { var sg = new VReg("spill"); out.push(Inst("load", { dst: sg, imm: slot[newArgs[i].id] })); newArgs[i] = sg; }
      }
      var newDst = ins.dst, storeBack = null;
      if (sp(ins.dst)) {
        var sd = new VReg("spill");
        if (DST_READ_OPS[ins.op]) out.push(Inst("load", { dst: sd, imm: slot[ins.dst.id] }));   // dst read (cmpbr/inc)
        newDst = sd;
        if (DST_WRITTEN[ins.op]) storeBack = [sd, slot[ins.dst.id]];                            // dst written -> store back
      }
      out.push(clone(ins, { dst: newDst, a: newA, b: newB, args: newArgs }));
      if (storeBack) out.push(Inst("save", { a: storeBack[0], imm: storeBack[1] }));
    });
    return out;
  }

  // Allocate; on >16 live values, spill the overflow to scratch cards and re-allocate
  // (a working slow compile beats a hard RegisterPressureError on real code -- INV-13).
  function allocateOrSpill(insts) {
    try {
      return { insts: insts, mapping: allocate(insts, false).mapping };
    } catch (e) {
      if (!/register pressure/.test(String(e && e.message))) throw e;
      var meta = allocate(insts, true);
      var legal = legalizeSpills(insts, meta.spilled);
      return { insts: legal, mapping: allocate(legal, false).mapping };
    }
  }

  function phys(mapping, v) {
    var r = mapping[v.id];
    if (r === undefined) throw new Error("vreg " + v.name + " unallocated");
    return r;
  }

  // ── bytecode lowering (CONST/MOV-imm expand to 2 words) ───────────────────
  function emitWord(ins, mapping, labels, pc) {
    var op = ins.op;
    if (op === "mov") {
      var rd = phys(mapping, ins.dst);
      var rs1 = phys(mapping, ins.a);  // a is VReg here (imm handled by caller)
      return enc(OP.ADD, rd, rs1, 0, 0);
    }
    if (ARITH[op] !== undefined) {
      var d = phys(mapping, ins.dst), s1 = phys(mapping, ins.a);
      if (isImm(ins.b)) return enc(ARITH[op], d, s1, 0, ins.b.value & 0xFFFF);
      return enc(ARITH[op], d, s1, ADDR_REG, phys(mapping, ins.b));
    }
    if (op === "inc") return enc(OP.INC, phys(mapping, ins.dst));
    if (op === "cmpbr") {
      var ra = phys(mapping, ins.a), rb = phys(mapping, ins.b);
      var off = (labels[ins.label] - pc) & 0xFFFF;
      return enc(OP.BRANCH, ra, rb, COND[ins.cond], off);
    }
    if (op === "jmp") return enc(OP.JUMP, 0, 0, 0, labels[ins.label]);
    if (op === "call") return enc(OP.CALL, 0, 0, 0, labels[ins.label]);
    if (op === "ret") return enc(OP.RETURN);
    if (op === "load") return enc(OP.LOAD, phys(mapping, ins.dst), 0, 0, ins.imm);
    if (op === "save") return enc(OP.SAVE, 0, phys(mapping, ins.a), 0, ins.imm);
    if (op === "pipe") return enc(OP.PIPE, 0, phys(mapping, ins.a), 0, ins.imm);
    if (op === "net") {
      var k = ins.method;
      if (k === "status") return enc(OP.NOOP, 0, 0, 0, (H.NET_STATUS_BASE | (ins.imm & 0x0FFF)));
      if (k === "type") return enc(OP.NOOP, 0, 0, 0, (CT_BY_NAME[ins.text] || 0xA000));
      if (k === "header") return enc(OP.NOOP, 0, 0, 0, H.NET_HEADER_BASE);
      if (k === "body") return enc(OP.NOOP, 0, 0, 0, H.NET_BODY_MARKER);
      if (k === "close") return enc(OP.NOOP, 0, 0, 0, H.NET_CLOSE_MARKER);
      throw new Error("unknown net kind " + k);
    }
    if (op === "host") {
      var hook = HOOK_BY_NAME[ins.ns + "." + ins.method];
      if (hook === undefined) throw new Error("unknown host hook " + ins.ns + "." + ins.method);
      var imm = (hook <= 0xff) ? (H.HOST_HOOK_BASE | hook) : (H.EXT_HOST_HOOK_BASE | (hook & 0xfff));
      var hrd = isVReg(ins.dst) ? phys(mapping, ins.dst) : 0;
      var hrs1 = (ins.args[0] && isVReg(ins.args[0])) ? phys(mapping, ins.args[0]) : 0;
      var hrs2 = (ins.args[1] && isVReg(ins.args[1])) ? phys(mapping, ins.args[1]) : 0;
      return enc(OP.NOOP, hrd, hrs1, hrs2, imm);
    }
    throw new Error("cannot lower IL op " + op);
  }

  // INV-7 compile-time iso-lease: byte-identical to picoscript_il.verify_response_ownership.
  // Forward must-dataflow (AND-merge) over the IL CFG; a Resp.* op illegal on every
  // path to it is a compile error. State is a 4-bit mask SEALED=1/ENDED=2/BODY=4/
  // STREAM_CLOSED=8 (all monotonic); AND-merge is order-independent, the check loop
  // walks reachable points in ascending index order, so the first violation reported
  // matches the Python gate exactly.
  var RESP_GRAPH_METHODS = {
    Status: 1, Header: 1, Write: 1, Trailer: 1, Seal: 1, Respond: 1, End: 1, Abort: 1,
    Flush: 1, Continue: 1, EndStream: 1, Upgrade: 1, EarlyHints: 1
  };
  function verifyResponseOwnership(insts) {
    var n = insts.length, i, j, sc;
    var hasResp = false;
    for (i = 0; i < n; i++) { if (insts[i].op === "host" && insts[i].ns === "Resp") { hasResp = true; break; } }
    if (!hasResp) return;

    var labelAt = {};
    for (i = 0; i < n; i++) { if (insts[i].op === "label") labelAt[insts[i].label] = i; }

    function succs(i) {
      var ins = insts[i], op = ins.op, out = [], k, tg;
      if (op === "jmp") { return (ins.label in labelAt) ? [labelAt[ins.label]] : []; }
      if (op === "ret") { return []; }
      if (op === "cmpbr") {
        if (i + 1 < n) out.push(i + 1);
        if (ins.label in labelAt) out.push(labelAt[ins.label]);
        return out;
      }
      if (op === "jmptab") {
        tg = ins.targets || [];
        for (k = 0; k < tg.length; k++) { if (tg[k] in labelAt) out.push(labelAt[tg[k]]); }
        if (ins.label in labelAt) out.push(labelAt[ins.label]);
        return out;
      }
      if (op === "call") {
        if (i + 1 < n) out.push(i + 1);
        if (ins.label in labelAt) out.push(labelAt[ins.label]);
        return out;
      }
      return (i + 1 < n) ? [i + 1] : [];
    }

    var reachable = {}, stack = (n ? [0] : []), idx;
    while (stack.length) {
      idx = stack.pop();
      if (idx < 0 || idx >= n || reachable[idx]) continue;
      reachable[idx] = true;
      sc = succs(idx);
      for (j = 0; j < sc.length; j++) stack.push(sc[j]);
    }

    var preds = {};
    for (i in reachable) preds[i] = [];
    for (i in reachable) {
      sc = succs(+i);
      for (j = 0; j < sc.length; j++) { if (reachable[sc[j]]) preds[sc[j]].push(+i); }
    }

    var SEALED = 1, ENDED = 2, BODY = 4, STREAM_CLOSED = 8, TOP = 15, BOT = 0;
    function transfer(mask, ins) {
      if (ins.op === "host" && ins.ns === "Resp") {
        var m = ins.method;
        if (m === "Seal") mask |= SEALED;
        else if (m === "Respond") mask |= (SEALED | ENDED);
        else if (m === "End" || m === "Abort") mask |= ENDED;
        else if (m === "Write") mask |= BODY;
        else if (m === "EndStream") mask |= STREAM_CLOSED;
      }
      return mask;
    }

    var order = Object.keys(reachable).map(Number).sort(function (a, b) { return a - b; });
    var IN = {}, OUT = {}, p, inv, outv, key;
    for (i = 0; i < order.length; i++) { IN[order[i]] = TOP; OUT[order[i]] = TOP; }
    var changed = true;
    while (changed) {
      changed = false;
      for (i = 0; i < order.length; i++) {
        key = order[i];
        if (key === 0 || preds[key].length === 0) {
          inv = BOT;
        } else {
          inv = TOP;
          for (p = 0; p < preds[key].length; p++) inv &= OUT[preds[key][p]];
        }
        if (inv !== IN[key]) { IN[key] = inv; changed = true; }
        outv = transfer(IN[key], insts[key]);
        if (outv !== OUT[key]) { OUT[key] = outv; changed = true; }
      }
    }

    for (i = 0; i < order.length; i++) {
      var ins = insts[order[i]];
      if (ins.op !== "host" || ins.ns !== "Resp") continue;
      var mask = IN[order[i]], m = ins.method;
      if ((mask & ENDED) && RESP_GRAPH_METHODS[m])
        throw new Error("INV-7: Resp." + m + " after the response was finalized (use-after-end)");
      if ((m === "Status" || m === "Header") && (mask & SEALED))
        throw new Error("INV-7: Resp." + m + " after Seal (use-after-seal; preamble/headers are committed)");
      if (m === "Seal" && (mask & SEALED))
        throw new Error("INV-7: Resp.Seal after Seal (use-after-seal; double seal)");
      if (m === "Header" && (mask & BODY))
        throw new Error("INV-7: Resp.Header after a body write (header phase is over)");
      if (m === "Write" && (mask & STREAM_CLOSED))
        throw new Error("INV-7: Resp.Write after EndStream (stream phase closed)");
    }
  }

  function lowerToBytecode(insts, opt, outVars, checkOwnership, debug) {
    if (checkOwnership !== false) verifyResponseOwnership(insts);
    if (opt !== false) insts = optimize(insts);
    var alloc = allocateOrSpill(insts);   // auto-spills on >16 live values (INV-13)
    insts = alloc.insts;
    var mapping = alloc.mapping;
    if (outVars) {
      insts.forEach(function (ins) {
        operandVRegs(ins).forEach(function (v) {
          if (v.pinned && mapping[v.id] !== undefined) outVars[v.name] = mapping[v.id];
        });
      });
    }
    function width(ins) {
      if (ins.op === "label") return 0;
      if (ins.op === "const") return (ins.imm >= -32768 && ins.imm <= 32767) ? 2 : 8;
      if (ins.op === "mov" && isImm(ins.a)) return (ins.a.value >= -32768 && ins.a.value <= 32767) ? 2 : 8;
      if (ins.op === "jmptab") return ins.targets.length + 1;
      return 1;
    }
    // Load `value` into rd: 2-word SUB/ADD-imm for a 16-bit immediate (unchanged), else
    // an 8-word big-endian byte build (SUB; ADD b3; MUL 256; ...; ADD b0) using only
    // sign-safe positive immediates. Byte-identical to picoscript_il._emit_const.
    function emitConst(words, rd, value) {
      words.push(enc(OP.SUB, rd, rd, ADDR_REG, rd));   // rd = rd - rd = 0
      if (value >= -32768 && value <= 32767) {
        words.push(enc(OP.ADD, rd, rd, 0, value & 0xFFFF));
        return 2;
      }
      var u = value >>> 0, shs = [24, 16, 8, 0], i;
      for (i = 0; i < 4; i++) {
        words.push(enc(OP.ADD, rd, rd, 0, (u >>> shs[i]) & 0xFF));
        if (shs[i]) words.push(enc(OP.MUL, rd, rd, 0, 256));
      }
      return 8;
    }
    var labels = {}, pc = 0;
    insts.forEach(function (ins) {
      if (ins.op === "label") labels[ins.label] = pc; else pc += width(ins);
    });
    var words = []; pc = 0;
    insts.forEach(function (ins) {
      if (ins.op === "label") return;
      if (ins.op === "const" || (ins.op === "mov" && isImm(ins.a))) {
        var rd = phys(mapping, ins.dst);
        var value = (ins.op === "const") ? ins.imm : ins.a.value;
        pc += emitConst(words, rd, value); return;
      }
      if (ins.op === "jmptab") {
        var sel = phys(mapping, ins.a);
        words.push(enc(OP.JUMP, 0, sel, ADDR_REG_OFF, (pc + 1) & 0xFFFF));   // PC = sel + tablebase
        ins.targets.forEach(function (t) { words.push(enc(OP.JUMP, 0, 0, 0, labels[t])); });
        pc += ins.targets.length + 1; return;
      }
      words.push(emitWord(ins, mapping, labels, pc));
      pc += 1;
    });
    // INV-25: build pc -> [off, op, ns, method] from the SAME final insts/width the
    // words were emitted from (side-band; the word stream above is byte-identical).
    if (debug) {
      pc = 0;
      insts.forEach(function (ins) {
        var w = width(ins);
        if (w === 0) return;
        var rec = [ins.pos, ins.op, ins.ns != null ? ins.ns : null, ins.method != null ? ins.method : null];
        for (var p = pc; p < pc + w; p++) debug[p] = rec;
        pc += w;
      });
    }
    return words;
  }

  // ========================================================================
  // C-SYNTAX FRONTEND (port of picoscript_cfront.py)
  // ========================================================================
  var C_KW = { int:1, var:1, void:1, if:1, else:1, while:1, for:1, return:1, break:1, continue:1, switch:1, case:1, default:1, do:1, goto:1, dispatch:1, const:1, enum:1 };
  var C_TWO = { "==":1, "!=":1, "<=":1, ">=":1, "&&":1, "||":1, "++":1, "--":1, "+=":1, "-=":1, "*=":1, "/=":1, "%=":1 };
  var C_ONE = "+-*/%()<>=;,{}.!?:";
  var C_PREC = { "||":1, "&&":2, "==":3, "!=":3, "<":4, ">":4, "<=":4, ">=":4, "+":5, "-":5, "*":6, "/":6, "%":6 };
  var C_COMPOUND = { "+=":"+", "-=":"-", "*=":"*", "/=":"/", "%=":"%" };
  var CMP = { "<":"LT", ">":"GT", "<=":"LE", ">=":"GE", "==":"EQ", "!=":"NE" };
  var COP = { "+":"add", "-":"sub", "*":"mul", "/":"div" };

  function numval(s) { return /^0[xX]/.test(s) ? parseInt(s, 16) : parseInt(s, 10); }
  function isAlpha(c) { return /[A-Za-z_]/.test(c); }
  function isAlnum(c) { return /[A-Za-z0-9_]/.test(c); }
  function isDigit(c) { return c >= "0" && c <= "9"; }

  function ctokenize(src) {
    var toks = [], i = 0, n = src.length;
    function push(k, v, p) { toks.push({ kind: k, value: v, pos: p }); }   // INV-25: pos = token start offset
    while (i < n) {
      var c = src[i], start = i;
      if (c === " " || c === "\t" || c === "\r" || c === "\n") { i++; continue; }
      if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
      if (c === "/" && src[i + 1] === "*") { i += 2; while (i + 1 < n && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
      if (c === '"') { var j = i + 1, b = ""; while (j < n && src[j] !== '"') { if (src[j] === "\\" && j + 1 < n) { b += src[j + 1]; j += 2; continue; } b += src[j]; j++; } push("str", b, start); i = j + 1; continue; }
      if (isDigit(c)) { var j2 = i; if (c === "0" && (src[j2 + 1] === "x" || src[j2 + 1] === "X")) { j2 += 2; while (j2 < n && /[0-9a-fA-F]/.test(src[j2])) j2++; } else { while (j2 < n && isDigit(src[j2])) j2++; } push("num", src.slice(i, j2), start); i = j2; continue; }
      if (isAlpha(c)) { var j3 = i; while (j3 < n && isAlnum(src[j3])) j3++; var w = src.slice(i, j3); var low = w.toLowerCase(); if (C_KW[low]) push("kw", low, start); else push("id", w, start); i = j3; continue; }
      var two = src.slice(i, i + 2);
      if (C_TWO[two]) { push("op", two, start); i += 2; continue; }
      if (C_ONE.indexOf(c) >= 0) { push("op", c, start); i++; continue; }
      throw new Error("C: unexpected char " + JSON.stringify(c));
    }
    push("eof", "", n);
    return toks;
  }

  function CParser(toks) { this.toks = toks; this.i = 0; }
  CParser.prototype = {
    peek: function () { return this.toks[this.i]; },
    next: function () { return this.toks[this.i++]; },
    accept: function (v) { var t = this.peek(); if (t.value === v && (t.kind === "op" || t.kind === "kw")) { this.i++; return true; } return false; },
    expect: function (v) { var t = this.peek(); if (t.value !== v) throw new Error("C: expected " + v + " got " + t.value); return this.next(); },
    parseProgram: function () { var s = []; while (this.peek().kind !== "eof") s.push(this.parseToplevel()); return s; },
    parseToplevel: function () {
      var t = this.peek();
      // void name(params) { } or int/var name(params) { } function definition
      if (t.kind === "kw" && t.value === "void") {
        return this._parseFuncDef();
      }
      if (t.kind === "kw" && (t.value === "int" || t.value === "var")) {
        // Disambiguate: int name( => function def; int name = / int name ; => var decl
        if (this.i + 2 < this.toks.length && this.toks[this.i + 1].kind === "id" && this.toks[this.i + 2].value === "(") {
          return this._parseFuncDef();
        }
      }
      return this.parseStmt();
    },
    _parseFuncDef: function () {
      this.next(); // consume return type (void/int/var)
      var name = this.next().value; this.expect("(");
      var params = [];
      if (!this.accept(")")) {
        while (true) {
          var pt = this.peek();
          if (pt.kind === "kw" && (pt.value === "int" || pt.value === "var")) this.next();
          params.push(this.next().value);
          if (!this.accept(",")) break;
        }
        this.expect(")");
      }
      return { t: "Func", name: name, body: this.parseBlock(), params: params.length ? params : null };
    },
    parseBlock: function () { this.expect("{"); var s = []; while (!this.accept("}")) { if (this.peek().kind === "eof") throw new Error("C: unterminated block"); s.push(this.parseStmt()); } return s; },
    parseStmt: function () {
      // INV-25: stamp every statement node with its first token's source offset.
      var start = this.peek().pos;
      var node = this._parseStmt();
      if (node != null) node.pos = start;
      return node;
    },
    _parseStmt: function () {
      var t = this.peek();
      if (t.kind === "kw") {
        if (t.value === "int" || t.value === "var") return this.parseDecl();
        if (t.value === "const") return this.parseConstDecl();
        if (t.value === "enum") return this.parseEnumDecl();
        if (t.value === "if") return this.parseIf();
        if (t.value === "while") return this.parseWhile();
        if (t.value === "for") return this.parseFor();
        if (t.value === "switch") return this.parseSwitch();
        if (t.value === "dispatch") return this.parseDispatch();
        if (t.value === "do") return this.parseDo();
        if (t.value === "goto") { this.next(); var gl = this.next().value; this.expect(";"); return { t: "Goto", label: gl }; }
        if (t.value === "return") { this.next(); if (this.accept(";")) return { t: "Return", value: null }; var v = this.parseExpr(); this.expect(";"); return { t: "Return", value: v }; }
        if (t.value === "break") { this.next(); this.expect(";"); return { t: "Break" }; }
        if (t.value === "continue") { this.next(); this.expect(";"); return { t: "Continue" }; }
      }
      if (t.kind === "id" && t.value === "Server" && this.toks[this.i + 1] && this.toks[this.i + 1].value === "." && this.toks[this.i + 2] && this.toks[this.i + 2].value === "Main" && this.toks[this.i + 3] && this.toks[this.i + 3].value === "{") {
        this.next(); this.next(); this.next(); return { t: "ServerMain", body: this.parseBlock() };
      }
      if (t.value === "{") { return { t: "If", cond: { t: "Num", value: 1 }, then: this.parseBlock(), els: null }; }
      if (t.kind === "id" && this.toks[this.i + 1].value === ":") { var lab = this.next().value; this.next(); return { t: "Label", name: lab }; }
      if (t.kind === "id" && this.toks[this.i + 1].kind === "id") { this.next(); return this.parseDeclAfterType(); }
      if (t.kind === "id" && this.toks[this.i + 1].value === "." && this.toks[this.i + 2].kind === "id" && ["=","++","--","+=","-=","*=","/=","%="].indexOf(this.toks[this.i + 3].value) >= 0) {
        var fo = this.next().value; this.expect("."); var ff = this.next().value; var fop = this.next().value, fv;
        if (fop === "=") fv = this.parseExpr();
        else if (fop === "++" || fop === "--") fv = { t: "Bin", op: fop === "++" ? "+" : "-", lhs: { t: "FieldRef", obj: fo, field: ff }, rhs: { t: "Num", value: 1 } };
        else fv = { t: "Bin", op: C_COMPOUND[fop], lhs: { t: "FieldRef", obj: fo, field: ff }, rhs: this.parseExpr() };
        this.expect(";"); return { t: "FieldAssign", obj: fo, field: ff, value: fv };
      }
      if (t.kind === "id" && this.toks[this.i + 1].value === "=") {
        var name = this.next().value; this.expect("="); var val = this.parseExpr(); this.expect(";"); return { t: "Assign", name: name, value: val };
      }
      if (t.kind === "id" && C_COMPOUND[this.toks[this.i + 1].value]) {
        var cn = this.next().value; var cop = C_COMPOUND[this.next().value]; var cv = this.parseExpr(); this.expect(";");
        return { t: "Assign", name: cn, value: { t: "Bin", op: cop, lhs: { t: "Var", name: cn }, rhs: cv } };
      }
      var e = this.parseExpr(); this.expect(";"); return { t: "ExprStmt", expr: e };
    },
    parseDecl: function () { this.next(); return this.parseDeclAfterType(); },
    parseConstDecl: function () {
      this.next(); // const
      if (this.peek().kind === "kw" && (this.peek().value === "int" || this.peek().value === "var")) this.next();
      var name = this.next().value;
      this.expect("=");
      var value = this.parseExpr();
      this.expect(";");
      return { t: "ConstDecl", name: name, value: value };
    },
    parseEnumDecl: function () {
      this.next(); // enum
      var enumName = this.next().value;
      this.expect("{");
      var members = [];
      while (!this.accept("}")) {
        if (this.peek().kind === "eof") throw new Error("C: unterminated enum declaration");
        var memberName = this.next().value;
        var memberValue = null;
        if (this.accept("=")) memberValue = this.parseExpr();
        members.push([memberName, memberValue]);
        this.accept(",");
      }
      this.expect(";");
      return { t: "EnumDecl", enum_name: enumName, members: members };
    },
    parseDeclAfterType: function () { var name = this.next().value; var init = null; if (this.accept("=")) init = this.parseExpr(); this.expect(";"); return { t: "Decl", name: name, init: init }; },
    parseDeclNoSemi: function () { this.next(); var name = this.next().value; var init = null; if (this.accept("=")) init = this.parseExpr(); this.expect(";"); return { t: "Decl", name: name, init: init }; },
    parseIf: function () {
      this.next(); this.expect("("); var cond = this.parseExpr(); this.expect(")"); var then = this.parseBlock(); var els = null;
      if (this.accept("else")) { els = (this.peek().value === "{") ? this.parseBlock() : [this.parseIf()]; }
      return { t: "If", cond: cond, then: then, els: els };
    },
    parseWhile: function () { this.next(); this.expect("("); var cond = this.parseExpr(); this.expect(")"); return { t: "While", cond: cond, body: this.parseBlock() }; },
    parseFor: function () {
      this.next(); this.expect("("); var init = null;
      if (!this.accept(";")) {
        if (this.peek().value === "int" || this.peek().value === "var") init = this.parseDeclNoSemi();
        else { var nm = this.next().value; this.expect("="); init = { t: "Assign", name: nm, value: this.parseExpr() }; this.expect(";"); }
      }
      var cond = null; if (!this.accept(";")) { cond = this.parseExpr(); this.expect(";"); }
      var step = null;
      if (this.peek().value !== ")") {
        if (this.peek().kind === "id" && this.toks[this.i + 1].value === "=") { var nm2 = this.next().value; this.expect("="); step = { t: "Assign", name: nm2, value: this.parseExpr() }; }
        else if (this.peek().kind === "id" && C_COMPOUND[this.toks[this.i + 1].value]) { var nm3 = this.next().value; var sop = C_COMPOUND[this.next().value]; step = { t: "Assign", name: nm3, value: { t: "Bin", op: sop, lhs: { t: "Var", name: nm3 }, rhs: this.parseExpr() } }; }
        else step = { t: "ExprStmt", expr: this.parseExpr() };
      }
      this.expect(")"); return { t: "For", init: init, cond: cond, step: step, body: this.parseBlock() };
    },
    parseSwitch: function () {
      this.next(); this.expect("("); var expr = this.parseExpr(); this.expect(")"); this.expect("{");
      var cases = [], def = null;
      while (!this.accept("}")) {
        var t = this.peek();
        if (t.kind === "kw" && t.value === "case") { this.next(); var val = this.parseExpr(); this.expect(":"); cases.push([val, this.parseCaseBody()]); }
        else if (t.kind === "kw" && t.value === "default") { this.next(); this.expect(":"); def = this.parseCaseBody(); }
        else throw new Error("C: expected case/default in switch");
      }
      return { t: "Switch", expr: expr, cases: cases, def: def };
    },
    parseDispatch: function () {
      this.next(); this.expect("("); var expr = this.parseExpr(); this.expect(")"); this.expect("{");
      var cases = [], def = null;
      while (!this.accept("}")) {
        var t = this.peek();
        if (t.kind === "kw" && t.value === "case") { this.next(); var val = this.parseExpr(); this.expect(":"); cases.push([val, this.parseCaseBody()]); }
        else if (t.kind === "kw" && t.value === "default") { this.next(); this.expect(":"); def = this.parseCaseBody(); }
        else throw new Error("C: expected case/default in dispatch");
      }
      return { t: "Dispatch", expr: expr, cases: cases, def: def };
    },
    parseCaseBody: function () {
      var stmts = [];
      while (true) {
        var t = this.peek();
        if (t.value === "}") break;
        if (t.kind === "kw" && (t.value === "case" || t.value === "default")) break;
        if (t.kind === "kw" && t.value === "break") { this.next(); this.expect(";"); break; }
        stmts.push(this.parseStmt());
      }
      return stmts;
    },
    parseDo: function () {
      this.next(); var body = this.parseBlock();
      if (!(this.peek().kind === "kw" && this.peek().value === "while")) throw new Error("C: expected 'while' after do block");
      this.next(); this.expect("("); var cond = this.parseExpr(); this.expect(")"); this.expect(";");
      return { t: "DoWhile", cond: cond, until: false, body: body };
    },
    parseExpr: function (minp) { return this.parseTernary(); },
    parseTernary: function () {
      var cond = this.parseBinary(0);
      if (this.peek().kind === "op" && this.peek().value === "?") {
        this.next(); var then = this.parseExpr(); this.expect(":"); var els = this.parseTernary();
        return { t: "Ternary", cond: cond, then: then, els: els };
      }
      return cond;
    },
    parseBinary: function (minp) {
      minp = minp || 0; var left = this.parseUnary();
      while (true) { var t = this.peek(); if (t.kind !== "op" || C_PREC[t.value] === undefined || C_PREC[t.value] < minp) break; var op = this.next().value; var right = this.parseBinary(C_PREC[op] + 1); left = { t: "Bin", op: op, lhs: left, rhs: right }; }
      return left;
    },
    parseUnary: function () {
      var t = this.peek();
      if (t.kind === "op" && (t.value === "++" || t.value === "--")) { var po = this.next().value; return { t: "IncDec", op: po, target: this.parseUnary(), prefix: true }; }
      if ((t.value === "-" || t.value === "!") && t.kind === "op") { var op = this.next().value; return { t: "Unary", op: op, operand: this.parseUnary() }; }
      return this.parseAtom();
    },
    parseAtom: function () {
      var node = this.parsePrimary();
      while (this.peek().kind === "op" && (this.peek().value === "++" || this.peek().value === "--")) { var o = this.next().value; node = { t: "IncDec", op: o, target: node, prefix: false }; }
      return node;
    },
    parsePrimary: function () {
      var t = this.next();
      if (t.kind === "num") return { t: "Num", value: numval(t.value) };
      if (t.kind === "str") return { t: "Str", value: t.value };
      if (t.value === "(") { var e = this.parseExpr(); this.expect(")"); return e; }
      if (t.kind === "id") {
        if (this.peek().value === ".") { this.next(); var m = this.next().value; if (this.peek().value === "(") return { t: "Call", ns: t.value, method: m, args: this.parseArgs() }; return { t: "FieldRef", obj: t.value, field: m }; }
        if (this.peek().value === "(") return { t: "Call", ns: null, method: t.value, args: this.parseArgs() };
        return { t: "Var", name: t.value };
      }
      throw new Error("C: unexpected token " + t.value);
    },
    parseArgs: function () { this.expect("("); var a = []; if (!this.accept(")")) { a.push(this.parseExpr()); while (this.accept(",")) a.push(this.parseExpr()); this.expect(")"); } return a; }
  };

  // C-frontend aliases: libc spellings -> canonical (ns, method). Mirrors
  // picoscript_cfront.C_ALIASES so Python- and JS-compiled bytecode stay identical.
  var C_ALIASES = {
    strlen: ["String", "Length"], strcat: ["String", "Concat"], strstr: ["String", "IndexOf"],
    toupper: ["String", "ToUpper"], tolower: ["String", "ToLower"], substr: ["String", "Substring"],
    atoi: ["Number", "Parse"], itoa: ["Number", "ToString"], tohex: ["Number", "ToHex"],
    abs: ["Number", "Abs"], sqrt: ["Maths", "Sqrt"], pow: ["Maths", "Power"], sha256: ["Crypto", "Sha256"]
  };

  // Stage a string literal's UTF-8 bytes in a scratch arena region and return a
  // span over them (two alternating slots). Mirrors picoscript_*.emit_str_span.
  function emitStrSpan(self, text) {
    var data = Array.prototype.slice.call(new TextEncoder().encode(text));
    // String-literal constant pool (mirrors picoscript_cfront.emit_str_span): each
    // distinct literal interned to its own stable address growing down from 0x8000,
    // deduped by content, so any number can be live at once.
    if (!self._strpool) { self._strpool = {}; self._strpoolTop = 0x8000; }
    var key = data.join(",");
    var base = self._strpool[key];
    if (base === undefined) { self._strpoolTop -= data.length; base = self._strpoolTop; self._strpool[key] = base; }
    var b = self.b, areg = b.vreg(), vreg = b.vreg();
    for (var i = 0; i < data.length; i++) {
      b.const_(areg, base + i);
      b.const_(vreg, data[i]);
      b.host("Memory", "SetConst", [areg, vreg], null);
    }
    b.const_(areg, base);
    b.const_(vreg, data.length);
    var span = b.vreg();
    b.host("Span", "Make", [areg, vreg], span);
    return span;
  }

  function CLowerer() { this.b = new ILBuilder(); this.vars = {}; this.funcs = []; this.loop = []; this._strlitN = 0; this.userConstants = {}; }
  CLowerer.prototype = {
    varOf: function (name) { var k = name.toLowerCase(); if (!this.vars[k]) this.vars[k] = new VReg(name, true); return this.vars[k]; },
    resolveConstant: function (name) {
      var key = String(name).trim().toUpperCase();
      if (Object.prototype.hasOwnProperty.call(this.userConstants, key)) return this.userConstants[key] | 0;
      return namedConstant(name);
    },
    evalConstExpr: function (e) {
      if (e.t === "Num") return e.value | 0;
      if (e.t === "Var") {
        var cv = this.resolveConstant(e.name);
        if (cv === null) throw new Error("unknown constant " + e.name + " in constant expression");
        return cv | 0;
      }
      if (e.t === "FieldRef") {
        var fv = this.resolveConstant(e.obj + "." + e.field);
        if (fv === null) throw new Error("unknown constant " + e.obj + "." + e.field + " in constant expression");
        return fv | 0;
      }
      if (e.t === "Unary") {
        if (e.op === "-") return -this.evalConstExpr(e.operand);
        throw new Error("unsupported unary op " + e.op + " in constant expression");
      }
      if (e.t === "Bin") {
        var a = this.evalConstExpr(e.lhs), b = this.evalConstExpr(e.rhs);
        if (e.op === "+") return (a + b) | 0;
        if (e.op === "-") return (a - b) | 0;
        if (e.op === "*") return (a * b) | 0;
        if (e.op === "/") {
          if (b === 0) throw new Error("division by zero in constant expression");
          return (a / b) | 0;
        }
        if (e.op === "%") {
          if (b === 0) throw new Error("modulo by zero in constant expression");
          return (a - ((a / b) | 0) * b) | 0;
        }
      }
      throw new Error("unsupported constant expression " + e.t);
    },
    defineConstant: function (name, expr) {
      this.userConstants[String(name).trim().toUpperCase()] = this.evalConstExpr(expr) | 0;
    },
    defineEnum: function (enumName, members) {
      var ek = String(enumName).trim().toUpperCase();
      var cur = -1;
      for (var i = 0; i < members.length; i++) {
        var mname = members[i][0];
        var mexpr = members[i][1];
        cur = (mexpr == null) ? (cur + 1) : (this.evalConstExpr(mexpr) | 0);
        var mk = String(mname).trim().toUpperCase();
        this.userConstants[mk] = cur;
        this.userConstants[ek + "_" + mk] = cur;
        this.userConstants[ek + "." + mk] = cur;
      }
    },
    lowerProgram: function (prog) {
      var self = this, body = [];
      this._funcParams = {};
      prog.forEach(function (s) { if (s.t === "Func") { self.funcs.push(s); self._funcParams[s.name.toLowerCase()] = s.params || []; } else body.push(s); });
      body.forEach(function (s) { self.stmt(s); });
      this.b.ret();
      this.funcs.forEach(function (f) {
        self.b.label("fn_" + f.name.toLowerCase());
        (f.params || []).forEach(function (p, i) { var pv = self.varOf(p); var av = self.varOf("__arg" + i + "__"); self.b.mov(pv, av); });
        f.body.forEach(function (s) { self.stmt(s); });
        self.b.ret();
      });
      return this.b.insts;
    },
    stmt: function (s) {
      var self = this;
      if (typeof s.pos === "number" && s.pos >= 0) this.b.curPos = s.pos;   // INV-25
      if (s.t === "Decl") { var v = this.varOf(s.name); if (s.init != null) this.assignTo(v, s.init); else this.b.const_(v, 0); }
      else if (s.t === "ConstDecl") this.defineConstant(s.name, s.value);
      else if (s.t === "EnumDecl") this.defineEnum(s.enum_name, s.members || []);
      else if (s.t === "Assign") this.assignTo(this.varOf(s.name), s.value);
      else if (s.t === "FieldAssign") this.assignField(s.obj, s.field, s.value);
      else if (s.t === "If") this.lowerIf(s);
      else if (s.t === "While") this.lowerWhile(s);
      else if (s.t === "For") this.lowerFor(s);
      else if (s.t === "Switch") this.lowerSwitch(s);
      else if (s.t === "Dispatch") this.lowerDispatch(s);
      else if (s.t === "DoWhile") this.lowerDoWhile(s);
      else if (s.t === "Goto") this.b.jmp("lbl_" + s.label.toLowerCase());
      else if (s.t === "Label") this.b.label("lbl_" + s.name.toLowerCase());
      else if (s.t === "Return") { if (s.value != null) { var rv = this.eval(s.value); this.b.mov(this.varOf("__ret__"), rv); } this.b.ret(); }
      else if (s.t === "ExprStmt") { if (s.expr != null) this.eval(s.expr, false); }
      else if (s.t === "Break") { if (!this.loop.length) throw new Error("break outside loop"); this.b.jmp(this.loop[this.loop.length - 1][1]); }
      else if (s.t === "Continue") { if (!this.loop.length) throw new Error("continue outside loop"); this.b.jmp(this.loop[this.loop.length - 1][0]); }
      else if (s.t === "ServerMain") s.body.forEach(function (st) { self.stmt(st); });
      else throw new Error("C: cannot lower " + s.t);
    },
    assignTo: function (dst, e) {
      if (e.t === "Bin" && COP[e.op]) {
        var a = this.eval(e.lhs);
        if (e.rhs.t === "Num" && e.rhs.value >= -32768 && e.rhs.value <= 65535) { this.b.arith(COP[e.op], dst, a, new Imm(e.rhs.value)); return; }
        var bb = this.eval(e.rhs); this.b.arith(COP[e.op], dst, a, bb); return;
      }
      this.b.mov(dst, this.eval(e));
    },
    assignField: function (obj, field, expr) {
      var card = this.varOf(obj);
      this.b.host("Storage", "EditCard", [card], null);
      var name = emitStrSpan(this, field);
      if (expr.t === "Str") this.b.host("Storage", "SetFieldStr", [name, emitStrSpan(this, expr.value)], null);
      else this.b.host("Storage", "SetField", [name, this.eval(expr)], null);
    },
    lowerIf: function (s) {
      var elseL = this.b.newLabel("else"), endL = this.b.newLabel("endif");
      this.branchFalse(s.cond, elseL);
      var self = this; s.then.forEach(function (st) { self.stmt(st); });
      if (s.els) { this.b.jmp(endL); this.b.label(elseL); s.els.forEach(function (st) { self.stmt(st); }); this.b.label(endL); }
      else this.b.label(elseL);
    },
    lowerWhile: function (s) {
      var top = this.b.newLabel("while"), end = this.b.newLabel("endwhile");
      this.b.label(top); this.branchFalse(s.cond, end);
      this.loop.push([top, end]); var self = this; s.body.forEach(function (st) { self.stmt(st); }); this.loop.pop();
      this.b.jmp(top); this.b.label(end);
    },
    lowerFor: function (s) {
      if (s.init) this.stmt(s.init);
      var top = this.b.newLabel("for"), cont = this.b.newLabel("forcont"), end = this.b.newLabel("endfor");
      this.b.label(top); if (s.cond) this.branchFalse(s.cond, end);
      this.loop.push([cont, end]); var self = this; s.body.forEach(function (st) { self.stmt(st); }); this.loop.pop();
      this.b.label(cont); if (s.step) this.stmt(s.step); this.b.jmp(top); this.b.label(end);
    },
    lowerSwitch: function (s) {
      var val = this.eval(s.expr);
      var end = this.b.newLabel("endsw");
      var prevCont = this.loop.length ? this.loop[this.loop.length - 1][0] : end;
      this.loop.push([prevCont, end]);
      var self = this;
      s.cases.forEach(function (cb) {
        var nxt = self.b.newLabel("case");
        self.branchFalse({ t: "Bin", op: "==", lhs: { t: "Raw", v: val }, rhs: cb[0] }, nxt);
        cb[1].forEach(function (st) { self.stmt(st); });
        self.b.jmp(end); self.b.label(nxt);
      });
      if (s.def) s.def.forEach(function (st) { self.stmt(st); });
      this.loop.pop();
      this.b.label(end);
    },
    lowerDispatch: function (s) {
      var sel = this.eval(s.expr);
      var end = this.b.newLabel("enddisp"), defL = this.b.newLabel("dispdef");
      var prevCont = this.loop.length ? this.loop[this.loop.length - 1][0] : end;
      this.loop.push([prevCont, end]);
      var self = this, pairs = [];
      s.cases.forEach(function (cb) {
        if (cb[0].t !== "Num" || cb[0].value < 0) throw new Error("dispatch case must be a constant non-negative integer");
        pairs.push([cb[0].value, cb[1]]);
      });
      var n = 0; pairs.forEach(function (p) { if (p[0] + 1 > n) n = p[0] + 1; });
      var table = []; for (var i = 0; i < n; i++) table.push(defL);
      var bodies = [];
      pairs.forEach(function (p) { var lbl = self.b.newLabel("dcase"); table[p[0]] = lbl; bodies.push([lbl, p[1]]); });
      var nreg = this.b.vreg(); this.b.const_(nreg, n); this.b.cmpbr("GE", sel, nreg, defL);
      var zreg = this.b.vreg(); this.b.const_(zreg, 0); this.b.cmpbr("LT", sel, zreg, defL);
      this.b.jmptab(sel, table, defL);
      bodies.forEach(function (bd) { self.b.label(bd[0]); bd[1].forEach(function (st) { self.stmt(st); }); self.b.jmp(end); });
      this.b.label(defL);
      if (s.def) s.def.forEach(function (st) { self.stmt(st); });
      this.loop.pop();
      this.b.label(end);
    },
    lowerDoWhile: function (s) {
      var top = this.b.newLabel("do"), cont = this.b.newLabel("docont"), end = this.b.newLabel("enddo");
      this.b.label(top);
      this.loop.push([cont, end]); var self = this; s.body.forEach(function (st) { self.stmt(st); }); this.loop.pop();
      this.b.label(cont);
      if (s.until) { this.branchFalse(s.cond, top); }
      else { this.branchFalse(s.cond, end); this.b.jmp(top); }
      this.b.label(end);
    },
    branchFalse: function (cond, falseL) {
      if (cond.t === "Bin" && CMP[cond.op]) { var a = this.eval(cond.lhs), b = this.eval(cond.rhs); this.b.cmpbr(COND_NEGATE[CMP[cond.op]], a, b, falseL); return; }
      var v = this.eval(cond); this.b.cmpbr("Z", v, v, falseL);
    },
    eval: function (e, want) {
      if (want === undefined) want = true;
      if (e.t === "Num") { var v = this.b.vreg(); this.b.const_(v, e.value); return v; }
      if (e.t === "Var") {
        var cv = this.resolveConstant(e.name);
        if (cv !== null) { var vv = this.b.vreg(); this.b.const_(vv, cv); return vv; }
        return this.varOf(e.name);
      }
      if (e.t === "Raw") return e.v;
      if (e.t === "Bin") {
        if (CMP[e.op]) return this.evalBool(e);
        if (e.op === "&&" || e.op === "||") return this.evalLogical(e);
        if (e.op === "%") return this.evalMod(e.lhs, e.rhs);
        var a = this.eval(e.lhs), dst = this.b.vreg();
        if (e.rhs.t === "Num" && e.rhs.value >= -32768 && e.rhs.value <= 65535) this.b.arith(COP[e.op], dst, a, new Imm(e.rhs.value));
        else { var b = this.eval(e.rhs); this.b.arith(COP[e.op], dst, a, b); }
        return dst;
      }
      if (e.t === "IncDec") return this.evalIncDec(e);
      if (e.t === "Ternary") return this.evalTernary(e);
      if (e.t === "Unary") {
        if (e.op === "-") { var z = this.b.vreg(); this.b.const_(z, 0); var inner = this.eval(e.operand); var d = this.b.vreg(); this.b.arith("sub", d, z, inner); return d; }
        if (e.op === "!") { var iv = this.eval(e.operand); return this.evalBool({ t: "Bin", op: "==", lhs: { t: "Raw", v: iv }, rhs: { t: "Num", value: 0 } }); }
      }
      if (e.t === "Call") return this.lowerCall(e, want);
      if (e.t === "Str") return emitStrSpan(this, e.value);
      if (e.t === "FieldRef") {
        var fv = this.resolveConstant(e.obj + "." + e.field);
        if (fv !== null) { var fe = this.b.vreg(); this.b.const_(fe, fv); return fe; }
        var card = this.varOf(e.obj); this.b.host("Storage", "EditCard", [card], null); var name = emitStrSpan(this, e.field); var fd = this.b.vreg(); this.b.host("Storage", "GetField", [name], fd); return fd;
      }
      throw new Error("C: cannot evaluate " + e.t);
    },
    evalBool: function (e) {
      var a = this.eval(e.lhs), b = this.eval(e.rhs), dst = this.b.vreg();
      var tl = this.b.newLabel("bt"), el = this.b.newLabel("be");
      this.b.cmpbr(CMP[e.op], a, b, tl); this.b.const_(dst, 0); this.b.jmp(el);
      this.b.label(tl); this.b.const_(dst, 1); this.b.label(el); return dst;
    },
    evalMod: function (lhs, rhs) {
      var a = this.eval(lhs), b = this.eval(rhs);
      var q = this.b.vreg(); this.b.arith("div", q, a, b);
      var m = this.b.vreg(); this.b.arith("mul", m, q, b);
      var dst = this.b.vreg(); this.b.arith("sub", dst, a, m);
      return dst;
    },
    evalLogical: function (e) {
      var dst = this.b.vreg(); var a = this.eval(e.lhs); var endL = this.b.newLabel("lend");
      if (e.op === "&&") {
        var falseL = this.b.newLabel("land0");
        this.b.cmpbr("Z", a, a, falseL);
        var b = this.eval(e.rhs); this.b.cmpbr("Z", b, b, falseL);
        this.b.const_(dst, 1); this.b.jmp(endL);
        this.b.label(falseL); this.b.const_(dst, 0);
      } else {
        var trueL = this.b.newLabel("lor1");
        this.b.cmpbr("NZ", a, a, trueL);
        var b2 = this.eval(e.rhs); this.b.cmpbr("NZ", b2, b2, trueL);
        this.b.const_(dst, 0); this.b.jmp(endL);
        this.b.label(trueL); this.b.const_(dst, 1);
      }
      this.b.label(endL); return dst;
    },
    evalIncDec: function (e) {
      if (e.target.t !== "Var") throw new Error("++/-- requires a variable");
      var v = this.varOf(e.target.name);
      if (e.prefix) { if (e.op === "++") this.b.inc(v); else this.b.arith("sub", v, v, new Imm(1)); return v; }
      var old = this.b.vreg(); this.b.mov(old, v);
      if (e.op === "++") this.b.inc(v); else this.b.arith("sub", v, v, new Imm(1));
      return old;
    },
    evalTernary: function (e) {
      var dst = this.b.vreg(); var elseL = this.b.newLabel("telse"), endL = this.b.newLabel("tend");
      this.branchFalse(e.cond, elseL);
      var tv = this.eval(e.then); this.b.mov(dst, tv); this.b.jmp(endL);
      this.b.label(elseL); var ev = this.eval(e.els); this.b.mov(dst, ev);
      this.b.label(endL); return dst;
    },
    lowerCall: function (c, want) {
      var ns = c.ns, m = c.method;
      if (ns == null) {
        if (m.toLowerCase() === "print") { if (c.args[0].t === "Str") { this.b.host("Io", "Write", [emitStrSpan(this, c.args[0].value)], null); return null; } var v = this.eval(c.args[0]); this.b.save(v, 0xFFFE); this.b.pipe(v, 0xFFFE); return null; }
        var ak = m.toLowerCase();
        if (C_ALIASES[ak] && !this.funcs.some(function (f) { return f.name.toLowerCase() === ak; })) {
          return this.lowerCall({ t: "Call", ns: C_ALIASES[ak][0], method: C_ALIASES[ak][1], args: c.args }, want);
        }
        // pass args via arg-passing regs
        var params = (this._funcParams || {})[ak] || [];
        for (var ai = 0; ai < c.args.length; ai++) { var aav = this.varOf("__arg" + ai + "__"); this.assignTo(aav, c.args[ai]); }
        this.b.call("fn_" + m.toLowerCase());
        if (want) return this.varOf("__ret__");
        return null;
      }
      if (ns.toUpperCase() === "NET") {
        var M = m.toUpperCase();
        if (M === "STATUS") this.b.net("status", this.evalConstExpr(c.args[0]));
        else if (M === "TYPE") this.b.net("type", strlit(c.args[0]));
        else if (M === "BODY") this.b.net("body");
        else if (M === "CLOSE") this.b.net("close");
        else if (M === "HEADER") this.b.net("header");
        else throw new Error("unknown Net." + m);
        return null;
      }
      if (ns.toUpperCase() === "STORAGE" && ["LOAD", "SAVE", "PIPE"].indexOf(m.toUpperCase()) >= 0) {
        var addr = encodeCardAddr(intlit(c.args[0]), intlit(c.args[1]), intlit(c.args[2]));
        var reg = this.eval(c.args[3]); var MM = m.toUpperCase();
        if (MM === "LOAD") this.b.load(reg, addr); else if (MM === "SAVE") this.b.save(reg, addr); else this.b.pipe(reg, addr);
        return reg;
      }
      if (ns.toUpperCase() === "STORAGE" && m.toUpperCase() === "GETCARD") { var gp = this.eval(c.args[0]), gc = this.eval(c.args[1]); this.b.host("Storage", "UsePack", [gp], null); var gd = want ? this.b.vreg() : null; this.b.host("Storage", "EditCard", [gc], gd); return gd; }
      if (ns.toUpperCase() === "STORAGE" && m.toUpperCase() === "SAVECARD") { var sc = this.eval(c.args[0]); this.b.host("Storage", "EditCard", [sc], null); var sd = want ? this.b.vreg() : null; if (sd) this.b.const_(sd, 1); return sd; }
      if (ns.toUpperCase() === "STORAGE" && m.toUpperCase() === "QUERYCARDS") { var qp = this.eval(c.args[0]), qq = this.eval(c.args[1]); this.b.host("Storage", "UsePack", [qp], null); var qd = want ? this.b.vreg() : null; this.b.host("Storage", "QueryCard", [qq], qd); return qd; }
      var cn = canonHost(ns, m); var self = this;
      var argregs = c.args.slice(0, 2).map(function (a) { return self.eval(a); });
      var dst = want ? this.b.vreg() : null;
      this.b.host(cn[0], cn[1], argregs, dst); return dst;
    }
  };
  function intlit(node) { if (node.t === "Num") return node.value; throw new Error("expected integer literal"); }
  function strlit(node) { if (node.t === "Str") return node.value; throw new Error("expected string literal"); }
  function compileC(src) { return new CLowerer().lowerProgram(new CParser(ctokenize(src)).parseProgram()); }

  // ========================================================================
  // BASIC-LIKE FRONTEND (port of picoscript_basic.py)
  // ========================================================================
  var B_KW = {}; ["LET","DIM","IF","THEN","ELSEIF","ELSE","ENDIF","WHILE","ENDWHILE","FOR","TO","STEP","NEXT","FOREACH","IN","ENDFOREACH","SWITCH","CASE","DEFAULT","ENDSWITCH","DISPATCH","ENDDISPATCH","GOTO","GOSUB","SUB","ENDSUB","RETURN","PRINT","AND","OR","NOT","DO","LOOP","UNTIL","BREAK","SKIP","INC","DEC","IIF","EQ","NE","LT","GT","LE","GE","MOD","STORE","GPIO","LOAD","SERVER","ENDSERVER","ASSERT","PACK","CARD","FIFO","DEVICE","STREAM","UI","EVENT","CONST","ENUM","ENDENUM"].forEach(function (k) { B_KW[k] = 1; });
  var B_CMPW = { EQ:"EQ", NE:"NE", LT:"LT", GT:"GT", LE:"LE", GE:"GE" };
  var B_CMPS = { "==":"EQ", "!=":"NE", "<>":"NE", "=":"EQ", "<":"LT", ">":"GT", "<=":"LE", ">=":"GE" };
  var B_COMPARATORS = {}; for (var _k in B_CMPW) B_COMPARATORS[_k] = B_CMPW[_k]; for (var _k2 in B_CMPS) B_COMPARATORS[_k2] = B_CMPS[_k2];
  var B_ASSIGN = { "+=":"+", "-=":"-", "*=":"*", "/=":"/" };
  var B_TWO = { "==":1, "!=":1, "<=":1, ">=":1, "<>":1, "+=":1, "-=":1, "*=":1, "/=":1 };
  var B_ONE = "+-*/()<>=,.:";
  var B_PREC = { OR:1, AND:2, "+":5, "-":5, "*":6, "/":6, MOD:6 };
  for (var _c in B_COMPARATORS) B_PREC[_c] = 3;
  var B_ARITH = { "+":"add", "-":"sub", "*":"mul", "/":"div" };
  var B_PRINT_CARD = 0xFFFE;

  function btokenize(src) {
    var toks = [], i = 0, n = src.length;
    function push(k, v, p) { toks.push({ kind: k, value: v, pos: p }); }
    while (i < n) {
      var c = src[i], start = i;
      if (c === "\n") { push("nl", "\\n", start); i++; continue; }
      if (c === " " || c === "\t" || c === "\r") { i++; continue; }
      if (c === "'" || (c === "/" && src[i + 1] === "/")) { while (i < n && src[i] !== "\n") i++; continue; }
      if (c === '"') { var j = i + 1, b = ""; while (j < n && src[j] !== '"') { b += src[j]; j++; } push("str", b, start); i = j + 1; continue; }
      if (isDigit(c)) { var j2 = i; if (c === "0" && (src[j2 + 1] === "x" || src[j2 + 1] === "X")) { j2 += 2; while (j2 < n && /[0-9a-fA-F]/.test(src[j2])) j2++; } else { while (j2 < n && isDigit(src[j2])) j2++; } push("num", src.slice(i, j2), start); i = j2; continue; }
      if (isAlpha(c)) { var j3 = i; while (j3 < n && isAlnum(src[j3])) j3++; if (src[j3] === "$") j3++; var w = src.slice(i, j3); var up = w.toUpperCase(); if (B_KW[up]) push("kw", up, start); else push("id", w, start); i = j3; continue; }
      var two = src.slice(i, i + 2);
      if (B_TWO[two]) { push("op", two, start); i += 2; continue; }
      if (B_ONE.indexOf(c) >= 0) { push("op", c, start); i++; continue; }
      throw new Error("BASIC: unexpected char " + JSON.stringify(c));
    }
    push("nl", "\\n", n); push("eof", "", n);
    return toks;
  }

  function BParser(toks) { this.toks = toks; this.i = 0; }
  BParser.prototype = {
    peek: function () { return this.toks[this.i]; },
    peek2: function () { return this.toks[this.i + 1]; },
    next: function () { return this.toks[this.i++]; },
    skipNl: function () { while (this.peek().kind === "nl") this.i++; },
    atKw: function () { var t = this.peek(); if (t.kind !== "kw") return false; for (var k = 0; k < arguments.length; k++) if (t.value === arguments[k]) return true; return false; },
    eatKw: function (name) { var t = this.next(); if (!(t.kind === "kw" && t.value === name)) throw new Error("BASIC: expected " + name + " got " + t.value); },
    eatOp: function (v) { var t = this.next(); if (!(t.kind === "op" && t.value === v)) throw new Error("BASIC: expected " + v + " got " + t.value); },
    endLine: function () { var t = this.peek(); if (t.kind === "nl" || t.kind === "eof") { this.skipNl(); return; } throw new Error("BASIC: expected EOL got " + t.value); },
    parseProgram: function () { var s = []; this.skipNl(); while (this.peek().kind !== "eof") { s.push(this.parseStmt()); this.skipNl(); } return s; },
    parseBlock: function () {
      var terms = Array.prototype.slice.call(arguments); var s = []; this.skipNl();
      while (!this.atKwArr(terms)) { if (this.peek().kind === "eof") throw new Error("BASIC: unexpected EOF expecting " + terms); s.push(this.parseStmt()); this.skipNl(); }
      return s;
    },
    atKwArr: function (arr) { var t = this.peek(); return t.kind === "kw" && arr.indexOf(t.value) >= 0; },
    parseStmt: function () {
      var start = this.peek().pos;
      var node = this._parseStmt();
      if (node != null) node.pos = start;
      return node;
    },
    _parseStmt: function () {
      var t = this.peek();
      if (t.kind === "id" && this.peek2().kind === "op" && this.peek2().value === ":") { var name = this.next().value; this.next(); this.endLine(); return { t: "Label", name: name }; }
      if (t.kind === "kw") {
        var kw = t.value;
        if (kw === "LET") return this.parseLet(true);
        if (kw === "DIM") return this.parseDim();
        if (kw === "CONST") return this.parseConst();
        if (kw === "ENUM") return this.parseEnum();
        if (kw === "INC") { this.next(); var ni = this.next().value; this.endLine(); return { t: "IncDec", name: ni, delta: 1 }; }
        if (kw === "DEC") { this.next(); var nd = this.next().value; this.endLine(); return { t: "IncDec", name: nd, delta: -1 }; }
        if (kw === "IF") return this.parseIf();
        if (kw === "WHILE") return this.parseWhile();
        if (kw === "DO") return this.parseDo();
        if (kw === "FOR") return this.parseFor();
        if (kw === "FOREACH") return this.parseForeach();
        if (kw === "SWITCH") return this.parseSwitch();
      if (kw === "DISPATCH") return this.parseDispatch();
        if (kw === "GOTO") { this.next(); var nm = this.next().value; this.endLine(); return { t: "Goto", label: nm }; }
        if (kw === "GOSUB") {
          this.next(); var nm2 = this.next().value;
          var gArgs = null;
          if (this.peek().kind === "op" && this.peek().value === "(") { gArgs = this.parseArgs(); }
          this.endLine(); return { t: "Gosub", name: nm2, args: gArgs };
        }
        if (kw === "SUB") return this.parseSub();
        if (kw === "SERVER") return this.parseServer();
        if (kw === "RETURN") {
          this.next();
          if (this.peek().kind === "nl" || this.peek().kind === "eof") { this.endLine(); return { t: "Return" }; }
          var rv = this.parseExpr(); this.endLine(); return { t: "Return", value: rv };
        }
        if (kw === "BREAK") { this.next(); this.endLine(); return { t: "Break" }; }
        if (kw === "SKIP") { this.next(); this.endLine(); return { t: "Skip" }; }
        if (kw === "PRINT") { this.next(); var v = this.parseExpr(); this.endLine(); return { t: "Print", value: v }; }
        if (kw === "STORE") { this.next(); var sc = this.parseStoreBody(false); this.endLine(); return { t: "CallStmt", call: sc }; }
        if (kw === "LOAD") { this.next(); var lc = this.parseLoadBody(false); this.endLine(); return { t: "CallStmt", call: lc }; }
        if (kw === "GPIO") { this.next(); var gc = this.parseGpioBody(false); this.endLine(); return { t: "CallStmt", call: gc }; }
        if (kw === "ASSERT") { this.next(); var ac = this.parseExpr(); this.endLine(); return { t: "CallStmt", call: { t: "Call", ns: "Assert", method: "True", args: [ac] } }; }
        if (kw === "PACK" || kw === "CARD" || kw === "FIFO" || kw === "DEVICE" || kw === "STREAM") { this.next(); var dc = this.parseCapsBody(kw, false); this.endLine(); return { t: "CallStmt", call: dc }; }
        if (kw === "UI" || kw === "EVENT") { this.next(); var uc = this.parseUiEvtBody(kw, false); this.endLine(); return { t: "CallStmt", call: uc }; }
        throw new Error("BASIC: unexpected keyword " + kw);
      }
      if (t.kind === "id") {
        var nx = this.peek2();
        if (t.value.toUpperCase() === "POKE" && !(nx.kind === "op" && nx.value === "(")) {
          this.next();                                  // classic no-parens form: POKE addr, value
          var pa = this.parseExpr(); this.eatOp(",");
          var pb = this.parseExpr(); this.endLine();
          return { t: "CallStmt", call: { t: "Call", ns: null, method: "poke", args: [pa, pb] } };
        }
        if (nx.kind === "op" && nx.value === "=") return this.parseLet(false);
        if (nx.kind === "op" && B_ASSIGN[nx.value]) {
          var an = this.next().value; var aop = B_ASSIGN[this.next().value];
          var arhs = this.parseExpr(); this.endLine();
          return { t: "Let", name: an, value: { t: "Bin", op: aop, lhs: { t: "Var", name: an }, rhs: arhs } };
        }
        if (nx.kind === "op" && nx.value === ".") { var call = this.parseCallFromId(); this.endLine(); return { t: "CallStmt", call: call }; }
        if (nx.kind === "op" && nx.value === "(") { var cn = this.next().value; var cargs = this.parseArgs(); this.endLine(); return { t: "CallStmt", call: { t: "Call", ns: null, method: cn, args: cargs } }; }
      }
      throw new Error("BASIC: cannot parse statement at " + t.value);
    },
    parseDim: function () {
      this.eatKw("DIM"); var name = this.next().value; var init = null;
      if (this.peek().kind === "op" && this.peek().value === "=") { this.next(); init = this.parseExpr(); }
      else if (this.peekWord() === "NEW") { this.eatWord(); this.expectWord("CARD"); init = { t: "Call", ns: "Storage", method: "AddCard", args: [] }; }
      this.endLine(); return { t: "Dim", name: name, init: init };
    },
    parseConst: function () {
      this.eatKw("CONST");
      var name = this.next().value;
      this.eatOp("=");
      var value = this.parseExpr();
      this.endLine();
      return { t: "ConstDecl", name: name, value: value };
    },
    parseEnum: function () {
      this.eatKw("ENUM");
      var enumName = this.next().value;
      this.endLine();
      var members = [];
      this.skipNl();
      while (!this.atKw("ENDENUM")) {
        if (this.peek().kind === "eof") throw new Error("BASIC: unexpected EOF expecting ENDENUM");
        var tok = this.next();
        if (tok.kind !== "id" && tok.kind !== "kw") throw new Error("BASIC: expected enum member name got " + tok.value);
        var memberName = tok.value, memberValue = null;
        if (this.peek().kind === "op" && this.peek().value === "=") { this.next(); memberValue = this.parseExpr(); }
        this.endLine();
        members.push([memberName, memberValue]);
        this.skipNl();
      }
      this.eatKw("ENDENUM");
      this.endLine();
      return { t: "EnumDecl", enum_name: enumName, members: members };
    },
    parseLet: function (eat) { if (eat) this.eatKw("LET"); var name = this.next().value; if (this.peekWord() === "NEW") { this.eatWord(); this.expectWord("CARD"); this.endLine(); return { t: "Let", name: name, value: { t: "Call", ns: "Storage", method: "AddCard", args: [] } }; } this.eatOp("="); var v = this.parseExpr(); this.endLine(); return { t: "Let", name: name, value: v }; },
    peekWord: function () { var t = this.peek(); if (t.kind === "id") return t.value.toUpperCase(); if (t.kind === "kw") return t.value; return null; },
    eatWord: function () { var t = this.next(); if (t.kind !== "id" && t.kind !== "kw") throw new Error("BASIC: expected a word got " + t.value); return t.value.toUpperCase(); },
    expectWord: function (e) { var w = this.eatWord(); if (w !== e) throw new Error("BASIC: expected " + e + " got " + w); },
    parseStoreBody: function (wantValue) {
      var verb = this.eatWord();
      if (wantValue && verb !== "NEW") throw new Error("BASIC: STORE " + verb + " is a statement, not a value");
      if (verb === "USE") { this.expectWord("PACK"); return { t: "Call", ns: "Storage", method: "UsePack", args: [this.parseAtom()] }; }
      if (verb === "SET") {
        if (this.peekWord() === "PACK") { this.eatWord(); return { t: "Call", ns: "Storage", method: "UsePack", args: [this.parseAtom()] }; }
        var field = this.parseAtom(); this.eatOp("="); var rhs = this.parseExpr();
        var method = (rhs.t === "Str") ? "SetFieldStr" : "SetField";
        return { t: "Call", ns: "Storage", method: method, args: [field, rhs] };
      }
      if (verb === "DELETE") { this.expectWord("CARD"); return { t: "Call", ns: "Storage", method: "DeleteCard", args: [this.parseAtom()] }; }
      if (verb === "NEW") { this.expectWord("CARD"); return { t: "Call", ns: "Storage", method: "AddCard", args: [] }; }
      throw new Error("BASIC: unknown STORE verb " + verb);
    },
    parseLoadBody: function (wantValue) {
      var w = this.peekWord();
      if (w === "CARD") { this.eatWord(); return { t: "Call", ns: "Storage", method: "EditCard", args: [this.parseAtom()] }; }
      if (w === "QUERY") { this.eatWord(); return { t: "Call", ns: "Storage", method: "QueryCard", args: [this.parseAtom()] }; }
      if (w === "RESULT") { this.eatWord(); return { t: "Call", ns: "Storage", method: "QueryResult", args: [this.parseAtom()] }; }
      var field = this.parseAtom();
      if (this.peekWord() === "AS") { this.eatWord(); this.expectWord("TEXT"); return { t: "Call", ns: "Storage", method: "GetFieldStr", args: [field] }; }
      return { t: "Call", ns: "Storage", method: "GetField", args: [field] };
    },
    parseGpioBody: function (wantValue) {
      var verb = this.eatWord();
      if (verb === "COUNT") return { t: "Call", ns: "Gpio", method: "Count", args: [] };
      if (verb === "READ") return { t: "Call", ns: "Gpio", method: "Read", args: [this.parseAtom()] };
      if (verb === "WRITE") {
        if (wantValue) throw new Error("BASIC: GPIO WRITE is a statement, not a value");
        var pin = this.parseAtom(); this.eatOp("="); var val = this.parseExpr();
        return { t: "Call", ns: "Gpio", method: "Write", args: [pin, val] };
      }
      if (verb === "DIR" || verb === "PULL") {
        var pin2 = this.parseAtom();
        if (!wantValue && this.peek().kind === "op" && this.peek().value === "=") {
          this.eatOp("=");
          var rhs2 = (verb === "DIR") ? this.parseDirValue() : this.parsePullValue();
          return { t: "Call", ns: "Gpio", method: (verb === "DIR" ? "SetDir" : "SetPull"), args: [pin2, rhs2] };
        }
        return { t: "Call", ns: "Gpio", method: (verb === "DIR" ? "GetDir" : "GetPull"), args: [pin2] };
      }
      throw new Error("BASIC: unknown GPIO verb " + verb);
    },
    needStmt: function (wantValue, what) { if (wantValue) throw new Error("BASIC: " + what + " is a statement, not a value"); },
    parseCapsBody: function (head, wantValue) {
      var verb;
      if (head === "PACK") { this.expectWord("USE"); return { t: "Call", ns: "Pack", method: "Use", args: [this.parseAtom()] }; }
      if (head === "CARD") {
        verb = this.eatWord();
        if (verb === "READ") return { t: "Call", ns: "Card", method: "Read", args: [this.parseAtom()] };
        if (verb === "ADDRESS") { var pk = this.parseAtom(), cd = this.parseAtom(); return { t: "Call", ns: "Card", method: "Address", args: [pk, cd] }; }
        if (verb === "WRITE") { this.needStmt(wantValue, "CARD WRITE"); var cw = this.parseAtom(); this.eatOp("="); var cv = this.parseExpr(); return { t: "Call", ns: "Card", method: "Write", args: [cw, cv] }; }
        throw new Error("BASIC: unknown CARD verb " + verb);
      }
      if (head === "FIFO") {
        verb = this.eatWord();
        if (verb === "OPEN") return { t: "Call", ns: "Fifo", method: "Open", args: [this.parseAtom()] };
        if (verb === "RECV") return { t: "Call", ns: "Fifo", method: "Recv", args: [this.parseAtom()] };
        if (verb === "POLL") return { t: "Call", ns: "Fifo", method: "Poll", args: [this.parseAtom()] };
        if (verb === "SEND") { this.needStmt(wantValue, "FIFO SEND"); var fh = this.parseAtom(); this.eatOp("="); var fv = this.parseExpr(); return { t: "Call", ns: "Fifo", method: "Send", args: [fh, fv] }; }
        throw new Error("BASIC: unknown FIFO verb " + verb);
      }
      if (head === "DEVICE") {
        verb = this.eatWord();
        if (verb === "OPEN") { var ident = this.parseAtom(); var cfg = { t: "Num", value: 0 }; if (this.peekWord() === "CONFIG") { this.eatWord(); cfg = this.parseAtom(); } return { t: "Call", ns: "Device", method: "Open", args: [ident, cfg] }; }
        if (verb === "CAPS") return { t: "Call", ns: "Device", method: "Caps", args: [this.parseAtom()] };
        if (verb === "STATUS") return { t: "Call", ns: "Device", method: "Status", args: [this.parseAtom()] };
        if (verb === "CLOSE") { this.needStmt(wantValue, "DEVICE CLOSE"); return { t: "Call", ns: "Device", method: "Close", args: [this.parseAtom()] }; }
        throw new Error("BASIC: unknown DEVICE verb " + verb);
      }
      if (head === "STREAM") {
        verb = this.eatWord();
        if (verb === "OPEN") { var dev = this.parseAtom(), scfg = this.parseAtom(); return { t: "Call", ns: "Stream", method: "Open", args: [dev, scfg] }; }
        if (verb === "NEXT") return { t: "Call", ns: "Stream", method: "Next", args: [this.parseAtom()] };
        if (verb === "SPAN") return { t: "Call", ns: "Stream", method: "Span", args: [this.parseAtom()] };
        if (verb === "SETSLICE") { this.needStmt(wantValue, "STREAM SETSLICE"); var so = this.parseAtom(); if (this.peek().kind === "op" && this.peek().value === ",") this.next(); var sl = this.parseAtom(); return { t: "Call", ns: "Stream", method: "SetSlice", args: [so, sl] }; }
        if (verb === "SLICE") return { t: "Call", ns: "Stream", method: "Slice", args: [this.parseAtom()] };
        if (verb === "SUBMIT") { this.needStmt(wantValue, "STREAM SUBMIT"); var sst = this.parseAtom(); this.eatOp("="); var sle = this.parseExpr(); return { t: "Call", ns: "Stream", method: "Submit", args: [sst, sle] }; }
        if (verb === "RELEASE") { this.needStmt(wantValue, "STREAM RELEASE"); return { t: "Call", ns: "Stream", method: "Release", args: [this.parseAtom()] }; }
        if (verb === "CLOSE") { this.needStmt(wantValue, "STREAM CLOSE"); return { t: "Call", ns: "Stream", method: "Close", args: [this.parseAtom()] }; }
        throw new Error("BASIC: unknown STREAM verb " + verb);
      }
      throw new Error("BASIC: unknown DSL head " + head);
    },
    parseUiEvtBody: function (head, wantValue) {
      var verb;
      if (head === "EVENT") {
        verb = this.eatWord();
        if (verb === "POST") { var ty = this.parseAtom(), tg = this.parseAtom(); return { t: "Call", ns: "Event", method: "Post", args: [ty, tg] }; }
        if (verb === "NEXT") return { t: "Call", ns: "Event", method: "Next", args: [] };
        if (verb === "TYPE") return { t: "Call", ns: "Event", method: "Type", args: [this.parseAtom()] };
        if (verb === "TARGET") return { t: "Call", ns: "Event", method: "Target", args: [this.parseAtom()] };
        if (verb === "DATA") return { t: "Call", ns: "Event", method: "Data", args: [this.parseAtom()] };
        if (verb === "DATALEN") return { t: "Call", ns: "Event", method: "DataLen", args: [this.parseAtom()] };
        if (verb === "DATASLICE") return { t: "Call", ns: "Event", method: "DataSlice", args: [this.parseAtom()] };
        if (verb === "COUNT") return { t: "Call", ns: "Event", method: "Count", args: [] };
        if (verb === "SETSLICE") { this.needStmt(wantValue, "EVENT SETSLICE"); var eo = this.parseAtom(); if (this.peek().kind === "op" && this.peek().value === ",") this.next(); var el = this.parseAtom(); return { t: "Call", ns: "Event", method: "SetSlice", args: [eo, el] }; }
        if (verb === "SETDATA") { this.needStmt(wantValue, "EVENT SETDATA"); var ev = this.parseAtom(); this.eatOp("="); var sp = this.parseExpr(); return { t: "Call", ns: "Event", method: "SetData", args: [ev, sp] }; }
        throw new Error("BASIC: unknown EVENT verb " + verb);
      }
      if (head === "UI") {
        verb = this.eatWord();
        if (verb === "WINDOW") return { t: "Call", ns: "Ui", method: "Window", args: [this.parseAtom()] };
        if (verb === "PANEL") return { t: "Call", ns: "Ui", method: "Panel", args: [this.parseAtom()] };
        if (verb === "LABEL" || verb === "BUTTON" || verb === "TEXTBOX" || verb === "CHECKBOX") {
          var parent = this.parseAtom(), text = this.parseAtom();
          var m = { LABEL: "Label", BUTTON: "Button", TEXTBOX: "TextBox", CHECKBOX: "Checkbox" }[verb];
          return { t: "Call", ns: "Ui", method: m, args: [parent, text] };
        }
        if (verb === "POS" || verb === "SIZE") {
          this.needStmt(wantValue, "UI " + verb);
          var node = this.parseAtom(); this.eatOp("="); var x = this.parseExpr(), val;
          if (this.peek().kind === "op" && this.peek().value === ",") {
            this.next(); var y = this.parseExpr();
            val = { t: "Bin", op: "+", lhs: { t: "Bin", op: "*", lhs: x, rhs: { t: "Num", value: 65536 } }, rhs: y };
          } else { val = x; }
          return { t: "Call", ns: "Ui", method: (verb === "POS" ? "Pos" : "Size"), args: [node, val] };
        }
        if (verb === "SETTEXT" || verb === "SETID" || verb === "SETVALUE") {
          this.needStmt(wantValue, "UI " + verb);
          var n2 = this.parseAtom(); this.eatOp("="); var v2 = this.parseExpr();
          var m2 = { SETTEXT: "SetText", SETID: "SetId", SETVALUE: "SetValue" }[verb];
          return { t: "Call", ns: "Ui", method: m2, args: [n2, v2] };
        }
        if (verb === "SERIALIZE") return { t: "Call", ns: "Ui", method: "Serialize", args: [this.parseAtom()] };
        throw new Error("BASIC: unknown UI verb " + verb);
      }
      throw new Error("BASIC: unknown DSL head " + head);
    },
    parseDirValue: function () {
      var t = this.peek();
      if (t.kind === "kw" && t.value === "IN") { this.next(); return { t: "Num", value: 0 }; }
      if (t.kind === "id" && (t.value.toUpperCase() === "OUT" || t.value.toUpperCase() === "OUTPUT")) { this.next(); return { t: "Num", value: 1 }; }
      if (t.kind === "id" && t.value.toUpperCase() === "INPUT") { this.next(); return { t: "Num", value: 0 }; }
      return this.parseExpr();
    },
    parsePullValue: function () {
      var t = this.peek();
      if (t.kind === "id") { var w = t.value.toUpperCase(); if (w === "NONE") { this.next(); return { t: "Num", value: 0 }; } if (w === "UP") { this.next(); return { t: "Num", value: 1 }; } if (w === "DOWN") { this.next(); return { t: "Num", value: 2 }; } }
      return this.parseExpr();
    },
    parseIf: function () {
      this.eatKw("IF"); var cond = this.parseCondition(); this.eatKw("THEN"); this.endLine();
      var body = this.parseBlock("ELSEIF", "ELSE", "ENDIF"); var arms = [[cond, body]]; var els = null;
      while (this.atKw("ELSEIF")) { this.eatKw("ELSEIF"); var c2 = this.parseCondition(); this.eatKw("THEN"); this.endLine(); arms.push([c2, this.parseBlock("ELSEIF", "ELSE", "ENDIF")]); }
      if (this.atKw("ELSE")) { this.eatKw("ELSE"); this.endLine(); els = this.parseBlock("ENDIF"); }
      this.eatKw("ENDIF"); this.endLine(); return { t: "If", arms: arms, els: els };
    },
    parseWhile: function () { this.eatKw("WHILE"); var cond = this.parseCondition(); this.endLine(); var body = this.parseBlock("ENDWHILE"); this.eatKw("ENDWHILE"); this.endLine(); return { t: "While", cond: cond, body: body }; },
    parseDo: function () {
      this.eatKw("DO");
      var topCond = null, topUntil = false;
      if (this.atKw("WHILE")) { this.eatKw("WHILE"); topCond = this.parseCondition(); }
      else if (this.atKw("UNTIL")) { this.eatKw("UNTIL"); topCond = this.parseCondition(); topUntil = true; }
      this.endLine();
      var body = this.parseBlock("LOOP");
      this.eatKw("LOOP");
      var botCond = null, botUntil = false;
      if (this.atKw("WHILE")) { this.eatKw("WHILE"); botCond = this.parseCondition(); }
      else if (this.atKw("UNTIL")) { this.eatKw("UNTIL"); botCond = this.parseCondition(); botUntil = true; }
      this.endLine();
      if ((topCond === null) === (botCond === null)) throw new Error("DO/LOOP needs a WHILE or UNTIL condition at exactly one of DO or LOOP");
      return { t: "DoLoop", topCond: topCond, topUntil: topUntil, botCond: botCond, botUntil: botUntil, body: body };
    },
    parseFor: function () {
      this.eatKw("FOR"); var v = this.next().value; this.eatOp("="); var start = this.parseExpr(); this.eatKw("TO"); var end = this.parseExpr();
      var step = null; if (this.atKw("STEP")) { this.eatKw("STEP"); step = this.parseExpr(); }
      this.endLine(); var body = this.parseBlock("NEXT"); this.eatKw("NEXT"); this.endLine(); return { t: "ForTo", v: v, start: start, end: end, step: step, body: body };
    },
    parseForeach: function () { this.eatKw("FOREACH"); var v = this.next().value; this.eatKw("IN"); var count = this.parseExpr(); this.endLine(); var body = this.parseBlock("ENDFOREACH"); this.eatKw("ENDFOREACH"); this.endLine(); return { t: "ForEach", v: v, count: count, body: body }; },
    parseSwitch: function () {
      this.eatKw("SWITCH"); var expr = this.parseExpr(); this.endLine(); this.skipNl(); var cases = [], def = null;
      while (!this.atKw("ENDSWITCH")) {
        if (this.atKw("CASE")) { this.eatKw("CASE"); var val = this.parseExpr(); this.endLine(); cases.push([val, this.parseBlock("CASE", "DEFAULT", "ENDSWITCH")]); }
        else if (this.atKw("DEFAULT")) { this.eatKw("DEFAULT"); this.endLine(); def = this.parseBlock("ENDSWITCH"); }
        else throw new Error("BASIC: expected CASE/DEFAULT/ENDSWITCH");
      }
      this.eatKw("ENDSWITCH"); this.endLine(); return { t: "Switch", expr: expr, cases: cases, def: def };
    },
    parseDispatch: function () {
      this.eatKw("DISPATCH"); var expr = this.parseExpr(); this.endLine(); this.skipNl(); var cases = [], def = null;
      while (!this.atKw("ENDDISPATCH")) {
        if (this.atKw("CASE")) { this.eatKw("CASE"); var val = this.parseExpr(); this.endLine(); cases.push([val, this.parseBlock("CASE", "DEFAULT", "ENDDISPATCH")]); }
        else if (this.atKw("DEFAULT")) { this.eatKw("DEFAULT"); this.endLine(); def = this.parseBlock("ENDDISPATCH"); }
        else throw new Error("BASIC: expected CASE/DEFAULT/ENDDISPATCH");
      }
      this.eatKw("ENDDISPATCH"); this.endLine(); return { t: "Dispatch", expr: expr, cases: cases, def: def };
    },
    parseSub: function () {
      this.eatKw("SUB"); var name = this.next().value;
      var params = null;
      if (this.peek().kind === "op" && this.peek().value === "(") {
        this.next(); params = [];
        if (!(this.peek().kind === "op" && this.peek().value === ")")) {
          params.push(this.next().value);
          while (this.peek().kind === "op" && this.peek().value === ",") { this.next(); params.push(this.next().value); }
        }
        this.eatOp(")");
      }
      this.endLine(); var body = this.parseBlock("ENDSUB"); this.eatKw("ENDSUB"); this.endLine();
      return { t: "Sub", name: name, body: body, params: params };
    },
    parseServer: function () { this.eatKw("SERVER"); this.endLine(); var body = this.parseBlock("ENDSERVER"); this.eatKw("ENDSERVER"); this.endLine(); return { t: "ServerMain", body: body }; },
    parseCallFromId: function () { var ns = this.next().value; this.eatOp("."); var m = this.next().value; return { t: "Call", ns: ns, method: m, args: this.parseArgs() }; },
    parseArgs: function () { this.eatOp("("); var a = []; if (!(this.peek().kind === "op" && this.peek().value === ")")) { a.push(this.parseExpr()); while (this.peek().kind === "op" && this.peek().value === ",") { this.next(); a.push(this.parseExpr()); } } this.eatOp(")"); return a; },
    parseCondition: function () { return this.parseExpr(); },
    parseExpr: function (minp) {
      minp = minp || 0; var left = this.parseUnary();
      while (true) {
        var t = this.peek(); var ov = null;
        if (t.kind === "op" && B_PREC[t.value] !== undefined) ov = t.value;
        else if (t.kind === "kw" && B_PREC[t.value] !== undefined) ov = t.value;
        if (ov === null || B_PREC[ov] < minp) break;
        this.next();
        var right = this.parseExpr(B_PREC[ov] + 1);
        if (B_COMPARATORS[ov]) left = { t: "Cmp", cond: B_COMPARATORS[ov], lhs: left, rhs: right };
        else left = { t: "Bin", op: ov, lhs: left, rhs: right };
      }
      return left;
    },
    parseUnary: function () { var t = this.peek(); if (t.kind === "op" && t.value === "-") { this.next(); return { t: "Bin", op: "-", lhs: { t: "Num", value: 0 }, rhs: this.parseUnary() }; } if (t.kind === "kw" && t.value === "NOT") { this.next(); return { t: "Cmp", cond: "EQ", lhs: this.parseUnary(), rhs: { t: "Num", value: 0 } }; } return this.parseAtom(); },
    parseAtom: function () {
      var t = this.next();
      if (t.kind === "num") return { t: "Num", value: numval(t.value) };
      if (t.kind === "str") return { t: "Str", value: t.value };
      if (t.kind === "kw" && t.value === "STORE") return this.parseStoreBody(true);
      if (t.kind === "kw" && t.value === "LOAD") return this.parseLoadBody(true);
      if (t.kind === "kw" && t.value === "GPIO") return this.parseGpioBody(true);
      if (t.kind === "kw" && (t.value === "PACK" || t.value === "CARD" || t.value === "FIFO" || t.value === "DEVICE" || t.value === "STREAM")) return this.parseCapsBody(t.value, true);
      if (t.kind === "kw" && (t.value === "UI" || t.value === "EVENT")) return this.parseUiEvtBody(t.value, true);
      if (t.kind === "kw" && t.value === "IIF") {
        this.eatOp("("); var c = this.parseExpr(); this.eatOp(",");
        var th = this.parseExpr(); this.eatOp(","); var el = this.parseExpr(); this.eatOp(")");
        return { t: "Ternary", cond: c, then: th, els: el };
      }
      if (t.kind === "op" && t.value === "(") { var e = this.parseExpr(); this.eatOp(")"); return e; }
      if (t.kind === "id") { if (this.peek().kind === "op" && this.peek().value === ".") { this.next(); var m = this.next().value; return { t: "Call", ns: t.value, method: m, args: this.parseArgs() }; } if (this.peek().kind === "op" && this.peek().value === "(") { return { t: "Call", ns: null, method: t.value, args: this.parseArgs() }; } return { t: "Var", name: t.value }; }
      throw new Error("BASIC: unexpected token " + t.value);
    }
  };

  // Idiomatic aliases for the BASIC + (shared-lowerer) Python/English frontends ->
  // canonical (ns, method). Mirrors picoscript_basic.BP_ALIASES/BP_RADIX so Python-
  // and JS-compiled bytecode stay identical. Keys lowercase; a user SUB of the same
  // name takes precedence. Radix formatters follow each language's convention.
  var BP_ALIASES = {
    poke: ["Memory", "Set"], peek: ["Memory", "Get"],
    len: ["String", "Length"], "mid$": ["String", "Substring"],
    "ucase$": ["String", "ToUpper"], "lcase$": ["String", "ToLower"],
    instr: ["String", "IndexOf"], val: ["Number", "Parse"],
    "str$": ["Number", "ToString"], abs: ["Number", "Abs"],
    sqr: ["Maths", "Sqrt"], "oct$": ["Number", "ToOctal"], "bin$": ["Number", "ToBinary"],
    span: ["Span", "Make"], sha256: ["Crypto", "Sha256"],
    min: ["Number", "Min"], max: ["Number", "Max"],
    str: ["Number", "ToString"], int: ["Number", "Parse"],
    pow: ["Maths", "Power"], upper: ["String", "ToUpper"],
    lower: ["String", "ToLower"], find: ["String", "IndexOf"],
    substr: ["String", "Substring"]
  };
  var BP_RADIX = {
    hex: ["ToHex", "0x", false], oct: ["ToOctal", "0o", false],
    bin: ["ToBinary", "0b", false], "hex$": ["ToHex", null, true]
  };

  function BLowerer() { this.b = new ILBuilder(); this.vars = {}; this.subs = []; this.scopes = []; this._strlitN = 0; this.userConstants = {}; }
  BLowerer.prototype = {
    varOf: function (name) { var k = name.toUpperCase(); if (!this.vars[k]) this.vars[k] = new VReg(name, true); return this.vars[k]; },
    resolveConstant: function (name) {
      var key = String(name).trim().toUpperCase();
      if (Object.prototype.hasOwnProperty.call(this.userConstants, key)) return this.userConstants[key] | 0;
      return namedConstant(name);
    },
    evalConstExpr: function (e) {
      if (e.t === "Num") return e.value | 0;
      if (e.t === "Var") {
        var cv = this.resolveConstant(e.name);
        if (cv === null) throw new Error("unknown constant " + e.name + " in constant expression");
        return cv | 0;
      }
      if (e.t === "Bin") {
        var a = this.evalConstExpr(e.lhs), b = this.evalConstExpr(e.rhs);
        if (e.op === "+") return (a + b) | 0;
        if (e.op === "-") return (a - b) | 0;
        if (e.op === "*") return (a * b) | 0;
        if (e.op === "/") {
          if (b === 0) throw new Error("division by zero in constant expression");
          return (a / b) | 0;
        }
        if (e.op === "MOD") {
          if (b === 0) throw new Error("modulo by zero in constant expression");
          return (a - ((a / b) | 0) * b) | 0;
        }
      }
      throw new Error("unsupported constant expression " + e.t);
    },
    defineConstant: function (name, expr) {
      this.userConstants[String(name).trim().toUpperCase()] = this.evalConstExpr(expr) | 0;
    },
    defineEnum: function (enumName, members) {
      var ek = String(enumName).trim().toUpperCase();
      var cur = -1;
      for (var i = 0; i < members.length; i++) {
        var mname = members[i][0];
        var mexpr = members[i][1];
        cur = (mexpr == null) ? (cur + 1) : (this.evalConstExpr(mexpr) | 0);
        var mk = String(mname).trim().toUpperCase();
        this.userConstants[mk] = cur;
        this.userConstants[ek + "_" + mk] = cur;
        this.userConstants[ek + "." + mk] = cur;
      }
    },
    lowerProgram: function (prog) {
      var self = this, body = [];
      this._subParams = {};
      prog.forEach(function (s) { if (s.t === "Sub") { self.subs.push(s); self._subParams[s.name.toLowerCase()] = s.params || []; } else body.push(s); });
      body.forEach(function (s) { self.stmt(s); });
      this.b.ret();
      this.subs.forEach(function (sub) {
        self.b.label("sub_" + sub.name.toUpperCase());
        (sub.params || []).forEach(function (p, i) { var pv = self.varOf(p); var av = self.varOf("__arg" + i + "__"); self.b.mov(pv, av); });
        sub.body.forEach(function (s) { self.stmt(s); });
        self.b.ret();
      });
      return this.b.insts;
    },
    stmt: function (s) {
      var self = this;
      if (typeof s.pos === "number" && s.pos >= 0) this.b.curPos = s.pos;   // INV-25
      if (s.t === "Let" || s.t === "Assign") this.assignTo(this.varOf(s.name), s.value);
      else if (s.t === "Dim") { var dv = this.varOf(s.name); if (s.init === null) this.b.const_(dv, 0); else this.assignTo(dv, s.init); }
      else if (s.t === "ConstDecl") this.defineConstant(s.name, s.value);
      else if (s.t === "EnumDecl") this.defineEnum(s.enum_name, s.members || []);
      else if (s.t === "IncDec") { var iv = this.varOf(s.name); if (s.delta === 1) this.b.inc(iv); else this.b.arith("sub", iv, iv, new Imm(1)); }
      else if (s.t === "Label") this.b.label("lbl_" + s.name.toUpperCase());
      else if (s.t === "Goto") this.b.jmp("lbl_" + s.label.toUpperCase());
      else if (s.t === "Gosub") {
        if (s.args) { for (var gi = 0; gi < s.args.length; gi++) { this.assignTo(this.varOf("__arg" + gi + "__"), s.args[gi]); } }
        this.b.call("sub_" + s.name.toUpperCase());
      }
      else if (s.t === "Return") { if (s.value != null) { var rv = this.eval(s.value); this.b.mov(this.varOf("__ret__"), rv); } this.b.ret(); }
      else if (s.t === "Break") this.lowerBreak();
      else if (s.t === "Skip") this.lowerSkip();
      else if (s.t === "If") this.lowerIf(s);
      else if (s.t === "While") this.lowerWhile(s);
      else if (s.t === "DoLoop") this.lowerDo(s);
      else if (s.t === "ForTo") this.lowerFor(s);
      else if (s.t === "ForEach") this.lowerForeach(s);
      else if (s.t === "Switch") this.lowerSwitch(s);
      else if (s.t === "Dispatch") this.lowerDispatch(s);
      else if (s.t === "Print") { if (s.value.t === "Str") { this.b.host("Io", "Write", [emitStrSpan(this, s.value.value)], null); } else { var v = this.eval(s.value); this.b.save(v, B_PRINT_CARD); this.b.pipe(v, B_PRINT_CARD); } }
      else if (s.t === "CallStmt") this.lowerCall(s.call, false);
      else if (s.t === "ServerMain") s.body.forEach(function (st) { self.stmt(st); });
      else throw new Error("BASIC: cannot lower " + s.t);
    },
    assignTo: function (dst, e) {
      if (e.t === "Bin" && B_ARITH[e.op]) {
        var a = this.eval(e.lhs);
        if (e.rhs.t === "Num" && e.rhs.value >= -32768 && e.rhs.value <= 65535) { this.b.arith(B_ARITH[e.op], dst, a, new Imm(e.rhs.value)); return; }
        var bb = this.eval(e.rhs); this.b.arith(B_ARITH[e.op], dst, a, bb); return;
      }
      this.b.mov(dst, this.eval(e));
    },
    branchFalse: function (cond, falseL) {
      if (cond.t === "Cmp") { var a = this.eval(cond.lhs), b = this.eval(cond.rhs); this.b.cmpbr(COND_NEGATE[cond.cond], a, b, falseL); return; }
      var v = this.eval(cond); this.b.cmpbr("Z", v, v, falseL);
    },
    branchTrue: function (cond, trueL) {
      if (cond.t === "Cmp") { var a = this.eval(cond.lhs), b = this.eval(cond.rhs); this.b.cmpbr(cond.cond, a, b, trueL); return; }
      var v = this.eval(cond); this.b.cmpbr("NZ", v, v, trueL);
    },
    lowerBreak: function () {
      if (!this.scopes.length) throw new Error("BREAK outside a loop or SWITCH");
      this.b.jmp(this.scopes[this.scopes.length - 1][1]);
    },
    lowerSkip: function () {
      for (var i = this.scopes.length - 1; i >= 0; i--) {
        if (this.scopes[i][0] !== null) { this.b.jmp(this.scopes[i][0]); return; }
      }
      throw new Error("SKIP outside a loop");
    },
    lowerIf: function (s) {
      var end = this.b.newLabel("endif"), self = this;
      s.arms.forEach(function (arm) { var nxt = self.b.newLabel("arm"); self.branchFalse(arm[0], nxt); arm[1].forEach(function (st) { self.stmt(st); }); self.b.jmp(end); self.b.label(nxt); });
      if (s.els) s.els.forEach(function (st) { self.stmt(st); });
      this.b.label(end);
    },
    lowerWhile: function (s) { var top = this.b.newLabel("while"), end = this.b.newLabel("endwhile"), self = this; this.b.label(top); this.branchFalse(s.cond, end); this.scopes.push([top, end]); s.body.forEach(function (st) { self.stmt(st); }); this.scopes.pop(); this.b.jmp(top); this.b.label(end); },
    lowerDo: function (s) {
      var top = this.b.newLabel("do"), cont = this.b.newLabel("docont"), end = this.b.newLabel("enddo"), self = this;
      this.b.label(top);
      if (s.topCond !== null) {
        if (s.topUntil) this.branchTrue(s.topCond, end); else this.branchFalse(s.topCond, end);
      }
      this.scopes.push([cont, end]);
      s.body.forEach(function (st) { self.stmt(st); });
      this.scopes.pop();
      this.b.label(cont);
      if (s.botCond !== null) {
        if (s.botUntil) this.branchFalse(s.botCond, top); else this.branchTrue(s.botCond, top);
      } else {
        this.b.jmp(top);
      }
      this.b.label(end);
    },
    lowerFor: function (s) {
      var v = this.varOf(s.v); this.assignTo(v, s.start);
      var endv = this.b.vreg("__for_end__"); this.b.mov(endv, this.eval(s.end));
      var top = this.b.newLabel("for"), cont = this.b.newLabel("forcont"), end = this.b.newLabel("endfor"), self = this;
      this.b.label(top); this.b.cmpbr("GT", v, endv, end);
      this.scopes.push([cont, end]);
      s.body.forEach(function (st) { self.stmt(st); });
      this.scopes.pop();
      this.b.label(cont);
      if (s.step != null && s.step.t === "Num") this.b.arith("add", v, v, new Imm(s.step.value));
      else if (s.step != null) this.b.arith("add", v, v, this.eval(s.step));
      else this.b.inc(v);
      this.b.jmp(top); this.b.label(end);
    },
    lowerForeach: function (s) {
      var v = this.varOf(s.v); var cnt = this.b.vreg("__fe_count__"); this.b.mov(cnt, this.eval(s.count)); this.b.const_(v, 0);
      var top = this.b.newLabel("foreach"), cont = this.b.newLabel("fecont"), end = this.b.newLabel("endforeach"), self = this;
      this.b.label(top); this.b.cmpbr("GE", v, cnt, end);
      this.scopes.push([cont, end]);
      s.body.forEach(function (st) { self.stmt(st); });
      this.scopes.pop();
      this.b.label(cont);
      this.b.inc(v); this.b.jmp(top); this.b.label(end);
    },
    lowerSwitch: function (s) {
      var sel = this.eval(s.expr); var end = this.b.newLabel("endswitch"), self = this;
      var caseLabels = s.cases.map(function () { return self.b.newLabel("case"); });
      var defL = this.b.newLabel("default");
      s.cases.forEach(function (cse, idx) { var cv = self.eval(cse[0]); self.b.cmpbr("EQ", sel, cv, caseLabels[idx]); });
      this.b.jmp(defL);
      this.scopes.push([null, end]);
      s.cases.forEach(function (cse, idx) { self.b.label(caseLabels[idx]); cse[1].forEach(function (st) { self.stmt(st); }); self.b.jmp(end); });
      this.b.label(defL); if (s.def) s.def.forEach(function (st) { self.stmt(st); });
      this.scopes.pop();
      this.b.label(end);
    },
    lowerDispatch: function (s) {
      var sel = this.eval(s.expr); var end = this.b.newLabel("enddisp"), defL = this.b.newLabel("dispdef"), self = this;
      var pairs = [];
      s.cases.forEach(function (cb) {
        if (cb[0].t !== "Num" || cb[0].value < 0) throw new Error("DISPATCH case must be a constant non-negative integer");
        pairs.push([cb[0].value, cb[1]]);
      });
      var n = 0; pairs.forEach(function (p) { if (p[0] + 1 > n) n = p[0] + 1; });
      var table = []; for (var i = 0; i < n; i++) table.push(defL);
      var bodies = [];
      pairs.forEach(function (p) { var lbl = self.b.newLabel("dcase"); table[p[0]] = lbl; bodies.push([lbl, p[1]]); });
      var nreg = this.b.vreg(); this.b.const_(nreg, n); this.b.cmpbr("GE", sel, nreg, defL);
      var zreg = this.b.vreg(); this.b.const_(zreg, 0); this.b.cmpbr("LT", sel, zreg, defL);
      this.b.jmptab(sel, table, defL);
      this.scopes.push([null, end]);
      bodies.forEach(function (bd) { self.b.label(bd[0]); bd[1].forEach(function (st) { self.stmt(st); }); self.b.jmp(end); });
      this.b.label(defL); if (s.def) s.def.forEach(function (st) { self.stmt(st); });
      this.scopes.pop();
      this.b.label(end);
    },
    eval: function (e) {
      if (e.t === "Num") { var v = this.b.vreg(); this.b.const_(v, e.value); return v; }
      if (e.t === "Var") {
        var bv = this.resolveConstant(e.name);
        if (bv !== null) { var bc = this.b.vreg(); this.b.const_(bc, bv); return bc; }
        return this.varOf(e.name);
      }
      if (e.t === "Bin") {
        if (e.op === "AND" || e.op === "OR") return this.evalLogical(e);
        if (e.op === "MOD") return this.evalMod(e.lhs, e.rhs);
        var a = this.eval(e.lhs), dst = this.b.vreg();
        if (e.rhs.t === "Num" && e.rhs.value >= -32768 && e.rhs.value <= 65535) this.b.arith(B_ARITH[e.op], dst, a, new Imm(e.rhs.value));
        else { var b = this.eval(e.rhs); this.b.arith(B_ARITH[e.op], dst, a, b); }
        return dst;
      }
      if (e.t === "Cmp") return this.evalBool(e);
      if (e.t === "Ternary") return this.evalTernary(e);
      if (e.t === "Call") { var r = this.lowerCall(e, true); if (r == null) throw new Error(e.ns + "." + e.method + " has no value"); return r; }
      if (e.t === "Str") return emitStrSpan(this, e.value);
      throw new Error("BASIC: cannot evaluate " + e.t);
    },
    evalBool: function (e) {
      var a = this.eval(e.lhs), b = this.eval(e.rhs), dst = this.b.vreg();
      var tl = this.b.newLabel("bt"), el = this.b.newLabel("be");
      this.b.cmpbr(e.cond, a, b, tl); this.b.const_(dst, 0); this.b.jmp(el);
      this.b.label(tl); this.b.const_(dst, 1); this.b.label(el); return dst;
    },
    evalMod: function (lhs, rhs) {
      var a = this.eval(lhs), b = this.eval(rhs);
      var q = this.b.vreg(); this.b.arith("div", q, a, b);
      var m = this.b.vreg(); this.b.arith("mul", m, q, b);
      var dst = this.b.vreg(); this.b.arith("sub", dst, a, m);
      return dst;
    },
    evalLogical: function (e) {
      var dst = this.b.vreg(); var a = this.eval(e.lhs); var endL = this.b.newLabel("lend");
      if (e.op === "AND") {
        var falseL = this.b.newLabel("land0");
        this.b.cmpbr("Z", a, a, falseL);
        var b = this.eval(e.rhs); this.b.cmpbr("Z", b, b, falseL);
        this.b.const_(dst, 1); this.b.jmp(endL);
        this.b.label(falseL); this.b.const_(dst, 0);
      } else {
        var trueL = this.b.newLabel("lor1");
        this.b.cmpbr("NZ", a, a, trueL);
        var b2 = this.eval(e.rhs); this.b.cmpbr("NZ", b2, b2, trueL);
        this.b.const_(dst, 0); this.b.jmp(endL);
        this.b.label(trueL); this.b.const_(dst, 1);
      }
      this.b.label(endL); return dst;
    },
    evalTernary: function (e) {
      var dst = this.b.vreg(); var elseL = this.b.newLabel("telse"), endL = this.b.newLabel("tend");
      this.branchFalse(e.cond, elseL);
      var tv = this.eval(e.then); this.b.mov(dst, tv); this.b.jmp(endL);
      this.b.label(elseL); var ev = this.eval(e.els); this.b.mov(dst, ev);
      this.b.label(endL); return dst;
    },
    lowerCall: function (c, want) {
      var ns = c.ns, m = c.method;
      if (ns == null) {
        var key = m.toLowerCase();
        var isSub = this.subs.some(function (s) { return s.name.toLowerCase() === key; });
        if (isSub) {
          for (var si = 0; si < c.args.length; si++) { this.assignTo(this.varOf("__arg" + si + "__"), c.args[si]); }
          this.b.call("sub_" + m.toUpperCase());
          if (want) return this.varOf("__ret__");
          return null;
        }
        if (BP_RADIX[key] && !isSub) {
          var r = BP_RADIX[key], cm = r[0], prefix = r[1], upper = r[2];
          var val = this.eval(c.args[0]);
          var d = this.b.vreg(); this.b.host("Number", cm, [val], d);
          if (upper) { var outU = this.b.vreg(); this.b.host("String", "ToUpper", [d], outU); return outU; }
          if (prefix) { var pre = emitStrSpan(this, prefix); var outP = this.b.vreg(); this.b.host("String", "Concat", [pre, d], outP); return outP; }
          return d;
        }
        if (BP_ALIASES[key] && !isSub) {
          var al = BP_ALIASES[key];
          return this.lowerCall({ t: "Call", ns: al[0], method: al[1], args: c.args }, want);
        }
      }
      if (ns != null && ns.toUpperCase() === "NET") {
        var M = m.toUpperCase();
        if (M === "STATUS") this.b.net("status", this.evalConstExpr(c.args[0]));
        else if (M === "TYPE") this.b.net("type", strlit(c.args[0]));
        else if (M === "BODY") this.b.net("body");
        else if (M === "CLOSE") this.b.net("close");
        else if (M === "HEADER") this.b.net("header");
        else throw new Error("unknown Net." + m);
        return null;
      }
      if (ns != null && ns.toUpperCase() === "STORAGE" && ["LOAD", "SAVE", "PIPE"].indexOf(m.toUpperCase()) >= 0) {
        var addr = encodeCardAddr(intlit(c.args[0]), intlit(c.args[1]), intlit(c.args[2]));
        var reg = this.eval(c.args[3]); var MM = m.toUpperCase();
        if (MM === "LOAD") this.b.load(reg, addr); else if (MM === "SAVE") this.b.save(reg, addr); else this.b.pipe(reg, addr);
        return reg;
      }
      if (ns != null && ns.toUpperCase() === "STORAGE" && m.toUpperCase() === "GETCARD") {
        var gp = this.eval(c.args[0]), gc = this.eval(c.args[1]);
        this.b.host("Storage", "UsePack", [gp], null);
        var gd = want ? this.b.vreg() : null;
        this.b.host("Storage", "EditCard", [gc], gd);
        return gd;
      }
      if (ns != null && ns.toUpperCase() === "STORAGE" && m.toUpperCase() === "SAVECARD") {
        var sc = this.eval(c.args[0]);
        this.b.host("Storage", "EditCard", [sc], null);
        var sd = want ? this.b.vreg() : null;
        if (sd) this.b.const_(sd, 1);
        return sd;
      }
      if (ns != null && ns.toUpperCase() === "STORAGE" && m.toUpperCase() === "QUERYCARDS") {
        var qp = this.eval(c.args[0]), qq = this.eval(c.args[1]);
        this.b.host("Storage", "UsePack", [qp], null);
        var qd = want ? this.b.vreg() : null;
        this.b.host("Storage", "QueryCard", [qq], qd);
        return qd;
      }
      var self = this; var argregs = c.args.slice(0, 2).map(function (a) { return self.eval(a); });
      var dst = want ? this.b.vreg() : null;
      var cn = canonHost(ns, m); this.b.host(cn[0], cn[1], argregs, dst); return dst;
    }
  };
  function compileBasic(src) { return new BLowerer().lowerProgram(new BParser(btokenize(src)).parseProgram()); }


  // ========================================================================
  // EXTRA FRONTENDS (Python-style + natural-English) -- defined before the
  // factory's return so their var/prototype initializers actually execute.
  // ========================================================================

  // ---- Python-style frontend (port of picoscript_python.py) ---------------
  var PY_KW = {}; ["if","elif","else","while","for","in","range","def","return","break","continue","pass","and","or","not","print","true","false","match","case","do","until","goto","label","dispatch","const","enum"].forEach(function (k) { PY_KW[k] = 1; });
  var PY_CMP = { "==":"EQ","!=":"NE","<":"LT",">":"GT","<=":"LE",">=":"GE" };
  var PY_AUG = { "+=":"+","-=":"-","*=":"*","/=":"/","%=":"MOD" };
  var PY_PREC = { or:1, and:2, "==":3, "!=":3, "<":3, ">":3, "<=":3, ">=":3, "+":5, "-":5, "*":6, "/":6, "%":6 };
  var PY_BINOP = { "+":"+","-":"-","*":"*","/":"/","%":"MOD", and:"AND", or:"OR" };
  var PY_TWO = { "==":1,"!=":1,"<=":1,">=":1,"+=":1,"-=":1,"*=":1,"/=":1,"%=":1 };
  var PY_ONE = "+-*/%()<>=,.:";

  function indentTokLine(text, out, kwset, two, one, who, lineStart) {
    var i = 0, n = text.length;
    while (i < n) {
      var c = text[i], start = lineStart + i;
      if (c === " " || c === "\t") { i++; continue; }
      if (c === "#") break;
      if (isDigit(c)) { var j = i; if (c === "0" && (text[j + 1] === "x" || text[j + 1] === "X")) { j += 2; while (j < n && /[0-9a-fA-F]/.test(text[j])) j++; } else { while (j < n && isDigit(text[j])) j++; } out.push({ kind: "num", value: text.slice(i, j), pos: start }); i = j; continue; }
      if (isAlpha(c)) { var j2 = i; while (j2 < n && isAlnum(text[j2])) j2++; var w = text.slice(i, j2); if (kwset === null) out.push({ kind: "word", value: w, pos: start }); else out.push({ kind: kwset[w.toLowerCase()] ? "kw" : "id", value: w, pos: start }); i = j2; continue; }
      if (c === '"' || c === "'") { var q = c, j3 = i + 1, b = ""; while (j3 < n && text[j3] !== q) { if (text[j3] === "\\" && j3 + 1 < n) { var nx = text[j3 + 1]; b += ({ n: "\n", t: "\t", "\\": "\\", '"': '"', "'": "'" }[nx] || nx); j3 += 2; } else { b += text[j3]; j3++; } } if (j3 >= n) throw new Error(who + ": unterminated string"); out.push({ kind: "str", value: b, pos: start }); i = j3 + 1; continue; }
      var tw = text.slice(i, i + 2);
      if (two[tw]) { out.push({ kind: "op", value: tw, pos: start }); i += 2; continue; }
      if (one.indexOf(c) >= 0) { out.push({ kind: "op", value: c, pos: start }); i++; continue; }
      throw new Error(who + ": unexpected char " + JSON.stringify(c));
    }
  }

  function indentTokenize(src, kwset, two, one, who) {
    var out = [], indents = [0], lines = src.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    var offset = 0;
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li], lineStart = offset; offset += line.length + 1;
      var stripped = line.replace(/^[ \t]+/, "");
      if (stripped === "" || stripped[0] === "#") continue;
      var indent = line.length - stripped.length;
      if (indent > indents[indents.length - 1]) { indents.push(indent); out.push({ kind: "indent", value: "", pos: lineStart }); }
      else { while (indent < indents[indents.length - 1]) { indents.pop(); out.push({ kind: "dedent", value: "", pos: lineStart }); } if (indent !== indents[indents.length - 1]) throw new Error(who + ": inconsistent indentation"); }
      var before = out.length;
      indentTokLine(line, out, kwset, two, one, who, lineStart);
      if (out.length > before) out.push({ kind: "newline", value: "", pos: lineStart });
    }
    while (indents.length > 1) { indents.pop(); out.push({ kind: "dedent", value: "", pos: offset }); }
    out.push({ kind: "eof", value: "", pos: offset });
    return out;
  }

  function pytokenize(src) { return indentTokenize(src, PY_KW, PY_TWO, PY_ONE, "Python"); }

  function PyParser(toks) { this.toks = toks; this.i = 0; }
  PyParser.prototype = {
    peek: function (k) { var j = this.i + (k || 0); return j < this.toks.length ? this.toks[j] : this.toks[this.toks.length - 1]; },
    next: function () { return this.toks[this.i++]; },
    at: function (kind, value) { var t = this.peek(); return t.kind === kind && (value === undefined || t.value === value); },
    atKw: function () { var t = this.peek(); if (t.kind !== "kw") return false; for (var k = 0; k < arguments.length; k++) if (t.value.toLowerCase() === arguments[k]) return true; return false; },
    expect: function (kind, value) { var t = this.next(); if (t.kind !== kind || (value !== undefined && t.value !== value)) throw new Error("Python: expected " + (value !== undefined ? value : kind) + " got " + t.value); return t; },
    expectKw: function (name) { var t = this.next(); if (!(t.kind === "kw" && t.value.toLowerCase() === name)) throw new Error("Python: expected " + name + " got " + t.value); },
    parseProgram: function () { var s = []; while (this.peek().kind !== "eof") { var st = this.parseStmt(); if (st !== null) s.push(st); } return s; },
    parseSuite: function () {
      this.expect("op", ":"); this.expect("newline"); this.expect("indent");
      var s = [];
      while (!this.at("dedent")) { if (this.peek().kind === "eof") throw new Error("Python: EOF in block"); var st = this.parseStmt(); if (st !== null) s.push(st); }
      this.expect("dedent"); return s;
    },
    parseStmt: function () {
      var start = this.peek().pos;
      var node = this._parseStmt();
      if (node != null) node.pos = start;
      return node;
    },
    _parseStmt: function () {
      var t = this.peek();
      if (t.kind === "kw") {
        var kw = t.value.toLowerCase();
        if (kw === "if") return this.parseIf();
        if (kw === "while") { this.expectKw("while"); var c = this.parseExpr(); return { t: "While", cond: c, body: this.parseSuite() }; }
        if (kw === "for") return this.parseFor();
        if (kw === "match") return this.parseMatch();
      if (kw === "dispatch") return this.parseDispatch();
        if (kw === "do") return this.parseDo();
        if (kw === "const") return this.parseConstDecl();
        if (kw === "enum") return this.parseEnumDecl();
        if (kw === "goto") { this.next(); var gl = this.expect("id").value; this.expect("newline"); return { t: "Goto", label: gl }; }
        if (kw === "label") { this.next(); var ll = this.expect("id").value; this.expect("newline"); return { t: "Label", name: ll }; }
        if (kw === "def") return this.parseDef();
        if (kw === "return") {
          this.next();
          if (this.at("newline")) { this.next(); return { t: "Return" }; }
          var rv = this.parseExpr(); this.expect("newline"); return { t: "Return", value: rv };
        }
        if (kw === "break") { this.next(); this.expect("newline"); return { t: "Break" }; }
        if (kw === "continue") { this.next(); this.expect("newline"); return { t: "Skip" }; }
        if (kw === "pass") { this.next(); this.expect("newline"); return null; }
        if (kw === "print") { this.next(); this.expect("op", "("); var v = this.parseExpr(); this.expect("op", ")"); this.expect("newline"); return { t: "Print", value: v }; }
        throw new Error("Python: unexpected keyword " + t.value);
      }
      if (t.kind === "id") {
        var nx = this.peek(1);
        if (nx.kind === "op" && nx.value === "=") { var nm = this.next().value; this.next(); var vv = this.parseExpr(); this.expect("newline"); return { t: "Let", name: nm, value: vv }; }
        if (nx.kind === "op" && PY_AUG[nx.value]) { var an = this.next().value; var op = PY_AUG[this.next().value]; var rhs = this.parseExpr(); this.expect("newline"); return { t: "Let", name: an, value: { t: "Bin", op: op, lhs: { t: "Var", name: an }, rhs: rhs } }; }
        if (nx.kind === "op" && nx.value === ".") { var call = this.parseCallFromId(); this.expect("newline"); return { t: "CallStmt", call: call }; }
        if (nx.kind === "op" && nx.value === "(") { var gn = this.next().value; var gargs = this.parseArgs(); this.expect("newline"); return { t: "Gosub", name: gn, args: gargs.length ? gargs : null }; }
      }
      throw new Error("Python: cannot parse statement at " + t.value);
    },
    parseIf: function () {
      this.expectKw("if"); var cond = this.parseExpr(); var body = this.parseSuite(); var arms = [[cond, body]], els = null;
      while (this.atKw("elif")) { this.expectKw("elif"); arms.push([this.parseExpr(), this.parseSuite()]); }
      if (this.atKw("else")) { this.expectKw("else"); els = this.parseSuite(); }
      return { t: "If", arms: arms, els: els };
    },
    parseFor: function () {
      this.expectKw("for"); var v = this.expect("id").value; this.expectKw("in"); this.expectKw("range"); this.expect("op", "(");
      var args = [this.parseExpr()];
      while (this.at("op", ",")) { this.next(); args.push(this.parseExpr()); }
      this.expect("op", ")"); var body = this.parseSuite();
      if (args.length === 1) return { t: "ForEach", v: v, count: args[0], body: body };
      var end = (args[1].t === "Num") ? { t: "Num", value: args[1].value - 1 } : { t: "Bin", op: "-", lhs: args[1], rhs: { t: "Num", value: 1 } };
      return { t: "ForTo", v: v, start: args[0], end: end, step: args.length >= 3 ? args[2] : null, body: body };
    },
    parseMatch: function () {
      this.expectKw("match"); var expr = this.parseExpr();
      this.expect("op", ":"); this.expect("newline"); this.expect("indent");
      var cases = [], def = null;
      while (!this.at("dedent")) {
        this.expectKw("case");
        if (this.peek().kind === "id" && this.peek().value === "_") { this.next(); def = this.parseSuite(); }
        else { var val = this.parseExpr(); cases.push([val, this.parseSuite()]); }
      }
      this.expect("dedent");
      return { t: "Switch", expr: expr, cases: cases, def: def };
    },
    parseDispatch: function () {
      this.expectKw("dispatch"); var expr = this.parseExpr();
      this.expect("op", ":"); this.expect("newline"); this.expect("indent");
      var cases = [], def = null;
      while (!this.at("dedent")) {
        this.expectKw("case");
        if (this.peek().kind === "id" && this.peek().value === "_") { this.next(); def = this.parseSuite(); }
        else { var val = this.parseExpr(); cases.push([val, this.parseSuite()]); }
      }
      this.expect("dedent");
      return { t: "Dispatch", expr: expr, cases: cases, def: def };
    },
    parseDo: function () {
      this.expectKw("do"); var body = this.parseSuite();
      var cond, until;
      if (this.atKw("while")) { this.expectKw("while"); cond = this.parseExpr(); until = false; }
      else if (this.atKw("until")) { this.expectKw("until"); cond = this.parseExpr(); until = true; }
      else throw new Error("Python: 'do:' block must be followed by 'while' or 'until'");
      this.expect("newline");
      return { t: "DoLoop", topCond: null, topUntil: false, botCond: cond, botUntil: until, body: body };
    },
    parseDef: function () {
      this.expectKw("def"); var name = this.expect("id").value; this.expect("op", "(");
      var params = [];
      if (!this.at("op", ")")) { params.push(this.expect("id").value); while (this.at("op", ",")) { this.next(); params.push(this.expect("id").value); } }
      this.expect("op", ")");
      return { t: "Sub", name: name, body: this.parseSuite(), params: params.length ? params : null };
    },
    parseConstDecl: function () {
      this.expectKw("const");
      var name = this.expect("id").value;
      this.expect("op", "=");
      var value = this.parseExpr();
      this.expect("newline");
      return { t: "ConstDecl", name: name, value: value };
    },
    parseEnumDecl: function () {
      this.expectKw("enum");
      var enumName = this.expect("id").value;
      this.expect("op", ":");
      this.expect("newline");
      this.expect("indent");
      var members = [];
      while (!this.at("dedent")) {
        var memberName = this.expect("id").value;
        var memberValue = null;
        if (this.at("op", "=")) { this.next(); memberValue = this.parseExpr(); }
        this.expect("newline");
        members.push([memberName, memberValue]);
      }
      this.expect("dedent");
      return { t: "EnumDecl", enum_name: enumName, members: members };
    },
    parseCallFromId: function () { var ns = this.next().value; this.expect("op", "."); var m = this.next().value; return { t: "Call", ns: ns, method: m, args: this.parseArgs() }; },
    parseArgs: function () { this.expect("op", "("); var a = []; if (!this.at("op", ")")) { a.push(this.parseExpr()); while (this.at("op", ",")) { this.next(); a.push(this.parseExpr()); } } this.expect("op", ")"); return a; },
    parseExpr: function (minp) {
      minp = minp || 0; var left = this.parseUnary();
      if (minp === 0 && this.atKw("if")) { this.expectKw("if"); var cond = this.parseExpr(); this.expectKw("else"); var els = this.parseExpr(); return { t: "Ternary", cond: cond, then: left, els: els }; }
      while (true) {
        var t = this.peek(), ov = null;
        if (t.kind === "op" && PY_PREC[t.value] !== undefined) ov = t.value;
        else if (t.kind === "kw" && PY_PREC[t.value.toLowerCase()] !== undefined) ov = t.value.toLowerCase();
        if (ov === null || PY_PREC[ov] < minp) break;
        this.next(); var right = this.parseExpr(PY_PREC[ov] + 1);
        if (PY_CMP[ov]) left = { t: "Cmp", cond: PY_CMP[ov], lhs: left, rhs: right };
        else left = { t: "Bin", op: PY_BINOP[ov], lhs: left, rhs: right };
      }
      return left;
    },
    parseUnary: function () {
      var t = this.peek();
      if (t.kind === "op" && t.value === "-") { this.next(); return { t: "Bin", op: "-", lhs: { t: "Num", value: 0 }, rhs: this.parseUnary() }; }
      if (t.kind === "kw" && t.value.toLowerCase() === "not") { this.next(); return { t: "Cmp", cond: "EQ", lhs: this.parseUnary(), rhs: { t: "Num", value: 0 } }; }
      return this.parseAtom();
    },
    parseAtom: function () {
      var t = this.next();
      if (t.kind === "num") return { t: "Num", value: numval(t.value) };
      if (t.kind === "str") return { t: "Str", value: t.value };
      if (t.kind === "kw" && (t.value.toLowerCase() === "true" || t.value.toLowerCase() === "false")) return { t: "Num", value: t.value.toLowerCase() === "true" ? 1 : 0 };
      if (t.kind === "op" && t.value === "(") { var e = this.parseExpr(); this.expect("op", ")"); return e; }
      if (t.kind === "id") { if (this.at("op", ".")) { this.next(); var m = this.next().value; return { t: "Call", ns: t.value, method: m, args: this.parseArgs() }; } if (this.at("op", "(")) { return { t: "Call", ns: null, method: t.value, args: this.parseArgs() }; } return { t: "Var", name: t.value }; }
      throw new Error("Python: unexpected token " + t.value);
    }
  };
  function compilePython(src) { return new BLowerer().lowerProgram(new PyParser(pytokenize(src)).parseProgram()); }

  // ---- English-style frontend (port of picoscript_english.py) -------------
  var EN_TWO = { "==":1,"!=":1,"<=":1,">=":1,"<>":1 };
  var EN_ONE = "+-*/%()<>=,.:";
  var EN_PREC_SYM = { "+":5,"-":5,"*":6,"/":6,"%":6,"<":3,">":3,"<=":3,">=":3,"==":3,"!=":3,"<>":3 };
  var EN_CMP_SYM = { "<":"LT",">":"GT","<=":"LE",">=":"GE","==":"EQ","!=":"NE","<>":"NE" };

  function entokenize(src) { return indentTokenize(src, null, EN_TWO, EN_ONE, "English"); }

  function EnParser(toks) { this.toks = toks; this.i = 0; }
  EnParser.prototype = {
    peek: function (k) { var j = this.i + (k || 0); return j < this.toks.length ? this.toks[j] : this.toks[this.toks.length - 1]; },
    next: function () { return this.toks[this.i++]; },
    at: function (kind, value) { var t = this.peek(); return t.kind === kind && (value === undefined || t.value === value); },
    atWord: function () { var t = this.peek(); if (t.kind !== "word") return false; for (var k = 0; k < arguments.length; k++) if (t.value.toLowerCase() === arguments[k]) return true; return false; },
    wordAt: function (k) { var t = this.peek(k); return t.kind === "word" ? t.value.toLowerCase() : null; },
    expect: function (kind, value) { var t = this.next(); if (t.kind !== kind || (value !== undefined && t.value !== value)) throw new Error("English: expected " + (value !== undefined ? value : kind) + " got " + t.value); return t; },
    eatWord: function () { var t = this.next(); if (t.kind !== "word") throw new Error("English: expected word got " + t.value); var lw = t.value.toLowerCase(); for (var k = 0; k < arguments.length; k++) if (lw === arguments[k]) return t.value; throw new Error("English: expected one of " + Array.prototype.slice.call(arguments) + " got " + t.value); },
    endStmt: function () { if (this.at("op", ".")) this.next(); this.expect("newline"); },
    parseProgram: function () { var s = []; while (this.peek().kind !== "eof") { var st = this.parseStmt(); if (st !== null) s.push(st); } return s; },
    parseSuite: function () {
      this.expect("op", ":"); this.expect("newline"); this.expect("indent");
      var s = [];
      while (!this.at("dedent")) { if (this.peek().kind === "eof") throw new Error("English: EOF in block"); var st = this.parseStmt(); if (st !== null) s.push(st); }
      this.expect("dedent"); return s;
    },
    parseStmt: function () {
      var start = this.peek().pos;
      var node = this._parseStmt();
      if (node != null) node.pos = start;
      return node;
    },
    _parseStmt: function () {
      var t = this.peek();
      if (t.kind === "word") {
        var w = t.value.toLowerCase();
        if (w === "set" || w === "let") { this.next(); var nm = this.expect("word").value; this.eatWord(w === "set" ? "to" : "be"); var v = this.parseExpr(); this.endStmt(); return { t: "Let", name: nm, value: v }; }
        if (w === "add") { this.next(); var e = this.parseExpr(); this.eatWord("to"); var an = this.expect("word").value; this.endStmt(); return { t: "Let", name: an, value: { t: "Bin", op: "+", lhs: { t: "Var", name: an }, rhs: e } }; }
        if (w === "subtract") { this.next(); var e2 = this.parseExpr(); this.eatWord("from"); var sn = this.expect("word").value; this.endStmt(); return { t: "Let", name: sn, value: { t: "Bin", op: "-", lhs: { t: "Var", name: sn }, rhs: e2 } }; }
        if (w === "increase" || w === "decrease" || w === "multiply" || w === "divide") { this.next(); var vn = this.expect("word").value; this.eatWord("by"); var ve = this.parseExpr(); this.endStmt(); var op = { increase: "+", decrease: "-", multiply: "*", divide: "/" }[w]; return { t: "Let", name: vn, value: { t: "Bin", op: op, lhs: { t: "Var", name: vn }, rhs: ve } }; }
        if (w === "print" || w === "show" || w === "display") { this.next(); var pe = this.parseExpr(); this.endStmt(); return { t: "Print", value: pe }; }
        if (w === "if") return this.parseIf();
        if (w === "while") { this.next(); var wc = this.parseExpr(); return { t: "While", cond: wc, body: this.parseSuite() }; }
        if (w === "as") { this.next(); this.eatWord("long"); this.eatWord("as"); var ac = this.parseExpr(); return { t: "While", cond: ac, body: this.parseSuite() }; }
        if (w === "choose") return this.parseChoose();
      if (w === "dispatch") return this.parseDispatch();
        if (w === "label") { this.next(); var lname = this.expect("word").value; this.endStmt(); return { t: "Label", name: lname }; }
        if (w === "go") { this.next(); this.eatWord("to"); var gname = this.expect("word").value; this.endStmt(); return { t: "Goto", label: gname }; }
        if (w === "repeat") return this.parseRepeat();
        if (w === "for") return this.parseFor();
        if (w === "define" || w === "to") {
          this.next();
          if (this.atWord("a", "an", "the")) this.next();
          if (this.atWord("constant", "const")) {
            this.next();
            var cname = this.expect("word").value;
            if (this.atWord("as", "to", "is", "equals", "be")) this.next();
            var cval = this.parseExpr();
            this.endStmt();
            return { t: "ConstDecl", name: cname, value: cval };
          }
          if (this.atWord("enum", "enumeration")) {
            this.next();
            var ename = this.expect("word").value;
            this.expect("op", ":"); this.expect("newline"); this.expect("indent");
            var emembers = [];
            while (!this.at("dedent")) {
              if (this.atWord("member")) this.next();
              var mn = this.expect("word").value;
              var mv = null;
              if (this.atWord("is", "equals", "as", "to", "be")) { this.next(); mv = this.parseExpr(); }
              this.endStmt();
              emembers.push([mn, mv]);
            }
            this.expect("dedent");
            return { t: "EnumDecl", enum_name: ename, members: emembers };
          }
          if (this.atWord("routine", "subroutine", "procedure", "function")) { this.next(); if (this.atWord("called", "named")) this.next(); }
          var dn = this.expect("word").value;
          var dparams = null;
          if (this.at("op", "(")) {
            this.next(); dparams = [];
            if (!this.at("op", ")")) { dparams.push(this.expect("word").value); while (this.at("op", ",")) { this.next(); dparams.push(this.expect("word").value); } }
            this.expect("op", ")");
          }
          return { t: "Sub", name: dn, body: this.parseSuite(), params: dparams };
        }
        if (w === "do" || w === "call") {
          this.next(); var cn = this.expect("word").value;
          var cargs = null;
          if (this.at("op", "(")) { this.next(); cargs = []; if (!this.at("op", ")")) { cargs.push(this.parseExpr()); while (this.at("op", ",")) { this.next(); cargs.push(this.parseExpr()); } } this.expect("op", ")"); }
          this.endStmt(); return { t: "Gosub", name: cn, args: cargs };
        }
        if (w === "return") {
          this.next();
          if (this.at("newline") || this.at("eof") || this.at("op", ".")) { this.endStmt(); return { t: "Return" }; }
          var rv = this.parseExpr(); this.endStmt(); return { t: "Return", value: rv };
        }
        if (w === "stop" || w === "break") { this.next(); if (this.atWord("out")) this.next(); this.endStmt(); return { t: "Break" }; }
        if (w === "skip" || w === "continue") { this.next(); this.endStmt(); return { t: "Skip" }; }
        if (this.peek(1).kind === "op" && this.peek(1).value === "." && this.peek(2).kind === "word" && this.peek(3).kind === "op" && this.peek(3).value === "(") { var call = this.parseCallFromWord(); this.endStmt(); return { t: "CallStmt", call: call }; }
      }
      throw new Error("English: cannot parse statement at " + t.value);
    },
    parseIf: function () {
      this.eatWord("if"); var cond = this.parseExpr(); var body = this.parseSuite(); var arms = [[cond, body]], els = null;
      while (this.atWord("otherwise") && this.peek(1).kind === "word" && this.peek(1).value.toLowerCase() === "if") { this.eatWord("otherwise"); this.eatWord("if"); arms.push([this.parseExpr(), this.parseSuite()]); }
      if (this.atWord("otherwise")) { this.eatWord("otherwise"); els = this.parseSuite(); }
      return { t: "If", arms: arms, els: els };
    },
    parseChoose: function () {
      this.eatWord("choose"); var expr = this.parseExpr();
      this.expect("op", ":"); this.expect("newline"); this.expect("indent");
      var cases = [], def = null;
      while (!this.at("dedent")) {
        if (this.atWord("when")) { this.eatWord("when"); var val = this.parseExpr(); cases.push([val, this.parseSuite()]); }
        else if (this.atWord("otherwise")) { this.eatWord("otherwise"); def = this.parseSuite(); }
        else throw new Error("English: expected 'When' or 'Otherwise' in Choose");
      }
      this.expect("dedent");
      return { t: "Switch", expr: expr, cases: cases, def: def };
    },
    parseDispatch: function () {
      this.eatWord("dispatch"); if (this.atWord("on")) this.eatWord("on"); var expr = this.parseExpr();
      this.expect("op", ":"); this.expect("newline"); this.expect("indent");
      var cases = [], def = null;
      while (!this.at("dedent")) {
        if (this.atWord("when")) { this.eatWord("when"); var val = this.parseExpr(); cases.push([val, this.parseSuite()]); }
        else if (this.atWord("otherwise")) { this.eatWord("otherwise"); def = this.parseSuite(); }
        else throw new Error("English: expected 'When' or 'Otherwise' in Dispatch");
      }
      this.expect("dedent");
      return { t: "Dispatch", expr: expr, cases: cases, def: def };
    },
    parseRepeat: function () {
      this.eatWord("repeat");
      if (this.at("op", ":")) {
        var body = this.parseSuite(); var cond, until;
        if (this.atWord("until")) { this.eatWord("until"); cond = this.parseExpr(); until = true; }
        else if (this.atWord("while")) { this.eatWord("while"); cond = this.parseExpr(); until = false; }
        else throw new Error("English: 'Repeat:' block must be followed by 'Until' or 'While'");
        this.endStmt();
        return { t: "DoLoop", topCond: null, topUntil: false, botCond: cond, botUntil: until, body: body };
      }
      if (this.atWord("while")) { this.eatWord("while"); var c = this.parseExpr(); return { t: "While", cond: c, body: this.parseSuite() }; }
      var count = this.parseUnary(); this.eatWord("times"); var v = "_i";
      if (this.atWord("with")) { this.eatWord("with"); v = this.expect("word").value; }
      return { t: "ForEach", v: v, count: count, body: this.parseSuite() };
    },
    parseFor: function () {
      this.eatWord("for"); this.eatWord("each"); var v = this.expect("word").value; this.eatWord("from"); var start = this.parseExpr(); this.eatWord("to"); var end = this.parseExpr();
      var step = null; if (this.atWord("by", "step")) { this.next(); step = this.parseExpr(); }
      return { t: "ForTo", v: v, start: start, end: end, step: step, body: this.parseSuite() };
    },
    parseCallFromWord: function () { var ns = this.next().value; this.expect("op", "."); var m = this.next().value; return { t: "Call", ns: ns, method: m, args: this.parseArgs() }; },
    parseArgs: function () { this.expect("op", "("); var a = []; if (!this.at("op", ")")) { a.push(this.parseExpr()); while (this.at("op", ",")) { this.next(); a.push(this.parseExpr()); } } this.expect("op", ")"); return a; },
    matchBinop: function () {
      var t = this.peek();
      if (t.kind === "op" && EN_PREC_SYM[t.value] !== undefined) {
        if (EN_CMP_SYM[t.value]) return [EN_PREC_SYM[t.value], 1, "cmp", EN_CMP_SYM[t.value]];
        return [EN_PREC_SYM[t.value], 1, "bin", t.value === "%" ? "MOD" : t.value];
      }
      if (t.kind !== "word") return null;
      var w = t.value.toLowerCase(), w1 = this.wordAt(1), w2 = this.wordAt(2), w3 = this.wordAt(3), w4 = this.wordAt(4), w5 = this.wordAt(5);
      if (w === "and") return [2, 1, "bin", "AND"];
      if (w === "or") return [1, 1, "bin", "OR"];
      if (w === "plus") return [5, 1, "bin", "+"];
      if (w === "minus") return [5, 1, "bin", "-"];
      if (w === "times") return [6, 1, "bin", "*"];
      if (w === "modulo" || w === "mod") return [6, 1, "bin", "MOD"];
      if (w === "divided" && w1 === "by") return [6, 2, "bin", "/"];
      if (w === "over") return [6, 1, "bin", "/"];
      if (w === "is") {
        if (w1 === "greater" && w2 === "than") { if (w3 === "or" && w4 === "equal" && w5 === "to") return [3, 6, "cmp", "GE"]; return [3, 3, "cmp", "GT"]; }
        if (w1 === "less" && w2 === "than") { if (w3 === "or" && w4 === "equal" && w5 === "to") return [3, 6, "cmp", "LE"]; return [3, 3, "cmp", "LT"]; }
        if (w1 === "at" && w2 === "least") return [3, 3, "cmp", "GE"];
        if (w1 === "at" && w2 === "most") return [3, 3, "cmp", "LE"];
        if (w1 === "not") { if (w2 === "equal" && w3 === "to") return [3, 4, "cmp", "NE"]; return [3, 2, "cmp", "NE"]; }
        if (w1 === "equal" && w2 === "to") return [3, 3, "cmp", "EQ"];
        return [3, 1, "cmp", "EQ"];
      }
      if (w === "equals") return [3, 1, "cmp", "EQ"];
      if (w === "exceeds") return [3, 1, "cmp", "GT"];
      return null;
    },
    parseExpr: function (minp) {
      minp = minp || 0; var left = this.parseUnary();
      if (minp === 0 && this.atWord("if")) { this.eatWord("if"); var cond = this.parseExpr(); this.eatWord("otherwise"); var els = this.parseExpr(); return { t: "Ternary", cond: cond, then: left, els: els }; }
      while (true) {
        var m = this.matchBinop();
        if (m === null || m[0] < minp) break;
        for (var k = 0; k < m[1]; k++) this.next();
        var right = this.parseExpr(m[0] + 1);
        left = (m[2] === "cmp") ? { t: "Cmp", cond: m[3], lhs: left, rhs: right } : { t: "Bin", op: m[3], lhs: left, rhs: right };
      }
      return left;
    },
    parseUnary: function () {
      var t = this.peek();
      if (t.kind === "op" && t.value === "-") { this.next(); return { t: "Bin", op: "-", lhs: { t: "Num", value: 0 }, rhs: this.parseUnary() }; }
      if (t.kind === "word" && t.value.toLowerCase() === "not") { this.next(); return { t: "Cmp", cond: "EQ", lhs: this.parseUnary(), rhs: { t: "Num", value: 0 } }; }
      return this.parseAtom();
    },
    parseAtom: function () {
      var t = this.next();
      if (t.kind === "num") return { t: "Num", value: numval(t.value) };
      if (t.kind === "str") return { t: "Str", value: t.value };
      if (t.kind === "op" && t.value === "(") { var e = this.parseExpr(); this.expect("op", ")"); return e; }
      if (t.kind === "word") {
        var lw = t.value.toLowerCase();
        if (lw === "true") return { t: "Num", value: 1 };
        if (lw === "false") return { t: "Num", value: 0 };
        if (this.at("op", ".") && this.peek(1).kind === "word" && this.peek(2).kind === "op" && this.peek(2).value === "(") { this.next(); var m = this.next().value; return { t: "Call", ns: t.value, method: m, args: this.parseArgs() }; }
        if (this.at("op", "(")) return { t: "Call", ns: null, method: t.value, args: this.parseArgs() };
        return { t: "Var", name: t.value };
      }
      throw new Error("English: unexpected token " + t.value);
    }
  };
  function compileEnglish(src) { return new BLowerer().lowerProgram(new EnParser(entokenize(src)).parseProgram()); }

  // ── INV-25: structured debug trace -- symbolication (mirrors picoscript_il) ──
  var FAULT_NAMES = {
    0: "none", 1: "step_budget", 2: "bad_opcode", 3: "bad_jump", 4: "call_overflow",
    5: "ret_underflow", 6: "bad_hook", 7: "template", 8: "capability", 9: "alloc", 10: "const_write"
  };
  function offsetToLineCol(source, off) {
    if (source == null || off == null || off < 0 || off > source.length) return [0, 0];
    var line = 1, lastNl = -1;
    for (var k = 0; k < off; k++) { if (source[k] === "\n") { line++; lastNl = k; } }
    return [line, off - lastNl];
  }
  function sourceLineText(source, off) {
    if (source == null || off == null || off < 0 || off > source.length) return "";
    var start = source.lastIndexOf("\n", off - 1) + 1;
    var end = source.indexOf("\n", off);
    if (end < 0) end = source.length;
    return source.slice(start, end);
  }
  function symbolize(code, pc, detail, debug, source) {
    source = source || "";
    var rec = (debug && Object.prototype.hasOwnProperty.call(debug, pc)) ? debug[pc] : null;
    var off = rec ? rec[0] : -1, op = rec ? rec[1] : "", ns = rec ? rec[2] : null, method = rec ? rec[3] : null;
    var lc = offsetToLineCol(source, off);
    var target = ns ? (ns + "." + method) : (op || "?");
    return {
      code: code, fault: (FAULT_NAMES[code] !== undefined ? FAULT_NAMES[code] : String(code)),
      pc: pc, detail: detail, op: op || "?", target: target,
      off: off, line: lc[0], col: lc[1], source_line: sourceLineText(source, off)
    };
  }

  function pushAst(out, node) {
    if (node == null) return;
    if (Array.isArray(node)) Array.prototype.push.apply(out, node);
    else out.push(node);
  }
  function markAst(node, pos) {
    var arr = Array.isArray(node) ? node : [node];
    arr.forEach(function (n) { if (n && typeof n === "object") n.pos = pos; });
    return node;
  }
  function periodTokenize(src, kwset, two, one, who, opt) {
    opt = opt || {};
    var out = [], i = 0, n = src.length, bol = true;
    function push(k, v, p) { out.push({ kind: k, value: v, pos: p }); bol = false; }
    while (i < n) {
      var c = src[i], start = i;
      if (c === "\n") { out.push({ kind: "nl", value: "", pos: start }); i++; bol = true; continue; }
      if (c === " " || c === "\t" || c === "\r") { i++; continue; }
      if (opt.commentInlineStarGt && c === "*" && src[i + 1] === ">") { while (i < n && src[i] !== "\n") i++; continue; }
      if (opt.commentSlashSlash && c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
      if (opt.commentLineStar && c === "*" && bol) { while (i < n && src[i] !== "\n") i++; continue; }
      if (opt.commentInlineQuote && c === '"') { while (i < n && src[i] !== "\n") i++; continue; }
      if (c === '"' || c === "'") {
        var q = c, j = i + 1, b = "";
        while (j < n && src[j] !== q) {
          if (src[j] === "\\" && j + 1 < n) {
            var nx = src[j + 1];
            b += ({ n: "\n", t: "\t", "\\": "\\", '"': '"', "'": "'" }[nx] || nx);
            j += 2;
          } else {
            b += src[j++];
          }
        }
        if (j >= n) throw new Error(who + ": unterminated string");
        push("str", b, start); i = j + 1; continue;
      }
      if (isDigit(c)) {
        var j2 = i;
        if (c === "0" && (src[j2 + 1] === "x" || src[j2 + 1] === "X")) { j2 += 2; while (j2 < n && /[0-9a-fA-F]/.test(src[j2])) j2++; }
        else while (j2 < n && isDigit(src[j2])) j2++;
        push("num", src.slice(i, j2), start); i = j2; continue;
      }
      if (isAlpha(c) || c === "_") {
        var j3 = i;
        while (j3 < n) {
          var ch = src[j3];
          if (isAlnum(ch) || ch === "_" || (opt.allowHyphen && ch === "-")) j3++;
          else break;
        }
        var raw = src.slice(i, j3), word = opt.uppercase ? raw.toUpperCase() : raw, key = opt.uppercase ? word : raw.toUpperCase();
        push(kwset[key] ? "kw" : "id", word, start); i = j3; continue;
      }
      var tw = src.slice(i, i + 2);
      if (two[tw]) { push("op", tw, start); i += 2; continue; }
      if (one.indexOf(c) >= 0) { push("op", c, start); i++; continue; }
      throw new Error(who + ": unexpected char " + JSON.stringify(c));
    }
    out.push({ kind: "nl", value: "", pos: n });
    out.push({ kind: "eof", value: "", pos: n });
    return out;
  }

  // ---- COBOL-style frontend -------------------------------------------------
  var COB_KW = {};
  ["IDENTIFICATION","DIVISION","PROGRAM-ID","DATA","PROCEDURE","WORKING-STORAGE","SECTION","PIC","VALUE","MOVE","TO","COMPUTE","DISPLAY","IF","ELSE","END-IF","PERFORM","VARYING","FROM","BY","UNTIL","END-PERFORM","STOP","RUN","NOT","AND","OR","IS","GREATER","LESS","EQUAL","THAN","EVALUATE","WHEN","OTHER","END-EVALUATE","GO","MOD","EXIT","CYCLE"].forEach(function (k) { COB_KW[k] = 1; });
  var COB_TWO = { "==":1, "!=":1, "<=":1, ">=":1, "<>":1 };
  var COB_ONE = "+-*/()<>=,.:";
  var COB_CMP = { "=":"EQ", "==":"EQ", "!=":"NE", "<>":"NE", "<":"LT", ">":"GT", "<=":"LE", ">=":"GE" };
  var COB_PREC = { OR:1, AND:2, "+":5, "-":5, "*":6, "/":6, MOD:6 };
  Object.keys(COB_CMP).forEach(function (k) { COB_PREC[k] = 3; });
  function cobtokenize(src) { return periodTokenize(src, COB_KW, COB_TWO, COB_ONE, "COBOL", { commentLineStar: true, commentInlineStarGt: true, allowHyphen: true, uppercase: true }); }
  function CobParser(toks) { this.toks = toks; this.i = 0; }
  CobParser.prototype = {
    peek: function (k) { var j = this.i + (k || 0); return j < this.toks.length ? this.toks[j] : this.toks[this.toks.length - 1]; },
    next: function () { return this.toks[this.i++]; },
    at: function (kind, value) { var t = this.peek(); return t.kind === kind && (value === undefined || t.value === value); },
    atKw: function () { var t = this.peek(); if (t.kind !== "kw") return false; for (var k = 0; k < arguments.length; k++) if (t.value === arguments[k]) return true; return false; },
    wordAt: function (k) { var t = this.peek(k); return (t.kind === "kw" || t.kind === "id") ? t.value : null; },
    expect: function (kind, value) { var t = this.next(); if (t.kind !== kind || (value !== undefined && t.value !== value)) throw new Error("COBOL: expected " + (value !== undefined ? value : kind) + " got " + t.value); return t; },
    expectKw: function (name) { var t = this.next(); if (!(t.kind === "kw" && t.value === name)) throw new Error("COBOL: expected " + name + " got " + t.value); },
    expectName: function () { var t = this.next(); if (t.kind !== "id") throw new Error("COBOL: expected identifier got " + t.value); return t.value; },
    skipNl: function () { while (this.at("nl")) this.next(); },
    endHeader: function () { if (this.at("op", ".")) this.next(); if (this.at("nl") || this.at("eof")) { this.skipNl(); return; } throw new Error("COBOL: expected end of line got " + this.peek().value); },
    endSimple: function () { if (this.at("op", ".")) this.next(); if (this.at("nl") || this.at("eof")) { this.skipNl(); return; } throw new Error("COBOL: expected end of statement got " + this.peek().value); },
    skipLine: function () { while (!this.at("eof") && !this.at("nl")) this.next(); this.skipNl(); },
    atDivision: function (name) { return this.atKw(name) && this.peek(1).kind === "kw" && this.peek(1).value === "DIVISION"; },
    consumeDivision: function (name) { this.expectKw(name); this.expectKw("DIVISION"); if (this.at("op", ".")) this.next(); this.skipNl(); },
    atParagraph: function () { return this.peek().kind === "id" && this.peek(1).kind === "op" && this.peek(1).value === "." && (this.peek(2).kind === "nl" || this.peek(2).kind === "eof"); },
    parseProgram: function () {
      var decls = [], main = [], subs = [];
      this.skipNl();
      while (!this.at("eof")) {
        if (this.atDivision("IDENTIFICATION")) { this.consumeDivision("IDENTIFICATION"); continue; }
        if (this.atDivision("DATA")) { this.consumeDivision("DATA"); decls = decls.concat(this.parseDataDivision()); continue; }
        if (this.atDivision("PROCEDURE")) { this.consumeDivision("PROCEDURE"); var p = this.parseProcedureDivision(); main = main.concat(p.body); subs = subs.concat(p.subs); break; }
        this.skipLine();
      }
      return decls.concat(main, subs);
    },
    parseDataDivision: function () {
      var out = [];
      while (!this.at("eof") && !this.atDivision("PROCEDURE")) {
        this.skipNl();
        if (this.at("eof") || this.atDivision("PROCEDURE")) break;
        if (this.peek().kind === "num") out.push(this.parseDataItem());
        else this.skipLine();
      }
      return out;
    },
    parseDataItem: function () {
      this.expect("num");
      var name = this.expectName(), init = { t: "Num", value: 0 };
      while (!this.at("eof") && !this.at("op", ".") && !this.at("nl")) {
        if (this.atKw("VALUE")) { this.next(); init = this.parseExpr(); break; }
        this.next();
      }
      if (this.at("op", ".")) this.next();
      this.skipNl();
      return { t: "Let", name: name, value: init };
    },
    collectGotoTargets: function () {
      var labels = {};
      for (var j = this.i; j < this.toks.length; j++) {
        if (this.toks[j].kind === "kw" && this.toks[j].value === "GO" && this.toks[j + 1] && this.toks[j + 1].kind === "kw" && this.toks[j + 1].value === "TO" && this.toks[j + 2] && this.toks[j + 2].kind === "id") labels[this.toks[j + 2].value] = 1;
      }
      return labels;
    },
    parseProcedureDivision: function () {
      var body = [], subs = [];
      this.gotoTargets = this.collectGotoTargets();
      this.skipNl();
      while (!this.at("eof")) {
        if (this.atParagraph()) {
          if (this.gotoTargets && this.gotoTargets[this.peek().value]) body.push(this.parseLabelParagraph());
          else subs.push(this.parseParagraph());
        }
        else pushAst(body, this.parseStmt());
      }
      return { body: body, subs: subs };
    },
    parseLabelParagraph: function () { var start = this.peek().pos, name = this.expectName(); this.expect("op", "."); this.skipNl(); return markAst({ t: "Label", name: name }, start); },
    parseParagraph: function () { var name = this.expectName(); this.expect("op", "."); this.skipNl(); return { t: "Sub", name: name, params: null, body: this.parseBlock([], true) }; },
    parseBlock: function (stopWords, stopOnParagraph) {
      var out = [];
      this.skipNl();
      while (!this.at("eof")) {
        if (stopOnParagraph && this.atParagraph()) break;
        if (this.peek().kind === "kw" && stopWords.indexOf(this.peek().value) >= 0) break;
        pushAst(out, this.parseStmt());
        this.skipNl();
      }
      return out;
    },
    parseStmt: function () { this.skipNl(); var start = this.peek().pos, node = this._parseStmt(); return markAst(node, start); },
    _parseStmt: function () {
      var t = this.peek();
      if (t.kind === "kw") {
        if (t.value === "MOVE") return this.parseMove();
        if (t.value === "COMPUTE") return this.parseCompute();
        if (t.value === "DISPLAY") return this.parseDisplay();
        if (t.value === "IF") return this.parseIf();
        if (t.value === "PERFORM") return this.parsePerform();
        if (t.value === "EVALUATE") return this.parseEvaluate();
        if (t.value === "STOP") return this.parseStopRun();
        if (t.value === "GO") return this.parseGoTo();
        if (t.value === "EXIT") return this.parseExit();
      }
      if (t.kind === "id" && this.peek(1).kind === "op" && this.peek(1).value === "." && (this.peek(2).kind === "id" || this.peek(2).kind === "kw") && this.peek(3).kind === "op" && this.peek(3).value === "(") {
        var call = this.parseCallFromId(); this.endSimple(); return { t: "CallStmt", call: call };
      }
      throw new Error("COBOL: cannot parse statement at " + t.value);
    },
    parseMove: function () { this.expectKw("MOVE"); var value = this.parseExpr(); this.expectKw("TO"); var name = this.expectName(); this.endSimple(); return { t: "Let", name: name, value: value }; },
    parseCompute: function () { this.expectKw("COMPUTE"); var name = this.expectName(); this.expect("op", "="); var value = this.parseExpr(); this.endSimple(); return { t: "Let", name: name, value: value }; },
    parseDisplay: function () { this.expectKw("DISPLAY"); var value = this.parseExpr(); this.endSimple(); return { t: "Print", value: value }; },
    parseIf: function () {
      this.expectKw("IF");
      var cond = this.parseExpr(), arms = [], els = null;
      this.endHeader();
      arms.push([cond, this.parseBlock(["ELSE", "END-IF"], false)]);
      if (this.atKw("ELSE")) { this.next(); this.endHeader(); els = this.parseBlock(["END-IF"], false); }
      this.expectKw("END-IF"); this.endSimple();
      return { t: "If", arms: arms, els: els };
    },
    parsePerform: function () { this.expectKw("PERFORM"); if (this.atKw("VARYING")) return this.parsePerformVarying(); if (this.atKw("UNTIL")) return this.parsePerformUntil(); var name = this.expectName(); this.endSimple(); return { t: "Gosub", name: name, args: null }; },
    parseGoTo: function () { this.expectKw("GO"); if (this.atKw("TO")) this.next(); var name = this.expectName(); this.endSimple(); return { t: "Goto", label: name }; },
    parseExit: function () { this.expectKw("EXIT"); if (this.atKw("PERFORM")) this.next(); var isCycle = false; if (this.atKw("CYCLE")) { this.next(); isCycle = true; } this.endSimple(); return { t: isCycle ? "Skip" : "Break" }; },
    parsePerformUntil: function () {
      this.expectKw("UNTIL");
      var cond = this.parseExpr();
      this.endHeader();
      var body = this.parseBlock(["END-PERFORM"], false);
      this.expectKw("END-PERFORM"); this.endSimple();
      return { t: "While", cond: this.negateExpr(cond), body: body };
    },
    parsePerformVarying: function () {
      this.expectKw("VARYING");
      var v = this.expectName();
      this.expectKw("FROM");
      var start = this.parseExpr(), step = { t: "Num", value: 1 };
      if (this.atKw("BY")) { this.next(); step = this.parseExpr(); }
      this.expectKw("UNTIL");
      var cond = this.parseExpr();
      this.endHeader();
      var body = this.parseBlock(["END-PERFORM"], false);
      this.expectKw("END-PERFORM"); this.endSimple();
      return { t: "ForTo", v: v, start: start, end: this.forEndFromUntil(v, cond), step: step, body: body };
    },
    forEndFromUntil: function (v, cond) {
      if (cond.t === "Cmp" && cond.lhs && cond.lhs.t === "Var" && cond.lhs.name === v) {
        if (cond.cond === "GT") return cond.rhs;
        if (cond.cond === "GE") return { t: "Bin", op: "-", lhs: cond.rhs, rhs: { t: "Num", value: 1 } };
      }
      throw new Error("COBOL: unsupported PERFORM VARYING UNTIL condition");
    },
    parseEvaluate: function () {
      this.expectKw("EVALUATE");
      var expr = this.parseExpr(), cases = [], def = null;
      this.endHeader();
      while (!this.atKw("END-EVALUATE")) {
        this.expectKw("WHEN");
        if (this.atKw("OTHER")) {
          this.next();
          this.endHeader();
          def = this.parseBlock(["END-EVALUATE"], false);
          break;
        }
        var val = this.parseExpr();
        this.endHeader();
        cases.push([val, this.parseBlock(["WHEN", "END-EVALUATE"], false)]);
      }
      this.expectKw("END-EVALUATE"); this.endSimple();
      return { t: "Switch", expr: expr, cases: cases, def: def };
    },
    negateExpr: function (expr) { return { t: "Cmp", cond: "EQ", lhs: expr, rhs: { t: "Num", value: 0 } }; },
    parseStopRun: function () { this.expectKw("STOP"); if (this.atKw("RUN")) this.next(); this.endSimple(); return { t: "Return" }; },
    parseCallFromId: function () { var ns = this.expectName(); this.expect("op", "."); var m = this.next(); if (m.kind !== "id" && m.kind !== "kw") throw new Error("COBOL: expected method after ."); return { t: "Call", ns: ns, method: m.value, args: this.parseArgs() }; },
    parseArgs: function () { this.expect("op", "("); var a = []; if (!this.at("op", ")")) { a.push(this.parseExpr()); while (this.at("op", ",")) { this.next(); a.push(this.parseExpr()); } } this.expect("op", ")"); return a; },
    matchBinop: function () {
      var t = this.peek(), w = this.wordAt(0), w1 = this.wordAt(1), w2 = this.wordAt(2), w3 = this.wordAt(3), w4 = this.wordAt(4);
      if (t.kind === "op" && COB_PREC[t.value] !== undefined) return [COB_PREC[t.value], 1, COB_CMP[t.value] ? "cmp" : "bin", COB_CMP[t.value] || t.value];
      if (w === "AND") return [2, 1, "bin", "AND"];
      if (w === "OR") return [1, 1, "bin", "OR"];
      if (w === "MOD") return [6, 1, "bin", "MOD"];
      if (w === "GREATER" && w1 === "THAN") { if (w2 === "OR" && w3 === "EQUAL" && w4 === "TO") return [3, 5, "cmp", "GE"]; return [3, 2, "cmp", "GT"]; }
      if (w === "LESS" && w1 === "THAN") { if (w2 === "OR" && w3 === "EQUAL" && w4 === "TO") return [3, 5, "cmp", "LE"]; return [3, 2, "cmp", "LT"]; }
      if (w === "EQUAL" && w1 === "TO") return [3, 2, "cmp", "EQ"];
      if (w === "NOT" && w1 === "EQUAL" && w2 === "TO") return [3, 3, "cmp", "NE"];
      return null;
    },
    parseExpr: function (minp) {
      minp = minp || 0; var left = this.parseUnary();
      while (true) {
        var m = this.matchBinop();
        if (!m || m[0] < minp) break;
        for (var i = 0; i < m[1]; i++) this.next();
        var right = this.parseExpr(m[0] + 1);
        left = (m[2] === "cmp") ? { t: "Cmp", cond: m[3], lhs: left, rhs: right } : { t: "Bin", op: m[3], lhs: left, rhs: right };
      }
      return left;
    },
    parseUnary: function () { var t = this.peek(); if (t.kind === "op" && t.value === "-") { this.next(); return { t: "Bin", op: "-", lhs: { t: "Num", value: 0 }, rhs: this.parseUnary() }; } if (t.kind === "kw" && t.value === "NOT") { this.next(); return { t: "Cmp", cond: "EQ", lhs: this.parseUnary(), rhs: { t: "Num", value: 0 } }; } return this.parseAtom(); },
    parseAtom: function () {
      var t = this.next();
      if (t.kind === "num") return { t: "Num", value: numval(t.value) };
      if (t.kind === "str") return { t: "Str", value: t.value };
      if (t.kind === "op" && t.value === "(") { var e = this.parseExpr(); this.expect("op", ")"); return e; }
      if (t.kind === "id") {
        if (this.at("op", ".") && (this.peek(1).kind === "id" || this.peek(1).kind === "kw") && this.peek(2).kind === "op" && this.peek(2).value === "(") { this.next(); var m = this.next().value; return { t: "Call", ns: t.value, method: m, args: this.parseArgs() }; }
        if (this.at("op", "(")) return { t: "Call", ns: null, method: t.value, args: this.parseArgs() };
        return { t: "Var", name: t.value };
      }
      throw new Error("COBOL: unexpected token " + t.value);
    }
  };
  function compileCobol(src) { return new BLowerer().lowerProgram(new CobParser(cobtokenize(src)).parseProgram()); }

  // ---- Report/4GL frontend --------------------------------------------------
  var REP_KW = {};
  ["DATA","TYPE","VALUE","IF","ELSE","ELSEIF","ENDIF","WRITE","FORM","ENDFORM","USING","PERFORM","CASE","WHEN","OTHERS","ENDCASE","LOOP","AT","INTO","WHERE","ENDLOOP","RETURN","EXIT","CONTINUE","AND","OR","NOT","WHILE","ENDWHILE","LABEL","GOTO","MOD","COMPUTE","MOVE","TO"].forEach(function (k) { REP_KW[k] = 1; });
  var REP_TWO = { "==":1, "!=":1, "<=":1, ">=":1, "<>":1 };
  var REP_ONE = "+-*/%()<>=,.:";
  var REP_CMP = { "=":"EQ", "==":"EQ", "!=":"NE", "<>":"NE", "<":"LT", ">":"GT", "<=":"LE", ">=":"GE" };
  var REP_PREC = { OR:1, AND:2, "+":5, "-":5, "*":6, "/":6, "%":6 };
  Object.keys(REP_CMP).forEach(function (k) { REP_PREC[k] = 3; });
  function reptokenize(src) { return periodTokenize(src, REP_KW, REP_TWO, REP_ONE, "Report", { commentLineStar: true, commentInlineQuote: true, uppercase: true }); }
  function RepParser(toks) { this.toks = toks; this.i = 0; this.tmp = 0; }
  RepParser.prototype = {
    peek: function (k) { var j = this.i + (k || 0); return j < this.toks.length ? this.toks[j] : this.toks[this.toks.length - 1]; },
    next: function () { return this.toks[this.i++]; },
    at: function (kind, value) { var t = this.peek(); return t.kind === kind && (value === undefined || t.value === value); },
    atKw: function () { var t = this.peek(); if (t.kind !== "kw") return false; for (var k = 0; k < arguments.length; k++) if (t.value === arguments[k]) return true; return false; },
    expect: function (kind, value) { var t = this.next(); if (t.kind !== kind || (value !== undefined && t.value !== value)) throw new Error("Report: expected " + (value !== undefined ? value : kind) + " got " + t.value); return t; },
    expectKw: function (name) { var t = this.next(); if (!(t.kind === "kw" && t.value === name)) throw new Error("Report: expected " + name + " got " + t.value); },
    skipNl: function () { while (this.at("nl")) this.next(); },
    endStmt: function () { if (this.at("op", ".")) this.next(); this.skipNl(); },
    freshTemp: function () { this.tmp++; return "__loop" + this.tmp; },
    parseProgram: function () {
      var out = [];
      while (!this.at("eof")) {
        this.skipNl();
        if (this.at("eof")) break;
        if (this.at("op", ".")) { this.next(); continue; }
        pushAst(out, this.parseStmt());
      }
      return out;
    },
    parseBlockUntil: function (stops) {
      var out = [];
      while (!this.at("eof")) {
        this.skipNl();
        if (this.peek().kind === "kw" && stops.indexOf(this.peek().value) >= 0) break;
        if (this.at("op", ".")) { this.next(); continue; }
        pushAst(out, this.parseStmt());
      }
      return out;
    },
    parseStmt: function () { this.skipNl(); var start = this.peek().pos, node = this._parseStmt(); return markAst(node, start); },
    _parseStmt: function () {
      var t = this.peek();
      if (t.kind === "kw") {
        if (t.value === "DATA") return this.parseData();
        if (t.value === "IF") return this.parseIf();
        if (t.value === "WRITE") { this.next(); var pv = this.parseExpr(); this.endStmt(); return { t: "Print", value: pv }; }
        if (t.value === "FORM") return this.parseForm();
        if (t.value === "PERFORM") return this.parsePerform();
        if (t.value === "CASE") return this.parseCase();
        if (t.value === "LOOP") return this.parseLoop();
        if (t.value === "WHILE") return this.parseWhile();
        if (t.value === "LABEL") return this.parseLabel();
        if (t.value === "GOTO") return this.parseGoto();
        if (t.value === "RETURN") { this.next(); if (this.at("op", ".") || this.at("nl") || this.at("eof")) { this.endStmt(); return { t: "Return" }; } var rv = this.parseExpr(); this.endStmt(); return { t: "Return", value: rv }; }
        if (t.value === "EXIT") { this.next(); this.endStmt(); return { t: "Break" }; }
        if (t.value === "CONTINUE") { this.next(); this.endStmt(); return { t: "Skip" }; }
        if (t.value === "COMPUTE") { this.next(); var cName = this.next().value; this.expect("op", "="); var cVal = this.parseExpr(); this.endStmt(); return { t: "Let", name: cName, value: cVal }; }
        if (t.value === "MOVE") { this.next(); var mVal = this.parseExpr(); this.expectKw("TO"); var mName = this.next().value; this.endStmt(); return { t: "Let", name: mName, value: mVal }; }
      }
      if (t.kind === "id") {
        if (this.peek(1).kind === "op" && this.peek(1).value === "=") { var name = this.next().value; this.next(); var vv = this.parseExpr(); this.endStmt(); return { t: "Let", name: name, value: vv }; }
        if (this.peek(1).kind === "op" && this.peek(1).value === "." && (this.peek(2).kind === "id" || this.peek(2).kind === "kw") && this.peek(3).kind === "op" && this.peek(3).value === "(") { var call = this.parseCallFromId(); this.endStmt(); return { t: "CallStmt", call: call }; }
      }
      throw new Error("Report: cannot parse statement at " + t.value);
    },
    parseData: function () {
      this.expectKw("DATA");
      if (this.at("op", ":")) this.next();
      var decls = [];
      while (true) {
        this.skipNl();
        var name = this.expect("id").value, init = { t: "Num", value: 0 };
        while (this.peek().kind === "kw" && (this.peek().value === "TYPE" || this.peek().value === "VALUE")) {
          if (this.peek().value === "TYPE") { this.next(); this.next(); }
          else { this.next(); init = this.parseExpr(); }
        }
        decls.push({ t: "Let", name: name, value: init });
        if (this.at("op", ",")) { this.next(); continue; }
        this.endStmt(); return decls;
      }
    },
    parseIf: function () {
      this.expectKw("IF");
      var cond = this.parseExpr(), arms = [], els = null;
      this.endStmt();
      arms.push([cond, this.parseBlockUntil(["ELSEIF", "ELSE", "ENDIF"])]);
      while (this.atKw("ELSEIF")) { this.next(); var ec = this.parseExpr(); this.endStmt(); arms.push([ec, this.parseBlockUntil(["ELSEIF", "ELSE", "ENDIF"])]); }
      if (this.atKw("ELSE")) { this.next(); this.endStmt(); els = this.parseBlockUntil(["ENDIF"]); }
      this.expectKw("ENDIF"); this.endStmt();
      return { t: "If", arms: arms, els: els };
    },
    parseForm: function () {
      this.expectKw("FORM");
      var name = this.expect("id").value, params = null;
      if (this.atKw("USING")) { this.next(); params = this.parseNameListUntilDot(); }
      this.endStmt();
      var body = this.parseBlockUntil(["ENDFORM"]);
      this.expectKw("ENDFORM"); this.endStmt();
      return { t: "Sub", name: name, body: body, params: params && params.length ? params : null };
    },
    parsePerform: function () {
      this.expectKw("PERFORM");
      var name = this.expect("id").value, args = null;
      if (this.atKw("USING")) { this.next(); args = this.parseExprListUntilDot(); }
      this.endStmt();
      return { t: "Gosub", name: name, args: args && args.length ? args : null };
    },
    parseCase: function () {
      this.expectKw("CASE");
      var expr = this.parseExpr(), cases = [], def = null;
      this.endStmt();
      while (!this.atKw("ENDCASE")) {
        this.expectKw("WHEN");
        if (this.atKw("OTHERS")) { this.next(); this.endStmt(); def = this.parseBlockUntil(["ENDCASE"]); break; }
        var val = this.parseExpr(); this.endStmt();
        cases.push([val, this.parseBlockUntil(["WHEN", "ENDCASE"])]);
      }
      this.expectKw("ENDCASE"); this.endStmt();
      return { t: "Switch", expr: expr, cases: cases, def: def };
    },
    parseLoop: function () {
      this.expectKw("LOOP"); this.expectKw("AT");
      var count = this.parseExpr(); this.expectKw("INTO"); var v = this.expect("id").value; var where = null;
      if (this.atKw("WHERE")) { this.next(); where = this.parseExpr(); }
      this.endStmt();
      var body = this.parseBlockUntil(["ENDLOOP"]);
      this.expectKw("ENDLOOP"); this.endStmt();
      if (where) body = [{ t: "If", arms: [[where, body]], els: null }];
      return { t: "ForEach", v: v || this.freshTemp(), count: count, body: body };
    },
    parseWhile: function () {
      this.expectKw("WHILE");
      var cond = this.parseExpr();
      this.endStmt();
      var body = this.parseBlockUntil(["ENDWHILE"]);
      this.expectKw("ENDWHILE"); this.endStmt();
      return { t: "While", cond: cond, body: body };
    },
    parseLabel: function () { this.expectKw("LABEL"); var name = this.expect("id").value; this.endStmt(); return { t: "Label", name: name }; },
    parseGoto: function () { this.expectKw("GOTO"); var name = this.expect("id").value; this.endStmt(); return { t: "Goto", label: name }; },
    parseNameListUntilDot: function () { var a = []; while (!this.at("op", ".") && !this.at("eof")) { if (this.at("op", ",")) { this.next(); continue; } a.push(this.expect("id").value); } return a; },
    parseExprListUntilDot: function () { var a = []; while (!this.at("op", ".") && !this.at("eof")) { if (this.at("op", ",")) { this.next(); continue; } a.push(this.parseExpr()); } return a; },
    parseCallFromId: function () { var ns = this.expect("id").value; this.expect("op", "."); var m = this.next(); if (m.kind !== "id" && m.kind !== "kw") throw new Error("Report: expected method after ."); return { t: "Call", ns: ns, method: m.value, args: this.parseArgs() }; },
    parseArgs: function () { this.expect("op", "("); var a = []; if (!this.at("op", ")")) { a.push(this.parseExpr()); while (this.at("op", ",")) { this.next(); a.push(this.parseExpr()); } } this.expect("op", ")"); return a; },
    matchBinop: function () {
      var t = this.peek();
      if (t.kind === "op" && REP_PREC[t.value] !== undefined) return [REP_PREC[t.value], 1, REP_CMP[t.value] ? "cmp" : "bin", REP_CMP[t.value] || (t.value === "%" ? "MOD" : t.value)];
      if (t.kind === "kw" && t.value === "AND") return [2, 1, "bin", "AND"];
      if (t.kind === "kw" && t.value === "OR") return [1, 1, "bin", "OR"];
      if (t.kind === "kw" && t.value === "MOD") return [6, 1, "bin", "MOD"];
      return null;
    },
    parseExpr: function (minp) {
      minp = minp || 0; var left = this.parseUnary();
      while (true) {
        var m = this.matchBinop();
        if (!m || m[0] < minp) break;
        this.next(); var right = this.parseExpr(m[0] + 1);
        left = (m[2] === "cmp") ? { t: "Cmp", cond: m[3], lhs: left, rhs: right } : { t: "Bin", op: m[3], lhs: left, rhs: right };
      }
      return left;
    },
    parseUnary: function () { var t = this.peek(); if (t.kind === "op" && t.value === "-") { this.next(); return { t: "Bin", op: "-", lhs: { t: "Num", value: 0 }, rhs: this.parseUnary() }; } if (t.kind === "kw" && t.value === "NOT") { this.next(); return { t: "Cmp", cond: "EQ", lhs: this.parseUnary(), rhs: { t: "Num", value: 0 } }; } return this.parseAtom(); },
    parseAtom: function () {
      var t = this.next();
      if (t.kind === "num") return { t: "Num", value: numval(t.value) };
      if (t.kind === "str") return { t: "Str", value: t.value };
      if (t.kind === "op" && t.value === "(") { var e = this.parseExpr(); this.expect("op", ")"); return e; }
      if (t.kind === "id") {
        if (this.at("op", ".") && (this.peek(1).kind === "id" || this.peek(1).kind === "kw") && this.peek(2).kind === "op" && this.peek(2).value === "(") { this.next(); var m = this.next().value; return { t: "Call", ns: t.value, method: m, args: this.parseArgs() }; }
        if (this.at("op", "(")) return { t: "Call", ns: null, method: t.value, args: this.parseArgs() };
        return { t: "Var", name: t.value };
      }
      throw new Error("Report: unexpected token " + t.value);
    }
  };
  function compileReport(src) { return new BLowerer().lowerProgram(new RepParser(reptokenize(src)).parseProgram()); }

  // ---- Functional frontend --------------------------------------------------
  var FUN_KW = {};
  ["let","if","then","else","elif","match","with","for","in","do","while","printfn","printf","not","true","false","and","or","return","break","continue","skip","rec","mutable","goto","label"].forEach(function (k) { FUN_KW[k] = 1; });
  var FUN_TWO = { "==":1, "!=":1, "<>":1, "<=":1, ">=":1, "|>":1, "->":1, "..":1, "&&":1, "||":1 };
  var FUN_ONE = "+-*/%()<>=,.:|";
  var FUN_CMP = { "=":"EQ", "==":"EQ", "!=":"NE", "<>":"NE", "<":"LT", ">":"GT", "<=":"LE", ">=":"GE" };
  var FUN_PREC = { or:1, "||":1, and:2, "&&":2, "=":3, "==":3, "!=":3, "<>":3, "<":3, ">":3, "<=":3, ">=":3, "+":5, "-":5, "*":6, "/":6, "%":6 };
  var FUN_BIN = { "+":"+", "-":"-", "*":"*", "/":"/", "%":"MOD", and:"AND", or:"OR", "&&":"AND", "||":"OR" };
  function ftokenizeLine(text, out, kwset, two, one, who, lineStart) {
    var i = 0, n = text.length;
    while (i < n) {
      var c = text[i], start = lineStart + i;
      if (c === " " || c === "\t") { i++; continue; }
      if (c === "/" && text[i + 1] === "/") break;
      if (isDigit(c)) {
        var j = i;
        if (c === "0" && (text[j + 1] === "x" || text[j + 1] === "X")) { j += 2; while (j < n && /[0-9a-fA-F]/.test(text[j])) j++; }
        else while (j < n && isDigit(text[j])) j++;
        out.push({ kind: "num", value: text.slice(i, j), pos: start }); i = j; continue;
      }
      if (isAlpha(c) || c === "_") {
        var j2 = i; while (j2 < n && (isAlnum(text[j2]) || text[j2] === "_")) j2++;
        var w = text.slice(i, j2), lw = w.toLowerCase();
        out.push({ kind: kwset[lw] ? "kw" : "id", value: w, pos: start }); i = j2; continue;
      }
      if (c === '"') {
        var j3 = i + 1, b = "";
        while (j3 < n && text[j3] !== '"') {
          if (text[j3] === "\\" && j3 + 1 < n) { var nx = text[j3 + 1]; b += ({ n: "\n", t: "\t", "\\": "\\", '"': '"' }[nx] || nx); j3 += 2; }
          else b += text[j3++];
        }
        if (j3 >= n) throw new Error("Functional: unterminated string");
        out.push({ kind: "str", value: b, pos: start }); i = j3 + 1; continue;
      }
      var tw = text.slice(i, i + 2);
      if (two[tw]) { out.push({ kind: "op", value: tw, pos: start }); i += 2; continue; }
      if (one.indexOf(c) >= 0) { out.push({ kind: "op", value: c, pos: start }); i++; continue; }
      throw new Error("Functional: unexpected char " + JSON.stringify(c));
    }
  }
  function funtokenize(src) {
    var out = [], indents = [0], lines = src.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n"), offset = 0;
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li], lineStart = offset; offset += line.length + 1;
      var stripped = line.replace(/^[ \t]+/, "");
      if (stripped === "" || stripped.indexOf("//") === 0) continue;
      var indent = line.length - stripped.length;
      if (indent > indents[indents.length - 1]) { indents.push(indent); out.push({ kind: "indent", value: "", pos: lineStart }); }
      else {
        while (indent < indents[indents.length - 1]) { indents.pop(); out.push({ kind: "dedent", value: "", pos: lineStart }); }
        if (indent !== indents[indents.length - 1]) throw new Error("Functional: inconsistent indentation");
      }
      var before = out.length;
      ftokenizeLine(line, out, FUN_KW, FUN_TWO, FUN_ONE, "Functional", lineStart);
      if (out.length > before) out.push({ kind: "newline", value: "", pos: lineStart });
    }
    while (indents.length > 1) { indents.pop(); out.push({ kind: "dedent", value: "", pos: offset }); }
    out.push({ kind: "eof", value: "", pos: offset });
    return out;
  }
  function FunCallTarget(ns, method) { this.ns = ns; this.method = method; }
  function FunParser(toks) { this.toks = toks; this.i = 0; }
  FunParser.prototype = {
    peek: function (k) { var j = this.i + (k || 0); return j < this.toks.length ? this.toks[j] : this.toks[this.toks.length - 1]; },
    next: function () { return this.toks[this.i++]; },
    at: function (kind, value) { var t = this.peek(); return t.kind === kind && (value === undefined || t.value === value); },
    atKw: function () { var t = this.peek(); if (t.kind !== "kw") return false; var w = t.value.toLowerCase(); for (var k = 0; k < arguments.length; k++) if (w === arguments[k]) return true; return false; },
    expect: function (kind, value) { var t = this.next(); if (t.kind !== kind || (value !== undefined && t.value !== value)) throw new Error("Functional: expected " + (value !== undefined ? value : kind) + " got " + t.value); return t; },
    expectKw: function (name) { var t = this.next(); if (!(t.kind === "kw" && t.value.toLowerCase() === name)) throw new Error("Functional: expected " + name + " got " + t.value); },
    parseProgram: function () { var out = []; while (!this.at("eof")) pushAst(out, this.parseStmt(true)); return out; },
    parseSuite: function (allowFunc) {
      this.expect("newline"); this.expect("indent");
      var out = [];
      while (!this.at("dedent")) { if (this.at("eof")) throw new Error("Functional: EOF in block"); pushAst(out, this.parseStmt(allowFunc)); }
      this.expect("dedent"); return out;
    },
    parseStmtBody: function () {
      if (this.at("newline")) return this.parseSuite(false);
      var st = this.parseStmt(false);
      if (st == null) return [];
      return Array.isArray(st) ? st : [st];
    },
    parseFunctionBody: function () {
      if (!this.at("newline")) { var expr = this.parseExpr(); this.expect("newline"); return [{ t: "Return", value: expr }]; }
      this.expect("newline"); this.expect("indent");
      var body = [];
      while (!this.at("dedent")) {
        if (this.lineStartsExpr()) {
          var ex = this.parseExpr(); this.expect("newline"); body.push({ t: "Return", value: ex });
          if (!this.at("dedent")) throw new Error("Functional: expression result must be final in function body");
          break;
        }
        pushAst(body, this.parseStmt(false));
      }
      this.expect("dedent");
      if (!body.length || body[body.length - 1].t !== "Return") body.push({ t: "Return" });
      return body;
    },
    parseStmt: function (allowFunc) {
      if (this.at("newline")) { this.next(); return null; }
      var start = this.peek().pos, node = this._parseStmt(allowFunc);
      return markAst(node, start);
    },
    _parseStmt: function (allowFunc) {
      var t = this.peek();
      if (t.kind === "kw") {
        var kw = t.value.toLowerCase();
        if (kw === "let") return this.parseLetStmt(allowFunc);
        if (kw === "printfn" || kw === "printf") { this.next(); var pv = this.parseExpr(); this.expect("newline"); return { t: "Print", value: pv }; }
        if (kw === "if") return this.parseIfStmt();
        if (kw === "while") return this.parseWhileStmt();
        if (kw === "for") return this.parseForStmt();
        if (kw === "match") return this.parseMatchStmt();
        if (kw === "label") { this.next(); var lname = this.expect("id").value; this.expect("newline"); return { t: "Label", name: lname }; }
        if (kw === "goto") { this.next(); var gname = this.expect("id").value; this.expect("newline"); return { t: "Goto", label: gname }; }
        if (kw === "return") { this.next(); if (this.at("newline")) { this.next(); return { t: "Return" }; } var rv = this.parseExpr(); this.expect("newline"); return { t: "Return", value: rv }; }
        if (kw === "break") { this.next(); this.expect("newline"); return { t: "Break" }; }
        if (kw === "continue" || kw === "skip") { this.next(); this.expect("newline"); return { t: "Skip" }; }
      }
      if (t.kind === "id" && this.peek(1).kind === "op" && this.peek(1).value === "=") {
        var name = this.next().value;
        this.next();
        var value = this.parseExpr();
        this.expect("newline");
        return { t: "Assign", name: name, value: value };
      }
      var expr = this.parseExpr();
      this.expect("newline");
      if (expr.t === "Call") return { t: "CallStmt", call: expr };
      throw new Error("Functional: expression statement must be a call");
    },
    parseLetStmt: function (allowFunc) {
      this.expectKw("let");
      if (this.atKw("rec")) this.next();
      if (this.atKw("mutable")) this.next();
      var name = this.expect("id").value, params = [];
      while (this.at("id")) params.push(this.next().value);
      var zeroParam = false;
      if (this.at("op", "(") && this.peek(1).kind === "op" && this.peek(1).value === ")") { this.next(); this.next(); zeroParam = true; }
      this.expect("op", "=");
      if (params.length || zeroParam) {
        if (!allowFunc) throw new Error("Functional: function definitions only allowed at top level");
        return { t: "Sub", name: name, params: params.length ? params : null, body: this.parseFunctionBody() };
      }
      var value = this.parseBindingExpr();
      this.expect("newline");
      return { t: "Let", name: name, value: value };
    },
    parseBindingExpr: function () {
      if (this.at("newline")) { this.expect("newline"); this.expect("indent"); var expr = this.parseExpr(); this.expect("newline"); this.expect("dedent"); return expr; }
      return this.parseExpr();
    },
    parseIfStmt: function () {
      this.expectKw("if"); var cond = this.parseExpr(); this.expectKw("then");
      var arms = [[cond, this.parseStmtBody()]], els = null;
      while (this.atKw("elif")) { this.next(); var c2 = this.parseExpr(); this.expectKw("then"); arms.push([c2, this.parseStmtBody()]); }
      if (this.atKw("else")) { this.next(); els = this.parseStmtBody(); }
      return { t: "If", arms: arms, els: els };
    },
    parseWhileStmt: function () { this.expectKw("while"); var cond = this.parseExpr(); this.expectKw("do"); return { t: "While", cond: cond, body: this.parseStmtBody() }; },
    parseForStmt: function () {
      this.expectKw("for"); var v = this.expect("id").value; this.expectKw("in");
      var start = this.parseExpr();
      if (this.at("op", "..")) { this.next(); var end = this.parseExpr(); this.expectKw("do"); return { t: "ForTo", v: v, start: start, end: end, step: null, body: this.parseStmtBody() }; }
      this.expectKw("do"); return { t: "ForEach", v: v, count: start, body: this.parseStmtBody() };
    },
    parseMatchStmt: function () {
      this.expectKw("match"); var expr = this.parseExpr(); this.expectKw("with"); this.expect("newline");
      var cases = [], def = null;
      while (this.at("op", "|")) {
        this.next();
        if (this.at("id", "_")) { this.next(); this.expect("op", "->"); def = this.parseStmtBody(); continue; }
        var val = this.parseExpr(); this.expect("op", "->"); cases.push([val, this.parseStmtBody()]);
      }
      if (!cases.length && !def) throw new Error("Functional: expected at least one match arm");
      return { t: "Switch", expr: expr, cases: cases, def: def };
    },
    parseExpr: function () { if (this.atKw("if")) return this.parseIfExpr(); return this.parsePipe(); },
    parseIfExpr: function () { this.expectKw("if"); var cond = this.parsePipe(); this.expectKw("then"); var th = this.parseExpr(); this.expectKw("else"); var el = this.parseExpr(); return { t: "Ternary", cond: cond, then: th, els: el }; },
    parsePipe: function () { var left = this.parseBinary(0); while (this.at("op", "|>")) { this.next(); left = this.applyPipe(left, this.parseApplication()); } return left; },
    applyPipe: function (lhs, rhs) {
      if (rhs.t === "Var") return { t: "Call", ns: null, method: rhs.name, args: [lhs] };
      if (rhs.t === "Call") return { t: "Call", ns: rhs.ns, method: rhs.method, args: [lhs].concat(rhs.args || []) };
      if (rhs instanceof FunCallTarget) return { t: "Call", ns: rhs.ns, method: rhs.method, args: [lhs] };
      throw new Error("Functional: invalid pipe target");
    },
    parseBinary: function (minp) {
      var left = this.parseApplication();
      while (true) {
        var t = this.peek(), op = null;
        if (t.kind === "op" && FUN_PREC[t.value] !== undefined) op = t.value;
        else if (t.kind === "kw" && FUN_PREC[t.value.toLowerCase()] !== undefined) op = t.value.toLowerCase();
        if (op == null || FUN_PREC[op] < minp) break;
        this.next(); var right = this.parseBinary(FUN_PREC[op] + 1);
        left = FUN_CMP[op] ? { t: "Cmp", cond: FUN_CMP[op], lhs: left, rhs: right } : { t: "Bin", op: FUN_BIN[op], lhs: left, rhs: right };
      }
      return left;
    },
    parseApplication: function () {
      var left = this.parseUnary();
      while (this.isAppArgStart(this.peek()) && this.callableExpr(left)) {
        var arg = this.parseUnary();
        if (left.t === "Var") left = { t: "Call", ns: null, method: left.name, args: [arg] };
        else if (left instanceof FunCallTarget) left = { t: "Call", ns: left.ns, method: left.method, args: [arg] };
        else if (left.t === "Call") left.args.push(arg);
      }
      if (left instanceof FunCallTarget) return { t: "Call", ns: left.ns, method: left.method, args: [] };
      return left;
    },
    parseUnary: function () { var t = this.peek(); if (t.kind === "op" && t.value === "-") { this.next(); return { t: "Bin", op: "-", lhs: { t: "Num", value: 0 }, rhs: this.parseUnary() }; } if (t.kind === "kw" && t.value.toLowerCase() === "not") { this.next(); return { t: "Cmp", cond: "EQ", lhs: this.parseUnary(), rhs: { t: "Num", value: 0 } }; } return this.parseAtom(); },
    parseAtom: function () {
      var t = this.next();
      if (t.kind === "num") return { t: "Num", value: numval(t.value) };
      if (t.kind === "str") return { t: "Str", value: t.value };
      if (t.kind === "kw" && (t.value.toLowerCase() === "true" || t.value.toLowerCase() === "false")) return { t: "Num", value: t.value.toLowerCase() === "true" ? 1 : 0 };
      if (t.kind === "op" && t.value === "(") { var e = this.parseExpr(); this.expect("op", ")"); return e; }
      if (t.kind === "id") {
        if (this.at("op", ".")) { this.next(); var m = this.next(); if (m.kind !== "id" && m.kind !== "kw") throw new Error("Functional: expected method after ."); if (this.at("op", "(")) return { t: "Call", ns: t.value, method: m.value, args: this.parseParenArgs() }; return new FunCallTarget(t.value, m.value); }
        if (this.at("op", "(")) return { t: "Call", ns: null, method: t.value, args: this.parseParenArgs() };
        return { t: "Var", name: t.value };
      }
      throw new Error("Functional: unexpected token " + t.value);
    },
    parseParenArgs: function () { this.expect("op", "("); var a = []; if (!this.at("op", ")")) { a.push(this.parseExpr()); while (this.at("op", ",")) { this.next(); a.push(this.parseExpr()); } } this.expect("op", ")"); return a; },
    callableExpr: function (node) { return !!node && (node.t === "Var" || node.t === "Call" || node instanceof FunCallTarget); },
    isAppArgStart: function (t) { if (t.kind === "num" || t.kind === "str" || t.kind === "id") return true; if (t.kind === "op" && t.value === "(") return true; return t.kind === "kw" && ["true","false","not"].indexOf(t.value.toLowerCase()) >= 0; },
    lineStartsExpr: function () { var t = this.peek(); if (t.kind === "id" && this.peek(1).kind === "op" && this.peek(1).value === "=") return false; if (t.kind === "num" || t.kind === "str" || t.kind === "id") return true; if (t.kind === "op" && (t.value === "(" || t.value === "-")) return true; return t.kind === "kw" && ["if","true","false","not"].indexOf(t.value.toLowerCase()) >= 0; }
  };
  function compileFunctional(src) { return new BLowerer().lowerProgram(new FunParser(funtokenize(src)).parseProgram()); }

  function compileIL(src, lang) {
    return (lang === "basic") ? compileBasic(src)
         : (lang === "python") ? compilePython(src)
         : (lang === "english") ? compileEnglish(src)
         : (lang === "cobol") ? compileCobol(src)
         : (lang === "report") ? compileReport(src)
         : (lang === "functional") ? compileFunctional(src)
         : compileC(src);
  }

  // ── Cross-language translator ──────────────────────────────────────────
  function translate(src, fromLang, toLang) {
    if (fromLang === toLang) return src;
    var ast;
    try {
      if (fromLang === "c") ast = new CParser(ctokenize(src)).parseProgram();
      else if (fromLang === "basic") ast = new BParser(btokenize(src)).parseProgram();
      else if (fromLang === "python") ast = new PyParser(pytokenize(src)).parseProgram();
      else if (fromLang === "english") ast = new EnParser(entokenize(src)).parseProgram();
      else if (fromLang === "cobol") ast = new CobParser(cobtokenize(src)).parseProgram();
      else if (fromLang === "report") ast = new RepParser(reptokenize(src)).parseProgram();
      else if (fromLang === "functional") ast = new FunParser(funtokenize(src)).parseProgram();
      else return src;
    } catch (e) { return src; }
    // Resolve user const/enum declarations to literal values before emitting, so
    // every target compiles identically -- some frontends (cobol, report) have no
    // const/enum syntax, and enum member access (Enum.Member) is not portable.
    try { ast = resolveConstantsInAst(ast); } catch (e) { /* keep original ast */ }
    if (toLang === "c") return astToC(ast);
    if (toLang === "basic") return astToBasic(ast);
    if (toLang === "python") return astToPython(ast);
    if (toLang === "english") return astToEnglish(ast);
    if (toLang === "cobol") return astToCobol(ast);
    if (toLang === "report") return astToReport(ast);
    if (toLang === "functional") return astToFunctional(ast);
    return src;
  }

  // Inline user constants and enum members as Num literals and drop the ConstDecl
  // / EnumDecl nodes. Mirrors the compiler's evalConstExpr + defineEnum so the
  // portable ("ENUM_MEMBER") and dotted (Enum.Member) forms both resolve.
  function resolveConstantsInAst(prog) {
    var consts = {};
    function ev(e) {
      if (!e) return null;
      if (e.t === "Num") return e.value | 0;
      if (e.t === "Var") {
        var k = String(e.name).toUpperCase();
        if (Object.prototype.hasOwnProperty.call(consts, k)) return consts[k] | 0;
        return namedConstant(e.name);
      }
      if (e.t === "FieldRef") {
        var fk = (e.obj + "." + e.field).toUpperCase();
        if (Object.prototype.hasOwnProperty.call(consts, fk)) return consts[fk] | 0;
        return namedConstant(e.obj + "." + e.field);
      }
      if (e.t === "Unary" && e.op === "-") { var u = ev(e.operand); return u == null ? null : (-u) | 0; }
      if (e.t === "Bin") {
        var a = ev(e.lhs), b = ev(e.rhs);
        if (a == null || b == null) return null;
        if (e.op === "+") return (a + b) | 0;
        if (e.op === "-") return (a - b) | 0;
        if (e.op === "*") return (a * b) | 0;
        if (e.op === "/") return b ? (a / b) | 0 : null;
        if (e.op === "%" || e.op === "MOD") return b ? (a - ((a / b) | 0) * b) | 0 : null;
      }
      return null;
    }
    function collect(node) {
      if (node == null || typeof node !== "object") return;
      if (Array.isArray(node)) { node.forEach(collect); return; }
      if (node.t === "ConstDecl") { consts[String(node.name).trim().toUpperCase()] = ev(node.value) | 0; }
      else if (node.t === "EnumDecl") {
        var ek = String(node.enum_name).trim().toUpperCase(), cur = -1;
        (node.members || []).forEach(function (m) {
          cur = (m[1] == null) ? (cur + 1) : (ev(m[1]) | 0);
          var mk = String(m[0]).trim().toUpperCase();
          consts[mk] = cur; consts[ek + "_" + mk] = cur; consts[ek + "." + mk] = cur;
        });
      }
      for (var k in node) if (Object.prototype.hasOwnProperty.call(node, k)) collect(node[k]);
    }
    function lookup(name) {
      var k = String(name).toUpperCase();
      return Object.prototype.hasOwnProperty.call(consts, k) ? consts[k] : null;
    }
    function xform(node) {
      if (Array.isArray(node)) {
        var out = [];
        node.forEach(function (n) {
          if (n && typeof n === "object" && (n.t === "ConstDecl" || n.t === "EnumDecl")) return;
          out.push(xform(n));
        });
        return out;
      }
      if (node == null || typeof node !== "object") return node;
      if (node.t === "Var") { var v = lookup(node.name); return (v == null) ? node : { t: "Num", value: v | 0 }; }
      if (node.t === "FieldRef") { var fv = lookup(node.obj + "." + node.field); if (fv != null) return { t: "Num", value: fv | 0 }; }
      var copy = {};
      for (var k in node) if (Object.prototype.hasOwnProperty.call(node, k)) copy[k] = xform(node[k]);
      return copy;
    }
    collect(prog);
    return xform(prog);
  }

  function exprStr(e, L) {
    if (!e) return "0";
    if (e.t === "Num") return String(e.value);
    if (e.t === "Str") {
      var q = (L === "report" || L === "cobol") ? "'" : '"';
      var s = String(e.value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
      s = (q === "'") ? s.replace(/'/g, "\\'") : s.replace(/"/g, '\\"');
      return q + s + q;
    }
    if (e.t === "Var") return targetName(e.name, L);
    if (e.t === "Call") {
      var p = e.ns ? (e.ns + ".") : "";
      return p + e.method + "(" + (e.args || []).map(function (a) { return exprStr(a, L); }).join(", ") + ")";
    }
    if (e.t === "Bin") {
      var op = e.op;
      if (L === "basic" || L === "report" || L === "cobol") {
        if (op === "%" || op === "MOD") op = "MOD";
        if (op === "&&" || op === "AND") op = "AND";
        if (op === "||" || op === "OR") op = "OR";
      } else if (L === "python" || L === "functional" || L === "english") {
        if (op === "&&" || op === "AND") op = "and";
        else if (op === "||" || op === "OR") op = "or";
        else if (op === "MOD") op = (L === "english" ? "modulo" : "%");
      }
      return exprStr(e.lhs, L) + " " + op + " " + exprStr(e.rhs, L);
    }
    if (e.t === "Cmp") {
      var m = { EQ:"==", NE:"!=", LT:"<", GT:">", LE:"<=", GE:">=" };
      var bm = { EQ:"=", NE:"<>", LT:"<", GT:">", LE:"<=", GE:">=" };
      var map = (L === "basic" || L === "report" || L === "cobol") ? bm : m;
      return exprStr(e.lhs, L) + " " + (map[e.cond] || e.cond) + " " + exprStr(e.rhs, L);
    }
    if (e.t === "Ternary") {
      if (L === "basic") return "IIF(" + exprStr(e.cond, L) + ", " + exprStr(e.then, L) + ", " + exprStr(e.els, L) + ")";
      if (L === "python") return exprStr(e.then, L) + " if " + exprStr(e.cond, L) + " else " + exprStr(e.els, L);
      if (L === "functional") return "if " + exprStr(e.cond, L) + " then " + exprStr(e.then, L) + " else " + exprStr(e.els, L);
      if (L === "english") return exprStr(e.then, L) + " if " + exprStr(e.cond, L) + " otherwise " + exprStr(e.els, L);
      return "(" + exprStr(e.cond, L) + " ? " + exprStr(e.then, L) + " : " + exprStr(e.els, L) + ")";
    }
    if (e.t === "FieldRef") return "Storage.GetField(" + exprStr({ t: "Str", value: e.field }, L) + ")";
    if (e.t === "IncDec") {
      var name = incDecName(e), delta = incDecDelta(e);
      if (!name) return "?";
      name = targetName(name, L);
      if (L === "c") return e.prefix ? (delta >= 0 ? "++" : "--") + name : name + (delta >= 0 ? "++" : "--");
      return name + (delta >= 0 ? " + " : " - ") + Math.abs(delta);
    }
    return "?";
  }
  function splitProgDefs(prog) {
    var defs = [], body = [];
    prog.forEach(function (s) { if (s.t === "Func" || s.t === "Sub") defs.push(s); else body.push(s); });
    return { defs: defs, body: body };
  }
  function incDecName(s) {
    if (!s) return null;
    if (s.name) return s.name;
    if (s.target && s.target.t === "Var") return s.target.name;
    return null;
  }
  function incDecDelta(s) {
    if (!s) return 0;
    if (s.delta != null) return s.delta;
    if (s.op === "++") return 1;
    if (s.op === "--") return -1;
    return 0;
  }
  function targetName(name, L) {
    name = String(name || "");
    var up = name.toUpperCase();
    if (L === "cobol" && COB_KW[up]) return "v_" + name;
    if (L === "report" && REP_KW[up]) return "v_" + name;
    return name;
  }
  function targetLabel(name, L) { return targetName(name, L); }
  function collectFieldObjs(e, out) {
    if (!e) return;
    if (e.t === "FieldRef") { out.push(e.obj); return; }
    if (e.t === "Bin" || e.t === "Cmp") { collectFieldObjs(e.lhs, out); collectFieldObjs(e.rhs, out); return; }
    if (e.t === "Ternary") { collectFieldObjs(e.cond, out); collectFieldObjs(e.then, out); collectFieldObjs(e.els, out); return; }
    if (e.t === "Unary") { collectFieldObjs(e.operand, out); return; }
    if (e.t === "Call") { (e.args || []).forEach(function (a) { collectFieldObjs(a, out); }); return; }
    if (e.t === "IncDec") collectFieldObjs(e.target, out);
  }
  function singleFieldObj(e) {
    var out = [];
    collectFieldObjs(e, out);
    if (!out.length) return null;
    for (var i = 1; i < out.length; i++) if (out[i] !== out[0]) return null;
    return out[0];
  }
  function doLoopCondExpr(s) {
    var cond = s.botCond || s.cond || { t: "Num", value: 1 };
    return (s.until || s.botUntil) ? { t: "Cmp", cond: "EQ", lhs: cond, rhs: { t: "Num", value: 0 } } : cond;
  }
  function cForClause(s) {
    if (!s) return "";
    if (s.t === "ExprStmt") return cForClause(s.expr);
    if (s.t === "Decl" || s.t === "Let" || s.t === "Dim") return "int " + s.name + " = " + exprStr(s.init || s.value || { t: "Num", value: 0 }, "c");
    if (s.t === "Assign") return s.name + " = " + exprStr(s.value, "c");
    if (s.t === "IncDec") { var n = incDecName(s); return n ? (n + (incDecDelta(s) >= 0 ? "++" : "--")) : ""; }
    return exprStr(s, "c");
  }
  function forLoopInfo(s) {
    if (!s || s.t !== "For" || !s.init || !s.cond) return null;
    var cmpMap = { "<": "LT", "<=": "LE", ">": "GT", ">=": "GE", "==": "EQ" };
    var cmp = s.cond.cond || cmpMap[s.cond.op] || s.cond.op;
    var lhs = s.cond.lhs, rhs = s.cond.rhs;
    var v = (s.init && s.init.name) || (lhs && lhs.t === "Var" ? lhs.name : null) || incDecName(s.step);
    if (!v || !rhs) return null;
    var start = s.init.init || s.init.value || { t: "Num", value: 0 };
    var end = rhs;
    if (cmp === "LT") end = { t: "Bin", op: "-", lhs: rhs, rhs: { t: "Num", value: 1 } };
    else if (cmp !== "LE") return null;
    var stepNode = s.step && s.step.t === "ExprStmt" ? s.step.expr : s.step;
    var step = { t: "Num", value: 1 };
    if (stepNode && stepNode.t === "Assign" && stepNode.name === v && stepNode.value && stepNode.value.t === "Bin" && stepNode.value.lhs && stepNode.value.lhs.t === "Var" && stepNode.value.lhs.name === v) {
      if (stepNode.value.op === "+") step = stepNode.value.rhs;
      else if (stepNode.value.op === "-") step = { t: "Bin", op: "-", lhs: { t: "Num", value: 0 }, rhs: stepNode.value.rhs };
    } else if (stepNode && stepNode.t === "IncDec") {
      step = { t: "Num", value: incDecDelta(stepNode) || 1 };
    }
    return { v: v, start: start, end: end, step: step };
  }
  function stmtPlainCall(s) {
    var call = null;
    if (s && s.t === "CallStmt") call = s.call;
    else if (s && s.t === "ExprStmt") call = s.expr;
    return call && call.t === "Call" && !call.ns ? call : null;
  }
  function astToC(prog) {
    var parts = splitProgDefs(prog), l = [];
    parts.defs.forEach(function (fn) {
      l.push("void " + fn.name + "(" + (fn.params || []).map(function (p) { return "int " + p; }).join(", ") + ") {");
      (fn.body || []).forEach(function (s) { l.push(sC(s, 1)); });
      l.push("}");
    });
    parts.body.forEach(function (s) { l.push(sC(s, 0)); });
    return l.join("\n");
  }
  function sC(s,d){var p="    ".repeat(d||0);if(!s)return"";if(s.t==="Decl"||s.t==="Let"||s.t==="Dim")return p+"int "+s.name+" = "+exprStr(s.init||s.value||{t:"Num",value:0},"c")+";";if(s.t==="Assign")return p+s.name+" = "+exprStr(s.value,"c")+";";if(s.t==="IncDec")return p+s.name+(s.delta>0?"++":"--")+";";if(s.t==="If"){var arms=s.arms||[[s.cond,s.then]];var els=s.els;var o=p+"if ("+exprStr(arms[0][0],"c")+") {\n";arms[0][1].forEach(function(st){o+=sC(st,d+1)+"\n";});o+=p+"}";for(var i=1;i<arms.length;i++){o+=" else if ("+exprStr(arms[i][0],"c")+") {\n";arms[i][1].forEach(function(st){o+=sC(st,d+1)+"\n";});o+=p+"}";}if(els){o+=" else {\n";(Array.isArray(els)?els:[els]).forEach(function(st){o+=sC(st,d+1)+"\n";});o+=p+"}";}return o;}if(s.t==="While"){var o=p+"while ("+exprStr(s.cond,"c")+") {\n";s.body.forEach(function(st){o+=sC(st,d+1)+"\n";});return o+p+"}";}if(s.t==="ForTo")return p+"for ("+s.v+" = "+exprStr(s.start,"c")+"; "+s.v+" <= "+exprStr(s.end,"c")+"; "+s.v+"++) {\n"+s.body.map(function(st){return sC(st,d+1);}).join("\n")+"\n"+p+"}";if(s.t==="ForEach")return p+"for ("+s.v+" = 0; "+s.v+" < "+exprStr(s.count,"c")+"; "+s.v+"++) {\n"+s.body.map(function(st){return sC(st,d+1);}).join("\n")+"\n"+p+"}";if(s.t==="Return")return p+"return"+(s.value?" "+exprStr(s.value,"c"):"")+";";if(s.t==="Break")return p+"break;";if(s.t==="Skip"||s.t==="Continue")return p+"continue;";if(s.t==="Goto")return p+"goto "+s.label+";";if(s.t==="Label")return p+s.name+":";if(s.t==="Gosub"){var a=(s.args||[]).map(function(x){return exprStr(x,"c");});return p+s.name+"("+a.join(", ")+");";}if(s.t==="CallStmt")return p+exprStr(s.call,"c")+";";if(s.t==="ExprStmt"){if(s.expr&&s.expr.t==="Call"&&!s.expr.ns&&s.expr.method==="print")return p+"print("+exprStr(s.expr.args[0],"c")+");";return s.expr?p+exprStr(s.expr,"c")+";":"";}if(s.t==="Print")return p+"print("+exprStr(s.value,"c")+");";if(s.t==="Switch"||s.t==="Dispatch"){var o=p+(s.t==="Dispatch"?"dispatch":"switch")+" ("+exprStr(s.expr,"c")+") {\n";(s.cases||[]).forEach(function(c){o+=p+"    case "+exprStr(c[0],"c")+": ";c[1].forEach(function(st){o+=sC(st,d+2)+"\n";});o+=p+"    break;\n";});if(s.def||s.els){o+=p+"    default: ";(s.def||s.els||[]).forEach(function(st){o+=sC(st,d+2)+"\n";});}return o+p+"}";}if(s.t==="DoLoop"||s.t==="DoWhile"){var cond=s.botCond||s.cond||{t:"Num",value:1};return p+"do {\n"+(s.body||[]).map(function(st){return sC(st,d+1);}).join("\n")+"\n"+p+"} while ("+exprStr(cond,"c")+");";}if(s.t==="For")return p+"for ("+cForClause(s.init)+"; "+(s.cond?exprStr(s.cond,"c"):"")+"; "+cForClause(s.step)+") {\n"+(s.body||[]).map(function(st){return sC(st,d+1);}).join("\n")+"\n"+p+"}";if(s.t==="ServerMain")return (s.body||[]).map(function(st){return sC(st,d);}).join("\n");return p+"// "+s.t;}
  function astToBasic(prog) {
    var parts = splitProgDefs(prog), l = [];
    parts.defs.forEach(function (f) {
      var pa = (f.params || []).length ? "(" + f.params.join(", ") + ")" : "";
      l.push("SUB " + (f.name || "") + pa);
      (f.body || []).forEach(function (s) { l.push(sB(s, 1)); });
      l.push("ENDSUB");
    });
    parts.body.forEach(function (s) { l.push(sB(s, 0)); });
    return l.join("\n");
  }
  function sB(s,d){var p="    ".repeat(d||0);if(!s)return"";if(s.t==="Decl"||s.t==="Dim")return p+"DIM "+(s.name||"")+(s.init!=null?" = "+exprStr(s.init,"basic"):"");if(s.t==="Let"||s.t==="Assign")return p+(s.name||"")+" = "+exprStr(s.value,"basic");if(s.t==="IncDec")return p+(s.delta>0?"INC ":"DEC ")+(s.name||"");if(s.t==="If"){var arms=s.arms||[[s.cond,s.then]];var els=s.els;var o=p+"IF "+exprStr(arms[0][0],"basic")+" THEN\n";arms[0][1].forEach(function(st){o+=sB(st,d+1)+"\n";});for(var i=1;i<arms.length;i++){o+=p+"ELSEIF "+exprStr(arms[i][0],"basic")+" THEN\n";arms[i][1].forEach(function(st){o+=sB(st,d+1)+"\n";});}if(els){o+=p+"ELSE\n";(Array.isArray(els)?els:[els]).forEach(function(st){o+=sB(st,d+1)+"\n";});}return o+p+"ENDIF";}if(s.t==="While"){var o=p+"WHILE "+exprStr(s.cond,"basic")+"\n";s.body.forEach(function(st){o+=sB(st,d+1)+"\n";});return o+p+"ENDWHILE";}if(s.t==="ForTo")return p+"FOR "+(s.v||"")+" = "+exprStr(s.start,"basic")+" TO "+exprStr(s.end,"basic")+"\n"+s.body.map(function(st){return sB(st,d+1);}).join("\n")+"\n"+p+"NEXT";if(s.t==="ForEach")return p+"FOREACH "+(s.v||"")+" IN "+exprStr(s.count,"basic")+"\n"+s.body.map(function(st){return sB(st,d+1);}).join("\n")+"\n"+p+"ENDFOREACH";if(s.t==="Return")return p+"RETURN"+(s.value?" "+exprStr(s.value,"basic"):"");if(s.t==="Break")return p+"BREAK";if(s.t==="Skip"||s.t==="Continue")return p+"SKIP";if(s.t==="Goto")return p+"GOTO "+(s.label||"");if(s.t==="Label")return p+(s.name||"")+":";if(s.t==="Gosub"){var a=(s.args||[]).map(function(x){return exprStr(x,"basic");});return p+"GOSUB "+(s.name||"")+(a.length?"("+a.join(", ")+")":"");}if(s.t==="CallStmt")return p+exprStr(s.call,"basic");if(s.t==="ExprStmt"){if(s.expr&&s.expr.t==="Call"&&!s.expr.ns&&s.expr.method==="print")return p+"PRINT "+exprStr(s.expr.args[0],"basic");return s.expr?p+exprStr(s.expr,"basic"):"";}if(s.t==="Print")return p+"PRINT "+exprStr(s.value,"basic");if(s.t==="Switch"||s.t==="Dispatch"){var o=p+(s.t==="Dispatch"?"DISPATCH ":"SWITCH ")+exprStr(s.expr,"basic")+"\n";(s.cases||[]).forEach(function(c){o+=p+"    CASE "+exprStr(c[0],"basic")+"\n";c[1].forEach(function(st){o+=sB(st,d+2)+"\n";});});if(s.def||s.els){o+=p+"    DEFAULT\n";(s.def||s.els||[]).forEach(function(st){o+=sB(st,d+2)+"\n";});}return o+p+"END"+(s.t==="Dispatch"?"DISPATCH":"SWITCH");}if(s.t==="DoLoop"||s.t==="DoWhile"){var cond=s.botCond||s.cond||{t:"Num",value:1};return p+"DO\n"+(s.body||[]).map(function(st){return sB(st,d+1);}).join("\n")+"\n"+p+"LOOP UNTIL "+exprStr(cond,"basic");}if(s.t==="For"){var f=forLoopInfo(s);if(f)return p+"FOR "+f.v+" = "+exprStr(f.start,"basic")+" TO "+exprStr(f.end,"basic")+"\n"+(s.body||[]).map(function(st){return sB(st,d+1);}).join("\n")+"\n"+p+"NEXT";}if(s.t==="ServerMain")return (s.body||[]).map(function(st){return sB(st,d);}).join("\n");return p+"' "+s.t;}
  function astToPython(prog){var parts=splitProgDefs(prog),l=[],body=[];parts.defs.forEach(function(f){l.push("def "+f.name+"("+(f.params||[]).join(", ")+"):");(f.body||[]).forEach(function(s){l.push(sP(s,1));});l.push("");});parts.body.forEach(function(s){body.push(sP(s,0));});return l.concat(body).join("\n");}
  function sP(s,d){
    var p="    ".repeat(d||0), v=s&&s.value||s&&s.init||{t:"Num",value:0}, obj;
    if(!s)return"";
    if(s.t==="Decl"||s.t==="Dim"||s.t==="Let"||s.t==="Assign"){obj=singleFieldObj(v);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"python")+")\n":"")+p+s.name+" = "+exprStr(v,"python");}
    if(s.t==="FieldAssign"){var pyMethod=s.value&&s.value.t==="Str"?"SetFieldStr":"SetField";return p+"Storage.EditCard("+exprStr({t:"Var",name:s.obj},"python")+")\n"+p+"Storage."+pyMethod+"("+exprStr({t:"Str",value:s.field},"python")+", "+exprStr(s.value,"python")+")";}
    if(s.t==="IncDec")return p+incDecName(s)+" "+(incDecDelta(s)>=0?"+=":"-=")+" "+Math.abs(incDecDelta(s));
    if(s.t==="If"){var arms=s.arms||[[s.cond,s.then]],els=s.els;var o=p+"if "+exprStr(arms[0][0],"python")+":\n";arms[0][1].forEach(function(st){o+=sP(st,d+1)+"\n";});for(var i=1;i<arms.length;i++){o+=p+"elif "+exprStr(arms[i][0],"python")+":\n";arms[i][1].forEach(function(st){o+=sP(st,d+1)+"\n";});}if(els){o+=p+"else:\n";(Array.isArray(els)?els:[els]).forEach(function(st){o+=sP(st,d+1)+"\n";});}return o.trimEnd();}
    if(s.t==="While"){var o2=p+"while "+exprStr(s.cond,"python")+":\n";s.body.forEach(function(st){o2+=sP(st,d+1)+"\n";});return o2.trimEnd();}
    if(s.t==="ForTo")return p+"for "+s.v+" in range("+exprStr(s.start,"python")+", "+exprStr(s.end,"python")+" + 1):\n"+s.body.map(function(st){return sP(st,d+1);}).join("\n");
    if(s.t==="ForEach")return p+"for "+s.v+" in range("+exprStr(s.count,"python")+"):\n"+s.body.map(function(st){return sP(st,d+1);}).join("\n");
    if(s.t==="Return")return p+"return"+(s.value?" "+exprStr(s.value,"python"):"");
    if(s.t==="Break")return p+"break";
    if(s.t==="Skip"||s.t==="Continue")return p+"continue";
    if(s.t==="Goto")return p+"goto "+targetLabel(s.label,"python");
    if(s.t==="Label")return p+"label "+targetLabel(s.name,"python");
    if(s.t==="Gosub"){var a=(s.args||[]).map(function(x){return exprStr(x,"python");});return p+s.name+"("+a.join(", ")+")";}
    if(s.t==="CallStmt")return p+exprStr(s.call,"python");
    if(s.t==="ExprStmt"){if(s.expr&&s.expr.t==="Call"&&!s.expr.ns&&s.expr.method==="print"){obj=singleFieldObj(s.expr.args[0]);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"python")+")\n":"")+p+"print("+exprStr(s.expr.args[0],"python")+")";}if(s.expr&&s.expr.t==="IncDec")return sP(s.expr,d);return s.expr?p+exprStr(s.expr,"python"):"";}
    if(s.t==="Print"){obj=singleFieldObj(s.value);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"python")+")\n":"")+p+"print("+exprStr(s.value,"python")+")";}
    if(s.t==="Switch"||s.t==="Dispatch"){var o3=p+"match "+exprStr(s.expr,"python")+":\n";(s.cases||[]).forEach(function(c){o3+=p+"    case "+exprStr(c[0],"python")+":\n";c[1].forEach(function(st){o3+=sP(st,d+2)+"\n";});});if(s.def||s.els){o3+=p+"    case _:\n";(s.def||s.els||[]).forEach(function(st){o3+=sP(st,d+2)+"\n";});}return o3.trimEnd();}
    if(s.t==="DoLoop"||s.t==="DoWhile"){var cond=doLoopCondExpr(s), kw=(s.until||s.botUntil)?"until":"while";return p+"do:\n"+(s.body||[]).map(function(st){return sP(st,d+1);}).join("\n")+"\n"+kw+" "+exprStr((s.botCond||s.cond||{t:"Num",value:1}),"python");}
    if(s.t==="For"){var f=forLoopInfo(s);if(f)return p+"for "+f.v+" in range("+exprStr(f.start,"python")+", "+exprStr(f.end,"python")+" + 1):\n"+(s.body||[]).map(function(st){return sP(st,d+1);}).join("\n");}
    if(s.t==="ServerMain")return (s.body||[]).map(function(st){return sP(st,d);}).join("\n");
    return p+"# "+s.t;
  }
  function astToEnglish(prog) {
    var parts = splitProgDefs(prog), l = [];
    parts.defs.forEach(function (f) {
      var pa = (f.params || []).length ? "(" + f.params.join(", ") + ")" : "";
      l.push("Define " + f.name + pa + ":");
      (f.body || []).forEach(function (s) { l.push(sE(s, 1)); });
    });
    parts.body.forEach(function (s) { l.push(sE(s, 0)); });
    return l.join("\n");
  }
  function sE(s,d){
    var p="    ".repeat(d||0), v=s&&s.value||s&&s.init||{t:"Num",value:0}, obj;
    if(!s)return"";
    if(s.t==="Decl"||s.t==="Dim"||s.t==="Let"||s.t==="Assign"){obj=singleFieldObj(v);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"english")+").\n":"")+p+"Set "+s.name+" to "+exprStr(v,"english")+".";}
    if(s.t==="FieldAssign"){var enMethod=s.value&&s.value.t==="Str"?"SetFieldStr":"SetField";return p+"Storage.EditCard("+exprStr({t:"Var",name:s.obj},"english")+").\n"+p+"Storage."+enMethod+"("+exprStr({t:"Str",value:s.field},"english")+", "+exprStr(s.value,"english")+").";}
    if(s.t==="IncDec")return p+(incDecDelta(s)>=0?"Increase ":"Decrease ")+incDecName(s)+" by "+Math.abs(incDecDelta(s))+".";
    if(s.t==="If"){var arms=s.arms||[[s.cond,s.then]],els=s.els;var o=p+"If "+exprStr(arms[0][0],"english")+":\n";arms[0][1].forEach(function(st){o+=sE(st,d+1)+"\n";});if(els){o+=p+"Otherwise:\n";(Array.isArray(els)?els:[els]).forEach(function(st){o+=sE(st,d+1)+"\n";});}return o.trimEnd();}
    if(s.t==="While"){var o2=p+"While "+exprStr(s.cond,"english")+":\n";s.body.forEach(function(st){o2+=sE(st,d+1)+"\n";});return o2.trimEnd();}
    if(s.t==="ForTo"||s.t==="ForEach"){var n=s.count||s.end,start=s.count?{t:"Num",value:0}:s.start;return p+"For each "+(s.v||"i")+" from "+exprStr(start,"english")+" to "+exprStr(n,"english")+":\n"+(s.body||[]).map(function(st){return sE(st,d+1);}).join("\n");}
    if(s.t==="Return")return p+"Return"+(s.value?" "+exprStr(s.value,"english"):"")+".";
    if(s.t==="Break")return p+"Stop.";
    if(s.t==="Skip"||s.t==="Continue")return p+"Skip.";
    if(s.t==="Goto")return p+"Go to "+targetLabel(s.label,"english")+".";
    if(s.t==="Label")return p+"Label "+targetLabel(s.name,"english")+".";
    if(s.t==="Gosub"){var a=(s.args||[]).map(function(x){return exprStr(x,"english");});return p+"Call "+s.name+(a.length?"("+a.join(", ")+")":"")+".";}
    if(s.t==="CallStmt"){var c=stmtPlainCall(s);if(c)return p+"Call "+c.method+((c.args||[]).length?"("+c.args.map(function(x){return exprStr(x,"english");}).join(", ")+")":"")+".";return p+exprStr(s.call,"english")+".";}
    if(s.t==="ExprStmt"){if(s.expr&&s.expr.t==="Call"&&!s.expr.ns&&s.expr.method==="print"){obj=singleFieldObj(s.expr.args[0]);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"english")+").\n":"")+p+"Print "+exprStr(s.expr.args[0],"english")+".";}if(s.expr&&s.expr.t==="IncDec")return sE(s.expr,d);var c2=stmtPlainCall(s);if(c2)return p+"Call "+c2.method+((c2.args||[]).length?"("+c2.args.map(function(x){return exprStr(x,"english");}).join(", ")+")":"")+".";return s.expr?p+exprStr(s.expr,"english")+".":"";}
    if(s.t==="Print"){obj=singleFieldObj(s.value);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"english")+").\n":"")+p+"Print "+exprStr(s.value,"english")+".";}
    if(s.t==="Switch"||s.t==="Dispatch"){var o3=p+"Choose "+exprStr(s.expr,"english")+":\n";(s.cases||[]).forEach(function(c){o3+=p+"    When "+exprStr(c[0],"english")+":\n";c[1].forEach(function(st){o3+=sE(st,d+2)+"\n";});});if(s.def||s.els){o3+=p+"    Otherwise:\n";(s.def||s.els||[]).forEach(function(st){o3+=sE(st,d+2)+"\n";});}return o3.trimEnd();}
    if(s.t==="DoLoop"||s.t==="DoWhile"){var kw=(s.until||s.botUntil)?"Until ":"While ";return p+"Repeat:\n"+(s.body||[]).map(function(st){return sE(st,d+1);}).join("\n")+"\n"+p+kw+exprStr((s.botCond||s.cond||{t:"Num",value:1}),"english")+".";}
    if(s.t==="For"){var f=forLoopInfo(s);if(f)return p+"For each "+f.v+" from "+exprStr(f.start,"english")+" to "+exprStr(f.end,"english")+":\n"+(s.body||[]).map(function(st){return sE(st,d+1);}).join("\n");}
    if(s.t==="ServerMain")return (s.body||[]).map(function(st){return sE(st,d);}).join("\n");
    return p+"' "+s.t;
  }

  function astToCobol(prog){
    var main=[],subs=[];
    prog.forEach(function(s){if(s.t==="Func"||s.t==="Sub")subs.push(s);else main.push(s);});
    var l=["IDENTIFICATION DIVISION.","PROGRAM-ID. PICO.","PROCEDURE DIVISION."];
    main.forEach(function(s){l.push(sCob(s,1));});
    subs.forEach(function(f){
      l.push((f.name||"SUB")+".");
      (f.params||[]).forEach(function(p,i){l.push(sCob({t:"Assign",name:p,value:{t:"Var",name:"__arg"+i+"__"}},1));});
      (f.body||[]).forEach(function(s){l.push(sCob(s,1));});
    });
    return l.join("\n");
  }
  function sCob(s,d){
    var p="    ".repeat(d||0), value=s&&(s.value||s.init||{t:"Num",value:0}), obj, arms, els, o, f, once, loop, cond;
    if(!s)return"";
    if(s.t==="Decl"||s.t==="Dim"||s.t==="Let"||s.t==="Assign"){
      var cobName=targetName(s.name,"cobol");
      if(value&&value.t==="Ternary")return p+"IF "+exprStr(value.cond,"cobol")+"\n"+p+"    COMPUTE "+cobName+" = "+exprStr(value.then,"cobol")+".\n"+p+"ELSE\n"+p+"    COMPUTE "+cobName+" = "+exprStr(value.els,"cobol")+".\n"+p+"END-IF.";
      obj=singleFieldObj(value);
      return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"cobol")+").\n":"")+p+"COMPUTE "+cobName+" = "+exprStr(value,"cobol")+".";
    }
    if(s.t==="FieldAssign"){var cobMethod=s.value&&s.value.t==="Str"?"SetFieldStr":"SetField";return p+"Storage.EditCard("+exprStr({t:"Var",name:s.obj},"cobol")+").\n"+p+"Storage."+cobMethod+"("+exprStr({t:"Str",value:s.field},"cobol")+", "+exprStr(s.value,"cobol")+").";}
    if(s.t==="Print"){obj=singleFieldObj(s.value);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"cobol")+").\n":"")+p+"DISPLAY "+exprStr(s.value,"cobol")+".";}
    if(s.t==="ExprStmt"){
      if(s.expr&&s.expr.t==="Call"&&!s.expr.ns&&s.expr.method==="print"){obj=singleFieldObj(s.expr.args[0]);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"cobol")+").\n":"")+p+"DISPLAY "+exprStr(s.expr.args[0],"cobol")+".";}
      if(s.expr&&s.expr.t==="IncDec")return sCob(s.expr,d);
      var ec=stmtPlainCall(s);
      if(ec&&!(ec.args||[]).length)return p+"PERFORM "+ec.method+".";
      return s.expr?p+exprStr(s.expr,"cobol")+".":"";
    }
    if(s.t==="Gosub")return p+"PERFORM "+s.name+".";
    if(s.t==="CallStmt"){var cc=stmtPlainCall(s);if(cc&&!(cc.args||[]).length)return p+"PERFORM "+cc.method+".";return p+exprStr(s.call,"cobol")+".";}
    if(s.t==="Return")return s.value?p+"COMPUTE __ret__ = "+exprStr(s.value,"cobol")+".\n"+p+"STOP RUN.":p+"STOP RUN.";
    if(s.t==="IncDec"){var cobInc=targetName(incDecName(s),"cobol"),cobDelta=incDecDelta(s);return p+"COMPUTE "+cobInc+" = "+cobInc+(cobDelta>=0?" + ":" - ")+Math.abs(cobDelta)+".";}
    if(s.t==="If"){arms=s.arms||[[s.cond,s.then]];els=s.els;o=p+"IF "+exprStr(arms[0][0],"cobol");arms[0][1].forEach(function(st){o+="\n"+sCob(st,d+1);});for(var i=1;i<arms.length;i++){o+="\n"+p+"ELSE\n"+p+"    IF "+exprStr(arms[i][0],"cobol");arms[i][1].forEach(function(st){o+="\n"+sCob(st,d+2);});o+="\n"+p+"    END-IF.";}if(els){o+="\n"+p+"ELSE";(Array.isArray(els)?els:[els]).forEach(function(st){o+="\n"+sCob(st,d+1);});}return o+"\n"+p+"END-IF.";}
    if(s.t==="While")return p+"PERFORM UNTIL NOT ("+exprStr(s.cond,"cobol")+")\n"+(s.body||[]).map(function(st){return sCob(st,d+1);}).join("\n")+"\n"+p+"END-PERFORM.";
    if(s.t==="ForTo"){var cobV=targetName(s.v,"cobol"),step=s.step?exprStr(s.step,"cobol"):"1";return p+"PERFORM VARYING "+cobV+" FROM "+exprStr(s.start,"cobol")+" BY "+step+" UNTIL "+cobV+" > "+exprStr(s.end,"cobol")+"\n"+(s.body||[]).map(function(st){return sCob(st,d+1);}).join("\n")+"\n"+p+"END-PERFORM.";}
    if(s.t==="ForEach"){var cobEach=targetName(s.v,"cobol");return p+"PERFORM VARYING "+cobEach+" FROM 0 BY 1 UNTIL "+cobEach+" >= "+exprStr(s.count,"cobol")+"\n"+(s.body||[]).map(function(st){return sCob(st,d+1);}).join("\n")+"\n"+p+"END-PERFORM.";}
    if(s.t==="Break")return p+"EXIT PERFORM.";
    if(s.t==="Skip"||s.t==="Continue")return p+"EXIT PERFORM CYCLE.";
    if(s.t==="Goto")return p+"GO TO "+targetLabel(s.label,"cobol")+".";
    if(s.t==="Label")return p+targetLabel(s.name,"cobol")+".";
    if(s.t==="Switch"||s.t==="Dispatch"){o=p+"EVALUATE "+exprStr(s.expr,"cobol");(s.cases||[]).forEach(function(c){o+="\n"+p+"WHEN "+exprStr(c[0],"cobol");(c[1]||[]).forEach(function(st){o+="\n"+sCob(st,d+1);});});if(s.def){o+="\n"+p+"WHEN OTHER";s.def.forEach(function(st){o+="\n"+sCob(st,d+1);});}return o+"\n"+p+"END-EVALUATE.";}
    if(s.t==="DoLoop"||s.t==="DoWhile"){cond=doLoopCondExpr(s);once=(s.body||[]).map(function(st){return sCob(st,d);}).join("\n");loop=p+"PERFORM UNTIL NOT ("+exprStr(cond,"cobol")+")\n"+(s.body||[]).map(function(st){return sCob(st,d+1);}).join("\n")+"\n"+p+"END-PERFORM.";return once+(once&&loop?"\n":"")+loop;}
    if(s.t==="For"){f=forLoopInfo(s);if(f){var cobFor=targetName(f.v,"cobol");return p+"PERFORM VARYING "+cobFor+" FROM "+exprStr(f.start,"cobol")+" BY "+exprStr(f.step,"cobol")+" UNTIL "+cobFor+" > "+exprStr(f.end,"cobol")+"\n"+(s.body||[]).map(function(st){return sCob(st,d+1);}).join("\n")+"\n"+p+"END-PERFORM.";}}
    if(s.t==="ServerMain")return (s.body||[]).map(function(st){return sCob(st,d);}).join("\n");
    return p+"*> "+s.t;
  }
  function astToReport(prog){
    var l=[],subs=[];
    prog.forEach(function(s){if(s.t==="Func"||s.t==="Sub")subs.push(s);else l.push(sRep(s,0));});
    subs.forEach(function(f){
      var pa=(f.params&&f.params.length)?" USING "+f.params.map(function(p){return targetName(p,"report");}).join(" "):"";
      l.push("FORM "+f.name+pa+".");
      (f.body||[]).forEach(function(s){l.push(sRep(s,1));});
      l.push("ENDFORM.");
    });
    return l.join("\n");
  }
  function sRep(s,d){
    var p="  ".repeat(d||0), value=s&&(s.value||s.init||{t:"Num",value:0}), obj, arms, els, o, f, once, loop, cond;
    if(!s)return"";
    if(s.t==="Decl"||s.t==="Dim"||s.t==="Let"||s.t==="Assign"){
      var repName=targetName(s.name,"report");
      if(value&&value.t==="Ternary")return p+"IF "+exprStr(value.cond,"report")+".\n"+p+"  "+repName+" = "+exprStr(value.then,"report")+".\n"+p+"ELSE.\n"+p+"  "+repName+" = "+exprStr(value.els,"report")+".\n"+p+"ENDIF.";
      obj=singleFieldObj(value);
      return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"report")+").\n":"")+p+repName+" = "+exprStr(value,"report")+".";
    }
    if(s.t==="FieldAssign"){var repMethod=s.value&&s.value.t==="Str"?"SetFieldStr":"SetField";return p+"Storage.EditCard("+exprStr({t:"Var",name:s.obj},"report")+").\n"+p+"Storage."+repMethod+"("+exprStr({t:"Str",value:s.field},"report")+", "+exprStr(s.value,"report")+").";}
    if(s.t==="Print"){obj=singleFieldObj(s.value);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"report")+").\n":"")+p+"WRITE "+exprStr(s.value,"report")+".";}
    if(s.t==="ExprStmt"){
      if(s.expr&&s.expr.t==="Call"&&!s.expr.ns&&s.expr.method==="print"){obj=singleFieldObj(s.expr.args[0]);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"report")+").\n":"")+p+"WRITE "+exprStr(s.expr.args[0],"report")+".";}
      if(s.expr&&s.expr.t==="IncDec")return sRep(s.expr,d);
      var ec=stmtPlainCall(s);if(ec)return p+"PERFORM "+ec.method+((ec.args||[]).length?" USING "+ec.args.map(function(x){return exprStr(x,"report");}).join(" "):"")+".";
      return s.expr?p+exprStr(s.expr,"report")+".":"";
    }
    if(s.t==="IncDec"){var repInc=targetName(incDecName(s),"report"),repDelta=incDecDelta(s);return p+repInc+" = "+repInc+(repDelta>=0?" + ":" - ")+Math.abs(repDelta)+".";}
    if(s.t==="Gosub"){var a=(s.args||[]).map(function(x){return exprStr(x,"report");});return p+"PERFORM "+s.name+(a.length?" USING "+a.join(" "):"")+".";}
    if(s.t==="CallStmt"){var cc=stmtPlainCall(s);if(cc)return p+"PERFORM "+cc.method+((cc.args||[]).length?" USING "+cc.args.map(function(x){return exprStr(x,"report");}).join(" "):"")+".";return p+exprStr(s.call,"report")+".";}
    if(s.t==="Return")return p+"RETURN"+(s.value?" "+exprStr(s.value,"report"):"")+".";
    if(s.t==="Break")return p+"EXIT.";
    if(s.t==="Skip"||s.t==="Continue")return p+"CONTINUE.";
    if(s.t==="If"){arms=s.arms||[[s.cond,s.then]];els=s.els;o=p+"IF "+exprStr(arms[0][0],"report")+".";arms[0][1].forEach(function(st){o+="\n"+sRep(st,d+1);});for(var i=1;i<arms.length;i++){o+="\n"+p+"ELSEIF "+exprStr(arms[i][0],"report")+".";arms[i][1].forEach(function(st){o+="\n"+sRep(st,d+1);});}if(els){o+="\n"+p+"ELSE.";(Array.isArray(els)?els:[els]).forEach(function(st){o+="\n"+sRep(st,d+1);});}return o+"\n"+p+"ENDIF.";}
    if(s.t==="While")return p+"WHILE "+exprStr(s.cond,"report")+".\n"+(s.body||[]).map(function(st){return sRep(st,d+1);}).join("\n")+"\n"+p+"ENDWHILE.";
    if(s.t==="Switch"||s.t==="Dispatch"){o=p+"CASE "+exprStr(s.expr,"report")+".";(s.cases||[]).forEach(function(c){o+="\n"+p+"WHEN "+exprStr(c[0],"report")+"."; (c[1]||[]).forEach(function(st){o+="\n"+sRep(st,d+1);});});if(s.def){o+="\n"+p+"WHEN OTHERS.";s.def.forEach(function(st){o+="\n"+sRep(st,d+1);});}return o+"\n"+p+"ENDCASE.";}
    if(s.t==="ForEach")return p+"LOOP AT "+exprStr(s.count,"report")+" INTO "+targetName(s.v||"I","report")+".\n"+(s.body||[]).map(function(st){return sRep(st,d+1);}).join("\n")+"\n"+p+"ENDLOOP.";
    if(s.t==="ForTo"){var repLoop=targetName(s.v||"I","report"),repTmp="__"+repLoop+"_loop",repCnt={t:"Bin",op:"+",lhs:{t:"Bin",op:"-",lhs:s.end,rhs:s.start},rhs:{t:"Num",value:1}},repVal={t:"Bin",op:"+",lhs:s.start,rhs:{t:"Var",name:repTmp}};return p+"LOOP AT "+exprStr(repCnt,"report")+" INTO "+repTmp+".\n"+p+"  "+repLoop+" = "+exprStr(repVal,"report")+".\n"+(s.body||[]).map(function(st){return sRep(st,d+1);}).join("\n")+"\n"+p+"ENDLOOP.";}
    if(s.t==="Goto")return p+"GOTO "+targetLabel(s.label,"report")+".";
    if(s.t==="Label")return p+"LABEL "+targetLabel(s.name,"report")+".";
    if(s.t==="DoLoop"||s.t==="DoWhile"){cond=doLoopCondExpr(s);once=(s.body||[]).map(function(st){return sRep(st,d);}).join("\n");loop=p+"WHILE "+exprStr(cond,"report")+".\n"+(s.body||[]).map(function(st){return sRep(st,d+1);}).join("\n")+"\n"+p+"ENDWHILE.";return once+(once&&loop?"\n":"")+loop;}
    if(s.t==="For"){f=forLoopInfo(s);if(f){var repFor=targetName(f.v,"report"),cnt2={t:"Bin",op:"+",lhs:{t:"Bin",op:"-",lhs:f.end,rhs:f.start},rhs:{t:"Num",value:1}},tmp="__"+repFor+"_loop",loopVal={t:"Bin",op:"+",lhs:f.start,rhs:{t:"Var",name:tmp}},body=(s.body||[]).map(function(st){return sRep(st,d+1);}).join("\n");return p+"LOOP AT "+exprStr(cnt2,"report")+" INTO "+tmp+".\n"+p+"  "+repFor+" = "+exprStr(loopVal,"report")+".\n"+body+"\n"+p+"ENDLOOP.";}}
    return p+"* "+s.t;
  }
  function astToFunctional(prog){
    var defs=[],body=[];
    prog.forEach(function(s){if(s.t==="Func"||s.t==="Sub")defs.push(s);else body.push(s);});
    var l=[];
    defs.forEach(function(f){
      var pa=(f.params||[]).join(" ");
      if((f.body||[]).length===1&&f.body[0].t==="Return"&&f.body[0].value)l.push("let "+f.name+(pa?" "+pa:" ()")+" = "+exprStr(f.body[0].value,"functional"));
      else{l.push("let "+f.name+(pa?" "+pa:" ()")+" =");(f.body||[]).forEach(function(s){l.push(sFun(s,1));});}
      l.push("");
    });
    body.forEach(function(s){l.push(sFun(s,0));});
    return l.join("\n").replace(/\n+$/,"");
  }
  function sFun(s,d){
    var p="    ".repeat(d||0), value=s&&(s.value||s.init||{t:"Num",value:0}), obj, arms, els, o, f, once, loop, cond;
    if(!s)return"";
    if(s.t==="Decl"||s.t==="Dim"||s.t==="Let"){obj=singleFieldObj(value);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"functional")+")\n":"")+p+"let "+s.name+" = "+exprStr(value,"functional");}
    if(s.t==="Assign"){obj=singleFieldObj(s.value);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"functional")+")\n":"")+p+s.name+" = "+exprStr(s.value,"functional");}
    if(s.t==="FieldAssign"){var funMethod=s.value&&s.value.t==="Str"?"SetFieldStr":"SetField";return p+"Storage.EditCard("+exprStr({t:"Var",name:s.obj},"functional")+")\n"+p+"Storage."+funMethod+"("+exprStr({t:"Str",value:s.field},"functional")+", "+exprStr(s.value,"functional")+")";}
    if(s.t==="Print"){obj=singleFieldObj(s.value);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"functional")+")\n":"")+p+"printfn "+exprStr(s.value,"functional");}
    if(s.t==="ExprStmt"){if(s.expr&&s.expr.t==="Call"&&!s.expr.ns&&s.expr.method==="print"){obj=singleFieldObj(s.expr.args[0]);return(obj?p+"Storage.EditCard("+exprStr({t:"Var",name:obj},"functional")+")\n":"")+p+"printfn "+exprStr(s.expr.args[0],"functional");}if(s.expr&&s.expr.t==="IncDec")return sFun(s.expr,d);return s.expr?p+exprStr(s.expr,"functional"):"";}
    if(s.t==="IncDec"){var funInc=incDecName(s),funDelta=incDecDelta(s);return p+funInc+" = "+funInc+(funDelta>=0?" + ":" - ")+Math.abs(funDelta);}
    if(s.t==="Return")return p+(s.value?"return "+exprStr(s.value,"functional"):"return");
    if(s.t==="Break")return p+"break";
    if(s.t==="Skip"||s.t==="Continue")return p+"continue";
    if(s.t==="CallStmt")return p+exprStr(s.call,"functional");
    if(s.t==="Gosub"){var a=(s.args||[]).map(function(x){return exprStr(x,"functional");});return p+s.name+"("+a.join(", ")+")";}
    if(s.t==="Goto")return p+"goto "+targetLabel(s.label,"functional");
    if(s.t==="Label")return p+"label "+targetLabel(s.name,"functional");
    if(s.t==="If"){arms=s.arms||[[s.cond,s.then]];els=s.els;o=p+"if "+exprStr(arms[0][0],"functional")+" then\n"+(arms[0][1]||[]).map(function(st){return sFun(st,d+1);}).join("\n");for(var i=1;i<arms.length;i++){o+="\n"+p+"else\n"+sFun({t:"If",arms:[arms[i]],els:null},d+1);}if(els){o+="\n"+p+"else\n"+els.map(function(st){return sFun(st,d+1);}).join("\n");}return o;}
    if(s.t==="While")return p+"while "+exprStr(s.cond,"functional")+" do\n"+(s.body||[]).map(function(st){return sFun(st,d+1);}).join("\n");
    if(s.t==="ForTo")return p+"for "+s.v+" in "+exprStr(s.start,"functional")+".."+exprStr(s.end,"functional")+" do\n"+(s.body||[]).map(function(st){return sFun(st,d+1);}).join("\n");
    if(s.t==="ForEach")return p+"for "+s.v+" in "+exprStr(s.count,"functional")+" do\n"+(s.body||[]).map(function(st){return sFun(st,d+1);}).join("\n");
    if(s.t==="Switch"||s.t==="Dispatch"){o=p+"match "+exprStr(s.expr,"functional")+" with";(s.cases||[]).forEach(function(c){o+="\n"+p+"| "+exprStr(c[0],"functional")+" ->";if((c[1]||[]).length===1)o+=" "+sFun(c[1][0],0).replace(/^\s+/,"");else o+="\n"+(c[1]||[]).map(function(st){return sFun(st,d+1);}).join("\n");});if(s.def){o+="\n"+p+"| _ ->";if(s.def.length===1)o+=" "+sFun(s.def[0],0).replace(/^\s+/,"");else o+="\n"+s.def.map(function(st){return sFun(st,d+1);}).join("\n");}return o;}
    if(s.t==="DoLoop"||s.t==="DoWhile"){cond=doLoopCondExpr(s);once=(s.body||[]).map(function(st){return sFun(st,d);}).join("\n");loop=p+"while "+exprStr(cond,"functional")+" do\n"+(s.body||[]).map(function(st){return sFun(st,d+1);}).join("\n");return once+(once&&loop?"\n":"")+loop;}
    if(s.t==="For"){f=forLoopInfo(s);if(f)return p+"for "+f.v+" in "+exprStr(f.start,"functional")+".."+exprStr(f.end,"functional")+" do\n"+(s.body||[]).map(function(st){return sFun(st,d+1);}).join("\n");}
    return p+"// "+s.t;
  }

  return {
    compile: function (src, lang) {
      var il = compileIL(src, lang);
      return { words: lowerToBytecode(il, true), il: il };
    },
    compileDebug: function (src, lang) {
      var vars = {};
      var dbg = {};
      var words = lowerToBytecode(compileIL(src, lang), true, vars, true, dbg);
      return { words: words, vars: vars, debug: dbg };
    },
    compileC: function (src) { return { words: lowerToBytecode(compileC(src), true), il: compileC(src) }; },
    compileBasic: function (src) { return { words: lowerToBytecode(compileBasic(src), true), il: compileBasic(src) }; },
    compilePython: function (src) { return { words: lowerToBytecode(compilePython(src), true), il: compilePython(src) }; },
    compileEnglish: function (src) { return { words: lowerToBytecode(compileEnglish(src), true), il: compileEnglish(src) }; },
    compileCobol: function(src) { return { words: lowerToBytecode(compileCobol(src), true) }; },
    compileReport: function(src) { return { words: lowerToBytecode(compileReport(src), true) }; },
    compileFunctional: function(src) { return { words: lowerToBytecode(compileFunctional(src), true) }; },
    compileWithDebug: function (src, lang) {
      var dbg = {};
      var words = lowerToBytecode(compileIL(src, lang), true, null, true, dbg);
      return { words: words, debug: dbg };
    },
    translate: translate,
    symbolize: symbolize,
    offsetToLineCol: offsetToLineCol,
    sourceLineText: sourceLineText,
    FAULT_NAMES: FAULT_NAMES,
    _lowerToBytecode: lowerToBytecode,
    _VReg: VReg, _Imm: Imm, _ILBuilder: ILBuilder, _canonHost: canonHost, _encodeCardAddr: encodeCardAddr,
    _COND: COND, _COND_NEGATE: COND_NEGATE
  };
});

// picovm.js -- PicoScript 16-opcode VM in JavaScript (browser + Node).
//
// Mirrors picoscript_vm.PicoVM and vm/picovm.c exactly (int32 semantics) so the
// same bytecode yields the same register file, output bytes and HTTP status in
// the browser as on host and bare metal. Exposes a step API for debugging.
//
// Usage:
//   const vm = new PicoVM();          // optional: new PicoVM({hooks: PV_HOOKS})
//   vm.load(words);                   // words: array of uint32
//   vm.run();                         // or: while (vm.step()) { inspect vm.regs }
//   vm.regs, vm.output, vm.httpStatus, vm.pc, vm.steps, vm.halted
(function (root, factory) {
  var PicoVM = factory(root.PV_HOOKS, root.PicoCompress, root.PicoBrotli);
  root.PicoVM = PicoVM;
})(_root, function (PV_HOOKS, PicoCompress, PicoBrotli) {
  "use strict";

  var OP = {
    NOOP: 0x0, LOAD: 0x1, SAVE: 0x2, PIPE: 0x3, ADD: 0x4, SUB: 0x5, MUL: 0x6,
    DIV: 0x7, INC: 0x8, JUMP: 0x9, BRANCH: 0xA, CALL: 0xB, RETURN: 0xC,
    WAIT: 0xD, RAISE: 0xE, DSP: 0xF
  };
  var ADDR_REG = 0x1;
  var ADDR_REG_OFF = 0x3;
  var BR = { EQ: 0, NE: 1, LT: 2, GT: 3, LE: 4, GE: 5, Z: 6, NZ: 7, EOF: 8, ERR: 9 };
  var FAULT = { STEP_BUDGET: 1, BAD_OPCODE: 2, BAD_JUMP: 3, TEMPLATE: 7, CAPABILITY: 8, ALLOC: 9, CONST_WRITE: 10 };

  function picoFault(code, pc, detail, msg) {
    var e = new Error(msg);
    e.fault = code;
    e.pc = (pc == null) ? 0 : pc;
    e.detail = (detail == null) ? 0 : detail;
    return e;
  }

  function sx16(v) { v &= 0xFFFF; return (v & 0x8000) ? v - 0x10000 : v; }

  // Binding capability classes (INV-17). Bit values match vm/picovm.h PV_CAP_* and
  // picoscript_vm.CAP_*; pure computation needs none (class 0, always allowed).
  var CAP = { KERNEL: 1, QUEUE: 2, RANDOM: 4, STORAGE: 8, TIME: 16, NET: 32, CONTEXT: 64, AUTH: 128, ENV: 256, CRYPTO: 512, GPIO: 1024, CAPSULE: 2048, DEVICE: 4096, DMA: 8192, EVENT: 16384, UI: 32768, PROCESS: 65536, TIMER: 131072, PRINCIPAL: 262144, CAPSULE_EXEC: 524288 };
  var CAP_ALL = 0xFFFFF;
  var CONSTANTS = (PV_HOOKS && PV_HOOKS.CONSTANTS) || {};
  var TZ_BY_ID = {
    0: "UTC",
    1: "Europe/London",
    2: "Europe/Paris",
    3: "America/New_York",
    4: "America/Chicago",
    5: "America/Denver",
    6: "America/Los_Angeles",
    7: "Asia/Tokyo",
    8: "Asia/Singapore",
    9: "Asia/Hong_Kong",
    10: "Australia/Sydney",
    11: "Asia/Dubai"
  };
  var CURRENCY_CODE_BY_NUM = {};
  var CURRENCY_MINOR_BY_CODE = {};
  Object.keys(CONSTANTS).forEach(function (k) {
    var v = CONSTANTS[k] | 0;
    if (k.indexOf("CURRENCY_MINOR_") === 0) {
      var m = k.slice("CURRENCY_MINOR_".length);
      if (m.length === 3) CURRENCY_MINOR_BY_CODE[m] = v | 0;
    } else if (k.indexOf("CURRENCY_") === 0) {
      var c = k.slice("CURRENCY_".length);
      if (c.length === 3 && CURRENCY_CODE_BY_NUM[v] === undefined) CURRENCY_CODE_BY_NUM[v] = c;
    }
  });
  function defaultLocaleTag() {
    if (typeof navigator !== "undefined" && navigator.language) return String(navigator.language);
    return "en-US";
  }
  function defaultTimeZone() {
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      var z = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (z) return String(z);
    }
    return "UTC";
  }
  function fmtOffset(minutes) {
    var sign = (minutes >= 0) ? "+" : "-";
    var n = Math.abs(minutes | 0);
    var hh = Math.floor(n / 60), mm = n % 60;
    return sign + String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
  }
  function formatScaledInt(value, scale) {
    var s = scale | 0;
    if (s < 0) s = 0;
    if (s > 9) s = 9;
    var v = value | 0;
    if (s === 0) return String(v);
    var sign = v < 0 ? "-" : "";
    var n = Math.abs(v);
    var den = Math.pow(10, s);
    var whole = Math.floor(n / den);
    var frac = String(n % den).padStart(s, "0");
    return sign + String(whole) + "." + frac;
  }
  var CAP_BY_NS = { Kernel: CAP.KERNEL, Queue: CAP.QUEUE, Random: CAP.RANDOM,
    Req: CAP.NET, Resp: CAP.NET, Net: CAP.NET, Storage: CAP.STORAGE, DateTime: CAP.TIME,
    Context: CAP.CONTEXT, Auth: CAP.AUTH, X509: CAP.AUTH, Environment: CAP.ENV, Locale: CAP.ENV, Gpio: CAP.GPIO,
    Pack: CAP.CAPSULE, Card: CAP.CAPSULE, Fifo: CAP.CAPSULE, Device: CAP.DEVICE, Stream: CAP.DMA, Event: CAP.EVENT, Ui: CAP.UI,
    Search: CAP.STORAGE, Process: CAP.PROCESS, Env: CAP.PROCESS, Timer: CAP.TIMER, Scheduler: CAP.TIMER,
    Principal: CAP.PRINCIPAL, Capability: CAP.PRINCIPAL, Sandbox: CAP.PRINCIPAL, Capsule: CAP.CAPSULE_EXEC };
  function hookCap(name) {   // "Ns.Method" -> required capability class (0 = pure)
    var dot = name.indexOf("."), ns = name.slice(0, dot), m = name.slice(dot + 1);
    if (ns === "Maths" && (m === "Random" || m === "RandomRange")) return CAP.RANDOM;
    if (ns === "Crypto" && m === "RandomBytes") return CAP.RANDOM;
    if (ns === "Crypto" && (m === "Encrypt" || m === "Decrypt")) return CAP.CRYPTO;
    if (ns === "Http" && (m === "ReadHeader" || m === "ReadBody" || m === "GenerateHeaders" || m === "GenerateResponse")) return CAP.NET;
    return CAP_BY_NS[ns] || 0;
  }

  function PicoVM(opts) {
    opts = opts || {};
    this.hooks = opts.hooks || PV_HOOKS || { HOST_HOOK_BASE: 0x7000,
      EXT_HOST_HOOK_BASE: 0x6000,
      NET_STATUS_BASE: 0x8000, NET_BODY_MARKER: 0xB000, NET_CLOSE_MARKER: 0xC000,
      NET_HEADER_BASE: 0x9000, CONTENT_TYPES: {}, BY_CODE: {} };
    this.maxSteps = opts.maxSteps || 1000000;
    this.caps = (opts.caps !== undefined) ? (opts.caps >>> 0) : CAP_ALL;  // granted bindings (INV-17)
    this.capCeiling = (opts.capCeiling !== undefined) ? (opts.capCeiling >>> 0) : this.caps;
    this._seed = (opts.seed !== undefined) ? (opts.seed >>> 0) : null;     // host-injected Random.U32 seed (INV-15)
    this.noAlloc = !!opts.noAlloc;          // hot-path no-allocation mode (INV-5)
    // Optional external card store (PicoWAL). Must expose get(addr)->int and
    // set(addr,int); when present it persists across reset()/load(), modelling a
    // disk-backed card store. Default is an in-memory Map (VM parity unchanged).
    this._extCards = opts.cards || null;
    // Pluggable provider layer (browser harness): the editor / PIOS can inject a
    // card store (PicoStore-compatible CRUD+query, e.g. PiosCapsuleStore) and/or a
    // GPIO provider ({ pins: {}, count: N }) to back Storage.*/Gpio.*. Defaults are
    // the built-in reference store + emulator, so VM parity is unchanged.
    this._cardStore = opts.cardStore || null;
    this._gpioProvider = opts.gpioProvider || null;
    this._streamProvider = opts.streamProvider || null;
    this.reset();
  }

  PicoVM.prototype.reset = function () {
    this.regs = new Int32Array(16);
    this.cards = this._extCards || new Map();   // PicoWAL store persists if external
    this.callStack = [];
    this.output = [];          // array of byte values (0..255)
    this.outputEvents = [];    // typed chunks for display only: int / bytes / byte
    this.httpStatus = -1;
    this.httpType = null;
    this.queues = {};
    this.rng = (this._seed !== null) ? this._seed : (0x4F6CDD1D >>> 0);
    this.hostStatus = 0;                      // INV-18: typed status of the last fallible hook
    this.constFloor = 0x8000;                 // INV-9: lowest literal const-pool address ([floor,0x8000) RO)
    this.constWritten = {};
    this.mem = new Uint8Array(520 * 1024);   // process arena = RP2350 (Pico 2) 520 KB SRAM
    this.dotLen = 0;                          // active span length for Dot8.Of
    this.tensorRows = 0; this.tensorCols = 0;
    this.bitlinearRows = 0; this.bitlinearCols = 0;
    this.arenaTop = 0x8000;             // bump pointer for Span.Materialize copies
    this.spans = [null];                // span table; handle = index (1-based)
    this.maps = [null];                 // Map.* registry; handle = index (1-based)
    this.activeMap = 0;                 // Map.* active-handle (see docs/MAP.md)
    this.pc = 0;
    this.curPc = 0;
    this.steps = 0;
    this.halted = false;
    this.waiting = false;
    this.program = [];
    this.log = [];
    // Simulated PIOS I/O binding: one bound request context (I4) and one
    // response descriptor graph builder (I2) per VM invocation.
    this.requestContext = null;
    this.responseGraph = [];
    this.responseSealed = false;
    this.responseEnded = false;
    this.responseMode = null;            // 'unary' | 'stream' (set at Seal / terminal verb)
    this.responseBodyStarted = false;    // first Resp.Write opens the body phase
    this.responseStreamClosed = false;   // Resp.EndStream closes the stream/body phase
    this._localeTag = defaultLocaleTag();
    this._localeTimeZone = defaultTimeZone();
    this._handlerMark = null;   // per-request arena scope (auto rewind on each request)
  };

  PicoVM.prototype.load = function (words) {
    this.reset();
    this.program = Array.prototype.slice.call(words);
  };

  // INV-10: static verification before execution -- reject out-of-range immediate
  // JUMP/CALL/BRANCH targets (register/indexed jumps are dynamic -> runtime-checked).
  PicoVM.prototype.verify = function () {
    var n = this.program.length;
    for (var i = 0; i < n; i++) {
      var w = this.program[i] >>> 0;
      var op = (w >>> 28) & 0xF, rs2 = (w >>> 16) & 0xF, imm = w & 0xFFFF, tgt;
      if (op === OP.JUMP && rs2 === 0) tgt = imm;
      else if (op === OP.CALL) tgt = imm;
      else if (op === OP.BRANCH) tgt = i + sx16(imm);
      else continue;
      if (tgt < 0 || tgt > n) throw picoFault(FAULT.BAD_JUMP, i, tgt, "bad static target " + tgt + " at pc=" + i);
    }
  };

  PicoVM.prototype.run = function (words) {
    if (words) this.load(words);
    this.verify();                       // INV-10: verify before execution
    while (!this.halted && this.pc < this.program.length) {
      if (this.steps >= this.maxSteps) throw picoFault(FAULT.STEP_BUDGET, this.pc, 0, "step budget exceeded");
      try {
        this.step();
      } catch (ex) {
        if (ex.fault !== undefined && this._errState && this._errState.handlerPc) {
          this._errState.code = ex.fault;
          this._errState.detail = ex.detail || 0;
          this._errState.resumePc = (ex.pc || 0) + 1;
          this.pc = this._errState.handlerPc;
        } else {
          throw ex;
        }
      }
    }
    return this;
  };

  // Execute one instruction. Returns false when halted / past end (for steppers).
  PicoVM.prototype.step = function () {
    if (this.halted || this.pc >= this.program.length) { this.halted = true; return false; }
    this.steps++;
    var w = this.program[this.pc] >>> 0;
    var op = (w >>> 28) & 0xF;
    var rd = (w >>> 24) & 0xF;
    var rs1 = (w >>> 20) & 0xF;
    var rs2 = (w >>> 16) & 0xF;
    var imm = w & 0xFFFF;
    var cur = this.pc;
    this.curPc = cur;
    this.pc++;
    var r = this.regs;

    switch (op) {
      case OP.NOOP: this._noop(rd, rs1, rs2, imm); break;
      case OP.LOAD: r[rd] = this.cards.get(imm) | 0; break;
      case OP.SAVE: this.cards.set(imm, r[rs1] | 0); break;
      case OP.PIPE: this._emit(this.cards.get(imm) | 0); break;
      case OP.ADD: case OP.SUB: case OP.MUL: case OP.DIV: {
        var a = r[rs1] | 0;
        var b = (rs2 === ADDR_REG) ? (r[imm & 0xF] | 0) : sx16(imm);
        var res;
        if (op === OP.ADD) res = (a + b) | 0;
        else if (op === OP.SUB) res = (a - b) | 0;
        else if (op === OP.MUL) res = Math.imul(a, b);
        else res = (b !== 0) ? ((a / b) | 0) : 0;
        r[rd] = res;
        break;
      }
      case OP.INC: r[rd] = (r[rd] + 1) | 0; break;
      case OP.JUMP: {
        var jt;
        if (rs2 === ADDR_REG) jt = r[rs1] & 0xFFFF;
        else if (rs2 === ADDR_REG_OFF) jt = (r[rs1] + imm) & 0xFFFF;
        else jt = imm;
        if (jt < 0 || jt > this.program.length) throw picoFault(FAULT.BAD_JUMP, cur, jt, "bad jump target " + jt);  // INV-11
        this.pc = jt;
        break;
      }
      case OP.BRANCH:
        if (this._cond(rs2, r[rd], r[rs1])) {
          var bt = cur + sx16(imm);
          if (bt < 0 || bt > this.program.length) throw picoFault(FAULT.BAD_JUMP, cur, bt, "bad branch target " + bt);
          this.pc = bt;
        }
        break;
      case OP.CALL:
        if (imm < 0 || imm > this.program.length) throw picoFault(FAULT.BAD_JUMP, cur, imm, "bad call target " + imm);
        this.callStack.push(this.pc); this.pc = imm;
        break;
      case OP.RETURN:
        if (this.callStack.length) this.pc = this.callStack.pop();
        else this.halted = true;
        break;
      case OP.WAIT: this.waiting = true; this.halted = true; break;
      case OP.RAISE: this.log.push("raise " + imm); break;
      case OP.DSP: this._dsp(rd, rs1, rs2, imm); break;
      default: throw picoFault(FAULT.BAD_OPCODE, cur, op, "bad opcode " + op);   // INV-10: unknown opcode faults (was silent halt)
    }
    return !this.halted;
  };

  PicoVM.prototype._cond = function (mode, a, b) {
    a = a | 0; b = b | 0;
    switch (mode) {
      case BR.EQ: return a === b;
      case BR.NE: return a !== b;
      case BR.LT: return a < b;
      case BR.GT: return a > b;
      case BR.LE: return a <= b;
      case BR.GE: return a >= b;
      case BR.Z: return a === 0;
      case BR.NZ: return a !== 0;
      default: return false;
    }
  };

  PicoVM.prototype._emit = function (val) {
    var v = val >>> 0;
    this.output.push((v >>> 24) & 0xFF, (v >>> 16) & 0xFF, (v >>> 8) & 0xFF, v & 0xFF);
    this.outputEvents.push({ kind: "int", value: v | 0 });
  };

  PicoVM.prototype._noop = function (rd, rs1, rs2, imm) {
    var H = this.hooks;
    if ((imm & 0xFF00) === H.HOST_HOOK_BASE) {
      this._host(imm & 0xFF, rd, rs1, rs2, imm);
    } else if ((imm & 0xF000) === (H.EXT_HOST_HOOK_BASE || 0x6000)) {
      this._host(imm & 0xFFF, rd, rs1, rs2, imm);
    } else if ((imm & 0xF000) === H.NET_STATUS_BASE) {
      this.httpStatus = imm & 0x0FFF;
    } else if ((imm & 0xF000) === 0xA000) {
      this.httpType = (H.CONTENT_TYPES && H.CONTENT_TYPES[imm]) || "application/octet-stream";
    } else if (imm === H.NET_CLOSE_MARKER) {
      this.halted = true;
    }
    // body / header / genuine noop: nothing
  };

  PicoVM.prototype._host = function (code, rd, rs1, rs2, imm) {
    var name = (this.hooks.BY_CODE && this.hooks.BY_CODE[code]) || ("hook_" + code);
    // INV-17: bindings are not ambient -- deny the hook unless its class is granted.
    var need = hookCap(name);
    if (need && !(this.caps & need)) throw picoFault(FAULT.CAPABILITY, this.curPc, code, "capability denied: " + name);
    if (name === "Status.Last") { this.regs[rd] = this.hostStatus | 0; return; }   // INV-18
    if (name === "Random.U32") {
      var x = this.rng >>> 0;
      x ^= (x << 13); x >>>= 0;
      x ^= (x >>> 7);
      x ^= (x << 17); x >>>= 0;
      this.rng = x >>> 0;
      this.regs[rd] = this.rng | 0;
      return;
    }
    // ---- memory + span / slice / materialize -----------------------------
    if (name === "Memory.Set") {
      var ma = (this.regs[rs1] >>> 0) % (520 * 1024);
      if (ma >= this.constFloor && ma < 0x8000) throw picoFault(FAULT.CONST_WRITE, this.curPc, ma, "write to read-only literal const region");  // INV-9
      this.mem[ma] = this.regs[rs2] & 0xFF; return;
    }
    if (name === "Memory.SetConst") {   // INV-9: compiler-only literal write
      var mc = (this.regs[rs1] >>> 0) % (520 * 1024);
      var mb = this.regs[rs2] & 0xFF;
      if (this.constWritten[mc] && this.mem[mc] !== mb) throw picoFault(FAULT.CONST_WRITE, this.curPc, mc, "conflicting write to read-only literal const region");
      this.mem[mc] = mb;
      this.constWritten[mc] = 1;
      if (mc < this.constFloor) this.constFloor = mc;
      return;
    }
    if (name === "Memory.Get") { this.regs[rd] = this.mem[(this.regs[rs1] >>> 0) % (520 * 1024)]; return; }
    if (name === "Span.Make") {
      this.spans.push({ ptr: this.regs[rs1] & 0xFFFF, len: Math.max(0, this.regs[rs2] | 0) });
      this.regs[rd] = this.spans.length - 1; return;
    }
    if (name === "Span.Slice") {                       // zero-copy sub-span VIEW
      var s = this.spans[this.regs[rs1]] || { ptr: 0, len: 0 };
      var off = Math.max(0, Math.min(this.regs[rs2] | 0, s.len));
      this.spans.push({ ptr: s.ptr + off, len: s.len - off });
      this.regs[rd] = this.spans.length - 1; return;
    }
    if (name === "Span.Materialize") {                 // memcpy to a new region (COPY)
      var sm = this.spans[this.regs[rs1]] || { ptr: 0, len: 0 };
      var dst = this.arenaTop; this.arenaTop += sm.len;
      for (var i = 0; i < sm.len; i++) this.mem[dst + i] = this.mem[sm.ptr + i];
      this.spans.push({ ptr: dst, len: sm.len });
      this.regs[rd] = this.spans.length - 1; return;
    }
    if (name === "Span.Len") { var sl = this.spans[this.regs[rs1]]; this.regs[rd] = sl ? sl.len : 0; return; }
    if (name === "Span.Get") {
      var sg = this.spans[this.regs[rs1]] || { ptr: 0, len: 0 };
      var idx = this.regs[rs2] | 0;
      this.regs[rd] = (idx >= 0 && idx < sg.len) ? this.mem[sg.ptr + idx] : 0; return;
    }
    // ---- Arena scopes: Mark / Rewind / Reset the bump arena ----------------
    if (name === "Arena.Mark") {
      this.regs[rd] = ((((this.spans.length & 0x7FF) << 20) | (this.arenaTop & 0xFFFFF)) | 0); return;
    }
    if (name === "Arena.Rewind") {
      var mk = this.regs[rs1] >>> 0;
      this.arenaTop = mk & 0xFFFFF;
      var ac = (mk >>> 20) & 0x7FF; if (ac < 1) ac = 1;
      if (ac < this.spans.length) this.spans.length = ac;
      return;
    }
    if (name === "Arena.Reset") { this.arenaTop = 0x8000; this.spans = [null]; return; }
    // ---- Map.* first-class dictionary (active-handle model; see docs/MAP.md) ---
    if (name.indexOf("Map.") === 0) { if (this._mapHook(name.slice(4), rd, rs1, rs2)) return; }
    // ---- parsers: Json.Parse / Binary.ParseCard|SerializeCard -> Map -----------
    if (name === "Json.Parse" || name.indexOf("Binary.") === 0) { if (this._parseHook(name, rd, rs1, rs2)) return; }
    // ---- EL0-facing PIOS request/response hooks ---------------------------
    if (name.indexOf("Req.") === 0) {
      if (this._req(name.slice(4), rd, rs1, rs2)) return;
    }
    if (name.indexOf("Resp.") === 0) {
      if (this._resp(name.slice(5), rd, rs1, rs2)) return;
    }
    if (name === "Queue.Enqueue") {
      (this.queues[rs1] = this.queues[rs1] || []).push(this.regs[rd] | 0);
      return;
    }
    if (name === "Queue.Dequeue") {
      var q = this.queues[rs1] || [];
      this.hostStatus = q.length ? 0 : 3;     // INV-18: EMPTY
      this.regs[rd] = q.length ? q.shift() : 0;
      return;
    }
    if (name === "Queue.Depth") {
      this.regs[rd] = (this.queues[rs1] || []).length;
      return;
    }
    if (name.indexOf("Bits.") === 0) {
      var ba = this.regs[rs1] | 0;
      var bb = this.regs[rs2] | 0;
      var bs = bb & 31;
      if (name === "Bits.And") { this.regs[rd] = (ba & bb) | 0; return; }
      if (name === "Bits.Or")  { this.regs[rd] = (ba | bb) | 0; return; }
      if (name === "Bits.Xor") { this.regs[rd] = (ba ^ bb) | 0; return; }
      if (name === "Bits.Shl") { this.regs[rd] = (ba << bs) | 0; return; }
      if (name === "Bits.Shr") { this.regs[rd] = (ba >>> bs) | 0; return; }
      if (name === "Bits.Sar") { this.regs[rd] = (ba >> bs) | 0; return; }
      if (name === "Bits.Not") { this.regs[rd] = (~ba) | 0; return; }
    }
    if (name.indexOf("Dot8.") === 0) {
      if (name === "Dot8.Len") { this.dotLen = this.regs[rs1] >>> 0; return; }
      if (name === "Dot8.Of") {
        var n = this.dotLen | 0, sz = this.mem.length;
        var wp = (this.regs[rs1] >>> 0) % sz, ap = (this.regs[rs2] >>> 0) % sz;
        var acc = 0;
        for (var di = 0; di < n; di++) {
          var w8 = this.mem[(wp + di) % sz]; if (w8 > 127) w8 -= 256;
          var a8 = this.mem[(ap + di) % sz]; if (a8 > 127) a8 -= 256;
          acc = (acc + w8 * a8) | 0;
        }
        this.regs[rd] = acc | 0;
        return;
      }
    }
    if (name.indexOf("Tensor.") === 0) { if (this._tensor(name.slice(7), rd, rs1, rs2)) return; }
    if (name.indexOf("BitLinear.") === 0) { if (this._bitlinear(name.slice(10), rd, rs1, rs2)) return; }
    if (name.indexOf("Quant.") === 0) { if (this._quant(name.slice(6), rd, rs1, rs2)) return; }
    if (name.indexOf("Attention.") === 0) { if (this._attention(name.slice(10), rd, rs1, rs2)) return; }
    if (name.indexOf("Tokenizer.") === 0) { if (this._tokenizer(name.slice(10), rd, rs1, rs2)) return; }
    if (name.indexOf("Model.") === 0) { if (this._model(name.slice(6), rd, rs1, rs2)) return; }
    if (name.indexOf("Kv.") === 0) { if (this._kv(name.slice(3), rd, rs1, rs2)) return; }
    if (name.indexOf("Sampling.") === 0) { if (this._sampling(name.slice(9), rd, rs1, rs2)) return; }
    if (name.indexOf("Query.") === 0) { if (this._queryHelpers(name.slice(6), rd, rs1, rs2)) return; }
    if (name.indexOf("Search.") === 0) { if (this._search(name.slice(7), rd, rs1, rs2)) return; }
    // ---- program-level card store: Storage.* over a PicoStore --------------
    if (name.indexOf("Storage.") === 0) {
      if (this._storage(name.slice(8), rd, rs1, rs2)) return;
    }
    // ---- Data.* host-bound read: the browser has no server data, so return
    //      empty/0 and let the authoritative server enforce data-dependent rules.
    if (name.indexOf("Data.") === 0) {
      this.regs[rd] = (name.slice(5) === "FieldStr") ? this._strSpan("") : 0;
      return;
    }
    // ---- program-level GPIO emulator: Gpio.* (reference; PIOS injects real driver)
    if (name.indexOf("Gpio.") === 0) {
      if (this._gpio(name.slice(5), rd, rs1, rs2)) return;
    }
    // ---- Device.*/Stream.* reference DMA-ring emulator ---------------------
    if (name.indexOf("Device.") === 0) {
      if (this._device(name.slice(7), rd, rs1, rs2)) return;
    }
    if (name.indexOf("Stream.") === 0) {
      if (this._stream(name.slice(7), rd, rs1, rs2)) return;
    }
    // ---- Assert.* PSUnit assertion counters --------------------------------
    if (name.indexOf("Assert.") === 0) {
      if (this._assert(name.slice(7), rd, rs1, rs2)) return;
    }
    // ---- Event.* reactive event queue --------------------------------------
    if (name.indexOf("Event.") === 0) {
      if (this._event(name.slice(6), rd, rs1, rs2)) return;
    }
    // ---- Ui.* retained scene tree / remote windowing -----------------------
    if (name.indexOf("Ui.") === 0) {
      if (this._ui(name.slice(3), rd, rs1, rs2)) return;
    }
    // ---- String.* arena string library -------------------------------------
    if (name.indexOf("String.") === 0) {
      if (this._stringlib(name.slice(7), rd, rs1, rs2)) return;
    }
    // ---- Number.* integer/format library -----------------------------------
    if (name.indexOf("Number.") === 0) {
      if (this._numberlib(name.slice(7), rd, rs1, rs2)) return;
    }
    // ---- Template.* (AOT compile-at-save + render) -------------------------
    if (name.indexOf("Template.") === 0) {
      if (this._templatelib(name.slice(9), rd, rs1, rs2)) return;
    }
    // ---- Maths.* pure-integer ops (Power/Sqrt) -----------------------------
    if (name.indexOf("Maths.") === 0) {
      if (this._mathslib(name.slice(6), rd, rs1, rs2)) return;
    }
    // ---- Compress.* (RLE) / Crypto.* (Sha256) / Html.* (entities) ----------
    if (name.indexOf("Compress.") === 0) { if (this._compresslib(name.slice(9), rd, rs1, rs2)) return; }
    if (name.indexOf("Crypto.") === 0) { if (this._cryptolib(name.slice(7), rd, rs1, rs2)) return; }
    if (name.indexOf("Html.") === 0) { if (this._htmllib(name.slice(5), rd, rs1, rs2)) return; }
    if (name.indexOf("Http.") === 0) { if (this._httplib(name.slice(5), rd, rs1, rs2)) return; }
    // ---- Io: write raw bytes (UTF-8 strings) to the output buffer ----------
    if (name === "Io.Write") {
      var sw = this.spans[this.regs[rs1]];
      if (sw) {
        var bs = [];
        for (var iw = 0; iw < sw.len; iw++) { var bv = this.mem[sw.ptr + iw]; this.output.push(bv); bs.push(bv); }
        this.outputEvents.push({ kind: "bytes", bytes: bs });
      }
      return;
    }
    if (name === "Io.WriteByte") { var ob = this.regs[rs1] & 0xFF; this.output.push(ob); this.outputEvents.push({ kind: "byte", value: ob }); return; }
    // ---- text/binary primitives: Utf8Writer / Utf8Reader / Json / Xml -----
    if (name.indexOf("Utf8Writer.") === 0 || name.indexOf("Utf8Reader.") === 0 ||
        name.indexOf("Json.") === 0 || name.indexOf("Xml.") === 0) {
      var dot = name.indexOf(".");
      if (this._textio(name.slice(0, dot), name.slice(dot + 1), rd, rs1, rs2)) return;
    }
    if (name.indexOf("TextRender.") === 0) { if (this._textrender(name.slice(11), rd, rs1, rs2)) return; }
    // ---- OS-worker: Process/Env, Timer/Scheduler, Principal/Capability/Sandbox, Error, Capsule ----
    if (name.indexOf("Process.") === 0) { if (this._processEnv("Process", name.slice(8), rd, rs1, rs2)) return; }
    if (name.indexOf("Env.") === 0) { if (this._processEnv("Env", name.slice(4), rd, rs1, rs2)) return; }
    if (name.indexOf("Timer.") === 0) { if (this._timerScheduler("Timer", name.slice(6), rd, rs1, rs2)) return; }
    if (name.indexOf("Scheduler.") === 0) { if (this._timerScheduler("Scheduler", name.slice(10), rd, rs1, rs2)) return; }
    if (name.indexOf("Principal.") === 0) { if (this._principalCap("Principal", name.slice(10), rd, rs1, rs2)) return; }
    if (name.indexOf("Capability.") === 0) { if (this._principalCap("Capability", name.slice(11), rd, rs1, rs2)) return; }
    if (name.indexOf("Sandbox.") === 0) { if (this._principalCap("Sandbox", name.slice(8), rd, rs1, rs2)) return; }
    if (name.indexOf("Error.") === 0) { if (this._errorHook(name.slice(6), rd, rs1, rs2)) return; }
    if (name.indexOf("Capsule.") === 0) { if (this._capsuleExec(name.slice(8), rd, rs1, rs2)) return; }
    if (name.indexOf("Base64.") === 0) { if (this._base64(name.slice(7), rd, rs1, rs2)) return; }
    if (name.indexOf("Encoding.") === 0) { if (this._encoding(name.slice(9), rd, rs1, rs2)) return; }
    if (name.indexOf("DateTime.") === 0) { if (this._datetime(name.slice(9), rd, rs1, rs2)) return; }
    if (name.indexOf("Locale.") === 0) { if (this._localeHook(name.slice(7), rd, rs1, rs2)) return; }
    if (name === "Req.Param" || name === "Req.ParamCount") { if (this._reqParam(name.slice(4), rd, rs1, rs2)) return; }
    this.log.push("host " + name + " R" + rd + " R" + rs1);
  };

  // Resolve the optional PicoStore library (Node require / browser global).
  function storeLib() {
    if (false) return null; /* bundled */
    var g = (typeof globalThis !== "undefined") ? globalThis
          : (typeof self !== "undefined") ? self : this;
    return g.PicoStore;
  }

  PicoVM.prototype._spanStr = function (handle) {
    if (handle <= 0 || handle >= this.spans.length) return "";
    var s = this.spans[handle];
    if (!s) return "";
    return new TextDecoder("utf-8").decode(this.mem.subarray(s.ptr, s.ptr + s.len));
  };
  PicoVM.prototype._strToBytes = function (str) {
    var b = new TextEncoder().encode(str);
    return Array.from(b);
  };

  PicoVM.prototype._strSpan = function (text) {
    var b = new TextEncoder().encode(text);
    var dst = this.arenaTop; this.arenaTop += b.length;
    for (var i = 0; i < b.length; i++) this.mem[dst + i] = b[i];
    this.spans.push({ ptr: dst, len: b.length });
    return this.spans.length - 1;
  };

  function _bcmp(a, b, off) { for (var k = 0; k < b.length; k++) if (a[off + k] !== b[k]) return false; return true; }
  function _bfind(a, n) { if (!n.length) return 0; for (var i = 0; i + n.length <= a.length; i++) if (_bcmp(a, n, i)) return i; return -1; }
  function _bfind2(a, b0, b1, start) { for (var i = start; i + 1 < a.length; i++) if (a[i] === b0 && a[i + 1] === b1) return i; return -1; }
  function _ws(c) { return c === 32 || c === 9 || c === 10 || c === 13; }
  function _keystr(arr) { var s = ""; for (var i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]); return s; }

  // ---- shared deserializers: string/bytes -> Map entries (see docs/MAP.md) -----
  // Byte-array parsers replicated identically in picovm.py + picovm.c so a parsed
  // Map is bit-identical on every VM. Values are pushed via the caller's put*
  // callbacks (which write into the active Map entry structure).
  function _hexv(c) { if (c >= 48 && c <= 57) return c - 48; if (c >= 97 && c <= 102) return c - 87; if (c >= 65 && c <= 70) return c - 55; return 0; }
  function _pushUtf8(out, cp) {
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) { out.push(0xC0 | (cp >> 6), 0x80 | (cp & 0x3F)); }
    else { out.push(0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)); }
  }
  function _cmpBytes(a, b) { var n = Math.min(a.length, b.length), i; for (i = 0; i < n; i++) { if (a[i] !== b[i]) return a[i] - b[i]; } return a.length - b.length; }
  // Parse a flat JSON object. Scalar values are decoded (string/int/bool/null);
  // nested object/array values are captured as their raw source substring (a
  // string value), so the scan is deterministic and identical across VMs.
  function _jsonParseObject(b, putSI, putSS, putNS) {
    var i = 0, n = b.length;
    function skip() { while (i < n && _ws(b[i])) i++; }
    function pstr() {
      i++; var out = [];
      while (i < n) {
        var c = b[i++];
        if (c === 34) break;
        if (c === 92) {
          var e = b[i++];
          if (e === 34) out.push(34); else if (e === 92) out.push(92); else if (e === 47) out.push(47);
          else if (e === 110) out.push(10); else if (e === 116) out.push(9); else if (e === 114) out.push(13);
          else if (e === 98) out.push(8); else if (e === 102) out.push(12);
          else if (e === 117) { var cp = 0, k; for (k = 0; k < 4; k++) cp = (cp << 4) | _hexv(b[i++]); _pushUtf8(out, cp); }
          else out.push(e);
        } else out.push(c);
      }
      return out;
    }
    function praw() {
      var start = i, depth = 0, instr = false;
      while (i < n) {
        var c = b[i];
        if (instr) { if (c === 92) { i += 2; continue; } if (c === 34) instr = false; i++; continue; }
        if (c === 34) { instr = true; i++; continue; }
        if (c === 123 || c === 91) depth++;
        else if (c === 125 || c === 93) { depth--; if (depth === 0) { i++; break; } }
        i++;
      }
      return b.slice(start, i);
    }
    skip(); if (b[i] !== 123) return; i++;
    while (i < n) {
      skip(); if (b[i] === 125) { i++; break; }
      if (b[i] !== 34) break;
      var key = pstr(); skip(); if (b[i] !== 58) break; i++; skip();
      var c = b[i];
      if (c === 34) putSS(key, pstr());
      else if (c === 123 || c === 91) putSS(key, praw());
      else if (c === 116) { i += 4; putSI(key, 1); }
      else if (c === 102) { i += 5; putSI(key, 0); }
      else if (c === 110) { i += 4; putNS(key); }
      else {
        var neg = (b[i] === 45); if (b[i] === 45 || b[i] === 43) i++;
        var val = 0;
        while (i < n && b[i] >= 48 && b[i] <= 57) { val = val * 10 + (b[i] - 48); i++; }
        if (i < n && (b[i] === 46 || b[i] === 101 || b[i] === 69)) { i++; while (i < n && ((b[i] >= 48 && b[i] <= 57) || b[i] === 46 || b[i] === 101 || b[i] === 69 || b[i] === 45 || b[i] === 43)) i++; }
        putSI(key, (neg ? -val : val) | 0);
      }
      skip(); if (b[i] === 44) { i++; continue; } if (b[i] === 125) { i++; break; } break;
    }
  }
  // Parse a PicoBinarySerializer PSC1 card (magic 0x50534331): [magic][u16 count]
  // then per field [u8 nameLen][name][u8 type: 1=int(4 BE), 2=str(u16 len + bytes)].
  function _psc1Parse(b, putSI, putSS) {
    if (b.length < 6) return;
    var magic = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
    if (magic !== 0x50534331) return;
    var count = (b[4] << 8) | b[5], pos = 6, k;
    for (k = 0; k < count; k++) {
      var nlen = b[pos++]; var key = b.slice(pos, pos + nlen); pos += nlen;
      var t = b[pos++];
      if (t === 1) { var x = ((b[pos] << 24) | (b[pos + 1] << 16) | (b[pos + 2] << 8) | b[pos + 3]) | 0; pos += 4; putSI(key, x); }
      else if (t === 2) { var vlen = (b[pos] << 8) | b[pos + 1]; pos += 2; putSS(key, b.slice(pos, pos + vlen)); pos += vlen; }
      else break;
    }
  }
  // Serialize an ordered [{kb,vk,vi,vb}] entry list to a PSC1 card (keys sorted by
  // UTF-8 bytes, matching picoserializer). Null values serialize as int 0.
  function _psc1Serialize(entries) {
    var es = entries.filter(function (e) { return e.kk === 's'; }).slice();
    es.sort(function (a, b) { return _cmpBytes(a.kb, b.kb); });
    var out = [0x50, 0x53, 0x43, 0x31, (es.length >> 8) & 255, es.length & 255];
    es.forEach(function (e) {
      out.push(e.kb.length & 255); for (var i = 0; i < e.kb.length; i++) out.push(e.kb[i] & 255);
      if (e.vk === 's') { out.push(2); var v = e.vb || []; out.push((v.length >> 8) & 255, v.length & 255); for (var j = 0; j < v.length; j++) out.push(v[j] & 255); }
      else { out.push(1); var x = (e.vk === 'i' ? e.vi : 0) | 0; out.push((x >> 24) & 255, (x >> 16) & 255, (x >> 8) & 255, x & 255); }
    });
    return out;
  }
  // ---- BSO1 (BareMetal.Binary): schema-driven, little-endian, HMAC-SHA256 signed.
  // HDR: MAGIC(i32) VERSION(i32) schemaVer(i32) byte(0) + 32-byte sig = 45 bytes,
  // then a presence byte, then fields in schema order. 64-bit/float/temporal values
  // are stored as their raw LE bytes (string) in the Map. Wire-compatible with
  // BareMetalJsTools/src/BareMetal.Binary.js. See docs/MAP.md.
  var BSO1_HDR = 45, BSO1_SIG_AT = 13;
  var BSO1_SZ = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 4, 7: 4, 8: 8, 9: 8, 10: 4, 11: 8, 12: 16, 13: 2, 14: 0, 15: 16, 16: 9, 17: 4, 18: 8, 19: 10, 20: 8, 21: 16, 22: 4 };
  var BSO1_INT = { 1: 'u', 2: 'u', 3: 's', 4: 's', 5: 'u', 6: 's', 7: 'u', 13: 'u', 17: 's', 22: 's' };
  function _leInt(b, pos, size, signed) {
    var v = 0, i; for (i = 0; i < size; i++) v += (b[pos + i] || 0) * Math.pow(256, i);
    if (signed) { var lim = Math.pow(2, size * 8 - 1); if (v >= lim) v -= lim * 2; }
    return v | 0;
  }
  function _bso1Schema(mapObj) {
    var members = [], version = 1;
    if (mapObj) mapObj.forEach(function (e) {
      var nm = e.kb;
      if (nm.length && nm[0] === 58) { if (_keystr(nm) === ':version' && e.vk === 'i') version = e.vi; return; }
      var code = (e.vk === 'i') ? e.vi : 0;
      members.push({ name: nm, wt: code & 255, nullable: (code & 256) !== 0 });
    });
    return { members: members, version: version };
  }
  function _bso1Read(b, sch, putSI, putSS, putNS) {
    var pos = BSO1_HDR, i;
    if (pos >= b.length) return;
    if (b[pos++] === 0) return;   // null object
    for (i = 0; i < sch.members.length; i++) {
      var m = sch.members[i], wt = m.wt;
      if (m.nullable) { if ((b[pos++] || 0) === 0) { putNS(m.name); continue; } }
      if (wt === 14) {
        var len = _leInt(b, pos, 4, true); pos += 4;
        if (len < 0) putNS(m.name);
        else { putSS(m.name, b.slice(pos, pos + len)); pos += len; }
      } else if (BSO1_INT[wt]) {
        var sz = BSO1_SZ[wt]; putSI(m.name, _leInt(b, pos, sz, BSO1_INT[wt] === 's')); pos += sz;
      } else {
        var sz2 = BSO1_SZ[wt]; putSS(m.name, b.slice(pos, pos + sz2)); pos += sz2;
      }
    }
  }
  function _bso1Write(dataMap, sch, hmacKey) {
    var out = [], i, k;
    function wI32(v) { out.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255); }
    wI32(0x314F5342); wI32(3); wI32(sch.version | 0); out.push(0);
    for (i = 0; i < 32; i++) out.push(0);
    out.push(1);
    for (i = 0; i < sch.members.length; i++) {
      var m = sch.members[i], wt = m.wt;
      var e = dataMap ? dataMap.get('s' + _keystr(m.name)) : null;
      var isNull = !e || e.vk === 'n';
      if (m.nullable) { if (isNull) { out.push(0); continue; } out.push(1); }
      if (wt === 14) {
        if (isNull) wI32(-1);
        else { var sb = (e && e.vk === 's') ? e.vb : []; wI32(sb.length); for (k = 0; k < sb.length; k++) out.push(sb[k] & 255); }
      } else if (BSO1_INT[wt]) {
        var sz = BSO1_SZ[wt], val = (e && e.vk === 'i') ? e.vi : 0; for (k = 0; k < sz; k++) out.push((val >> (8 * k)) & 255);
      } else {
        var sz2 = BSO1_SZ[wt], rb = (e && e.vk === 's') ? e.vb : []; for (k = 0; k < sz2; k++) out.push((k < rb.length ? rb[k] : 0) & 255);
      }
    }
    if (hmacKey && hmacKey.length) {
      var parts = out.slice(0, BSO1_SIG_AT).concat(out.slice(BSO1_HDR));
      var sig = _hmacSha256(hmacKey, parts);
      for (k = 0; k < 32; k++) out[BSO1_SIG_AT + k] = sig[k];
    }
    return out;
  }
  function _bso1Verify(b, key) {
    if (!key || !key.length || b.length < BSO1_HDR) return 0;
    var parts = b.slice(0, BSO1_SIG_AT).concat(b.slice(BSO1_HDR));
    var sig = _hmacSha256(key, parts), i;
    for (i = 0; i < 32; i++) if ((b[BSO1_SIG_AT + i] || 0) !== (sig[i] || 0)) return 0;
    return 1;
  }

  PicoVM.prototype._spanBytes = function (h) {
    if (h <= 0 || h >= this.spans.length || !this.spans[h]) return [];
    var s = this.spans[h], out = new Array(s.len);
    for (var i = 0; i < s.len; i++) out[i] = this.mem[s.ptr + i];
    return out;
  };
  PicoVM.prototype._newSpanBytes = function (bytes) {
    if (this.noAlloc) { var e = new Error("arena allocation in no-alloc mode"); e.fault = 9; e.pc = this.pc | 0; e.detail = bytes.length | 0; throw e; }  // INV-5
    var dst = this.arenaTop; this.arenaTop += bytes.length;
    for (var i = 0; i < bytes.length; i++) this.mem[dst + i] = bytes[i] & 255;
    this.spans.push({ ptr: dst, len: bytes.length });
    return this.spans.length - 1;
  };
  PicoVM.prototype._mapHook = function (method, rd, rs1, rs2) {
    // Active-handle dictionary primitive. Keys int/string; values int/string/null.
    // Insertion-order enumeration. See docs/MAP.md. FNV-1a: offset 0x811c9dc5,
    // prime 0x01000193, 32-bit (identical across all VM implementations).
    var R = this.regs, self = this;
    if (!this.maps) { this.maps = [null]; this.activeMap = 0; }
    function fnv1a(bytes) { var h = 0x811c9dc5 >>> 0; for (var i = 0; i < bytes.length; i++) { h ^= bytes[i] & 0xFF; h = Math.imul(h, 0x01000193) >>> 0; } return h | 0; }
    function cur() { return self.maps[self.activeMap] || null; }
    function ikey(k) { return 'i' + ((k | 0) >>> 0); }
    function skey(b) { return 's' + _keystr(b); }
    function vals(m) { return m ? Array.from(m.values()) : []; }
    var m = cur();
    switch (method) {
      case "New": { this.maps.push(new Map()); this.activeMap = this.maps.length - 1; R[rd] = this.activeMap; return true; }
      case "Use": { var h = R[rs1] | 0; this.activeMap = (h > 0 && h < this.maps.length && this.maps[h]) ? h : 0; return true; }
      case "Free": { var hf = R[rs1] | 0; if (hf > 0 && hf < this.maps.length) { this.maps[hf] = null; if (this.activeMap === hf) this.activeMap = 0; } return true; }
      case "Clear": { if (m) m.clear(); return true; }
      case "Count": { R[rd] = m ? m.size : 0; return true; }
      case "Hash": { R[rd] = fnv1a(this._spanBytes(R[rs1])); return true; }
      case "PutII": { if (m) { var k = R[rs1] | 0; m.set(ikey(k), { kk: 'i', ki: k, kb: null, vk: 'i', vi: R[rs2] | 0, vb: null }); } return true; }
      case "GetII": { var e = m ? m.get(ikey(R[rs1])) : null; R[rd] = (e && e.vk === 'i') ? e.vi : 0; this.hostStatus = e ? 0 : 1; return true; }
      case "HasI": { R[rd] = (m && m.has(ikey(R[rs1]))) ? 1 : 0; return true; }
      case "DelI": { if (m) m.delete(ikey(R[rs1])); return true; }
      case "PutIS": { if (m) { var k5 = R[rs1] | 0; m.set(ikey(k5), { kk: 'i', ki: k5, kb: null, vk: 's', vi: 0, vb: this._spanBytes(R[rs2]) }); } return true; }
      case "GetIS": { var e6 = m ? m.get(ikey(R[rs1])) : null; if (e6 && e6.vk === 's') { R[rd] = this._newSpanBytes(e6.vb); this.hostStatus = 0; } else { R[rd] = this._newSpanBytes([]); this.hostStatus = 1; } return true; }
      case "PutNullI": { if (m) { var k7 = R[rs1] | 0; m.set(ikey(k7), { kk: 'i', ki: k7, kb: null, vk: 'n', vi: 0, vb: null }); } return true; }
      case "IsNullI": { var e8 = m ? m.get(ikey(R[rs1])) : null; R[rd] = (e8 && e8.vk === 'n') ? 1 : 0; return true; }
      case "PutSI": { if (m) { var kb = this._spanBytes(R[rs1]); m.set(skey(kb), { kk: 's', ki: 0, kb: kb, vk: 'i', vi: R[rs2] | 0, vb: null }); } return true; }
      case "GetSI": { var ea = m ? m.get(skey(this._spanBytes(R[rs1]))) : null; R[rd] = (ea && ea.vk === 'i') ? ea.vi : 0; this.hostStatus = ea ? 0 : 1; return true; }
      case "HasS": { R[rd] = (m && m.has(skey(this._spanBytes(R[rs1])))) ? 1 : 0; return true; }
      case "DelS": { if (m) m.delete(skey(this._spanBytes(R[rs1]))); return true; }
      case "PutSS": { if (m) { var kbd = this._spanBytes(R[rs1]); m.set(skey(kbd), { kk: 's', ki: 0, kb: kbd, vk: 's', vi: 0, vb: this._spanBytes(R[rs2]) }); } return true; }
      case "GetSS": { var ee = m ? m.get(skey(this._spanBytes(R[rs1]))) : null; if (ee && ee.vk === 's') { R[rd] = this._newSpanBytes(ee.vb); this.hostStatus = 0; } else { R[rd] = this._newSpanBytes([]); this.hostStatus = 1; } return true; }
      case "PutNullS": { if (m) { var kbf = this._spanBytes(R[rs1]); m.set(skey(kbf), { kk: 's', ki: 0, kb: kbf, vk: 'n', vi: 0, vb: null }); } return true; }
      case "IsNullS": { var eg = m ? m.get(skey(this._spanBytes(R[rs1]))) : null; R[rd] = (eg && eg.vk === 'n') ? 1 : 0; return true; }
      case "KeyAt": { var eh = vals(m)[R[rs1] | 0]; R[rd] = eh ? (eh.kk === 'i' ? eh.ki : 0) : 0; return true; }
      case "KeySpanAt": { var ei = vals(m)[R[rs1] | 0]; R[rd] = this._newSpanBytes(ei && ei.kk === 's' ? ei.kb : []); return true; }
      case "ValAt": { var ej = vals(m)[R[rs1] | 0]; R[rd] = ej && ej.vk === 'i' ? ej.vi : 0; return true; }
      case "ValSpanAt": { var ek = vals(m)[R[rs1] | 0]; R[rd] = this._newSpanBytes(ek && ek.vk === 's' ? ek.vb : []); return true; }
      case "ValIsSpan": { var el = vals(m)[R[rs1] | 0]; R[rd] = el && el.vk === 's' ? 1 : 0; return true; }
    }
    return false;
  };
  PicoVM.prototype._parseHook = function (name, rd, rs1, rs2) {
    var R = this.regs, self = this;
    if (!this.maps) { this.maps = [null]; this.activeMap = 0; }
    function newMap() { self.maps.push(new Map()); self.activeMap = self.maps.length - 1; return self.activeMap; }
    if (name === "Json.Parse" || name === "Binary.ParseCard") {
      var bytes = this._spanBytes(R[rs1]);
      var h = newMap(), m = this.maps[h];
      var putSI = function (kb, v) { m.set('s' + _keystr(kb), { kk: 's', ki: 0, kb: kb, vk: 'i', vi: v | 0, vb: null }); };
      var putSS = function (kb, vb) { m.set('s' + _keystr(kb), { kk: 's', ki: 0, kb: kb, vk: 's', vi: 0, vb: vb }); };
      var putNS = function (kb) { m.set('s' + _keystr(kb), { kk: 's', ki: 0, kb: kb, vk: 'n', vi: 0, vb: null }); };
      if (name === "Json.Parse") _jsonParseObject(bytes, putSI, putSS, putNS);
      else _psc1Parse(bytes, putSI, putSS);
      R[rd] = h; return true;
    }
    if (name === "Binary.SetKey") { var kb = this._spanBytes(R[rs1]); this.bso1Key = kb.length ? kb : null; return true; }
    if (name === "Binary.ParseEntity") {
      var blob = this._spanBytes(R[rs1]), sch = _bso1Schema(this.maps[R[rs2]]);
      var hh = newMap(), mm = this.maps[hh];
      var pSI = function (kb2, v) { mm.set('s' + _keystr(kb2), { kk: 's', ki: 0, kb: kb2, vk: 'i', vi: v | 0, vb: null }); };
      var pSS = function (kb2, vb) { mm.set('s' + _keystr(kb2), { kk: 's', ki: 0, kb: kb2, vk: 's', vi: 0, vb: vb }); };
      var pNS = function (kb2) { mm.set('s' + _keystr(kb2), { kk: 's', ki: 0, kb: kb2, vk: 'n', vi: 0, vb: null }); };
      _bso1Read(blob, sch, pSI, pSS, pNS);
      R[rd] = hh; return true;
    }
    if (name === "Binary.SerializeEntity") {
      var dm = this.maps[R[rs1]], sch2 = _bso1Schema(this.maps[R[rs2]]);
      R[rd] = this._newSpanBytes(_bso1Write(dm, sch2, this.bso1Key || null)); return true;
    }
    if (name === "Binary.Verify") { R[rd] = _bso1Verify(this._spanBytes(R[rs1]), this.bso1Key || null); return true; }
    if (name === "Binary.SerializeCard") {
      var mm = this.maps[this.activeMap];
      var entries = mm ? Array.from(mm.values()) : [];
      R[rd] = this._newSpanBytes(_psc1Serialize(entries)); return true;
    }
    return false;
  };
  PicoVM.prototype._stringlib = function (method, rd, rs1, rs2) {
    var a = this._spanBytes(this.regs[rs1]);
    if (method === "Length") { this.regs[rd] = a.length; return true; }
    if (method === "Concat") { this.regs[rd] = this._newSpanBytes(a.concat(this._spanBytes(this.regs[rs2]))); return true; }
    if (method === "Substring") { var st = Math.max(0, this.regs[rs2] | 0); this.regs[rd] = this._newSpanBytes(a.slice(st)); return true; }
    if (method === "IndexOf") { var ix = _bfind(a, this._spanBytes(this.regs[rs2])); this.hostStatus = ix >= 0 ? 0 : 1; this.regs[rd] = ix | 0; return true; }
    if (method === "StartsWith") { var p = this._spanBytes(this.regs[rs2]); this.regs[rd] = (p.length <= a.length && _bcmp(a, p, 0)) ? 1 : 0; return true; }
    if (method === "EndsWith") { var su = this._spanBytes(this.regs[rs2]); this.regs[rd] = (su.length <= a.length && _bcmp(a, su, a.length - su.length)) ? 1 : 0; return true; }
    if (method === "Eq") { var eq = this._spanBytes(this.regs[rs2]); this.regs[rd] = (eq.length === a.length && _bcmp(a, eq, 0)) ? 1 : 0; return true; }
    if (method === "ToUpper") { this.regs[rd] = this._newSpanBytes(a.map(function (c) { return (c >= 97 && c <= 122) ? c - 32 : c; })); return true; }
    if (method === "ToLower") { this.regs[rd] = this._newSpanBytes(a.map(function (c) { return (c >= 65 && c <= 90) ? c + 32 : c; })); return true; }
    if (method === "Trim") { var i = 0, j = a.length; while (i < j && _ws(a[i])) i++; while (j > i && _ws(a[j - 1])) j--; this.regs[rd] = this._newSpanBytes(a.slice(i, j)); return true; }
    if (method === "SetReplace") { this._strRepl = a; return true; }
    if (method === "Replace") {
      var needle = this._spanBytes(this.regs[rs2]), repl = this._strRepl || [], out = [], k = 0;
      if (needle.length === 0) { this.regs[rd] = this._newSpanBytes(a); return true; }
      while (k < a.length) {
        if (k + needle.length <= a.length && _bcmp(a, needle, k)) { for (var m = 0; m < repl.length; m++) out.push(repl[m]); k += needle.length; }
        else { out.push(a[k]); k++; }
      }
      this.regs[rd] = this._newSpanBytes(out); return true;
    }
    return false;
  };

  function _strBytes(s) { var o = []; for (var i = 0; i < s.length; i++) o.push(s.charCodeAt(i) & 255); return o; }

  PicoVM.prototype._numberlib = function (method, rd, rs1, rs2) {
    if (method === "Parse") {
      var bb = this._spanBytes(this.regs[rs1]);
      var str = String.fromCharCode.apply(null, bb).trim();
      var ok = /^[+-]?\d+$/.test(str);
      this.hostStatus = ok ? 0 : 2;            // INV-18: PARSE_ERROR
      this.regs[rd] = (ok ? parseInt(str, 10) : 0) | 0;
      return true;
    }
    var a = this.regs[rs1] | 0, b = this.regs[rs2] | 0;
    if (method === "Abs") { this.regs[rd] = (a < 0 ? -a : a) | 0; return true; }
    if (method === "Min") { this.regs[rd] = (a < b ? a : b) | 0; return true; }
    if (method === "Max") { this.regs[rd] = (a > b ? a : b) | 0; return true; }
    if (method === "Floor" || method === "Ceiling" || method === "Round") { this.regs[rd] = a | 0; return true; }
    if (method === "ToString") { this.regs[rd] = this._newSpanBytes(_strBytes(String(a))); return true; }
    if (method === "ToHex") { this.regs[rd] = this._newSpanBytes(_strBytes((a >>> 0).toString(16))); return true; }
    if (method === "ToOctal") { this.regs[rd] = this._newSpanBytes(_strBytes((a >>> 0).toString(8))); return true; }
    if (method === "ToBinary") { this.regs[rd] = this._newSpanBytes(_strBytes((a >>> 0).toString(2))); return true; }
    return false;
  };

  // ── Q16.16 fixed-point CORDIC (Maths.Sin/Cos/Tan, ...) ──────────────────────
  // All-integer; constants/iteration count shared verbatim with picoscript_vm.py
  // (_q16_*) and vm/picovm.c so results are byte-identical on every path.
  var Q16_ONE = 65536, Q16_HALF_PI = 102944, Q16_PI = 205887, Q16_TWO_PI = 411775, Q16_GAIN_INV = 39797;
  var Q16_ATAN = [51472, 30386, 16055, 8150, 4091, 2047, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2];
  function q16Sincos(angle) {
    var a = (angle | 0) % Q16_TWO_PI;
    if (a < 0) a += Q16_TWO_PI;
    var q = (a / Q16_HALF_PI) | 0;
    var r = a - q * Q16_HALF_PI;
    var x = Q16_GAIN_INV, y = 0, z = r, i, dx, dy;
    for (i = 0; i < 16; i++) {
      dx = x >> i; dy = y >> i;
      if (z >= 0) { x = (x - dy) | 0; y = (y + dx) | 0; z -= Q16_ATAN[i]; }
      else { x = (x + dy) | 0; y = (y - dx) | 0; z += Q16_ATAN[i]; }
    }
    if (q === 0) return [y, x];
    if (q === 1) return [x, (-y) | 0];
    if (q === 2) return [(-y) | 0, (-x) | 0];
    return [(-x) | 0, y];
  }
  function q16Tan(angle) {
    var sc = q16Sincos(angle), s = sc[0], c = sc[1];
    if (c === 0) return s >= 0 ? 0x7FFFFFFF : -0x80000000;
    return Number(BigInt.asIntN(32, (BigInt(s) * 65536n) / BigInt(c)));   // trunc toward zero
  }
  // Q16.16 exp/log: fixmul/fixdiv via BigInt for exact 64-bit intermediates matching
  // the C int64 / Python big-int paths; series divides trunc-toward-zero.
  var Q16_LN2 = 45426, Q16_INV_LN2 = 94548, Q16_INV_LN10 = 28462, Q16_EXP_MAX_Z = 681300;
  function q16Fixmul(a, b) { return Number(BigInt.asIntN(32, (BigInt(a) * BigInt(b)) >> 16n)); }
  function q16Idiv(a, n) {
    var aa = a < 0 ? -a : a, nn = n < 0 ? -n : n, q = Math.floor(aa / nn);
    return ((a < 0) !== (n < 0)) ? -q : q;
  }
  function q16Fixdiv(a, b) {
    var num = BigInt(a) * 65536n, bb = BigInt(b);
    var an = num < 0n ? -num : num, ab = bb < 0n ? -bb : bb, q = an / ab;
    return Number(BigInt.asIntN(32, ((num < 0n) !== (bb < 0n)) ? -q : q));
  }
  function q16Exp(z) {
    if (z >= Q16_EXP_MAX_Z) return 0x7FFFFFFF;
    if (z <= -Q16_EXP_MAX_Z) return 0;
    var k = (q16Fixmul(z, Q16_INV_LN2) + (Q16_ONE >> 1)) >> 16;
    var r = (z - k * Q16_LN2) | 0, term = Q16_ONE, acc = Q16_ONE, n, i;
    for (n = 1; n < 8; n++) { term = q16Idiv(q16Fixmul(term, r), n); acc = (acc + term) | 0; }
    if (k >= 0) {
      var a = acc;
      for (i = 0; i < k; i++) { a = a * 2; if (a > 0x7FFFFFFF) return 0x7FFFFFFF; }
      return a | 0;
    }
    for (i = 0; i < -k; i++) acc = acc >> 1;
    return acc | 0;
  }
  function q16Log(x) {
    if (x <= 0) return -0x80000000;
    var e = 0, m = x;
    while (m >= 2 * Q16_ONE) { m = m >> 1; e++; }
    while (m < Q16_ONE) { m = m << 1; e--; }
    var u = q16Fixdiv((m - Q16_ONE) | 0, (m + Q16_ONE) | 0);
    var u2 = q16Fixmul(u, u), term = u, acc = 0, n;
    for (n = 0; n < 6; n++) { acc = (acc + q16Idiv(term, 2 * n + 1)) | 0; term = q16Fixmul(term, u2); }
    return ((2 * acc) + e * Q16_LN2) | 0;
  }

  PicoVM.prototype._mathslib = function (method, rd, rs1, rs2) {
    if (method === "Sin") { this.regs[rd] = q16Sincos(this.regs[rs1] | 0)[0] | 0; return true; }
    if (method === "Cos") { this.regs[rd] = q16Sincos(this.regs[rs1] | 0)[1] | 0; return true; }
    if (method === "Tan") { this.regs[rd] = q16Tan(this.regs[rs1] | 0) | 0; return true; }
    if (method === "Exp") { this.regs[rd] = q16Exp(this.regs[rs1] | 0) | 0; return true; }
    if (method === "Log") { this.regs[rd] = q16Log(this.regs[rs1] | 0) | 0; return true; }
    if (method === "Log10") { this.regs[rd] = q16Fixmul(q16Log(this.regs[rs1] | 0), Q16_INV_LN10) | 0; return true; }
    if (method === "Power") {
      var base = this.regs[rs1] | 0, exp = this.regs[rs2] | 0;
      if (exp <= 0) { this.regs[rd] = (exp === 0 ? 1 : 0) | 0; return true; }
      var r = 1, cap = exp < 0xFFFF ? exp : 0xFFFF;
      for (var t = 0; t < cap; t++) r = Math.imul(r, base);   // 32-bit modular multiply
      this.regs[rd] = r | 0; return true;
    }
    if (method === "Sqrt") {
      var n = this.regs[rs1] | 0;
      if (n <= 0) { this.regs[rd] = 0; return true; }
      var x = n, res = 0, bit = 1 << 30;
      while (bit > n) bit >>= 2;
      while (bit) {
        if (x >= res + bit) { x -= res + bit; res = (res >> 1) + bit; }
        else { res >>= 1; }
        bit >>= 2;
      }
      this.regs[rd] = res | 0; return true;
    }
    return false;
  };

  // ── DEFLATE (RFC 1951) + gzip (RFC 1952): byte-identical with picoscript_vm.py.
  // One final fixed-Huffman block, greedy LZ77 with a deterministic hash-chain
  // match finder. inflate is spec-deterministic (reads real zlib/gzip output).
  var Z_LEN_BASE = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
  var Z_LEN_EXTRA = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
  var Z_DIST_BASE = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
  var Z_DIST_EXTRA = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
  var Z_CLEN_ORDER = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
  var Z_CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t.push(c >>> 0); } return t; })();
  function zCrc32(data) { var crc = 0xFFFFFFFF; for (var i = 0; i < data.length; i++) crc = (Z_CRC[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8)) >>> 0; return (crc ^ 0xFFFFFFFF) >>> 0; }
  function zFixedLit() { var L = [], i; for (i = 0; i < 144; i++) L.push(8); for (i = 0; i < 112; i++) L.push(9); for (i = 0; i < 24; i++) L.push(7); for (i = 0; i < 8; i++) L.push(8); return L; }
  function zCodes(lengths) {
    var maxbits = 0, i; for (i = 0; i < lengths.length; i++) if (lengths[i] > maxbits) maxbits = lengths[i];
    var blc = []; for (i = 0; i <= maxbits; i++) blc.push(0);
    for (i = 0; i < lengths.length; i++) if (lengths[i]) blc[lengths[i]]++;
    var code = 0, nc = [0]; for (i = 1; i <= maxbits; i++) { code = (code + blc[i - 1]) << 1; nc[i] = code; }
    var out = {}; for (i = 0; i < lengths.length; i++) { var L = lengths[i]; if (L) { out[i] = [nc[L], L]; nc[L]++; } }
    return out;
  }
  function zTree(lengths) { var c = zCodes(lengths), t = {}; for (var s in c) t[c[s][0] + "_" + c[s][1]] = parseInt(s, 10); return t; }
  function zLenSym(length) { for (var i = Z_LEN_BASE.length - 1; i >= 0; i--) if (length >= Z_LEN_BASE[i]) return 257 + i; return 257; }
  function zDistSym(dist) { for (var i = Z_DIST_BASE.length - 1; i >= 0; i--) if (dist >= Z_DIST_BASE[i]) return i; return 0; }
  function zDeflate(data) {
    var lit = zCodes(zFixedLit()), out = [], bitbuf = 0, bitcnt = 0;
    function put(value, n) { bitbuf |= (value & ((1 << n) - 1)) << bitcnt; bitcnt += n; while (bitcnt >= 8) { out.push(bitbuf & 0xFF); bitbuf >>>= 8; bitcnt -= 8; } }
    function huff(code, n) { var r = 0; for (var k = 0; k < n; k++) { r = (r << 1) | (code & 1); code >>= 1; } put(r, n); }
    put(1, 1); put(1, 2);
    var n = data.length, head = {}, prev = new Array(n + 1), i; for (i = 0; i <= n; i++) prev[i] = 0;
    i = 0;
    while (i < n) {
      var matchLen = 0, matchDist = 0;
      if (i + 3 <= n) {
        var h = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
        var j = (head[h] || 0) - 1, chain = 0, maxlen = Math.min(258, n - i);
        while (j >= 0 && i - j <= 32768 && chain < 256) {
          var length = 0;
          while (length < maxlen && data[j + length] === data[i + length]) length++;
          if (length > matchLen) { matchLen = length; matchDist = i - j; if (length >= maxlen) break; }
          j = prev[j] - 1; chain++;
        }
      }
      if (matchLen >= 3) {
        var ls = zLenSym(matchLen), lc = lit[ls];
        huff(lc[0], lc[1]); put(matchLen - Z_LEN_BASE[ls - 257], Z_LEN_EXTRA[ls - 257]);
        var ds = zDistSym(matchDist); huff(ds, 5); put(matchDist - Z_DIST_BASE[ds], Z_DIST_EXTRA[ds]);
        var end = i + matchLen;
        while (i < end) { if (i + 3 <= n) { var hh = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]; prev[i] = head[hh] || 0; head[hh] = i + 1; } i++; }
      } else {
        var c0 = lit[data[i]]; huff(c0[0], c0[1]);
        if (i + 3 <= n) { var hl = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]; prev[i] = head[hl] || 0; head[hl] = i + 1; }
        i++;
      }
    }
    var ce = lit[256]; huff(ce[0], ce[1]);
    if (bitcnt > 0) out.push(bitbuf & 0xFF);
    return out;
  }
  function zInflate(data) {
    var pos = 0, bitbuf = 0, bitcnt = 0, out = [];
    var fLit = zTree(zFixedLit()), fDist = zTree((function () { var a = [], i; for (i = 0; i < 30; i++) a.push(5); return a; })());
    function take(n) { while (bitcnt < n) { if (pos >= data.length) throw new Error("truncated compressed data"); var b = data[pos]; pos++; bitbuf |= b << bitcnt; bitcnt += 8; } var v = bitbuf & ((1 << n) - 1); bitbuf >>>= n; bitcnt -= n; return v; }
    function sym(tree) { var code = 0, length = 0; while (true) { code = (code << 1) | take(1); length++; var s = tree[code + "_" + length]; if (s !== undefined) return s; if (length > 15) throw new Error("bad compressed data"); } }
    while (true) {
      var bfinal = take(1), btype = take(2);
      if (btype === 0) { take(bitcnt & 7); var ln = take(16); take(16); for (var q = 0; q < ln; q++) out.push(take(8)); }
      else {
        var litTree, distTree;
        if (btype === 1) { litTree = fLit; distTree = fDist; }
        else { var dyn = zReadDynamic(take); litTree = dyn[0]; distTree = dyn[1]; }
        while (true) {
          var s = sym(litTree);
          if (s === 256) break;
          if (s < 256) out.push(s);
          else { var li = s - 257, length2 = Z_LEN_BASE[li] + take(Z_LEN_EXTRA[li]); var dsy = sym(distTree); var dist = Z_DIST_BASE[dsy] + take(Z_DIST_EXTRA[dsy]); var start = out.length - dist; for (var k = 0; k < length2; k++) out.push(out[start + k]); }
        }
      }
      if (bfinal) break;
    }
    return out;
  }
  function zReadDynamic(take) {
    var hlit = take(5) + 257, hdist = take(5) + 1, hclen = take(4) + 4;
    var cl = [], i; for (i = 0; i < 19; i++) cl.push(0);
    for (i = 0; i < hclen; i++) cl[Z_CLEN_ORDER[i]] = take(3);
    var ct = zTree(cl);
    function csym() { var code = 0, length = 0; while (true) { code = (code << 1) | take(1); length++; var s = ct[code + "_" + length]; if (s !== undefined) return s; if (length > 15) throw new Error("bad compressed data"); } }
    var lengths = [];
    while (lengths.length < hlit + hdist) {
      var s = csym();
      if (s < 16) lengths.push(s);
      else if (s === 16) { var r = take(2) + 3, last = lengths[lengths.length - 1], t; for (t = 0; t < r; t++) lengths.push(last); }
      else if (s === 17) { var r2 = take(3) + 3, t2; for (t2 = 0; t2 < r2; t2++) lengths.push(0); }
      else { var r3 = take(7) + 11, t3; for (t3 = 0; t3 < r3; t3++) lengths.push(0); }
    }
    return [zTree(lengths.slice(0, hlit)), zTree(lengths.slice(hlit, hlit + hdist))];
  }
  function zGzip(data) {
    var body = zDeflate(data), c = zCrc32(data), n = data.length >>> 0;
    var out = [0x1F, 0x8B, 8, 0, 0, 0, 0, 0, 0, 0xFF], i;
    for (i = 0; i < body.length; i++) out.push(body[i]);
    out.push(c & 0xFF, (c >>> 8) & 0xFF, (c >>> 16) & 0xFF, (c >>> 24) & 0xFF);
    out.push(n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF);
    return out;
  }
  function zGunzip(data) {
    if (data.length < 18 || data[0] !== 0x1F || data[1] !== 0x8B) throw new Error("bad compressed data");
    var flg = data[3], pos = 10;
    if (flg & 4) { var xlen = data[pos] | (data[pos + 1] << 8); pos += 2 + xlen; }
    if (flg & 8) { while (data[pos] !== 0) pos++; pos++; }
    if (flg & 16) { while (data[pos] !== 0) pos++; pos++; }
    if (flg & 2) { pos += 2; }
    return zInflate(data.slice(pos, data.length - 8));
  }

  PicoVM.prototype._compresslib = function (method, rd, rs1, rs2) {
    var src = this._spanBytes(this.regs[rs1]);
    if (method === "PicoCompress") {
      this.regs[rd] = this._newSpanBytes(Array.from(PicoCompress.compress(Uint8Array.from(src)))); return true;
    }
    if (method === "PicoDecompress") {
      try { this.regs[rd] = this._newSpanBytes(Array.from(PicoCompress.decompress(Uint8Array.from(src)))); this.host_status = 0; }
      catch (e) { this.host_status = 2; this.regs[rd] = this._newSpanBytes([]); }
      return true;
    }
    if (method === "BrotliCompress") {
      this.regs[rd] = this._newSpanBytes(Array.from(PicoBrotli.encode(Uint8Array.from(src)))); return true;
    }
    if (method === "BrotliDecompress") {
      try { this.regs[rd] = this._newSpanBytes(Array.from(PicoBrotli.decode(Uint8Array.from(src)))); this.host_status = 0; }
      catch (e) { this.host_status = 2; this.regs[rd] = this._newSpanBytes([]); }
      return true;
    }
    if (method === "DeflateCompress" || method === "DeflateDecompress" || method === "GzipCompress" || method === "GzipDecompress") {
      var res;
      try {
        if (method === "DeflateCompress") res = zDeflate(src);
        else if (method === "DeflateDecompress") res = zInflate(src);
        else if (method === "GzipCompress") res = zGzip(src);
        else res = zGunzip(src);
        this.host_status = 0;
      } catch (e) { this.host_status = 2; res = []; }
      this.regs[rd] = this._newSpanBytes(res); return true;
    }
    return false;
  };

  // ── AES-256-CTR (Crypto.Encrypt/Decrypt). Tables + algorithm byte-identical with
  // picoscript_vm.py and vm/picovm.c; CTR is symmetric so encrypt == decrypt. ──
  var AES_SBOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
  ];
  var AES_RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d];
  function aesXtime(a) { return (a & 0x80) ? ((a << 1) ^ 0x1B) & 0xFF : (a << 1) & 0xFF; }
  function aesGmul(a, b) { var r = 0, i; for (i = 0; i < 8; i++) { if (b & 1) r ^= a; a = aesXtime(a); b >>= 1; } return r & 0xFF; }
  function aes256KeyExpand(key) {
    var rk = new Array(240), i, j, t = [0, 0, 0, 0], tmp;
    for (i = 0; i < 32; i++) rk[i] = key[i];
    for (i = 8; i < 60; i++) {
      for (j = 0; j < 4; j++) t[j] = rk[(i - 1) * 4 + j];
      if (i % 8 === 0) {
        tmp = t[0]; t[0] = t[1]; t[1] = t[2]; t[2] = t[3]; t[3] = tmp;
        for (j = 0; j < 4; j++) t[j] = AES_SBOX[t[j]];
        t[0] ^= AES_RCON[(i >> 3) - 1];
      } else if (i % 8 === 4) {
        for (j = 0; j < 4; j++) t[j] = AES_SBOX[t[j]];
      }
      for (j = 0; j < 4; j++) rk[i * 4 + j] = rk[(i - 8) * 4 + j] ^ t[j];
    }
    return rk;
  }
  function aes256EncryptBlock(inb, rk) {
    var s = new Array(16), t = new Array(16), out = new Array(16), i, c, r, rnd, a0, a1, a2, a3;
    for (i = 0; i < 16; i++) s[i] = inb[i] ^ rk[i];
    for (rnd = 1; rnd < 14; rnd++) {
      for (i = 0; i < 16; i++) s[i] = AES_SBOX[s[i]];
      for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) t[r + 4 * c] = s[r + 4 * ((c + r) & 3)];
      for (c = 0; c < 4; c++) {
        a0 = t[4 * c]; a1 = t[4 * c + 1]; a2 = t[4 * c + 2]; a3 = t[4 * c + 3];
        s[4 * c]     = (aesGmul(a0, 2) ^ aesGmul(a1, 3) ^ a2 ^ a3) & 0xFF;
        s[4 * c + 1] = (a0 ^ aesGmul(a1, 2) ^ aesGmul(a2, 3) ^ a3) & 0xFF;
        s[4 * c + 2] = (a0 ^ a1 ^ aesGmul(a2, 2) ^ aesGmul(a3, 3)) & 0xFF;
        s[4 * c + 3] = (aesGmul(a0, 3) ^ a1 ^ a2 ^ aesGmul(a3, 2)) & 0xFF;
      }
      for (i = 0; i < 16; i++) s[i] ^= rk[rnd * 16 + i];
    }
    for (i = 0; i < 16; i++) s[i] = AES_SBOX[s[i]];
    for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) t[r + 4 * c] = s[r + 4 * ((c + r) & 3)];
    for (i = 0; i < 16; i++) out[i] = t[i] ^ rk[14 * 16 + i];
    return out;
  }
  function aes256Ctr(key, iv, data) {
    var rk = aes256KeyExpand(key), out = [], ctr = iv.slice(0), off, j, ks;
    for (off = 0; off < data.length; off += 16) {
      ks = aes256EncryptBlock(ctr, rk);
      for (j = 0; j < 16 && off + j < data.length; j++) out.push(data[off + j] ^ ks[j]);
      for (j = 15; j >= 0; j--) { ctr[j] = (ctr[j] + 1) & 0xFF; if (ctr[j]) break; }
    }
    return out;
  }

  PicoVM.prototype._cryptolib = function (method, rd, rs1, rs2) {
    if (method === "Sha256") { this.regs[rd] = this._newSpanBytes(_sha256(this._spanBytes(this.regs[rs1]))); return true; }
    if (method === "HmacSha256") { this.regs[rd] = this._newSpanBytes(_hmacSha256(this._spanBytes(this.regs[rs1]), this._spanBytes(this.regs[rs2]))); return true; }
    if (method === "Encrypt" || method === "Decrypt") {
      var key = this._spanBytes(this.regs[rs1]), data = this._spanBytes(this.regs[rs2]);
      if (key.length !== 32 || data.length < 16) { this.hostStatus = 2; this.regs[rd] = 0; return true; }
      this.hostStatus = 0;
      var iv = data.slice(0, 16);
      this.regs[rd] = this._newSpanBytes(iv.concat(aes256Ctr(key, iv, data.slice(16))));
      return true;
    }
    return false;
  };

  PicoVM.prototype._htmllib = function (method, rd, rs1, rs2) {
    var s = _keystr(this._spanBytes(this.regs[rs1]));
    if (method === "Encode") {
      s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      this.regs[rd] = this._newSpanBytes(_strBytes(s)); return true;
    }
    if (method === "Decode") {
      s = s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
      this.regs[rd] = this._newSpanBytes(_strBytes(s)); return true;
    }
    return false;
  };

  function _urldecode(b) {
    var out = [], i = 0;
    while (i < b.length) {
      var c = b[i];
      if (c === 0x2b) { out.push(0x20); i += 1; }
      else if (c === 0x25 && i + 2 < b.length) {
        var hx = String.fromCharCode(b[i + 1], b[i + 2]);
        if (/^[0-9a-fA-F]{2}$/.test(hx)) { out.push(parseInt(hx, 16)); i += 3; }
        else { out.push(c); i += 1; }
      } else { out.push(c); i += 1; }
    }
    return out;
  }

  function _jsonesc(b) {
    var out = [];
    for (var i = 0; i < b.length; i++) {
      var c = b[i];
      if (c === 0x22) { out.push(0x5c, 0x22); }
      else if (c === 0x5c) { out.push(0x5c, 0x5c); }
      else if (c === 0x0a) { out.push(0x5c, 0x6e); }
      else if (c === 0x0d) { out.push(0x5c, 0x72); }
      else if (c === 0x09) { out.push(0x5c, 0x74); }
      else if (c < 0x20) {
        var hx = ("0000" + c.toString(16)).slice(-4);
        out.push(0x5c, 0x75);
        for (var j = 0; j < 4; j++) out.push(hx.charCodeAt(j));
      } else { out.push(c); }
    }
    return out;
  }

  PicoVM.prototype._parseJsonToModel = function (s) {
    var n = s.length, pos = [0], out = [];
    function isws(c) { return c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d; }
    function hx(c) { return (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66); }
    function skipws() { while (pos[0] < n && isws(s[pos[0]])) pos[0] += 1; }
    function pushAll(dst, arr) { for (var k = 0; k < arr.length; k++) dst.push(arr[k]); }
    function parseString() {
      var b = []; pos[0] += 1;
      while (pos[0] < n) {
        var c = s[pos[0]]; pos[0] += 1;
        if (c === 0x22) break;
        if (c === 0x5c && pos[0] < n) {
          var e = s[pos[0]]; pos[0] += 1;
          if (e === 0x6e) b.push(0x0a);
          else if (e === 0x74) b.push(0x09);
          else if (e === 0x72) b.push(0x0d);
          else if (e === 0x62) b.push(0x08);
          else if (e === 0x66) b.push(0x0c);
          else if (e === 0x75 && pos[0] + 4 <= n && hx(s[pos[0]]) && hx(s[pos[0] + 1]) && hx(s[pos[0] + 2]) && hx(s[pos[0] + 3])) {
            var cp = parseInt(String.fromCharCode(s[pos[0]], s[pos[0] + 1], s[pos[0] + 2], s[pos[0] + 3]), 16); pos[0] += 4;
            if (cp < 0x80) b.push(cp);
            else if (cp < 0x800) { b.push(0xC0 | (cp >> 6)); b.push(0x80 | (cp & 0x3F)); }
            else { b.push(0xE0 | (cp >> 12)); b.push(0x80 | ((cp >> 6) & 0x3F)); b.push(0x80 | (cp & 0x3F)); }
          } else b.push(e);
        } else b.push(c);
      }
      return b;
    }
    function childKey(prefix, key) {
      if (prefix.length === 0) return key.slice();
      var nk = prefix.slice(); nk.push(0x2e); pushAll(nk, key); return nk;
    }
    function emit(prefix, depth) {
      if (depth > 64) return;   // INV-20: bound JSON nesting depth (matches C pjs_emit depth>64)
      skipws();
      if (pos[0] >= n) return;
      var c = s[pos[0]];
      if (c === 0x7b) {
        pos[0] += 1; skipws();
        if (pos[0] < n && s[pos[0]] === 0x7d) { pos[0] += 1; return; }
        while (pos[0] < n) {
          skipws();
          if (pos[0] >= n || s[pos[0]] !== 0x22) break;
          var key = parseString(); skipws();
          if (pos[0] < n && s[pos[0]] === 0x3a) pos[0] += 1;
          emit(childKey(prefix, key), depth + 1); skipws();
          if (pos[0] < n && s[pos[0]] === 0x2c) { pos[0] += 1; continue; }
          if (pos[0] < n && s[pos[0]] === 0x7d) pos[0] += 1;
          break;
        }
      } else if (c === 0x5b) {
        pos[0] += 1; skipws();
        if (pos[0] < n && s[pos[0]] === 0x5d) { pos[0] += 1; return; }
        var idx = 0;
        while (pos[0] < n) {
          var ik = _strBytes(String(idx));
          emit(childKey(prefix, ik), depth + 1); idx += 1; skipws();
          if (pos[0] < n && s[pos[0]] === 0x2c) { pos[0] += 1; continue; }
          if (pos[0] < n && s[pos[0]] === 0x5d) pos[0] += 1;
          break;
        }
      } else if (c === 0x22) {
        var v = parseString(); pushAll(out, prefix); out.push(0x3d); pushAll(out, v); out.push(0x0a);
      } else {
        var start = pos[0];
        while (pos[0] < n) { var cc = s[pos[0]]; if (cc === 0x2c || cc === 0x7d || cc === 0x5d || isws(cc)) break; pos[0] += 1; }
        pushAll(out, prefix); out.push(0x3d); for (var q = start; q < pos[0]; q++) out.push(s[q]); out.push(0x0a);
      }
    }
    skipws(); emit([], 0);
    return out;
  };

  PicoVM.prototype._httplib = function (method, rd, rs1, rs2) {
    var src = this._spanBytes(this.regs[rs1]);
    if (method === "ParseQuery" || method === "ParseForm") {
      var out = [], pairs = [], cur = [];
      for (var p = 0; p < src.length; p++) { if (src[p] === 0x26) { pairs.push(cur); cur = []; } else cur.push(src[p]); }
      pairs.push(cur);
      for (var pi = 0; pi < pairs.length; pi++) {
        var pr = pairs[pi]; if (!pr.length) continue;
        var eq = pr.indexOf(0x3d), k, v;
        if (eq >= 0) { k = pr.slice(0, eq); v = pr.slice(eq + 1); } else { k = pr; v = []; }
        var dk = _urldecode(k), dv = _urldecode(v), a;
        for (a = 0; a < dk.length; a++) out.push(dk[a]);
        out.push(0x3d);
        for (a = 0; a < dv.length; a++) out.push(dv[a]);
        out.push(0x0a);
      }
      this.regs[rd] = this._newSpanBytes(out); return true;
    }
    if (method === "EncodeJson") {
      var lines = [], ln = [], i2;
      for (i2 = 0; i2 < src.length; i2++) { if (src[i2] === 0x0a) { lines.push(ln); ln = []; } else ln.push(src[i2]); }
      lines.push(ln);
      var jo = [0x7b], first = true;
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li], eq2 = line.indexOf(0x3d);
        if (eq2 < 0) continue;
        var ek = _jsonesc(line.slice(0, eq2)), ev = _jsonesc(line.slice(eq2 + 1)), a2;
        if (!first) jo.push(0x2c);
        first = false;
        jo.push(0x22); for (a2 = 0; a2 < ek.length; a2++) jo.push(ek[a2]);
        jo.push(0x22, 0x3a, 0x22); for (a2 = 0; a2 < ev.length; a2++) jo.push(ev[a2]);
        jo.push(0x22);
      }
      jo.push(0x7d);
      this.regs[rd] = this._newSpanBytes(jo); return true;
    }
    if (method === "ParseJson") {
      this.regs[rd] = this._newSpanBytes(this._parseJsonToModel(src)); return true;
    }
    return false;
  };

  // Compact pure-JS SHA-256 (32-bit ops, browser-safe; matches Python hashlib).
  var _SHA_K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function _sha256(bytes) {
    function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var m = bytes.slice(); var bitLen = m.length * 8;
    m.push(0x80);
    while (m.length % 64 !== 56) m.push(0);
    for (var p = 7; p >= 0; p--) m.push(Math.floor(bitLen / Math.pow(2, 8 * p)) & 0xff);
    var w = new Array(64);
    for (var off = 0; off < m.length; off += 64) {
      for (var t = 0; t < 16; t++) w[t] = ((m[off + 4 * t] << 24) | (m[off + 4 * t + 1] << 16) | (m[off + 4 * t + 2] << 8) | m[off + 4 * t + 3]) | 0;
      for (t = 16; t < 64; t++) {
        var s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
        var s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
        var ch = (e & f) ^ (~e & g);
        var temp1 = (h + S1 + ch + _SHA_K[t] + w[t]) | 0;
        var S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var temp2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + temp1) | 0; d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = [];
    for (var i = 0; i < 8; i++) out.push((H[i] >>> 24) & 255, (H[i] >>> 16) & 255, (H[i] >>> 8) & 255, H[i] & 255);
    return out;
  }

  // HMAC-SHA256 (RFC 2104) over the canonical _sha256 -> == Python hmac == C runtime.
  function _hmacSha256(key, msg) {
    if (key.length > 64) key = _sha256(key);
    var k = key.slice(); while (k.length < 64) k.push(0);
    var ipad = [], opad = [];
    for (var i = 0; i < 64; i++) { ipad.push(k[i] ^ 0x36); opad.push(k[i] ^ 0x5c); }
    var inner = _sha256(ipad.concat(msg));
    return _sha256(opad.concat(inner));
  }

  PicoVM.prototype._templatelib = function (method, rd, rs1, rs2) {
    var trim = function (a) { var p = 0, q = a.length; while (p < q && _ws(a[p])) p++; while (q > p && _ws(a[q - 1])) q--; return a.slice(p, q); };
    if (method === "Compile") {
      var src = this._spanBytes(this.regs[rs1]), plan = [], i = 0, n = src.length;
      var lit = function (b) { if (b.length) { plan.push(0x01, (b.length >> 8) & 255, b.length & 255); for (var x = 0; x < b.length; x++) plan.push(b[x]); } };
      var emitKey = function (op, key) { if (key.length > 255) key = key.slice(0, 255); plan.push(op, key.length); for (var y = 0; y < key.length; y++) plan.push(key[y]); };
      while (i < n) {
        var j = _bfind2(src, 0x7b, 0x7b, i);
        if (j < 0) { lit(src.slice(i)); break; }
        lit(src.slice(i, j));
        var k = _bfind2(src, 0x7d, 0x7d, j + 2);
        if (k < 0) { lit(src.slice(j)); break; }
        var inner = trim(src.slice(j + 2, k));
        var first = inner.length ? inner[0] : 0;
        if (first === 0x23) {                            // '#' section or '#each list'
          var rest = trim(inner.slice(1));
          if (rest.length >= 4 && rest[0] === 0x65 && rest[1] === 0x61 && rest[2] === 0x63 && rest[3] === 0x68 && (rest.length === 4 || _ws(rest[4]))) {
            emitKey(0x06, trim(rest.slice(4)));
          } else {
            emitKey(0x03, rest);
          }
        } else if (first === 0x5e) {                     // '^' inverted
          emitKey(0x04, trim(inner.slice(1)));
        } else if (first === 0x2f) {                     // '/' end
          plan.push(0x05);
        } else {                                         // hole
          emitKey(0x02, inner);
        }
        i = k + 2;
      }
      this.regs[rd] = this._newSpanBytes(plan); return true;
    }
    if (method === "Render") {
      var plan = this._spanBytes(this.regs[rs1]), mb = this._spanBytes(this.regs[rs2]), model = {}, cur = [];
      var self = this, mcount = 0;
      var commit = function (ln) {
        var eq = ln.indexOf(0x3d);
        if (eq >= 0) {
          if (++mcount > 512) throw picoFault(FAULT.TEMPLATE, self.curPc, mcount, "template model exceeded");  // INV-19
          model[_keystr(ln.slice(0, eq))] = ln.slice(eq + 1);
        }
      };
      for (var p = 0; p < mb.length; p++) { if (mb[p] === 0x0a) { commit(cur); cur = []; } else cur.push(mb[p]); }
      commit(cur);
      var resolve = function (keyArr, prefix) {
        var ks = _keystr(keyArr);
        if (ks === ".") return model[prefix] || [];
        if (prefix) { var v = model[prefix + "." + ks]; if (v !== undefined) return v; }
        return model[ks] || [];
      };
      var countList = function (full) {
        var c = 0;
        for (;;) {
          var base = full + "." + c, has = (model[base] !== undefined);
          if (!has) { var bp = base + "."; for (var kk in model) { if (kk.indexOf(bp) === 0) { has = true; break; } } }
          if (has) c++; else return c;
        }
      };
      var skipBlock = function (pp) {
        var depth = 1;
        while (pp < plan.length && depth > 0) {
          var o = plan[pp++];
          if (o === 0x01) { pp += 2 + ((plan[pp] << 8) | plan[pp + 1]); }
          else if (o === 0x02) { pp += 1 + plan[pp]; }
          else if (o === 0x03 || o === 0x04 || o === 0x06) { pp += 1 + plan[pp]; depth++; }
          else if (o === 0x05) { depth--; }
        }
        return pp;
      };
      var out = [], prefix = "", stack = [], i = 0, n = plan.length;
      while (i < n) {
        if (out.length > 262144) throw picoFault(FAULT.TEMPLATE, this.curPc, out.length, "template output exceeded");  // INV-19
        var op = plan[i++];
        if (op === 0x01) { var ln2 = (plan[i] << 8) | plan[i + 1]; i += 2; for (var q = 0; q < ln2; q++) out.push(plan[i + q]); i += ln2; }
        else if (op === 0x02) { var kl = plan[i++]; var v = resolve(plan.slice(i, i + kl), prefix); i += kl; for (var r = 0; r < v.length; r++) out.push(v[r]); }
        else if (op === 0x03 || op === 0x04) {
          var kl2 = plan[i++], key = plan.slice(i, i + kl2); i += kl2;
          var truthy = resolve(key, prefix).length > 0;
          if (op === 0x03 ? truthy : !truthy) {
            if (stack.length >= 32) throw picoFault(FAULT.TEMPLATE, this.curPc, 0, "template depth exceeded");  // INV-19: TPL_MAXDEPTH
            stack.push(["sec", prefix, 0, 0, "", 0]);
          } else i = skipBlock(i);
        }
        else if (op === 0x06) {
          var kl3 = plan[i++], lk = _keystr(plan.slice(i, i + kl3)); i += kl3;
          var full = prefix ? (prefix + "." + lk) : lk, cnt = countList(full);
          if (cnt > 100000) throw picoFault(FAULT.TEMPLATE, this.curPc, cnt, "template each-count exceeded");  // INV-19
          if (cnt === 0) i = skipBlock(i);
          else {
            if (stack.length >= 32) throw picoFault(FAULT.TEMPLATE, this.curPc, 0, "template depth exceeded");
            stack.push(["each", prefix, i, cnt, full, 0]); prefix = full + ".0";
          }
        }
        else if (op === 0x05) {
          if (stack.length) {
            var fr = stack[stack.length - 1];
            if (fr[0] === "each") {
              fr[5]++;
              if (fr[5] < fr[3]) { prefix = fr[4] + "." + fr[5]; i = fr[2]; }
              else { prefix = fr[1]; stack.pop(); }
            } else { prefix = fr[1]; stack.pop(); }
          }
        }
        else break;
      }
      this.regs[rd] = this._newSpanBytes(out); return true;
    }
    return false;
  };

  // ---- PIOS Req.*/Resp.* simulated host backend --------------------------
  PicoVM.prototype.setRequestContext = function (ctx) {
    ctx = ctx || {};
    // Automatic per-request arena scope: reclaim the previous request's spans,
    // then re-take the post-setup base (mirrors picoscript_vm.install_request_context).
    if (this._handlerMark) {
      this.arenaTop = this._handlerMark[0];
      if (this._handlerMark[1] < this.spans.length) this.spans.length = this._handlerMark[1];
    }
    this._handlerMark = [this.arenaTop, this.spans.length];
    var headers = ctx.headers || {}, body = ctx.body || [], hdr = {};
    Object.keys(headers).forEach(function (k) {
      hdr[String(k).toLowerCase()] = {
        name: this._strSpan(String(k)),
        value: this._strSpan(String(headers[k]))
      };
    }, this);
    function bodySpan(chunk) {
      if (chunk instanceof Uint8Array) return this._newSpanBytes(Array.from(chunk));
      if (Array.isArray(chunk)) return this._newSpanBytes(chunk.map(function (b) { return b & 0xFF; }));
      return this._strSpan(String(chunk));
    }
    this.requestContext = {
      seq: (ctx.seq || 0) >>> 0,
      principal: this._strSpan(String(ctx.principal || "")),
      method: this._strSpan(String(ctx.method || "GET")),
      path: this._strSpan(String(ctx.path || "/")),
      headers: hdr,
      bodyMode: (ctx.bodyMode || ctx.body_mode || 0) >>> 0,
      body: body.map(function (chunk) { return bodySpan.call(this, chunk); }, this),
      sliceOffset: 0,
      sliceLen: 0
    };
    this.responseGraph = [];
    this.responseSealed = false;
    this.responseEnded = false;
    this.responseMode = null;
    this.responseBodyStarted = false;
    this.responseStreamClosed = false;
  };
  PicoVM.prototype.installRequestContext = PicoVM.prototype.setRequestContext;
  PicoVM.prototype.setArenaBase = function () { this._handlerMark = [this.arenaTop, this.spans.length]; };
  PicoVM.prototype.getResponseGraph = function () {
    return this.responseGraph.map(function (d) {
      return { kind: d.kind, subtype: d.subtype, payload: d.payload };
    });
  };
  PicoVM.prototype._requireRequestContext = function () {
    // I4: Req.* reads are confined to the kernel-installed bound context.
    if (!this.requestContext) throw new Error("I4 violation: Req.* without installed request context");
    return this.requestContext;
  };
  PicoVM.prototype._ensureResponseOpen = function () {
    // I2: there is exactly one response graph being built; End closes it.
    if (this.responseEnded) throw new Error("I2 violation: response graph already finalized");
  };
  PicoVM.prototype._ensurePreambleMutable = function () {
    // I3: after Seal, the preamble and headers are immutable/frozen.
    if (this.responseSealed) throw new Error("I3 violation: response preamble/headers sealed");
  };
  PicoVM.prototype._ensureHeaderPhase = function () {
    // I6: headers belong to the preamble/header phase, which precedes the body
    // phase. Status may still be set last, but a header may not follow a body write.
    if (this.responseBodyStarted) throw new Error("I6 violation: header after body phase started");
  };
  PicoVM.prototype._ensureStreamOpen = function () {
    // I6: body writes are illegal once the stream phase is closed (Resp.EndStream).
    if (this.responseStreamClosed) throw new Error("I6 violation: body write after stream phase closed");
  };
  PicoVM.prototype._desc = function (kind, subtype, payload) {
    return { kind: kind, subtype: subtype == null ? null : subtype, payload: payload == null ? null : payload };
  };
  PicoVM.prototype._spanPayload = function (handle) {
    var s = (handle > 0 && handle < this.spans.length) ? this.spans[handle] : { ptr: 0, len: 0 };
    return { span: handle | 0, text: this._spanStr(handle | 0), ptr: s.ptr, len: s.len };
  };
  PicoVM.prototype._respStatus = function (code) {
    this._ensureResponseOpen();
    this._ensurePreambleMutable();
    var desc = this._desc("DESC_PREAMBLE", "STATUS", { code: code | 0 });
    for (var i = 0; i < this.responseGraph.length; i++) {
      if (this.responseGraph[i].kind === "DESC_PREAMBLE" && this.responseGraph[i].subtype === "STATUS") {
        this.responseGraph[i] = desc; return;
      }
    }
    this.responseGraph.push(desc);
  };
  PicoVM.prototype._respSeal = function (explicit) {
    this._ensureResponseOpen();
    if (this.responseSealed) {
      // I3 (use-after-seal): re-sealing via the explicit verb is rejected;
      // Respond's internal seal is idempotent.
      if (explicit) throw new Error("I3 violation: response already sealed");
      return;
    }
    this.responseGraph.push(this._desc("DESC_COMMIT", "SEAL", null));
    this.responseSealed = true;
    if (explicit && this.responseMode === null) this.responseMode = "stream";
  };
  PicoVM.prototype._respEnd = function () {
    this._ensureResponseOpen();
    if (this.responseMode === null) this.responseMode = "unary";
    this.responseGraph.push(this._desc("DESC_COMMIT", "END", null));
    this.responseEnded = true;
  };
  PicoVM.prototype._req = function (method, rd, rs1, rs2) {
    var ctx = this._requireRequestContext(), R = this.regs;
    if (method === "Seq") { R[rd] = ctx.seq | 0; return true; }
    if (method === "Principal") { R[rd] = ctx.principal | 0; return true; }
    if (method === "Method") { R[rd] = ctx.method | 0; return true; }
    if (method === "Path") { R[rd] = ctx.path | 0; return true; }
    if (method === "Header") { var h = ctx.headers[this._spanStr(R[rs1]).toLowerCase()]; R[rd] = h ? h.value : 0; return true; }
    if (method === "BodyMode") { R[rd] = ctx.bodyMode | 0; return true; }
    if (method === "BodyCount") { R[rd] = ctx.body.length | 0; return true; }
    if (method === "BodySpan") { var idx = R[rs1] | 0; R[rd] = (idx >= 0 && idx < ctx.body.length) ? ctx.body[idx] : 0; return true; }
    if (method === "SetSlice") { ctx.sliceOffset = Math.max(0, R[rs1] | 0); ctx.sliceLen = Math.max(0, R[rs2] | 0); R[rd] = 1; return true; }
    if (method === "BodyLen") { var li = R[rs1] | 0, lh = (li >= 0 && li < ctx.body.length) ? ctx.body[li] : 0; R[rd] = lh ? this._spanBytes(lh).length : 0; return true; }
    if (method === "BodySlice") { var si = R[rs1] | 0, sh = (si >= 0 && si < ctx.body.length) ? ctx.body[si] : 0, sd = sh ? this._spanBytes(sh) : []; var so = Math.min(ctx.sliceOffset, sd.length), se = Math.min(so + ctx.sliceLen, sd.length); R[rd] = this._newSpanBytes(sd.slice(so, se)); return true; }
    return false;
  };
  PicoVM.prototype._resp = function (method, rd, rs1, rs2) {
    var R = this.regs;
    if (method === "Status") { this._respStatus(R[rs1]); return true; }
    if (method === "Header") {
      this._ensureResponseOpen(); this._ensurePreambleMutable(); this._ensureHeaderPhase();
      this.responseGraph.push(this._desc("DESC_HEADER", null, { name: this._spanPayload(R[rs1]), value: this._spanPayload(R[rs2]) }));
      return true;
    }
    if (method === "Write") {
      this._ensureResponseOpen(); this._ensureStreamOpen();
      this.responseBodyStarted = true;
      this.responseGraph.push(this._desc("DESC_BODY", null, this._spanPayload(R[rs1])));
      return true;
    }
    if (method === "Trailer") {
      this._ensureResponseOpen();
      this.responseGraph.push(this._desc("DESC_TRAILER", null, { name: this._spanPayload(R[rs1]), value: this._spanPayload(R[rs2]) }));
      return true;
    }
    if (method === "Seal") { this._respSeal(true); return true; }
    if (method === "End") { this._respEnd(); return true; }
    if (method === "Respond") { this._respStatus(R[rs1]); this._respSeal(false); this._respEnd(); return true; }
    if (method === "Flush") { this._ensureResponseOpen(); this.responseGraph.push(this._desc("DESC_CONTROL", "FLUSH", null)); return true; }
    if (method === "Continue") { this._ensureResponseOpen(); this.responseGraph.push(this._desc("DESC_CONTROL", "CONTINUE_100", null)); return true; }
    if (method === "EndStream") {
      this._ensureResponseOpen(); this._ensureStreamOpen();
      if (this.responseMode !== "stream") throw new Error("I6 violation: EndStream outside stream mode (no open stream phase)");
      this.responseGraph.push(this._desc("DESC_CONTROL", "END_STREAM", null));
      this.responseStreamClosed = true;
      return true;
    }
    if (method === "Upgrade") { this._ensureResponseOpen(); this.responseGraph.push(this._desc("DESC_UPGRADE", null, this._spanPayload(R[rs1]))); return true; }
    if (method === "Abort") { this._ensureResponseOpen(); this.responseGraph.push(this._desc("DESC_ABORT", null, { code: R[rs1] | 0 })); this.responseEnded = true; return true; }
    if (method === "EarlyHints") { this._ensureResponseOpen(); this.responseGraph.push(this._desc("DESC_CONTROL", "EARLY_HINTS_103", null)); return true; }
    return false;
  };

  // Mirrors picoscript_vm HostApi._textio: arena-backed Utf8Writer/Reader + Json/Xml.
  PicoVM.prototype._wByte = function (w, b) { if (w.pos < w.cap) { this.mem[w.ptr + w.pos] = b & 0xFF; w.pos++; } };
  PicoVM.prototype._wText = function (w, text) { var b = new TextEncoder().encode(text); for (var i = 0; i < b.length; i++) this._wByte(w, b[i]); };
  PicoVM.prototype._wSpan = function (w, h) { var s = (h > 0 && h < this.spans.length) ? this.spans[h] : null; if (s) { for (var i = 0; i < s.len; i++) this._wByte(w, this.mem[s.ptr + i]); } };
  function jsonEsc(s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], o = s.charCodeAt(i);
      if (ch === '"') out += '\\"';
      else if (ch === '\\') out += '\\\\';
      else if (ch === '\n') out += '\\n';
      else if (ch === '\r') out += '\\r';
      else if (ch === '\t') out += '\\t';
      else if (o < 0x20) out += '\\u' + ('000' + o.toString(16)).slice(-4);
      else out += ch;
    }
    return out;
  }
  function xmlEsc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  PicoVM.prototype._jsonPre = function (w) {
    if (!w.stack.length) return;
    var st = w.stack[w.stack.length - 1];
    if (st.afterKey) st.afterKey = false;
    else if (st.count > 0) this._wByte(w, 0x2C);
  };
  PicoVM.prototype._jsonPost = function (w) { if (w.stack.length) w.stack[w.stack.length - 1].count += 1; };
  PicoVM.prototype._textio = function (ns, method, rd, rs1, rs2) {
    if (!this._tio) this._tio = { writers: {}, readers: {}, nextW: 1, nextR: 1 };
    var T = this._tio, R = this.regs;
    if (ns === "Utf8Writer") {
      if (method === "New") { var h = T.nextW++; T.writers[h] = { ptr: R[rs1] & 0xFFFF, cap: R[rs2] & 0xFFFF, pos: 0, stack: [] }; R[rd] = h; return true; }
      var w = T.writers[R[rs1]]; if (!w) { R[rd] = 0; return true; }
      if (method === "Byte") { this._wByte(w, R[rs2]); return true; }
      if (method === "Int") { this._wText(w, String(R[rs2] | 0)); return true; }
      if (method === "Span") { this._wSpan(w, R[rs2]); return true; }
      if (method === "ToSpan") { this.spans.push({ ptr: w.ptr, len: w.pos }); R[rd] = this.spans.length - 1; return true; }
      if (method === "Len") { R[rd] = w.pos; return true; }
      if (method === "Reset") { w.pos = 0; w.stack = []; return true; }
      return false;
    }
    if (ns === "Utf8Reader") {
      if (method === "New") { var s = (R[rs1] > 0 && R[rs1] < this.spans.length) ? this.spans[R[rs1]] : { ptr: 0, len: 0 }; var rh = T.nextR++; T.readers[rh] = { ptr: s.ptr, len: s.len, pos: 0 }; R[rd] = rh; return true; }
      var r = T.readers[R[rs1]]; if (!r) { R[rd] = 0; return true; }
      if (method === "Peek") { R[rd] = r.pos < r.len ? this.mem[r.ptr + r.pos] : 0; return true; }
      if (method === "Next") { R[rd] = r.pos < r.len ? this.mem[r.ptr + r.pos] : 0; if (r.pos < r.len) r.pos++; return true; }
      if (method === "SkipWs") { while (r.pos < r.len && (this.mem[r.ptr + r.pos] === 32 || this.mem[r.ptr + r.pos] === 9 || this.mem[r.ptr + r.pos] === 10 || this.mem[r.ptr + r.pos] === 13)) r.pos++; return true; }
      if (method === "Eof") { R[rd] = r.pos >= r.len ? 1 : 0; return true; }
      if (method === "Pos") { R[rd] = r.pos; return true; }
      if (method === "Match") { if (r.pos < r.len && this.mem[r.ptr + r.pos] === (R[rs2] & 0xFF)) { r.pos++; R[rd] = 1; } else R[rd] = 0; return true; }
      if (method === "Int") {
        while (r.pos < r.len && (this.mem[r.ptr + r.pos] === 32 || this.mem[r.ptr + r.pos] === 9 || this.mem[r.ptr + r.pos] === 10 || this.mem[r.ptr + r.pos] === 13)) r.pos++;
        var sign = 1; if (r.pos < r.len && this.mem[r.ptr + r.pos] === 0x2D) { sign = -1; r.pos++; }
        var n = 0; while (r.pos < r.len && this.mem[r.ptr + r.pos] >= 0x30 && this.mem[r.ptr + r.pos] <= 0x39) { n = n * 10 + (this.mem[r.ptr + r.pos] - 0x30); r.pos++; }
        R[rd] = (sign * n) | 0; return true;
      }
      return false;
    }
    if (ns === "Json") {
      var jw = T.writers[R[rs1]]; if (!jw) { R[rd] = 0; return true; }
      if (method === "BeginObject" || method === "BeginArray") {
        this._jsonPre(jw); this._wByte(jw, method === "BeginObject" ? 0x7B : 0x5B);
        if (jw.stack.length) jw.stack[jw.stack.length - 1].count += 1;
        jw.stack.push({ count: 0, afterKey: false }); return true;
      }
      if (method === "EndObject" || method === "EndArray") { if (jw.stack.length) jw.stack.pop(); this._wByte(jw, method === "EndObject" ? 0x7D : 0x5D); return true; }
      if (method === "Key") {
        var st = jw.stack.length ? jw.stack[jw.stack.length - 1] : null;
        if (st && st.count > 0) this._wByte(jw, 0x2C);
        this._wByte(jw, 0x22); this._wText(jw, jsonEsc(this._spanStr(R[rs2]))); this._wByte(jw, 0x22); this._wByte(jw, 0x3A);
        if (st) st.afterKey = true; return true;
      }
      if (method === "Str") { this._jsonPre(jw); this._wByte(jw, 0x22); this._wText(jw, jsonEsc(this._spanStr(R[rs2]))); this._wByte(jw, 0x22); this._jsonPost(jw); return true; }
      if (method === "Int") { this._jsonPre(jw); this._wText(jw, String(R[rs2] | 0)); this._jsonPost(jw); return true; }
      if (method === "Bool") { this._jsonPre(jw); this._wText(jw, R[rs2] ? "true" : "false"); this._jsonPost(jw); return true; }
      if (method === "Null") { this._jsonPre(jw); this._wText(jw, "null"); this._jsonPost(jw); return true; }
      if (method === "Raw") { this._jsonPre(jw); this._wSpan(jw, R[rs2]); this._jsonPost(jw); return true; }
      return false;
    }
    if (ns === "Xml") {
      var xw = T.writers[R[rs1]]; if (!xw) { R[rd] = 0; return true; }
      if (method === "Open") { this._wByte(xw, 0x3C); this._wSpan(xw, R[rs2]); return true; }
      if (method === "AttrName") { this._wByte(xw, 0x20); this._wSpan(xw, R[rs2]); this._wByte(xw, 0x3D); this._wByte(xw, 0x22); return true; }
      if (method === "AttrValue") { this._wText(xw, xmlEsc(this._spanStr(R[rs2]))); this._wByte(xw, 0x22); return true; }
      if (method === "OpenEnd") { this._wByte(xw, 0x3E); return true; }
      if (method === "Text") { this._wText(xw, xmlEsc(this._spanStr(R[rs2]))); return true; }
      if (method === "Close") { this._wByte(xw, 0x3C); this._wByte(xw, 0x2F); this._wSpan(xw, R[rs2]); this._wByte(xw, 0x3E); return true; }
      if (method === "Empty") { this._wByte(xw, 0x2F); this._wByte(xw, 0x3E); return true; }
      return false;
    }
    return false;
  };

  function modelLookup(model, key) {
    var lines = String(model).split(/\r?\n/), p = key + "=";
    for (var i = 0; i < lines.length; i++) if (lines[i].indexOf(p) === 0) return lines[i].slice(p.length);
    return "";
  }
  PicoVM.prototype._textrender = function (method, rd, rs1, rs2) {
    if (!this._tio) this._tio = { writers: {}, readers: {}, nextW: 1, nextR: 1 };
    var R = this.regs, T = this._tio;
    if (method === "Hole") {
      var hw = T.writers[1];
      if (!hw) { R[rd] = 0; return true; }
      this._wText(hw, xmlEsc(modelLookup(this._spanStr(R[rs1]), this._spanStr(R[rs2])))); R[rd] = 1; return true;
    }
    var w = T.writers[R[rs1]];
    if (!w) { R[rd] = 0; return true; }
    if (method === "Raw") { this._wSpan(w, R[rs2]); R[rd] = 1; return true; }
    if (method === "Text") { this._wText(w, xmlEsc(this._spanStr(R[rs2]))); R[rd] = 1; return true; }
    if (method === "Open") { this._wByte(w, 0x3C); this._wSpan(w, R[rs2]); R[rd] = 1; return true; }
    if (method === "Attr") { var sp = this._spanStr(R[rs2]).split("="); var name = sp.shift() || ""; var val = sp.join("="); this._wByte(w, 0x20); this._wText(w, name); this._wText(w, '="'); this._wText(w, xmlEsc(val)); this._wByte(w, 0x22); R[rd] = 1; return true; }
    if (method === "OpenEnd") { this._wByte(w, 0x3E); R[rd] = 1; return true; }
    if (method === "Close") { this._wText(w, "</"); this._wSpan(w, R[rs2]); this._wByte(w, 0x3E); R[rd] = 1; return true; }
    if (method === "Empty") { this._wText(w, "/>"); R[rd] = 1; return true; }
    if (method === "Br") { this._wText(w, "<br/>"); R[rd] = 1; return true; }
    return false;
  };

  // Mirrors picoscript_vm HostApi._storage. Context model (cur pack + card)
  // keeps every op within the 2-in/1-out host ABI; field names and queries are
  // UTF-8 byte-spans the program builds in arena memory.
  // ---- Tensor / BitLinear inference primitives ----------------------------
  function i8(b) { return b > 127 ? b - 256 : b; }
  function i32beAt(bytes, idx) {
    var o = idx * 4; if (o + 4 > bytes.length) return 0;
    return ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) | 0;
  }
  function packI32(vals) {
    var out = [];
    for (var i = 0; i < vals.length; i++) { var v = vals[i] | 0; out.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255); }
    return out;
  }
  PicoVM.prototype._tensor = function (method, rd, rs1, rs2) {
    if (method === "SetShape") { this.tensorRows = Math.max(0, this.regs[rs1] | 0); this.tensorCols = Math.max(0, this.regs[rs2] | 0); this.regs[rd] = 1; return true; }
    if (method === "DotI8") { var a = this._spanBytes(this.regs[rs1]), b = this._spanBytes(this.regs[rs2]), n = this.tensorCols || Math.min(a.length, b.length), acc = 0; for (var i = 0; i < n && i < a.length && i < b.length; i++) acc = (acc + i8(a[i]) * i8(b[i])) | 0; this.regs[rd] = acc; return true; }
    if (method === "MatVecI8") { var mat = this._spanBytes(this.regs[rs1]), vec = this._spanBytes(this.regs[rs2]), rows = this.tensorRows, cols = this.tensorCols || vec.length, vals = []; for (var r = 0; r < rows; r++) { var sum = 0, base = r * cols; for (var c = 0; c < cols; c++) if (base + c < mat.length && c < vec.length) sum = (sum + i8(mat[base + c]) * i8(vec[c])) | 0; vals.push(sum); } this.regs[rd] = this._newSpanBytes(packI32(vals)); return true; }
    if (method === "ArgMaxI32") { var ai = this._spanBytes(this.regs[rs1]), bestI = 0, bestV = null, an = Math.floor(ai.length / 4); for (var ix = 0; ix < an; ix++) { var av = i32beAt(ai, ix); if (bestV === null || av > bestV) { bestV = av; bestI = ix; } } this.regs[rd] = bestI; return true; }
    if (["AddI32","MulI32","ScaleI32","ReluI32","RmsNormI32","RoPEI32","SoftmaxI32"].indexOf(method) >= 0) {
      var x = this._spanBytes(this.regs[rs1]), xn = Math.floor(x.length / 4), res = [];
      if (method === "AddI32" || method === "MulI32") {
        var y = this._spanBytes(this.regs[rs2]), yn = Math.min(xn, Math.floor(y.length / 4));
        for (var j = 0; j < yn; j++) {
          var av2 = i32beAt(x, j), bv2 = i32beAt(y, j);
          res.push(method === "AddI32" ? ((av2 + bv2) | 0) : ((Math.imul(av2, bv2) >> 8) | 0));
        }
      } else if (method === "ScaleI32") {
        var sc = this.regs[rs2] | 0; for (var k = 0; k < xn; k++) res.push(Math.imul(i32beAt(x, k), sc));
      } else if (method === "ReluI32") {
        for (var m = 0; m < xn; m++) { var rv = i32beAt(x, m); res.push(rv < 0 ? 0 : rv); }
      } else if (method === "RmsNormI32") {
        var g = this._spanBytes(this.regs[rs2]), ss = 0; for (var rn = 0; rn < xn; rn++) { var xv = i32beAt(x, rn); ss += xv * xv; }
        var rms = Math.max(1, Math.floor(Math.sqrt(Math.max(1, Math.floor(ss / Math.max(1, xn))))));
        for (var ri = 0; ri < xn; ri++) { var gg = (ri * 4 + 4 <= g.length) ? i32beAt(g, ri) : 256; res.push(((i32beAt(x, ri) * gg) / rms) | 0); }
      } else if (method === "RoPEI32") {
        var csb = this._spanBytes(this.regs[rs2]), pairs = Math.floor(xn / 2);
        for (var pi = 0; pi < pairs; pi++) {
          var xx = i32beAt(x, pi * 2), yy = i32beAt(x, pi * 2 + 1);
          var cc = (pi * 8 + 4 <= csb.length) ? i32beAt(csb, pi * 2) : 32768;
          var sn = (pi * 8 + 8 <= csb.length) ? i32beAt(csb, pi * 2 + 1) : 0;
          res.push(((xx * cc - yy * sn) >> 15) | 0, ((xx * sn + yy * cc) >> 15) | 0);
        }
      } else if (method === "SoftmaxI32") {
        var xs = [], mx = null; for (var si = 0; si < xn; si++) { var sv = i32beAt(x, si); xs.push(sv); if (mx === null || sv > mx) mx = sv; }
        var ws = [], sumw = 0; for (var wi = 0; wi < xs.length; wi++) { var bucket = Math.min(15, Math.max(0, (mx - xs[wi]) >> 8)); var ww = Math.max(1, 32768 >> bucket); ws.push(ww); sumw += ww; }
        for (var oi = 0; oi < ws.length; oi++) res.push(Math.floor(ws[oi] * 32767 / Math.max(1, sumw)));
      }
      this.regs[rd] = this._newSpanBytes(packI32(res)); return true;
    }
    return false;
  };
  function ternaryWeight(packed, idx) { if (((idx / 4) | 0) >= packed.length) return 0; var code = (packed[(idx / 4) | 0] >>> ((idx & 3) * 2)) & 3; return code === 1 ? 1 : (code === 2 ? -1 : 0); }
  function decodeRowSpec(spec, defStart, defCount, maxRows) {
    spec = spec >>> 0;
    var start = spec ? ((spec >>> 16) & 0xFFFF) : (defStart | 0);
    var count = spec ? (spec & 0xFFFF) : (defCount | 0);
    if (count <= 0) count = Math.max(0, (maxRows | 0) - start);
    if (start < 0) start = 0;
    if (start > maxRows) start = maxRows | 0;
    return [start | 0, Math.min(count | 0, Math.max(0, (maxRows | 0) - start)) | 0];
  }
  function bitmapWeight(packed, row, col, cols) {
    var mb = Math.ceil(cols / 8), base = row * mb * 2, byte = (col / 8) | 0, bit = 1 << (col & 7);
    var z = (packed[base + byte] || 0) & bit, mn = (packed[base + mb + byte] || 0) & bit;
    return z ? 0 : (mn ? -1 : 1);
  }
  function base3Weight(packed, row, col, cols) {
    var rb = Math.ceil(cols / 5), stride = (rb + 3) & ~3, idx = row * stride + ((col / 5) | 0);
    var code = packed[idx] || 0, tr = [0, 0, 0, 0, 0];
    for (var i = 4; i >= 0; i--) { var t = code % 3; code = Math.floor(code / 3); tr[i] = t === 0 ? 0 : (t === 1 ? 1 : -1); }
    return tr[col % 5];
  }
  PicoVM.prototype._tensorBlobLayout = function (tid) {
    var t = (this._modelState && this._modelState.tensors[tid | 0]) || {};
    var st = this._st || { blobs: {} }, blob = st.blobs[String(t.pack || 0) + ":" + (t.card || 0)] || [];
    var fmt = t.fmt || 0, elem = (fmt === 1 || fmt === 2 || fmt === 3 || fmt === 15) ? 1 : 4;
    return { blob: blob, off: t.off || 0, rows: t.rows || 0, cols: t.cols || 0, fmt: fmt, elem: elem };
  };
  PicoVM.prototype._modelBlockMatVec = function (rd, tid, vecHandle, kind) {
    var L = this._tensorBlobLayout(tid), vec = this._spanBytes(vecHandle), cols = L.cols || vec.length;
    var block = this._modelState && this._modelState.block || { start: 0, count: 0 };
    var rc = decodeRowSpec(0, block.start || 0, block.count || 0, L.rows || 0), start = rc[0], count = rc[1], vals = [];
    var packed = L.blob.slice(L.off || 0);
    for (var r = start; r < start + count; r++) {
      var acc = 0;
      if (kind === "i8") {
        var base = (L.off || 0) + r * cols * L.elem;
        for (var c = 0; c < cols && c < vec.length; c++) if (base + c < L.blob.length) acc = (acc + i8(L.blob[base + c]) * i8(vec[c])) | 0;
      } else {
        for (var c2 = 0; c2 < cols && c2 < vec.length; c2++) {
          var w = kind === "ternary" ? ternaryWeight(packed, r * cols + c2) : (kind === "bitmap" ? bitmapWeight(packed, r, c2, cols) : base3Weight(packed, r, c2, cols));
          acc = (acc + w * i8(vec[c2])) | 0;
        }
      }
      vals.push(acc);
    }
    this.regs[rd] = this._newSpanBytes(packI32(vals)); return true;
  };
  PicoVM.prototype._bitlinear = function (method, rd, rs1, rs2) {
    if (method === "SetShape") { this.bitlinearRows = Math.max(0, this.regs[rs1] | 0); this.bitlinearCols = Math.max(0, this.regs[rs2] | 0); this.regs[rd] = 1; return true; }
    if (method === "MatVecTernary") { var w = this._spanBytes(this.regs[rs1]), v = this._spanBytes(this.regs[rs2]), rows = this.bitlinearRows, cols = this.bitlinearCols || v.length, vals = []; for (var r = 0; r < rows; r++) { var acc = 0, base = r * cols; for (var c = 0; c < cols; c++) if (c < v.length) acc = (acc + ternaryWeight(w, base + c) * i8(v[c])) | 0; vals.push(acc); } this.regs[rd] = this._newSpanBytes(packI32(vals)); return true; }
    if (method === "MatVecBitmap") { var bw = this._spanBytes(this.regs[rs1]), bv = this._spanBytes(this.regs[rs2]), brows = this.bitlinearRows, bcols = this.bitlinearCols || bv.length, mb = Math.ceil(bcols / 8), bvals = []; for (var br = 0; br < brows; br++) { var bacc = 0, row = br * mb * 2; for (var bc = 0; bc < bcols && bc < bv.length; bc++) { var bit = 1 << (bc & 7), z = (bw[row + ((bc / 8) | 0)] || 0) & bit, mn = (bw[row + mb + ((bc / 8) | 0)] || 0) & bit; bacc = (bacc + (z ? 0 : (mn ? -1 : 1)) * i8(bv[bc])) | 0; } bvals.push(bacc); } this.regs[rd] = this._newSpanBytes(packI32(bvals)); return true; }
    if (method === "MatVecBase3") { var pw = this._spanBytes(this.regs[rs1]), pv = this._spanBytes(this.regs[rs2]), prows = this.bitlinearRows, pcols = this.bitlinearCols || pv.length, rb = Math.ceil(pcols / 5), stride = (rb + 3) & ~3, pvals = []; for (var pr = 0; pr < prows; pr++) { var pacc = 0, col = 0; for (var pb = 0; pb < rb; pb++) { var code = pw[pr * stride + pb] || 0, tr = [0,0,0,0,0]; for (var ti = 4; ti >= 0; ti--) { var tt = code % 3; code = Math.floor(code / 3); tr[ti] = tt === 0 ? 0 : (tt === 1 ? 1 : -1); } for (var tj = 0; tj < 5 && col < pcols && col < pv.length; tj++, col++) pacc = (pacc + tr[tj] * i8(pv[col])) | 0; } pvals.push(pacc); } this.regs[rd] = this._newSpanBytes(packI32(pvals)); return true; }
    if (method === "MatVecTernaryBlock") return this._modelBlockMatVec(rd, this.regs[rs1] | 0, this.regs[rs2], "ternary");
    if (method === "MatVecBitmapBlock") return this._modelBlockMatVec(rd, this.regs[rs1] | 0, this.regs[rs2], "bitmap");
    if (method === "MatVecBase3Block") return this._modelBlockMatVec(rd, this.regs[rs1] | 0, this.regs[rs2], "base3");
    return false;
  };

  PicoVM.prototype._quant = function (method, rd, rs1, rs2) {
    var data = (method === "GroupScale") ? [] : this._spanBytes(this.regs[rs1]);
    if (method === "AbsMax") { var mx = 0; for (var i = 0; i < Math.floor(data.length / 4); i++) mx = Math.max(mx, Math.abs(i32beAt(data, i))); this.regs[rd] = mx; return true; }
    if (method === "QuantI8") { var scale = Math.max(1, this.regs[rs2] | 0), out = []; for (var q = 0; q < Math.floor(data.length / 4); q++) { var v = (i32beAt(data, q) / scale) | 0; out.push(v < -128 ? 128 : (v > 127 ? 255 : (v & 255))); } this.regs[rd] = this._newSpanBytes(out); return true; }
    if (method === "DequantI8") { var sc = this.regs[rs2] | 0, vals = data.map(function (b) { return i8(b) * sc; }); this.regs[rd] = this._newSpanBytes(packI32(vals)); return true; }
    if (method === "ApplyScale") { var as = this.regs[rs2] | 0, av = []; for (var a = 0; a < Math.floor(data.length / 4); a++) av.push(Math.imul(i32beAt(data, a), as)); this.regs[rd] = this._newSpanBytes(packI32(av)); return true; }
    if (method === "GroupScale") { var spec = this.regs[rs1] >>> 0, n = (spec >>> 16) & 0xFFFF, group = Math.max(1, spec & 0xFFFF), gv = []; for (var g = 0; g < n; g += group) gv.push(Math.min(group, n - g)); this.regs[rd] = this._newSpanBytes(packI32(gv)); return true; }
    return false;
  };

  PicoVM.prototype._attention = function (method, rd, rs1, rs2) {
    if (!this._attn) this._attn = { heads: 1, dim: 0 };
    if (method === "SetShape") { this._attn = { heads: Math.max(1, this.regs[rs1] | 0), dim: Math.max(0, this.regs[rs2] | 0) }; this.regs[rd] = 1; return true; }
    if (method === "Scores") { var q = this._spanBytes(this.regs[rs1]), k = this._spanBytes(this.regs[rs2]), dim = this._attn.dim || Math.min(q.length, k.length), rows = Math.floor(k.length / Math.max(1, dim)), vals = []; for (var r = 0; r < rows; r++) { var acc = 0, base = r * dim; for (var c = 0; c < dim; c++) if (c < q.length && base + c < k.length) acc = (acc + i8(q[c]) * i8(k[base + c])) | 0; vals.push(acc); } this.regs[rd] = this._newSpanBytes(packI32(vals)); return true; }
    if (method === "Mix") { var w = this._spanBytes(this.regs[rs1]), v = this._spanBytes(this.regs[rs2]), d = this._attn.dim || 1, nr = Math.min(Math.floor(w.length / 4), Math.floor(v.length / d)), out = []; for (var mc = 0; mc < d; mc++) { var sum = 0; for (var mr = 0; mr < nr; mr++) sum += i32beAt(w, mr) * i8(v[mr * d + mc]); out.push((sum >> 15) | 0); } this.regs[rd] = this._newSpanBytes(packI32(out)); return true; }
    if (method === "Attend") { if (!this._attention("Scores", rd, rs1, rs2)) return false; return this._tensor("SoftmaxI32", rd, rd, 0); }
    return false;
  };

  PicoVM.prototype._tokenizer = function (method, rd, rs1, rs2) {
    if (!this._tok) this._tok = [];
    if (!this._vocab) { this._vocab = []; this._vrev = {}; }
    if (method === "SetVocab") {
      var lines = this._spanStr(this.regs[rs1]).replace(/;/g, "\n").split(/\r?\n/), vocab = [], rev = {};
      lines.forEach(function (line) { var p = line.lastIndexOf("="); if (p > 0) { var piece = line.slice(0, p), id = parseInt(line.slice(p + 1), 10); if (!isNaN(id)) { var bytes = Array.from(new TextEncoder().encode(piece)); vocab.push([bytes, id]); rev[id] = bytes; } } });
      vocab.sort(function (a, b) { return (b[0].length - a[0].length) || (a[1] - b[1]); });
      this._vocab = vocab; this._vrev = rev; this.regs[rd] = vocab.length; return true;
    }
    if (method === "EncodeBytes") { var d = this._spanBytes(this.regs[rs1]); this._tok = d.map(function (b) { return b + 3; }); this.regs[rd] = this._tok.length; return true; }
    if (method === "EncodeTrie") { var data = this._spanBytes(this.regs[rs1]), out = [], i0 = 0; while (i0 < data.length) { var found = null; for (var vi = 0; vi < this._vocab.length; vi++) { var pc = this._vocab[vi][0], ok = pc.length && i0 + pc.length <= data.length; for (var pj = 0; ok && pj < pc.length; pj++) if (data[i0 + pj] !== pc[pj]) ok = false; if (ok) { found = this._vocab[vi]; break; } } if (found) { out.push(found[1]); i0 += found[0].length; } else { out.push(data[i0] + 3); i0++; } } this._tok = out; this.regs[rd] = out.length; return true; }
    if (method === "DecodeBytes") { this.regs[rd] = this._newSpanBytes(this._tok.filter(function(t){return t>=3&&t<=258;}).map(function(t){return (t-3)&255;})); return true; }
    if (method === "DecodeTrie") { var db = []; for (var di = 0; di < this._tok.length; di++) { var t = this._tok[di]; if (this._vrev[t]) db = db.concat(this._vrev[t]); else if (t >= 3 && t <= 258) db.push((t - 3) & 255); } this.regs[rd] = this._newSpanBytes(db); return true; }
    if (method === "Count") { this.regs[rd] = this._tok.length; return true; }
    if (method === "Token") { var i = this.regs[rs1] | 0; this.regs[rd] = (i >= 0 && i < this._tok.length) ? this._tok[i] : 0; return true; }
    return false;
  };
  PicoVM.prototype._model = function (method, rd, rs1, rs2) {
    if (!this._modelState) this._modelState = { cfg: {}, tensors: {}, block: { start: 0, count: 0 } };
    var m = this._modelState;
    if (method === "SetConfig") { m.cfg[this.regs[rs1] | 0] = this.regs[rs2] | 0; this.regs[rd] = 1; return true; }
    if (method === "GetConfig") { this.regs[rd] = m.cfg[this.regs[rs1] | 0] || 0; return true; }
    if (method === "TensorView") { var spec = this._spanStr(this.regs[rs2]).split("|"), slen = spec.length; while (spec.length < 6) spec.push("0"); var tid = this.regs[rs1] | 0; var pack, card, off, rows, cols, fmt; if (slen >= 6) { pack=spec[0]; card=spec[1]; off=spec[2]; rows=spec[3]; cols=spec[4]; fmt=spec[5]; } else { pack="0"; card="0"; off=spec[0]; rows=spec[1]; cols=spec[2]; fmt=spec[3]; } m.tensors[tid] = { pack: parseInt(pack||"0",10)||0, card: parseInt(card||"0",10)||0, off: parseInt(off||"0",10)||0, rows: parseInt(rows||"0",10)||0, cols: parseInt(cols||"0",10)||0, fmt: parseInt(fmt||"0",10)||0 }; this.regs[rd] = tid; return true; }
    var t = m.tensors[this.regs[rs1] | 0] || {};
    if (method === "TensorOffset") { this.regs[rd] = t.off || 0; return true; }
    if (method === "TensorRows") { this.regs[rd] = t.rows || 0; return true; }
    if (method === "TensorCols") { this.regs[rd] = t.cols || 0; return true; }
    if (method === "TensorFormat") { this.regs[rd] = t.fmt || 0; return true; }
    if (method === "SetBlock") { m.block = { start: Math.max(0, this.regs[rs1] | 0), count: Math.max(0, this.regs[rs2] | 0) }; this.regs[rd] = 1; return true; }
    if (method === "ReadTensor" || method === "ReadTensorRow" || method === "ReadTensorBlock") { var L = this._tensorBlobLayout(this.regs[rs1] | 0), rb = (L.cols || 0) * L.elem, start = L.off || 0, n = (L.rows || 0) * rb; if (method === "ReadTensorRow") { var row = Math.max(0, this.regs[rs2] | 0); start += row * rb; n = rb; } else if (method === "ReadTensorBlock") { var rc = decodeRowSpec(this.regs[rs2] | 0, m.block.start || 0, m.block.count || 0, L.rows || 0); start += rc[0] * rb; n = rc[1] * rb; } this.regs[rd] = this._newSpanBytes(L.blob.slice(start, start + n)); return true; }
    if (method === "MatVecI8Block") return this._modelBlockMatVec(rd, this.regs[rs1] | 0, this.regs[rs2], "i8");
    return false;
  };
  PicoVM.prototype._kv = function (method, rd, rs1, rs2) {
    if (!this._kvState) this._kvState = { k: {}, v: {}, shape: [0,0,0], head: 0 };
    var kv = this._kvState, key = (((this.regs[rs1] >>> 16) & 0xFFFF) + ":" + (this.regs[rs1] & 0xFFFF) + ":0"), hkey = (((this.regs[rs1] >>> 16) & 0xFFFF) + ":" + (this.regs[rs1] & 0xFFFF) + ":" + kv.head);
    if (method === "SetShape") { kv.shape = [this.regs[rs1] | 0, this.regs[rs2] | 0, this.regs[rs2] | 0]; this.regs[rd] = 1; return true; }
    if (method === "SetHead") { kv.head = Math.max(0, this.regs[rs1] | 0); this.regs[rd] = kv.head; return true; }
    if (method === "WriteK") { kv.k[key] = this._spanBytes(this.regs[rs2]); this.regs[rd] = 1; return true; }
    if (method === "WriteV") { kv.v[key] = this._spanBytes(this.regs[rs2]); this.regs[rd] = 1; return true; }
    if (method === "WriteKH") { kv.k[hkey] = this._spanBytes(this.regs[rs2]); this.regs[rd] = 1; return true; }
    if (method === "WriteVH") { kv.v[hkey] = this._spanBytes(this.regs[rs2]); this.regs[rd] = 1; return true; }
    if (method === "ReadK") { this.regs[rd] = this._newSpanBytes(kv.k[key] || []); return true; }
    if (method === "ReadV") { this.regs[rd] = this._newSpanBytes(kv.v[key] || []); return true; }
    if (method === "ReadKH") { this.regs[rd] = this._newSpanBytes(kv.k[hkey] || []); return true; }
    if (method === "ReadVH") { this.regs[rd] = this._newSpanBytes(kv.v[hkey] || []); return true; }
    if (method === "Len") { this.regs[rd] = Object.keys(kv.k).length + Object.keys(kv.v).length; return true; }
    if (method === "Clear") { kv.k = {}; kv.v = {}; this.regs[rd] = 1; return true; }
    return false;
  };
  PicoVM.prototype._sampling = function (method, rd, rs1, rs2) {
    if (!this._sampTemp) this._sampTemp = 256;
    if (method === "Temperature") { this._sampTemp = Math.max(1, this.regs[rs1] | 0); this.regs[rd] = this._sampTemp; return true; }
    if (method === "ArgMax") return this._tensor("ArgMaxI32", rd, rs1, rs2);
    if (method === "ArgMaxRows") { if (!this._tensor("MatVecI8", rd, rs1, rs2)) return false; return this._tensor("ArgMaxI32", rd, rd, 0); }
    if (method === "TopK") { var d = this._spanBytes(this.regs[rs1]), k = Math.max(1, this.regs[rs2] | 0), vals = []; for (var i = 0; i < Math.floor(d.length/4); i++) vals.push([i32beAt(d,i),i]); vals.sort(function(a,b){return (b[0]-a[0])||(a[1]-b[1]);}); this.regs[rd]=this._newSpanBytes(packI32(vals.slice(0,k).map(function(x){return x[1];}))); return true; }
    return false;
  };

  PicoVM.prototype._queryHelpers = function (method, rd, rs1, rs2) {
    if (method === "BuildLookupFilter") {
      var pack = this._spanStr(this.regs[rs1]), parts = this._spanStr(this.regs[rs2]).split("|");
      while (parts.length < 6) parts.push("");
      var lines = ["S:" + parts[0], "F:" + pack];
      if (parts[1] && parts[2]) lines.push("W:" + parts[1] + "|" + parts[2] + "|" + parts[3]);
      if (parts[4] && parts[5]) lines.push("W:" + parts[4] + "|!=|" + parts[5]);
      this.regs[rd] = this._strSpan(lines.join("\n")); return true;
    }
    if (method === "BuildManyToManyMap") {
      var p = this._spanStr(this.regs[rs1]), a = this._spanStr(this.regs[rs2]).split("|");
      while (a.length < 3) a.push("");
      this.regs[rd] = this._strSpan("S:" + a[2] + "\nF:" + p + "\nW:" + a[0] + "|==|" + a[1]); return true;
    }
    return false;
  };
  function searchTerms(text) { var m = String(text).toLowerCase().match(/[a-z0-9]+/g); return m || []; }
  PicoVM.prototype._search = function (method, rd, rs1, rs2) {
    if (!this._searchState) this._searchState = { docs: {}, results: [], plan: [0, 0, 0, 0], vector: 0, sem: 0, facets: {}, nums: {}, facetResults: [], saved: null, meta: { name: "", schema: 0 } };
    var s = this._searchState, pack = String((this._st && this._st.pack) || 0);
    function key(card) { return ((parseInt(pack, 10) || 0) << 22) | (card & 0x3FFFFF); }
    if (method === "Clear") { s.docs = {}; s.results = []; s.plan = [0, 0, 0, 0]; s.facets = {}; s.nums = {}; s.facetResults = []; this.regs[rd] = 1; return true; }
    if (method === "Configure") { s.meta = { name: this._spanStr(this.regs[rs1]), schema: this.regs[rs2] >>> 0 }; this.regs[rd] = 1; return true; }
    if (method === "Compatible") { this.regs[rd] = (s.meta.name === this._spanStr(this.regs[rs1]) && s.meta.schema === (this.regs[rs2] >>> 0)) ? 1 : 0; return true; }
    if (method === "Rebuild") { s.results = []; s.facetResults = []; this.regs[rd] = 1; return true; }
    if (method === "SetVector") { s.vector = this.regs[rs1] >>> 0; this.regs[rd] = 1; return true; }
    if (method === "SetSemanticWeight") { s.sem = Math.max(0, this.regs[rs1] | 0); this.regs[rd] = s.sem; return true; }
    if (method === "UpsertText") { var card = this.regs[rs1] >>> 0; s.docs[key(card)] = { card: card, text: this._spanStr(this.regs[rs2]), vector: s.vector }; this.regs[rd] = 1; return true; }
    if (method === "Delete") { var dk = key(this.regs[rs1] >>> 0), ok = s.docs[dk] ? 1 : 0; delete s.docs[dk]; Object.keys(s.facets).forEach(function(k){ if(k.indexOf(dk + "|")===0) delete s.facets[k]; }); Object.keys(s.nums).forEach(function(k){ if(k.indexOf(dk + "|")===0) delete s.nums[k]; }); this.regs[rd] = ok; return true; }
    if (method === "SetFacet") { var fc = this.regs[rs1] >>> 0, fp = this._spanStr(this.regs[rs2]).split("|"); s.facets[key(fc) + "|" + fp[0]] = fp[1] || ""; this.regs[rd] = 1; return true; }
    if (method === "SetNumber") { var nc = this.regs[rs1] >>> 0, np = this._spanStr(this.regs[rs2]).split("|"); s.nums[key(nc) + "|" + np[0]] = parseInt(np[1] || "0", 10) || 0; this.regs[rd] = 1; return true; }
    if (method === "ClearFields") { var ck = key(this.regs[rs1] >>> 0); Object.keys(s.facets).forEach(function(k){ if(k.indexOf(ck + "|")===0) delete s.facets[k]; }); Object.keys(s.nums).forEach(function(k){ if(k.indexOf(ck + "|")===0) delete s.nums[k]; }); this.regs[rd] = 1; return true; }
    if (method === "IndexPack") {
      var ST = storeLib(); if (!this._st) this._st = { store: new ST.PicoStore(), pack: 0, card: 0, results: [], schemas: {}, blobs: {}, sliceOffset: 0, sliceLen: 0 };
      var ipack = String(this.regs[rs1] >>> 0), rows = this._st.store.all(ipack), n = 0;
      rows.forEach(function (e) { var text = Object.keys(e[1]).sort().map(function (k) { return String(e[1][k]); }).join(" "); s.docs[((parseInt(ipack, 10) || 0) << 22) | (e[0] & 0x3FFFFF)] = { card: e[0], text: text, vector: 0 }; n++; });
      this.regs[rd] = n; return true;
    }
    if (method === "QueryText" || method === "QueryHybrid") {
      var q = this._spanStr(this.regs[rs1]), qt = searchTerms(q), res = [], lex = 0, vec = 0, sem = 0;
      Object.keys(s.docs).forEach(function (k) {
        var d = s.docs[k], dt = searchTerms(d.text), score = 0;
        qt.forEach(function (t) { dt.forEach(function (u) { if (u === t) score++; }); });
        if (score) lex++;
        if (method === "QueryHybrid" && s.vector && d.vector === s.vector) { score++; vec++; }
        if (s.sem && String(d.text).toLowerCase().indexOf(String(q).toLowerCase()) >= 0) { score += s.sem; sem++; }
        if (score) res.push([d.card, score]);
      });
      res.sort(function (a, b) { return (b[1] - a[1]) || (a[0] - b[0]); });
      s.results = res.slice(0, 128); s.plan = [lex, vec, s.results.length, sem]; this.regs[rd] = s.results.length; return true;
    }
    if (method === "Result") { var ri = this.regs[rs1] | 0; this.regs[rd] = (ri >= 0 && ri < s.results.length) ? s.results[ri][0] : 0; return true; }
    if (method === "Score") { var si = this.regs[rs1] | 0; this.regs[rd] = (si >= 0 && si < s.results.length) ? s.results[si][1] : 0; return true; }
    if (method === "Plan") { var pi = this.regs[rs1] | 0; this.regs[rd] = (pi >= 0 && pi < s.plan.length) ? s.plan[pi] : 0; return true; }
    if (method === "Facets") { var field = this._spanStr(this.regs[rs1]), counts = {}; Object.keys(s.facets).forEach(function(k){ var sp=k.split("|"); if(sp[1]===field) counts[s.facets[k]]=(counts[s.facets[k]]||0)+1; }); s.facetResults = Object.keys(counts).sort().map(function(v){ return [v, counts[v]]; }); this.regs[rd] = s.facetResults.length; return true; }
    if (method === "FacetValue") { var fvi = this.regs[rs1] | 0; this.regs[rd] = (fvi >= 0 && fvi < s.facetResults.length) ? this._strSpan(s.facetResults[fvi][0]) : 0; return true; }
    if (method === "FacetCount") { var fci = this.regs[rs1] | 0; this.regs[rd] = (fci >= 0 && fci < s.facetResults.length) ? s.facetResults[fci][1] : 0; return true; }
    if (method === "Range") { var spec=this._spanStr(this.regs[rs1]).split("|"), field=spec[0], lo=parseInt(spec[1]||"-2147483648",10), hi=parseInt(spec[2]||"2147483647",10), hits=[]; Object.keys(s.nums).forEach(function(k){ var sp=k.split("|"), v=s.nums[k]; if(sp[1]===field && v>=lo && v<=hi) hits.push(parseInt(sp[0],10)&0x3FFFFF); }); hits.sort(function(a,b){return a-b;}); s.results=hits.map(function(c){return [c,1];}); this.regs[rd]=hits.length; return true; }
    if (method === "Save") { s.saved = { docs: Object.assign({}, s.docs), facets: Object.assign({}, s.facets), nums: Object.assign({}, s.nums), meta: Object.assign({}, s.meta) }; this.regs[rd]=1; return true; }
    if (method === "Load") { if(s.saved){ s.docs=Object.assign({},s.saved.docs); s.facets=Object.assign({},s.saved.facets); s.nums=Object.assign({},s.saved.nums); s.meta=Object.assign({},s.saved.meta); this.regs[rd]=1; } else this.regs[rd]=0; return true; }
    if (method === "JournalUpsert") return this._search("UpsertText", rd, rs1, rs2);
    if (method === "JournalDelete") return this._search("Delete", rd, rs1, rs2);
    if (method === "JournalFacet") return this._search("SetFacet", rd, rs1, rs2);
    if (method === "JournalNumber") return this._search("SetNumber", rd, rs1, rs2);
    if (method === "JournalReplay") { this.regs[rd]=1; return true; }
    return false;
  };

  // ---- Storage.* card CRUD/query over PicoStore ---------------------------
  PicoVM.prototype._storage = function (method, rd, rs1, rs2) {
    if (!this._st) {
      var ST = storeLib();
      this._st = { store: this._cardStore || new ST.PicoStore(), pack: 0, card: 0, results: [], schemas: {}, blobs: {}, sliceOffset: 0, sliceLen: 0 };
    }
    var st = this._st;
    var pack = String(st.pack);
    if (method === "Ready") { this.hostStatus = 0; this.regs[rd] = 1; return true; }
    if (method === "IsUserPack") { var up = this.regs[rs1] >>> 0; this.regs[rd] = (up >= 2 && up <= 0x3FF) ? 1 : 0; return true; }
    if (method === "GetSchemaForPack") {
      this.regs[rd] = this._newSpanBytes(st.schemas[this.regs[rs1] | 0] || []); return true;
    }
    if (method === "SetSchemaForPack") {
      st.schemas[this.regs[rs1] | 0] = this._spanBytes(this.regs[rs2]); this.regs[rd] = 1; return true;
    }
    if (method === "UsePack") { st.pack = this.regs[rs1] | 0; this.regs[rd] = st.pack; return true; }
    if (method === "AddCard") { var cid = st.store.create(pack, {}); st.card = cid; this.regs[rd] = cid; return true; }
    if (method === "EditCard") {
      var eid = this.regs[rs1] | 0, ok = st.store.read(pack, eid) !== null;
      st.card = ok ? eid : 0; this.regs[rd] = ok ? eid : 0; return true;
    }
    if (method === "DeleteCard") {
      var did = this.regs[rs1] | 0, dok = st.store.delete(pack, did);
      if (did === st.card) st.card = 0;
      this.regs[rd] = dok ? 1 : 0; return true;
    }
    if (method === "GetField") {
      var grec = st.store.read(pack, st.card) || {}, gn = this._spanStr(this.regs[rs1]);
      var gv = grec.hasOwnProperty(gn) ? grec[gn] : 0;
      this.regs[rd] = (typeof gv === "number") ? (gv | 0) : 0; return true;
    }
    if (method === "SetField") {
      var sn = this._spanStr(this.regs[rs1]), srec = st.store.read(pack, st.card);
      if (srec === null) { this.regs[rd] = 0; return true; }
      srec[sn] = this.regs[rs2] | 0;
      this.regs[rd] = st.store.update(pack, st.card, srec) ? 1 : 0; return true;
    }
    if (method === "SetFieldStr") {
      var tn = this._spanStr(this.regs[rs1]), trec = st.store.read(pack, st.card);
      if (trec === null) { this.regs[rd] = 0; return true; }
      trec[tn] = this._spanStr(this.regs[rs2]);
      this.regs[rd] = st.store.update(pack, st.card, trec) ? 1 : 0; return true;
    }
    if (method === "GetFieldStr") {
      var frec = st.store.read(pack, st.card) || {}, fn = this._spanStr(this.regs[rs1]);
      var fv = frec.hasOwnProperty(fn) ? frec[fn] : "";
      this.regs[rd] = this._strSpan(typeof fv === "string" ? fv : String(fv)); return true;
    }
    if (method === "QueryCard") {
      var q = this._spanStr(this.regs[rs1]);
      st.results = st.store.query(pack, q).map(function (e) { return e[0]; });
      this.regs[rd] = st.results.length; return true;
    }
    if (method === "QueryResult") {
      var qi = this.regs[rs1] | 0;
      this.regs[rd] = (qi >= 0 && qi < st.results.length) ? st.results[qi] : 0; return true;
    }
    if (method === "SetSlice") {
      st.sliceOffset = Math.max(0, this.regs[rs1] | 0);
      st.sliceLen = Math.max(0, this.regs[rs2] | 0);
      this.regs[rd] = 1; return true;
    }
    if (method === "CardLen") {
      var clid = this.regs[rs1] | 0, ckey = pack + ":" + clid, cblob = st.blobs[ckey] || [];
      this.regs[rd] = cblob.length | 0; return true;
    }
    if (method === "ReadSlice") {
      var rid = this.regs[rs1] | 0, rkey = pack + ":" + rid, rblob = st.blobs[rkey] || [];
      var roff = Math.min(st.sliceOffset, rblob.length), rend = Math.min(roff + st.sliceLen, rblob.length);
      this.regs[rd] = this._newSpanBytes(rblob.slice(roff, rend)); return true;
    }
    if (method === "WriteSlice") {
      var wid = this.regs[rs1] | 0, wkey = pack + ":" + wid, wblob = st.blobs[wkey] || [];
      var wdata = this._spanBytes(this.regs[rs2]), woff = st.sliceOffset;
      while (wblob.length < woff) wblob.push(0);
      for (var wi = 0; wi < wdata.length; wi++) wblob[woff + wi] = wdata[wi] & 0xFF;
      st.blobs[wkey] = wblob; this.regs[rd] = 1; return true;
    }
    return false;
  };

  // Reference GPIO emulator (browser/sim). Mirrors picoscript_vm HostApi._gpio:
  // pins carry [0,1024]; dir 0=in/1=out; pull 0=none/1=up/2=down. Real pins are an
  // injected OS provider on PIOS; this keeps Python and JS byte-identical.
  PicoVM.prototype._gpio = function (method, rd, rs1, rs2) {
    var g = this._gpioProvider || this._gp || (this._gp = { pins: {}, count: 40 });
    if (method === "Count") { this.regs[rd] = g.count; return true; }
    var pin = this.regs[rs1] | 0;
    var st = g.pins[pin] || (g.pins[pin] = { dir: 0, pull: 0, value: 0 });
    if (method === "SetDir") { st.dir = (this.regs[rs2] | 0) ? 1 : 0; this.regs[rd] = 1; return true; }
    if (method === "GetDir") { this.regs[rd] = st.dir; return true; }
    if (method === "SetPull") { var p = this.regs[rs2] | 0; st.pull = (p === 1 || p === 2) ? p : 0; this.regs[rd] = 1; return true; }
    if (method === "GetPull") { this.regs[rd] = st.pull; return true; }
    if (method === "Write") { var v = this.regs[rs2] | 0; st.value = v < 0 ? 0 : (v > 1024 ? 1024 : v); this.regs[rd] = 1; return true; }
    if (method === "Read") { this.regs[rd] = st.value; return true; }
    return false;
  };

  // Reference DMA-ring emulator (Device.*/Stream.*). Mirrors picoscript_vm:
  // deterministic fake ring, RX frame n byte i = (n+i)&0xFF; ringCfg packs
  // dir(bit0:0=RX/1=TX) | bufSize<<1 | frames<<16. Python VM == JS VM.
  PicoVM.prototype._ringState = function () {
    if (this._streamProvider) return this._streamProvider;
    if (!this._dev) this._dev = { devices: {}, streams: {}, leases: {}, ds: 0, ss: 0, ls: 0, sliceOffset: 0, sliceLen: 0 };
    return this._dev;
  };
  PicoVM.prototype._ringFrame = function (idx, buf) {
    var a = []; for (var i = 0; i < buf; i++) a.push((idx + i) & 0xFF); return a;
  };
  PicoVM.prototype._device = function (method, rd, rs1, rs2) {
    var d = this._ringState();
    if (method === "Open") { d.ds++; d.devices[d.ds] = { id: this._spanStr(this.regs[rs1]), open: true }; this.regs[rd] = d.ds; return true; }
    var dev = d.devices[this.regs[rs1] | 0];
    if (method === "Caps") { this.regs[rd] = (dev && dev.open) ? 0x3 : 0; return true; }
    if (method === "Status") { this.regs[rd] = (dev && dev.open) ? 0 : 1; return true; }
    if (method === "Close") { if (dev) dev.open = false; this.regs[rd] = dev ? 1 : 0; return true; }
    return false;
  };
  PicoVM.prototype._stream = function (method, rd, rs1, rs2) {
    var d = this._ringState();
    if (method === "Open") {
      var dev = d.devices[this.regs[rs1] | 0];
      if (!dev || !dev.open) { this.hostStatus = 1; this.regs[rd] = 0; return true; }
      var cfg = this.regs[rs2] >>> 0;
      d.ss++; d.streams[d.ss] = { dir: cfg & 1, buf: (cfg >>> 1) & 0x7FFF, frames: (cfg >>> 16) & 0xFFFF, next: 0, tx: [] };
      this.regs[rd] = d.ss; return true;
    }
    if (method === "Next") {
      var st = d.streams[this.regs[rs1] | 0];
      if (!st || st.next >= st.frames) { this.hostStatus = 3; this.regs[rd] = 0; return true; }
      var idx = st.next++; d.ls++;
      var data = (st.dir === 0) ? this._ringFrame(idx, st.buf) : new Array(st.buf).fill(0);
      d.leases[d.ls] = { stream: this.regs[rs1] | 0, idx: idx, data: data, span: 0, released: false };
      this.regs[rd] = d.ls; return true;
    }
    if (method === "Span") {
      var le = d.leases[this.regs[rs1] | 0];
      if (!le || le.released) { this.hostStatus = 1; this.regs[rd] = 0; return true; }
      if (!le.span) le.span = this._newSpanBytes(le.data);
      this.regs[rd] = le.span; return true;
    }
    if (method === "SetSlice") { d.sliceOffset = Math.max(0, this.regs[rs1] | 0); d.sliceLen = Math.max(0, this.regs[rs2] | 0); this.regs[rd] = 1; return true; }
    if (method === "Slice") {
      var xle = d.leases[this.regs[rs1] | 0];
      if (!xle || xle.released) { this.hostStatus = 1; this.regs[rd] = 0; return true; }
      var xo = Math.min(d.sliceOffset, xle.data.length), xe = Math.min(xo + d.sliceLen, xle.data.length);
      this.regs[rd] = this._newSpanBytes(xle.data.slice(xo, xe)); return true;
    }
    if (method === "Submit") {
      var sst = d.streams[this.regs[rs1] | 0], sle = d.leases[this.regs[rs2] | 0];
      if (sst && sle && !sle.released) { sst.tx.push(sle.span ? this._spanBytes(sle.span) : sle.data); sle.released = true; this.regs[rd] = 1; }
      else this.regs[rd] = 0;
      return true;
    }
    if (method === "Release") {
      var rle = d.leases[this.regs[rs1] | 0];
      if (rle) { rle.released = true; this.regs[rd] = 1; } else this.regs[rd] = 0;
      return true;
    }
    if (method === "Close") { this.regs[rd] = d.streams[this.regs[rs1] | 0] ? 1 : 0; return true; }
    return false;
  };

  // -- Assert.* PSUnit assertion counters (mirrors picoscript_vm HostApi._assert)
  // A PicoScript-authored test harness: tests call Assert.Eq/True; the runner
  // reads Assert.Failed()/Count() after a run. Pure integer logic -> byte-identical
  // to the Python VM.
  PicoVM.prototype._assert = function (method, rd, rs1, rs2) {
    if (this._asTotal === undefined) { this._asTotal = 0; this._asFailed = 0; }
    if (method === "Eq") {
      var ok = ((this.regs[rs1] >>> 0) === (this.regs[rs2] >>> 0)) ? 1 : 0;
      this._asTotal++; if (!ok) this._asFailed++;
      this.regs[rd] = ok; return true;
    }
    if (method === "True") {
      var t = ((this.regs[rs1] >>> 0) !== 0) ? 1 : 0;
      this._asTotal++; if (!t) this._asFailed++;
      this.regs[rd] = t; return true;
    }
    if (method === "Count") { this.regs[rd] = this._asTotal >>> 0; return true; }
    if (method === "Failed") { this.regs[rd] = this._asFailed >>> 0; return true; }
    if (method === "Reset") { this._asTotal = 0; this._asFailed = 0; this.regs[rd] = 0; return true; }
    return false;
  };

  // -- Event.* reactive event queue (mirrors picoscript_vm HostApi._event) ----
  // Deterministic in-runtime FIFO of (type, target, data-span) records. Post
  // enqueues; Next dequeues the oldest (0 = empty). External UI/timer events are
  // injected through the same Post path -> byte-identical to the Python VM.
  PicoVM.prototype._event = function (method, rd, rs1, rs2) {
    if (!this._ev) this._ev = { recs: {}, queue: [], seq: 0, sliceOffset: 0, sliceLen: 0 };
    var e = this._ev;
    if (method === "Post") {
      e.seq++;
      e.recs[e.seq] = { type: this.regs[rs1] >>> 0, target: this.regs[rs2] >>> 0, data: null, span: 0 };
      e.queue.push(e.seq);
      this.regs[rd] = e.seq; return true;
    }
    if (method === "Next") { this.regs[rd] = e.queue.length ? e.queue.shift() : 0; return true; }
    if (method === "Count") { this.regs[rd] = e.queue.length; return true; }
    var rec = e.recs[this.regs[rs1] >>> 0];
    if (method === "Type") { this.regs[rd] = rec ? rec.type : 0; return true; }
    if (method === "Target") { this.regs[rd] = rec ? rec.target : 0; return true; }
    if (method === "Data") {
      if (!rec || rec.data === null) { this.regs[rd] = 0; return true; }
      if (!rec.span) rec.span = this._newSpanBytes(rec.data);
      this.regs[rd] = rec.span; return true;
    }
    if (method === "SetSlice") { e.sliceOffset = Math.max(0, this.regs[rs1] | 0); e.sliceLen = Math.max(0, this.regs[rs2] | 0); this.regs[rd] = 1; return true; }
    if (method === "DataLen") { this.regs[rd] = (rec && rec.data !== null) ? rec.data.length : 0; return true; }
    if (method === "DataSlice") { var ed = (rec && rec.data !== null) ? rec.data : [], eo = Math.min(e.sliceOffset, ed.length), ee = Math.min(eo + e.sliceLen, ed.length); this.regs[rd] = this._newSpanBytes(ed.slice(eo, ee)); return true; }
    if (method === "SetData") {
      if (rec) { rec.data = this._spanBytes(this.regs[rs2]); rec.span = 0; this.regs[rd] = 1; }
      else this.regs[rd] = 0;
      return true;
    }
    return false;
  };

  // -- Ui.* retained scene tree + PicoWire serialize (mirrors HostApi._ui) -----
  // Minimal remote windowing: build a retained tree, Ui.Serialize emits the
  // deterministic PicoWire binary. Byte-identical to the Python VM.
  var UI_KIND = { Window: 1, Panel: 2, Label: 3, Button: 4, TextBox: 5, Checkbox: 6 };
  PicoVM.prototype._ui = function (method, rd, rs1, rs2) {
    if (!this._uiState) this._uiState = { nodes: {}, seq: 0 };
    var u = this._uiState;
    if (UI_KIND[method] !== undefined) {
      u.seq++;
      var nid = u.seq, parent = 0, text = [];
      if (method === "Window") { text = this._spanBytes(this.regs[rs1]); }
      else { parent = this.regs[rs1] >>> 0; if (method !== "Panel") text = this._spanBytes(this.regs[rs2]); }
      u.nodes[nid] = { kind: UI_KIND[method], id: 0, x: 0, y: 0, w: 0, h: 0, value: 0, text: text, children: [] };
      var p = u.nodes[parent];
      if (p) p.children.push(nid);
      this.regs[rd] = nid; return true;
    }
    var nd = u.nodes[this.regs[rs1] >>> 0];
    if (method === "Pos") { var pv = this.regs[rs2] >>> 0; if (nd) { nd.x = (pv >>> 16) & 0xFFFF; nd.y = pv & 0xFFFF; } this.regs[rd] = nd ? 1 : 0; return true; }
    if (method === "Size") { var sv = this.regs[rs2] >>> 0; if (nd) { nd.w = (sv >>> 16) & 0xFFFF; nd.h = sv & 0xFFFF; } this.regs[rd] = nd ? 1 : 0; return true; }
    if (method === "SetText") { if (nd) nd.text = this._spanBytes(this.regs[rs2]); this.regs[rd] = nd ? 1 : 0; return true; }
    if (method === "SetId") { if (nd) nd.id = this.regs[rs2] & 0xFFFF; this.regs[rd] = nd ? 1 : 0; return true; }
    if (method === "SetValue") { if (nd) nd.value = this.regs[rs2] & 0xFFFF; this.regs[rd] = nd ? 1 : 0; return true; }
    if (method === "Serialize") { this.regs[rd] = this._newSpanBytes(this._uiWire(this.regs[rs1] >>> 0)); return true; }
    return false;
  };

  PicoVM.prototype._uiWire = function (root) {
    var u = this._uiState || { nodes: {} };
    var order = [];
    function walk(nid) {
      var nd = u.nodes[nid];
      if (!nd) return;
      order.push(nid);
      for (var i = 0; i < nd.children.length; i++) walk(nd.children[i]);
    }
    if (u.nodes[root]) walk(root);
    var out = [];
    function u16(v) { out.push((v >>> 8) & 0xFF); out.push(v & 0xFF); }
    function psInt(key, v) {            // PSC1 T_INT field
      out.push(key.length);
      for (var j = 0; j < key.length; j++) out.push(key.charCodeAt(j));
      out.push(1); out.push((v >>> 24) & 0xFF, (v >>> 16) & 0xFF, (v >>> 8) & 0xFF, v & 0xFF);
    }
    function psStr(key, vb) {           // PSC1 T_STR field (raw bytes)
      vb = vb.slice(0, 0xFFFF);
      out.push(key.length);
      for (var j = 0; j < key.length; j++) out.push(key.charCodeAt(j));
      out.push(2); out.push((vb.length >>> 8) & 0xFF, vb.length & 0xFF);
      for (var t = 0; t < vb.length; t++) out.push(vb[t] & 0xFF);
    }
    u16(order.length);
    for (var k = 0; k < order.length; k++) {
      var nd = u.nodes[order[k]];
      out.push(80, 83, 67, 49);        // 'PSC1' magic
      u16(9);                          // 9 fields per node record
      psInt("c", nd.kind);
      psInt("ch", nd.children.length);
      psInt("h", nd.h);
      psInt("id", nd.id);
      psStr("t", nd.text);
      psInt("v", nd.value);
      psInt("w", nd.w);
      psInt("x", nd.x);
      psInt("y", nd.y);
    }
    return out;
  };

  PicoVM.prototype._dsp = function (rd, rs1, rs2, imm) {
    var a = this.regs[rs1] | 0;
    if (rs2 === 0x4) this.regs[rd] = a < 0 ? 0 : a;          // RELU
    else if (rs2 === 0x3) this.regs[rd] = Math.imul(a, sx16(imm)); // SCALE
    else if (rs2 === 0x9) this.regs[rd] = (a + (this.regs[imm & 0xF] | 0)) | 0; // VADD
    else this.log.push("dsp " + rs2);
  };

  // Convenience: signed-32 PRINT/PIPE output as integers (4-byte big-endian).
  PicoVM.prototype.outputInts = function () {
    var out = [];
    for (var i = 0; i + 3 < this.output.length; i += 4) {
      var v = ((this.output[i] << 24) | (this.output[i + 1] << 16) |
               (this.output[i + 2] << 8) | this.output[i + 3]) | 0;
      out.push(v);
    }
    return out;
  };

  // Decode the output buffer (PIPE ints + Io.Write bytes) as UTF-8 text.
  PicoVM.prototype.outputText = function () {
    return new TextDecoder("utf-8").decode(new Uint8Array(this.output));
  };

  // Human-readable output for mixed programs. Raw VM output remains `output`; this
  // only formats typed chunks for the browser UI (e.g. PRINT "<br/>"; PRINT 14).
  PicoVM.prototype.outputDisplayText = function () {
    if (!this.outputEvents || !this.outputEvents.length) return this.outputText();
    var dec = new TextDecoder("utf-8"), parts = [];
    for (var i = 0; i < this.outputEvents.length; i++) {
      var e = this.outputEvents[i];
      if (e.kind === "int") parts.push(String(e.value | 0));
      else if (e.kind === "byte") {
        var b = e.value & 0xFF;
        parts.push((b === 10 || b === 13 || b === 9 || (b >= 32 && b <= 126)) ? String.fromCharCode(b) : "[" + b + "]");
      } else if (e.kind === "bytes") {
        parts.push(dec.decode(Uint8Array.from(e.bytes || [])));
      }
    }
    return parts.join("");
  };

  // -- Process.*/Env.* OS-worker process lifecycle (mirrors HostApi._process_env) ----
  PicoVM.prototype._processEnv = function (ns, method, rd, rs1, rs2) {
    if (!this._proc) this._proc = { seq: 0, self: 1, parent: 0, table: {}, args: [], envVars: {} };
    var p = this._proc;
    if (ns === "Process") {
      if (method === "Self") { this.regs[rd] = p.self; return true; }
      if (method === "Parent") { this.regs[rd] = p.parent; return true; }
      if (method === "Spawn") {
        p.seq++;
        var pid = p.seq + 100;
        p.table[pid] = { status: 0, exitCode: 0, pack: this.regs[rs1] >>> 0, entry: this.regs[rs2] >>> 0 };
        this.log.push("Process.Spawn pack=" + (this.regs[rs1] >>> 0) + " entry=" + (this.regs[rs2] >>> 0) + " -> pid=" + pid);
        this.regs[rd] = pid; return true;
      }
      if (method === "Exit") {
        var code = this.regs[rs1] | 0;
        p.table[p.self] = { status: 1, exitCode: code, pack: 0, entry: 0 };
        this.log.push("Process.Exit code=" + code);
        this.halted = true; return true;
      }
      if (method === "Kill") {
        var kp = p.table[this.regs[rs1] >>> 0];
        if (kp && kp.status === 0) { kp.status = 2; kp.exitCode = -1; this.regs[rd] = 1; }
        else this.regs[rd] = 0;
        return true;
      }
      if (method === "Status") {
        var sp = p.table[this.regs[rs1] >>> 0];
        this.regs[rd] = sp ? sp.status : 1; return true;
      }
      if (method === "Wait") {
        var wp = p.table[this.regs[rs1] >>> 0];
        this.regs[rd] = wp ? (wp.exitCode | 0) : 0; return true;
      }
      if (method === "Args") { this.regs[rd] = this._newSpanBytes(p.args); return true; }
    }
    if (ns === "Env") {
      if (method === "Get") {
        var key = this._spanStr(this.regs[rs1]);
        var val = p.envVars[key];
        if (val !== undefined) { this.regs[rd] = this._newSpanBytes(this._strToBytes(val)); }
        else { this.regs[rd] = 0; this.hostStatus = 1; }
        return true;
      }
      if (method === "Set") {
        p.envVars[this._spanStr(this.regs[rs1])] = this._spanStr(this.regs[rs2]);
        this.regs[rd] = 1; return true;
      }
      if (method === "Count") {
        this.regs[rd] = Object.keys(p.envVars).length; return true;
      }
      if (method === "Key") {
        var keys = Object.keys(p.envVars).sort();
        var idx = this.regs[rs1] >>> 0;
        if (idx < keys.length) { this.regs[rd] = this._newSpanBytes(this._strToBytes(keys[idx])); }
        else { this.regs[rd] = 0; this.hostStatus = 1; }
        return true;
      }
    }
    return false;
  };

  // -- Timer.*/Scheduler.* timers and deterministic scheduler (mirrors HostApi._timer_scheduler) ----
  PicoVM.prototype._timerScheduler = function (ns, method, rd, rs1, rs2) {
    if (!this._tmr) this._tmr = { seq: 0, timers: {}, elapsedMs: 0 };
    var t = this._tmr;
    if (ns === "Timer") {
      if (method === "After") {
        t.seq++; var ms = this.regs[rs1] >>> 0;
        t.timers[t.seq] = { ms: ms, repeat: false, remaining: ms, active: true };
        this.regs[rd] = t.seq; return true;
      }
      if (method === "Every") {
        t.seq++; var ms2 = this.regs[rs1] >>> 0;
        t.timers[t.seq] = { ms: ms2, repeat: true, remaining: ms2, active: true };
        this.regs[rd] = t.seq; return true;
      }
      if (method === "Cancel") {
        var ti = t.timers[this.regs[rs1] >>> 0];
        if (ti) { ti.active = false; this.regs[rd] = 1; }
        else this.regs[rd] = 0;
        return true;
      }
      if (method === "Elapsed") { this.regs[rd] = t.elapsedMs >>> 0; return true; }
    }
    if (ns === "Scheduler") {
      if (method === "Tick") {
        var delta = this.regs[rs1] >>> 0;
        t.elapsedMs += delta;
        var fired = 0;
        if (!this._ev) this._ev = { recs: {}, queue: [], seq: 0, sliceOffset: 0, sliceLen: 0 };
        var e = this._ev;
        var handles = Object.keys(t.timers);
        for (var i = 0; i < handles.length; i++) {
          var h = handles[i] | 0, ti2 = t.timers[h];
          if (!ti2.active) continue;
          ti2.remaining -= delta;
          while (ti2.remaining <= 0 && ti2.active) {
            fired++;
            e.seq++;
            e.recs[e.seq] = { type: 100, target: h, data: null, span: 0 };
            e.queue.push(e.seq);
            if (ti2.repeat) ti2.remaining += ti2.ms;
            else { ti2.active = false; break; }
          }
        }
        this.regs[rd] = fired; return true;
      }
    }
    return false;
  };

  // -- Principal.*/Capability.*/Sandbox.* identity & authz harness (mirrors HostApi._principal_cap) ----
  PicoVM.prototype._principalCap = function (ns, method, rd, rs1, rs2) {
    if (!this._auth) this._auth = { name: "anonymous", roles: [], claims: {}, denied: 0 };
    var a = this._auth;
    if (ns === "Principal") {
      if (method === "Current") { this.regs[rd] = this._newSpanBytes(this._strToBytes(a.name)); return true; }
      if (method === "HasRole") {
        var role = this._spanStr(this.regs[rs1]);
        this.regs[rd] = a.roles.indexOf(role) >= 0 ? 1 : 0; return true;
      }
      if (method === "Claims") {
        var ks = Object.keys(a.claims).sort();
        var pairs = ks.map(function (k) { return k + "=" + a.claims[k]; }).join(";");
        this.regs[rd] = this._newSpanBytes(this._strToBytes(pairs)); return true;
      }
    }
    if (ns === "Capability") {
      if (method === "Has") {
        var cb = this.regs[rs1] >>> 0;
        this.regs[rd] = ((this.caps & cb) && !(a.denied & cb)) ? 1 : 0; return true;
      }
      if (method === "Request") {
        var cb2 = this.regs[rs1] >>> 0;
        if ((a.denied & cb2) || (cb2 & ~this.capCeiling)) this.regs[rd] = 0;
        else { this.caps |= cb2; this.regs[rd] = 1; }
        return true;
      }
      if (method === "Drop") {
        this.caps &= ~(this.regs[rs1] >>> 0);
        this.regs[rd] = 1; return true;
      }
    }
    if (ns === "Sandbox") {
      if (method === "Deny") {
        var cb3 = this.regs[rs1] >>> 0;
        a.denied |= cb3; this.caps &= ~cb3;
        this.regs[rd] = 1; return true;
      }
    }
    return false;
  };

  // -- Error.* global error handler + fault inspection (mirrors HostApi._error_hook) ----
  PicoVM.prototype._errorHook = function (method, rd, rs1, rs2) {
    if (!this._errState) this._errState = { handlerPc: 0, code: 0, detail: 0, resumePc: 0 };
    var es = this._errState;
    if (method === "SetHandler") { es.handlerPc = this.regs[rs1] >>> 0; this.regs[rd] = 1; return true; }
    if (method === "HasHandler") { this.regs[rd] = es.handlerPc ? 1 : 0; return true; }
    if (method === "Code") { this.regs[rd] = es.code >>> 0; return true; }
    if (method === "Detail") { this.regs[rd] = es.detail >>> 0; return true; }
    if (method === "Resume") {
      es.code = 0; es.detail = 0;
      if (es.resumePc) { this.pc = es.resumePc; es.resumePc = 0; }
      this.regs[rd] = 1; return true;
    }
    if (method === "Clear") { es.code = 0; es.detail = 0; this.regs[rd] = 1; return true; }
    return false;
  };

  // -- Capsule.* inter-card module switching (mirrors HostApi._capsule_exec) ----
  PicoVM.prototype._capsuleExec = function (method, rd, rs1, rs2) {
    if (!this._capExec) this._capExec = { seq: 0, modules: {}, schedules: [] };
    var c = this._capExec;
    if (method === "Call") {
      this.log.push("Capsule.Call pack=" + (this.regs[rs1] >>> 0) + " card=" + (this.regs[rs2] >>> 0));
      this.regs[rd] = 0; return true;
    }
    if (method === "Schedule") {
      c.schedules.push({ pack: this.regs[rs1] >>> 0, card: this.regs[rs2] >>> 0 });
      this.log.push("Capsule.Schedule pack=" + (this.regs[rs1] >>> 0) + " card=" + (this.regs[rs2] >>> 0));
      this.regs[rd] = 1; return true;
    }
    if (method === "Jump") {
      this.log.push("Capsule.Jump pack=" + (this.regs[rs1] >>> 0) + " card=" + (this.regs[rs2] >>> 0));
      this.halted = true; return true;
    }
    if (method === "LoadModule") {
      c.seq++; var h = c.seq;
      c.modules[h] = { pack: this.regs[rs1] >>> 0, card: this.regs[rs2] >>> 0 };
      this.log.push("Capsule.LoadModule pack=" + (this.regs[rs1] >>> 0) + " card=" + (this.regs[rs2] >>> 0) + " -> handle=" + h);
      this.regs[rd] = h; return true;
    }
    if (method === "RunModule") {
      var m = c.modules[this.regs[rs1] >>> 0];
      if (m) this.log.push("Capsule.RunModule handle=" + (this.regs[rs1] >>> 0) + " pack=" + m.pack + " card=" + m.card);
      this.regs[rd] = 0; return true;
    }
    return false;
  };

  // -- Base64.* encode/decode (mirrors HostApi._base64) ----
  PicoVM.prototype._base64 = function (method, rd, rs1, rs2) {
    if (typeof btoa === "undefined" && typeof Buffer === "undefined") return false;
    if (method === "Encode") {
      var data = this._spanBytes(this.regs[rs1]);
      var str = "";
      for (var i = 0; i < data.length; i++) str += String.fromCharCode(data[i]);
      var enc = (typeof btoa !== "undefined") ? btoa(str) : Buffer.from(data).toString("base64");
      this.regs[rd] = this._newSpanBytes(this._strToBytes(enc));
      return true;
    }
    if (method === "UrlEncode") {
      var udata = this._spanBytes(this.regs[rs1]);
      var uenc;
      if (typeof btoa !== "undefined") {
        var s = ""; for (var ui = 0; ui < udata.length; ui++) s += String.fromCharCode(udata[ui]);
        uenc = btoa(s);
      } else {
        uenc = Buffer.from(udata).toString("base64");
      }
      uenc = uenc.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      this.regs[rd] = this._newSpanBytes(this._strToBytes(uenc));
      return true;
    }
    if (method === "Decode" || method === "UrlDecode") {
      var b64 = this._spanStr(this.regs[rs1]);
      if (method === "UrlDecode") {
        b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
        var pad = (4 - b64.length % 4) % 4;
        for (var p = 0; p < pad; p++) b64 += "=";
      }
      try {
        var dec;
        if (typeof atob !== "undefined") {
          var raw = atob(b64); dec = [];
          for (var j = 0; j < raw.length; j++) dec.push(raw.charCodeAt(j));
        } else {
          var buf = Buffer.from(b64, "base64"); dec = Array.from(buf);
        }
        this.regs[rd] = this._newSpanBytes(dec);
      } catch (e) {
        this.regs[rd] = this._newSpanBytes([]);
        this.hostStatus = 2;
      }
      return true;
    }
    return false;
  };

  function bytesToUtf8(bytes) { return new TextDecoder("utf-8", { fatal: false }).decode(Uint8Array.from(bytes)); }
  function utf8ToBytes(str) { return Array.from(new TextEncoder().encode(str)); }
  function cleanAscii(bytes) { return bytes.map(function (b) { return b < 128 ? b : 63; }); }
  function asciiEncodeText(str) { var out = []; for (var i = 0; i < str.length; i++) { var c = str.charCodeAt(i); out.push(c < 128 ? c : 63); } return out; }
  function utf16Bytes(str, little) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (little) out.push(c & 255, (c >>> 8) & 255); else out.push((c >>> 8) & 255, c & 255);
    }
    return out;
  }
  function fromUtf16Bytes(bytes, little) {
    var s = "";
    for (var i = 0; i + 1 < bytes.length; i += 2) {
      var c = little ? (bytes[i] | (bytes[i + 1] << 8)) : ((bytes[i] << 8) | bytes[i + 1]);
      s += String.fromCharCode(c);
    }
    return utf8ToBytes(s);
  }
  function base64FromBytes(bytes) {
    if (typeof btoa !== "undefined") {
      var s = ""; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
      return btoa(s);
    }
    return Buffer.from(bytes).toString("base64");
  }
  function bytesFromBase64(s) {
    if (typeof atob !== "undefined") {
      var raw = atob(s), out = [];
      for (var i = 0; i < raw.length; i++) out.push(raw.charCodeAt(i) & 255);
      return out;
    }
    return Array.from(Buffer.from(s, "base64"));
  }
  function utf7EncodeText(str) {
    var out = "", buf = [];
    function flush() {
      if (!buf.length) return;
      out += "+" + base64FromBytes(buf).replace(/=+$/g, "") + "-";
      buf = [];
    }
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 0x20 && c <= 0x7E && c !== 0x2B) { flush(); out += String.fromCharCode(c); }
      else if (c === 0x2B) { flush(); out += "+-"; }
      else { buf.push((c >>> 8) & 255, c & 255); }
    }
    flush();
    return out;
  }
  function utf7DecodeText(s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      if (s[i] !== "+") { out += s[i]; continue; }
      var j = s.indexOf("-", i + 1);
      if (j < 0) { out += "+"; continue; }
      var payload = s.slice(i + 1, j);
      if (payload === "") out += "+";
      else {
        var pad = (4 - payload.length % 4) % 4, b64 = payload.replace(/,/g, "/") + "=".repeat(pad);
        var bytes = bytesFromBase64(b64);
        for (var k = 0; k + 1 < bytes.length; k += 2) out += String.fromCharCode((bytes[k] << 8) | bytes[k + 1]);
      }
      i = j;
    }
    return out;
  }
  PicoVM.prototype._encoding = function (method, rd, rs1, rs2) {
    var data = this._spanBytes(this.regs[rs1]), out = null;
    try {
      if (method === "AsciiEncode") out = asciiEncodeText(bytesToUtf8(data));
      else if (method === "AsciiDecode") out = cleanAscii(data);
      else if (method === "Utf8Encode" || method === "Utf8Decode") out = utf8ToBytes(bytesToUtf8(data));
      else if (method === "Utf16LEEncode") out = utf16Bytes(bytesToUtf8(data), true);
      else if (method === "Utf16LEDecode") out = fromUtf16Bytes(data, true);
      else if (method === "Utf16BEEncode") out = utf16Bytes(bytesToUtf8(data), false);
      else if (method === "Utf16BEDecode") out = fromUtf16Bytes(data, false);
      else if (method === "Utf7Encode") out = utf8ToBytes(utf7EncodeText(bytesToUtf8(data)));
      else if (method === "Utf7Decode") out = utf8ToBytes(utf7DecodeText(bytesToUtf8(data)));
      else if (method === "HexEncode") out = utf8ToBytes(data.map(function (b) { return (b & 255).toString(16).padStart(2, "0"); }).join(""));
      else if (method === "HexDecode") {
        var hx = bytesToUtf8(data).replace(/[^0-9a-fA-F]/g, "");
        if (hx.length & 1) hx = "0" + hx;
        out = [];
        for (var hi = 0; hi < hx.length; hi += 2) out.push(parseInt(hx.slice(hi, hi + 2), 16) & 255);
      } else return false;
      this.hostStatus = 0;
    } catch (e) {
      out = []; this.hostStatus = 2;
    }
    this.regs[rd] = this._newSpanBytes(out);
    return true;
  };

  // -- DateTime core (UTC epoch-seconds storage) ----------------------------
  PicoVM.prototype._datetime = function (method, rd, rs1, rs2) {
    if (method === "UtcNow" || method === "Now" || method === "UnixTimestamp") {
      this.regs[rd] = (Date.now() / 1000) | 0;
      return true;
    }
    if (method === "Parse") {
      var raw = this._spanStr(this.regs[rs1]).trim();
      if (!raw) { this.regs[rd] = 0; this.hostStatus = 2; return true; }
      var sec = 0;
      if (/^[+-]?\d+$/.test(raw)) sec = parseInt(raw, 10) | 0;
      else {
        var iso = raw.endsWith("Z") ? (raw.slice(0, -1) + "+00:00") : raw;
        if (!/[zZ]|[+-]\d\d:\d\d$/.test(iso)) iso += "+00:00";
        var ms = Date.parse(iso);
        if (!isFinite(ms)) { this.regs[rd] = 0; this.hostStatus = 2; return true; }
        sec = (ms / 1000) | 0;
      }
      this.regs[rd] = sec | 0;
      this.hostStatus = 0;
      return true;
    }
    if (method === "Format") {
      var secFmt = this.regs[rs1] | 0;
      var dFmt = new Date(secFmt * 1000);
      this.regs[rd] = this._newSpanBytes(this._strToBytes(dFmt.toISOString().replace(/\.\d{3}Z$/, "Z")));
      this.hostStatus = 0;
      return true;
    }
    if (method === "AddSeconds") { this.regs[rd] = ((this.regs[rs1] | 0) + (this.regs[rs2] | 0)) | 0; return true; }
    if (method === "AddMinutes") { this.regs[rd] = ((this.regs[rs1] | 0) + Math.imul(this.regs[rs2] | 0, 60)) | 0; return true; }
    if (method === "AddHours") { this.regs[rd] = ((this.regs[rs1] | 0) + Math.imul(this.regs[rs2] | 0, 3600)) | 0; return true; }
    if (method === "AddDays") { this.regs[rd] = ((this.regs[rs1] | 0) + Math.imul(this.regs[rs2] | 0, 86400)) | 0; return true; }
    if (method === "GetDayOfWeek") {
      var dtw = new Date((this.regs[rs1] | 0) * 1000);
      var dow = dtw.getUTCDay(); if (dow === 0) dow = 7;
      this.regs[rd] = dow | 0;
      this.hostStatus = 0;
      return true;
    }
    if (method === "GetDayOfYear") {
      var dty = new Date((this.regs[rs1] | 0) * 1000);
      var start = Date.UTC(dty.getUTCFullYear(), 0, 1);
      this.regs[rd] = (((dty.getTime() - start) / 86400000) | 0) + 1;
      this.hostStatus = 0;
      return true;
    }
    if (method === "DiffDays" || method === "Year" || method === "Month" || method === "Day") {
      return this._datetimeExt(method, rd, rs1, rs2);
    }
    return false;
  };

  // -- Locale formatting + timezone conversion -------------------------------
  PicoVM.prototype._localeHook = function (method, rd, rs1, rs2) {
    var vm = this;
    function argText(regValue) {
      var h = regValue | 0;
      if (h > 0 && h < vm.spans.length && vm.spans[h]) return vm._spanStr(h).trim();
      return "";
    }
    function argTz(regValue) {
      if ((regValue | 0) === 0) return "";
      var txt = argText(regValue);
      if (txt && (txt.indexOf("/") >= 0 || txt.toUpperCase() === "UTC" || txt.toUpperCase().indexOf("GMT") === 0 || /^[A-Za-z]/.test(txt))) return txt;
      var id = regValue | 0;
      return TZ_BY_ID[id] || "";
    }
    function validTimeZone(tz) {
      if (!tz) return false;
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date(0));
        return true;
      } catch (e) {
        if (e instanceof RangeError) return false;
        throw e;
      }
    }
    function tzParts(sec, tz) {
      var ms = (sec | 0) * 1000;
      var f = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz, hour12: false,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
      var parts = f.formatToParts(new Date(ms));
      var out = {};
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.type === "year" || p.type === "month" || p.type === "day" ||
            p.type === "hour" || p.type === "minute" || p.type === "second") {
          out[p.type] = parseInt(p.value, 10) | 0;
        }
      }
      return out;
    }
    function tzOffsetMinutes(sec, tz) {
      var ms = (sec | 0) * 1000;
      var p = tzParts(sec, tz);
      var asUtc = Date.UTC(p.year, (p.month | 0) - 1, p.day | 0, p.hour | 0, p.minute | 0, p.second | 0);
      return ((asUtc - ms) / 60000) | 0;
    }
    function currencyCode(regValue) {
      var txt = argText(regValue).toUpperCase();
      if (/^[A-Z]{3}$/.test(txt)) return txt;
      return CURRENCY_CODE_BY_NUM[regValue | 0] || "USD";
    }

    if (method === "SetLocale") {
      var localeSpec = argText(this.regs[rs1]);
      var localeTag = this._localeTag;
      var tzName = this._localeTimeZone;
      if (localeSpec) {
        var at = localeSpec.indexOf("@");
        if (at >= 0) {
          var l = localeSpec.slice(0, at).trim();
          var t = localeSpec.slice(at + 1).trim();
          if (l) localeTag = l;
          if (t) tzName = t;
        } else {
          localeTag = localeSpec;
        }
      }
      var tzArg = argTz(this.regs[rs2]);
      if (tzArg) tzName = tzArg;
      if (!validTimeZone(tzName)) {
        this.hostStatus = 2;
        this.regs[rd] = 0;
        return true;
      }
      this._localeTag = localeTag || this._localeTag;
      this._localeTimeZone = tzName;
      this.hostStatus = 0;
      this.regs[rd] = 1;
      return true;
    }
    if (method === "GetCurrentLocale") {
      this.regs[rd] = this._newSpanBytes(this._strToBytes(this._localeTag + "@" + this._localeTimeZone));
      return true;
    }
    if (method === "FormatNumber") {
      this.regs[rd] = this._newSpanBytes(this._strToBytes(formatScaledInt(this.regs[rs1] | 0, this.regs[rs2] | 0)));
      this.hostStatus = 0;
      return true;
    }
    if (method === "FormatCurrency") {
      var code = currencyCode(this.regs[rs2]);
      var scale = CURRENCY_MINOR_BY_CODE[code];
      if (scale === undefined) scale = 2;
      var cur = code + " " + formatScaledInt(this.regs[rs1] | 0, scale);
      this.regs[rd] = this._newSpanBytes(this._strToBytes(cur));
      this.hostStatus = 0;
      return true;
    }
    if (method === "FormatDate" || method === "FormatTime") {
      var sec = this.regs[rs1] | 0;
      var tz = argTz(this.regs[rs2]) || this._localeTimeZone;
      if (!validTimeZone(tz)) {
        this.hostStatus = 2;
        this.regs[rd] = this._newSpanBytes([]);
        return true;
      }
      var p = tzParts(sec, tz);
      var offset = fmtOffset(tzOffsetMinutes(sec, tz));
      var text;
      if (method === "FormatDate") text = String(p.year).padStart(4, "0") + "-" + String(p.month).padStart(2, "0") + "-" + String(p.day).padStart(2, "0") + " " + offset;
      else text = String(p.hour).padStart(2, "0") + ":" + String(p.minute).padStart(2, "0") + ":" + String(p.second).padStart(2, "0") + " " + offset;
      this.regs[rd] = this._newSpanBytes(this._strToBytes(text));
      this.hostStatus = 0;
      return true;
    }
    if (method === "Translate") {
      var key = argText(this.regs[rs1]);
      var localeOverride = argText(this.regs[rs2]) || this._localeTag;
      var translated = key;
      if (PV_HOOKS && typeof PV_HOOKS.toLocale === "function") {
        var v = PV_HOOKS.toLocale(key, localeOverride, null, false);
        if (v) translated = v;
      }
      this.regs[rd] = this._newSpanBytes(this._strToBytes(translated));
      this.hostStatus = translated ? 0 : 2;
      return true;
    }
    return false;
  };

  // -- DateTime extended (DiffDays/Year/Month/Day) (mirrors HostApi._datetime_ext) ----
  PicoVM.prototype._datetimeExt = function (method, rd, rs1, rs2) {
    if (method === "DiffDays") {
      var a = this.regs[rs1] | 0, b = this.regs[rs2] | 0;
      this.regs[rd] = ((a - b) / 86400) | 0;
      return true;
    }
    var sec = this.regs[rs1] | 0;
    var dt = new Date(sec * 1000);
    if (method === "Year") { this.regs[rd] = dt.getUTCFullYear(); return true; }
    if (method === "Month") { this.regs[rd] = dt.getUTCMonth() + 1; return true; }
    if (method === "Day") { this.regs[rd] = dt.getUTCDate(); return true; }
    return false;
  };

  // -- Req.Param / Req.ParamCount (mirrors HostApi._req_param) ----
  PicoVM.prototype._reqParam = function (method, rd, rs1, rs2) {
    var ctx = this._reqCtx || {};
    var path = ctx.path || "";
    var segs = path.split("/").filter(function (s) { return s.length > 0; });
    if (method === "ParamCount") { this.regs[rd] = segs.length; return true; }
    if (method === "Param") {
      var idx = this.regs[rs1] >>> 0;
      if (idx < segs.length) { this.regs[rd] = this._newSpanBytes(this._strToBytes(segs[idx])); }
      else { this.regs[rd] = 0; this.hostStatus = 1; }
      return true;
    }
    return false;
  };

  // ── module container: embedded + checked ABI version (INV-23) ─────────────
  // Mirrors pico_module.py byte-for-byte: [MAGIC, ABI, HOOK_TABLE_VERSION, count, ...words].
  // load refuses a module whose magic/ABI/hook-table version != this runtime.
  var MODULE_MAGIC = 0x50534331;       // "PSC1"
  var MODULE_ABI_VERSION = 1;
  function _fnv1a32(str) {              // FNV-1a/32 over UTF-8 bytes (hook names are ASCII)
    var h = 0x811C9DC5;
    for (var i = 0; i < str.length; i++) h = Math.imul(h ^ (str.charCodeAt(i) & 0xFF), 0x01000193) >>> 0;
    return h >>> 0;
  }
  function hookTableVersion() {
    var bc = PV_HOOKS.BY_CODE || {};
    var codes = Object.keys(bc).map(function (k) { return parseInt(k, 10); }).sort(function (a, b) { return a - b; });
    var lines = codes.map(function (c) { return c + ":" + bc[c]; });
    return _fnv1a32(lines.join("\n"));
  }
  function packModule(words) {
    var out = [MODULE_MAGIC >>> 0, MODULE_ABI_VERSION >>> 0, hookTableVersion(), words.length >>> 0];
    for (var i = 0; i < words.length; i++) out.push(words[i] >>> 0);
    return out;
  }
  function loadModule(container) {
    if (!container || container.length < 4) throw new Error("ModuleAbiError: truncated module header");
    var magic = container[0] >>> 0, abi = container[1] >>> 0, htv = container[2] >>> 0, count = container[3] >>> 0;
    if (magic !== (MODULE_MAGIC >>> 0)) throw new Error("ModuleAbiError: bad module magic 0x" + magic.toString(16));
    if (abi !== MODULE_ABI_VERSION) throw new Error("ModuleAbiError: ABI version mismatch module=" + abi + " runtime=" + MODULE_ABI_VERSION);
    var expect = hookTableVersion();
    if (htv !== expect) throw new Error("ModuleAbiError: host hook table version mismatch module=0x" + htv.toString(16) + " runtime=0x" + expect.toString(16));
    var words = container.slice(4);
    if (words.length !== count) throw new Error("ModuleAbiError: word count mismatch header=" + count + " actual=" + words.length);
    return words.map(function (w) { return w >>> 0; });
  }
  PicoVM.packModule = packModule;
  PicoVM.loadModule = loadModule;
  PicoVM.hookTableVersion = hookTableVersion;
  PicoVM.MODULE_MAGIC = MODULE_MAGIC;
  PicoVM.MODULE_ABI_VERSION = MODULE_ABI_VERSION;


  // PicoVM.Pool -- simulated worker pool for Node.js.
  var _poolRequire = (typeof module !== "undefined" && module.exports && typeof require === "function") ? require : null;
  var _poolHttp = null;
  var _poolBuffer = (typeof Buffer !== "undefined") ? Buffer : null;
  try {
    if (_poolRequire) {
      _poolHttp = _poolRequire("http");
      _poolBuffer = _poolRequire("buffer").Buffer;
    }
  } catch (e) {
    _poolHttp = null;
  }

  function poolSpanBuffer(vm, payload) {
    if (!_poolBuffer || !payload) return "";
    if (payload.span !== undefined && typeof vm._spanBytes === "function") {
      return _poolBuffer.from(vm._spanBytes(payload.span));
    }
    return _poolBuffer.from(String(payload.text || ""), "utf8");
  }

  function poolResponseFromVM(vm) {
    var graph = (typeof vm.getResponseGraph === "function") ? vm.getResponseGraph() : [];
    var status = (vm.httpStatus >= 0) ? vm.httpStatus : 200;
    var headers = {};
    var trailers = {};
    var bodyParts = [];
    var i, d, name, value;
    if (vm.httpType) headers["content-type"] = vm.httpType;
    for (i = 0; i < graph.length; i++) {
      d = graph[i];
      if (d.kind === "DESC_PREAMBLE" && d.subtype === "STATUS") status = (d.payload && d.payload.code) || status;
      else if (d.kind === "DESC_HEADER" && d.payload) {
        name = String(d.payload.name && d.payload.name.text || "").toLowerCase();
        value = String(d.payload.value && d.payload.value.text || "");
        if (name) headers[name] = value;
      } else if (d.kind === "DESC_TRAILER" && d.payload) {
        name = String(d.payload.name && d.payload.name.text || "");
        value = String(d.payload.value && d.payload.value.text || "");
        if (name) trailers[name] = value;
      } else if (d.kind === "DESC_BODY") {
        bodyParts.push(poolSpanBuffer(vm, d.payload));
      } else if (d.kind === "DESC_ABORT") {
        status = (d.payload && d.payload.code) || 500;
        bodyParts = [];
      }
    }
    if (!bodyParts.length && vm.output && vm.output.length && _poolBuffer) {
      bodyParts.push(_poolBuffer.from(vm.output));
    }
    if (!headers["content-type"]) headers["content-type"] = vm.httpType || "application/octet-stream";
    return {
      status: status,
      headers: headers,
      trailers: trailers,
      body: _poolBuffer ? _poolBuffer.concat(bodyParts) : bodyParts.join("")
    };
  }

  PicoVM.Pool = function (opts) {
    opts = opts || {};
    this.size = Math.max(1, Math.min(64, opts.workers || 8));
    this.handler = (typeof opts.handler === "function") ? opts.handler : function () {};
    this.vmOptions = opts.vmOptions || {};
    this.server = null;
    this.pending = [];
    this.seq = 1;
    this.available = !!(_poolHttp && _poolBuffer);
    this.workers = [];
    for (var i = 0; i < this.size; i++) {
      this.workers.push({ id: i, busy: false, vm: new PicoVM(this.vmOptions) });
    }
  };

  PicoVM.Pool.prototype._freshVM = function () {
    return new PicoVM(this.vmOptions);
  };

  PicoVM.Pool.prototype._findIdleWorker = function () {
    for (var i = 0; i < this.workers.length; i++) if (!this.workers[i].busy) return this.workers[i];
    return null;
  };

  PicoVM.Pool.prototype._resetWorker = function (worker) {
    worker.vm = this._freshVM();
    worker.busy = false;
  };

  PicoVM.Pool.prototype._dispatch = function () {
    var worker, job;
    while (this.pending.length) {
      worker = this._findIdleWorker();
      if (!worker) return;
      job = this.pending.shift();
      this._runWorker(worker, job);
    }
  };

  PicoVM.Pool.prototype._runWorker = function (worker, job) {
    var self = this;
    var vm = worker.vm;
    worker.busy = true;
    vm.setRequestContext(job.ctx);
    Promise.resolve()
      .then(function () { return self.handler(vm); })
      .then(function () {
        var response = poolResponseFromVM(vm);
        job.res.statusCode = response.status;
        Object.keys(response.headers).forEach(function (key) { job.res.setHeader(key, response.headers[key]); });
        if (Object.keys(response.trailers).length && typeof job.res.addTrailers === "function") {
          try { job.res.addTrailers(response.trailers); } catch (e) { }
        }
        job.res.end(response.body);
      })
      .catch(function (err) {
        if (err) console.error(err && err.stack ? err.stack : err);
        job.res.statusCode = 500;
        job.res.setHeader("content-type", "text/plain; charset=utf-8");
        job.res.end("internal server error");
      })
      .finally(function () {
        self._resetWorker(worker);
        self._dispatch();
      });
  };

  PicoVM.Pool.prototype.listen = function (port, cb) {
    var self = this;
    if (!this.available) {
      if (typeof cb === "function") cb(new Error("PicoVM.Pool is only available in Node.js"));
      return null;
    }
    if (this.server) return this.server;
    this.server = _poolHttp.createServer(function (req, res) {
      var chunks = [];
      req.on("data", function (chunk) { chunks.push(chunk); });
      req.on("end", function () {
        var host = (req.headers && req.headers.host) || "127.0.0.1";
        var url = new URL(req.url || "/", "http://" + host);
        self.pending.push({
          res: res,
          ctx: {
            seq: self.seq++,
            principal: req.socket && req.socket.remoteAddress || "",
            method: req.method || "GET",
            path: url.pathname || "/",
            headers: req.headers || {},
            bodyMode: 0,
            body: chunks
          }
        });
        self._dispatch();
      });
      req.on("error", function (err) {
        res.statusCode = 400;
        res.end(String((err && err.message) || err));
      });
    });
    this.server.listen(port, cb);
    return this.server;
  };

  PicoVM.Pool.prototype.stop = function (cb) {
    if (!this.server) {
      if (typeof cb === "function") cb();
      return;
    }
    var server = this.server;
    this.server = null;
    server.close(cb);
  };

  // PIOS binding: instead of Node http.createServer, the PIOS kernel
  // posts to the worker's mailbox on accept. The worker WFIs until woken,
  // reads the request from the IPC FIFO, runs the handler, posts the
  // response back, then WFIs again. No OS threads — PIOS uses hardware
  // thread contexts (one per core) with cooperative scheduling.

  return PicoVM;
});


  var hooks = _root.PV_HOOKS;
  var Compiler = _root.PicoCompile;
  var VM = _root.PicoVM;
  function namespaces() { var ns = {}, bc = hooks.BY_CODE; for (var code in bc) { var dot = bc[code].indexOf('.'); if (dot > 0) ns[bc[code].slice(0, dot)] = true; } return Object.keys(ns).sort(); }
  function methods(namespace) { var out = [], bc = hooks.BY_CODE, prefix = namespace + '.'; for (var code in bc) { if (bc[code].indexOf(prefix) === 0) out.push(bc[code].slice(prefix.length)); } return out.sort(); }
  function hookCode(ns, method) { var name = ns + '.' + method, bc = hooks.BY_CODE; for (var code in bc) { if (bc[code] === name) return parseInt(code, 10); } return -1; }
  return {
    compile: Compiler.compile, compileC: Compiler.compileC, compileBasic: Compiler.compileBasic,
    compilePython: Compiler.compilePython, compileEnglish: Compiler.compileEnglish,
    compileDebug: Compiler.compileDebug, compileWithDebug: Compiler.compileWithDebug,
    symbolize: Compiler.symbolize, FAULT_NAMES: Compiler.FAULT_NAMES,
    VM: VM, hooks: hooks, namespaces: namespaces, methods: methods, hookCode: hookCode,
    PicoCompress: _root.PicoCompress, PicoBrotli: _root.PicoBrotli, VERSION: '2.0.0'
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.PicoScript;
