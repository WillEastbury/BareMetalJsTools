var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Expressions = (function() {
  'use strict';

  var items = {};
  var names = [];
  var own = Object.prototype.hasOwnProperty;
  var partTlds = { ac: 1, co: 1, com: 1, edu: 1, gov: 1, ltd: 1, me: 1, net: 1, org: 1, plc: 1, sch: 1 };
  var ipv4Part = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';

  function str(value) {
    if (value == null) return null;
    return typeof value === 'string' ? value : String(value);
  }

  function trimmed(value) {
    value = str(value);
    return value == null ? null : value.trim();
  }

  function run(pattern, value) {
    pattern.lastIndex = 0;
    return pattern.exec(value);
  }

  function copyGroups(match) {
    var out = {};
    var groups = match && match.groups;
    var key;
    if (groups) {
      for (key in groups) if (own.call(groups, key) && groups[key] !== undefined) out[key] = groups[key];
    }
    if (!Object.keys(out).length) out.value = match ? match[0] : null;
    return out;
  }

  function padBase64(value) {
    while (value.length % 4) value += '=';
    return value;
  }

  function decodeBase64(value, urlSafe) {
    var bytes;
    value = str(value);
    if (!value) return null;
    if (urlSafe) value = value.replace(/-/g, '+').replace(/_/g, '/');
    value = padBase64(value);
    try {
      if (typeof Buffer !== 'undefined') return Buffer.from(value, 'base64').toString('utf8');
      if (typeof atob === 'function') {
        bytes = atob(value);
        try {
          return decodeURIComponent(bytes.replace(/./g, function(ch) {
            return '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2);
          }));
        } catch (_) {
          return bytes;
        }
      }
    } catch (_) {}
    return null;
  }

  function decodeJsonSegment(value) {
    var decoded = decodeBase64(value, true);
    if (decoded == null) return null;
    try { return JSON.parse(decoded); } catch (_) { return null; }
  }

  function luhn(value) {
    var sum = 0;
    var dbl = false;
    var i, n;
    for (i = value.length - 1; i >= 0; i--) {
      n = value.charCodeAt(i) - 48;
      if (n < 0 || n > 9) return false;
      if (dbl) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      dbl = !dbl;
    }
    return sum % 10 === 0;
  }

  function mod97(value) {
    var rem = 0;
    var i, ch, code;
    for (i = 0; i < value.length; i++) {
      ch = value.charAt(i);
      code = ch >= 'A' && ch <= 'Z' ? (ch.charCodeAt(0) - 55).toString() : ch;
      rem = parseInt(String(rem) + code, 10) % 97;
    }
    return rem;
  }

  function validIban(value) {
    value = value.replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(value)) return false;
    return mod97(value.slice(4) + value.slice(0, 4)) === 1;
  }

  function validDate(year, month, day) {
    var d = new Date(Date.UTC(+year, +month - 1, +day));
    return d.getUTCFullYear() === +year && d.getUTCMonth() === (+month - 1) && d.getUTCDate() === +day;
  }

  function cardFormat(value) {
    return value.replace(/(.{4})/g, '$1 ').trim();
  }

  function deriveTld(domain) {
    var parts = domain.toLowerCase().split('.');
    if (parts.length >= 3 && parts[parts.length - 1].length === 2 && partTlds[parts[parts.length - 2]]) {
      return parts.slice(-2).join('.');
    }
    return parts[parts.length - 1] || '';
  }

  var api;

  function define(name, cfg) {
    var pattern = cfg.pattern;
    var prep = cfg.prepare || trimmed;
    var validate = cfg.validate;
    var extractImpl = cfg.extract;
    var entry = {
      pattern: pattern,
      description: cfg.description || '',
      examples: Array.isArray(cfg.examples) ? cfg.examples.slice() : [],
      detectable: cfg.detect !== false,
      test: function(value) {
        var input = prep(value);
        var match;
        if (input == null) return false;
        match = run(pattern, input);
        return !!match && (!validate || validate(input, match));
      },
      extract: function(value) {
        var input = prep(value);
        var match;
        if (input == null) return null;
        match = run(pattern, input);
        if (!match || (validate && !validate(input, match))) return null;
        return extractImpl ? extractImpl(input, match) : copyGroups(match);
      }
    };
    if (!own.call(items, name)) names.push(name);
    items[name] = entry;
    if (api) api[name] = entry;
    return entry;
  }

  define('email', {
    description: 'RFC 5322 simplified email address',
    pattern: /^(?<local>[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+)@(?<domain>(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,63})$/i,
    examples: ['user@example.com', 'first.last@domain.co.uk'],
    extract: function(value, match) {
      return { local: match.groups.local, domain: match.groups.domain.toLowerCase(), tld: deriveTld(match.groups.domain) };
    }
  });

  define('phone', {
    description: 'International phone number with separators',
    pattern: /^\+(?<body>[0-9()\s.-]{8,24})$/,
    examples: ['+44 7911 123456', '+1 (415) 555-2671'],
    validate: function(value) {
      var digits = value.replace(/\D/g, '');
      return /^[1-9]\d{7,14}$/.test(digits);
    },
    extract: function(value) {
      var digits = value.replace(/\D/g, '');
      return { number: '+' + digits, digits: digits };
    }
  });

  define('phoneStrict', {
    description: 'Strict E.164 phone number',
    pattern: /^\+(?<digits>[1-9]\d{7,14})$/,
    detect: false,
    examples: ['+447911123456', '+14155552671'],
    extract: function(value, match) {
      return { number: value, digits: match.groups.digits };
    }
  });

  define('url', {
    description: 'HTTP or HTTPS URL',
    pattern: new RegExp('^(?<protocol>https?):\\/\\/(?<host>(?:localhost|(?:' + ipv4Part + '\\.){3}' + ipv4Part + '|(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\\.)+[A-Z]{2,63}))(?::(?<port>\\d{1,5}))?(?<path>\\/[^\\s?#]*)?(?:\\?(?<query>[^\\s#]*))?(?:#(?<fragment>[^\\s]*))?$', 'i'),
    examples: ['https://example.com', 'https://example.com:8080/path?q=1#frag'],
    validate: function(value, match) {
      var port = match.groups.port;
      return !port || (+port > 0 && +port <= 65535);
    },
    extract: function(value, match) {
      return {
        protocol: match.groups.protocol.toLowerCase(),
        host: match.groups.host,
        port: match.groups.port || null,
        path: match.groups.path || '',
        query: match.groups.query || '',
        fragment: match.groups.fragment || ''
      };
    }
  });

  define('ipv4', {
    description: 'IPv4 dotted decimal address',
    pattern: new RegExp('^(?<o1>' + ipv4Part + ')\\.(?<o2>' + ipv4Part + ')\\.(?<o3>' + ipv4Part + ')\\.(?<o4>' + ipv4Part + ')$'),
    examples: ['192.168.1.1', '8.8.8.8'],
    extract: function(value, match) {
      return { octets: [match.groups.o1, match.groups.o2, match.groups.o3, match.groups.o4], address: value };
    }
  });

  define('ipv6', {
    description: 'IPv6 full or compressed address',
    pattern: /^((?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}|(?:[A-F0-9]{1,4}:){1,7}:|(?:[A-F0-9]{1,4}:){1,6}:[A-F0-9]{1,4}|(?:[A-F0-9]{1,4}:){1,5}(?::[A-F0-9]{1,4}){1,2}|(?:[A-F0-9]{1,4}:){1,4}(?::[A-F0-9]{1,4}){1,3}|(?:[A-F0-9]{1,4}:){1,3}(?::[A-F0-9]{1,4}){1,4}|(?:[A-F0-9]{1,4}:){1,2}(?::[A-F0-9]{1,4}){1,5}|[A-F0-9]{1,4}:(?::[A-F0-9]{1,4}){1,6}|:(?::[A-F0-9]{1,4}){1,7}|::)$/i,
    examples: ['2001:0db8:85a3:0000:0000:8a2e:0370:7334', '2001:db8::1'],
    extract: function(value) {
      return { address: value.toLowerCase() };
    }
  });

  define('macAddress', {
    description: 'MAC address with colon or hyphen separators',
    pattern: /^(?<a>[A-F0-9]{2})(?<sep>[:-])(?<b>[A-F0-9]{2})\k<sep>(?<c>[A-F0-9]{2})\k<sep>(?<d>[A-F0-9]{2})\k<sep>(?<e>[A-F0-9]{2})\k<sep>(?<f>[A-F0-9]{2})$/i,
    examples: ['00:1A:2B:3C:4D:5E', '00-1A-2B-3C-4D-5E'],
    extract: function(value, match) {
      return { octets: [match.groups.a, match.groups.b, match.groups.c, match.groups.d, match.groups.e, match.groups.f], normalized: [match.groups.a, match.groups.b, match.groups.c, match.groups.d, match.groups.e, match.groups.f].join(':').toLowerCase() };
    }
  });

  define('zipUS', {
    description: 'US ZIP code',
    pattern: /^(?<zip>\d{5})(?:-(?<plus4>\d{4}))?$/,
    examples: ['90210', '10001-1234']
  });

  define('zipUK', {
    description: 'UK postcode',
    pattern: /^(?<outward>GIR ?0AA|[A-PR-UWYZ][A-HK-Y]?\d[A-Z\d]?) ?(?<inward>\d[ABD-HJLNP-UW-Z]{2})$/i,
    examples: ['SW1A 1AA', 'M1 1AE'],
    extract: function(value, match) {
      return { outward: match.groups.outward.toUpperCase().replace(/\s+/g, ''), inward: match.groups.inward.toUpperCase(), postalCode: (match.groups.outward + ' ' + match.groups.inward).toUpperCase().replace(/\s+/g, ' ').trim() };
    }
  });

  define('zipCA', {
    description: 'Canadian postal code',
    pattern: /^(?<forward>[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])[ -]?(?<local>\d[ABCEGHJ-NPRSTV-Z]\d)$/i,
    examples: ['K1A 0B1', 'M5V3L9'],
    extract: function(value, match) {
      return { forward: match.groups.forward.toUpperCase(), local: match.groups.local.toUpperCase(), postalCode: (match.groups.forward + ' ' + match.groups.local).toUpperCase() };
    }
  });

  define('zipDE', {
    description: 'German PLZ',
    pattern: /^(?<postal>\d{5})$/,
    examples: ['10115']
  });

  define('zipFR', {
    description: 'French postal code',
    pattern: /^(?<postal>\d{5})$/,
    examples: ['75008']
  });

  define('zipAU', {
    description: 'Australian postcode',
    pattern: /^(?<postal>\d{4})$/,
    examples: ['2000']
  });

  define('zipGeneric', {
    description: 'Generic international postal code',
    pattern: /^(?<postal>[A-Z0-9][A-Z0-9 -]{1,10}[A-Z0-9])$/i,
    detect: false,
    examples: ['75008', 'SW1A 1AA', '1010 AB'],
    extract: function(value, match) {
      return { postal: match.groups.postal.toUpperCase() };
    }
  });

  define('latLong', {
    description: 'Latitude and longitude decimal pair',
    pattern: /^\s*(?<lat>[+-]?(?:90(?:\.0+)?|[1-8]?\d(?:\.\d+)?))\s*,\s*(?<long>[+-]?(?:180(?:\.0+)?|(?:1[0-7]\d|[1-9]?\d)(?:\.\d+)?))\s*$/,
    examples: ['51.5074,-0.1278', '37.7749, -122.4194'],
    extract: function(value, match) {
      return { latitude: match.groups.lat, longitude: match.groups.long, lat: parseFloat(match.groups.lat), long: parseFloat(match.groups.long) };
    }
  });

  define('creditCard', {
    description: 'Credit card number with Luhn checksum',
    pattern: /^(?<value>\d(?:[ -]?\d){12,18})$/,
    examples: ['4111 1111 1111 1111', '4012-8888-8888-1881'],
    validate: function(value) {
      var digits = value.replace(/\D/g, '');
      return /^\d{13,19}$/.test(digits) && luhn(digits);
    },
    extract: function(value) {
      var digits = value.replace(/\D/g, '');
      return { number: digits, formatted: cardFormat(digits) };
    }
  });

  define('iban', {
    description: 'International Bank Account Number',
    pattern: /^[A-Z]{2}\d{2}[A-Z0-9 ]{11,34}$/i,
    examples: ['GB82 WEST 1234 5698 7654 32', 'DE89370400440532013000'],
    validate: function(value) {
      return validIban(value);
    },
    extract: function(value) {
      var normalized = value.replace(/\s+/g, '').toUpperCase();
      return { country: normalized.slice(0, 2), checkDigits: normalized.slice(2, 4), bban: normalized.slice(4), normalized: normalized, formatted: normalized.replace(/(.{4})/g, '$1 ').trim() };
    }
  });

  define('swift', {
    description: 'SWIFT or BIC code',
    pattern: /^(?<bank>[A-Z]{4})(?<country>[A-Z]{2})(?<location>[A-Z0-9]{2})(?<branch>[A-Z0-9]{3})?$/i,
    examples: ['DEUTDEFF', 'NEDSZAJJXXX'],
    extract: function(value, match) {
      return { bank: match.groups.bank.toUpperCase(), country: match.groups.country.toUpperCase(), location: match.groups.location.toUpperCase(), branch: match.groups.branch ? match.groups.branch.toUpperCase() : null, code: value.toUpperCase() };
    }
  });

  define('cvv', {
    description: 'Card security code',
    pattern: /^(?<cvv>\d{3,4})$/,
    examples: ['123', '1234']
  });

  define('ssn', {
    description: 'US Social Security Number',
    pattern: /^(?<area>(?!000|666|9\d\d)\d{3})-(?<group>(?!00)\d{2})-(?<serial>(?!0000)\d{4})$/,
    examples: ['123-45-6789']
  });

  define('nino', {
    description: 'UK National Insurance Number',
    pattern: /^(?<prefix>(?!BG|GB|KN|NK|NT|TN|ZZ)[A-CEGHJ-PR-TW-Z]{2})\s?(?<p1>\d{2})\s?(?<p2>\d{2})\s?(?<p3>\d{2})\s?(?<suffix>[A-D])$/i,
    examples: ['AB 12 34 56 C', 'AB123456D'],
    extract: function(value, match) {
      return { prefix: match.groups.prefix.toUpperCase(), number: match.groups.p1 + match.groups.p2 + match.groups.p3, suffix: match.groups.suffix.toUpperCase(), formatted: (match.groups.prefix + ' ' + match.groups.p1 + ' ' + match.groups.p2 + ' ' + match.groups.p3 + ' ' + match.groups.suffix).toUpperCase() };
    }
  });

  define('passport', {
    description: 'Generic passport number',
    pattern: /^(?<passport>[A-Z0-9]{6,9})$/i,
    examples: ['123456789', 'A12B3456']
  });

  define('dateISO', {
    description: 'ISO date YYYY-MM-DD',
    pattern: /^(?<year>\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\d|3[01])$/,
    examples: ['2024-03-15'],
    validate: function(value, match) {
      return validDate(match.groups.year, match.groups.month, match.groups.day);
    }
  });

  define('dateUS', {
    description: 'US date MM/DD/YYYY',
    pattern: /^(?<month>0[1-9]|1[0-2])\/(?<day>0[1-9]|[12]\d|3[01])\/(?<year>\d{4})$/,
    examples: ['03/15/2024'],
    validate: function(value, match) {
      return validDate(match.groups.year, match.groups.month, match.groups.day);
    }
  });

  define('dateEU', {
    description: 'European date DD/MM/YYYY',
    pattern: /^(?<day>0[1-9]|[12]\d|3[01])\/(?<month>0[1-9]|1[0-2])\/(?<year>\d{4})$/,
    examples: ['15/03/2024'],
    validate: function(value, match) {
      return validDate(match.groups.year, match.groups.month, match.groups.day);
    }
  });

  define('time24', {
    description: '24-hour time',
    pattern: /^(?<hour>[01]\d|2[0-3]):(?<minute>[0-5]\d)(?::(?<second>[0-5]\d))?$/,
    examples: ['23:59', '08:30:15'],
    extract: function(value, match) {
      return { hour: match.groups.hour, minute: match.groups.minute, second: match.groups.second || null };
    }
  });

  define('time12', {
    description: '12-hour time with AM or PM',
    pattern: /^(?<hour>0?[1-9]|1[0-2]):(?<minute>[0-5]\d)\s?(?<period>AM|PM)$/i,
    examples: ['9:30 AM', '11:59pm'],
    extract: function(value, match) {
      return { hour: match.groups.hour, minute: match.groups.minute, period: match.groups.period.toUpperCase() };
    }
  });

  define('datetime', {
    description: 'ISO 8601 datetime',
    pattern: /^(?<year>\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\d|3[01])[T ](?<hour>[01]\d|2[0-3]):(?<minute>[0-5]\d)(?::(?<second>[0-5]\d)(?:\.(?<ms>\d{1,3}))?)?(?<timezone>Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?$/,
    examples: ['2024-03-15T10:30:45Z', '2024-03-15 10:30:45+01:00'],
    validate: function(value, match) {
      return validDate(match.groups.year, match.groups.month, match.groups.day);
    },
    extract: function(value, match) {
      return {
        year: match.groups.year,
        month: match.groups.month,
        day: match.groups.day,
        hour: match.groups.hour,
        minute: match.groups.minute,
        second: match.groups.second || null,
        ms: match.groups.ms || null,
        timezone: match.groups.timezone || null
      };
    }
  });

  define('hex', {
    description: 'Hexadecimal string',
    pattern: /^(?:0x)?(?<hex>[A-F0-9]+)$/i,
    examples: ['0xFF12', 'deadbeef'],
    extract: function(value, match) {
      return { hex: match.groups.hex.toLowerCase(), normalized: '0x' + match.groups.hex.toLowerCase() };
    }
  });

  define('hexColour', {
    description: 'Hex colour literal',
    pattern: /^#(?<hex>[A-F0-9]{3}|[A-F0-9]{6}|[A-F0-9]{8})$/i,
    examples: ['#fff', '#336699', '#336699cc'],
    extract: function(value, match) {
      return { hex: match.groups.hex.toLowerCase(), value: '#' + match.groups.hex.toLowerCase() };
    }
  });

  define('uuid', {
    description: 'UUID v4',
    pattern: /^(?<uuid>[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})$/i,
    examples: ['550e8400-e29b-41d4-a716-446655440000'],
    extract: function(value, match) {
      return { uuid: match.groups.uuid.toLowerCase() };
    }
  });

  define('semver', {
    description: 'Semantic version number',
    pattern: /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9A-Z-][0-9A-Z-]*)(?:\.(?:0|[1-9A-Z-][0-9A-Z-]*))*))?(?:\+(?<build>[0-9A-Z-]+(?:\.[0-9A-Z-]+)*))?$/i,
    examples: ['1.2.3', '2.0.0-beta.1'],
    extract: function(value, match) {
      return { major: match.groups.major, minor: match.groups.minor, patch: match.groups.patch, prerelease: match.groups.prerelease || null, build: match.groups.build || null };
    }
  });

  define('jwt', {
    description: 'JSON Web Token',
    pattern: /^(?<header>[A-Za-z0-9_-]+)\.(?<payload>[A-Za-z0-9_-]+)\.(?<signature>[A-Za-z0-9_-]+)$/,
    examples: ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature'],
    extract: function(value, match) {
      return { headerSegment: match.groups.header, payloadSegment: match.groups.payload, signature: match.groups.signature, header: decodeJsonSegment(match.groups.header), payload: decodeJsonSegment(match.groups.payload) };
    }
  });

  define('base64', {
    description: 'Base64 encoded string',
    pattern: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
    detect: false,
    examples: ['SGVsbG8=', 'eyJmb28iOiJiYXIifQ=='],
    validate: function(value) {
      return value.length > 0;
    },
    extract: function(value) {
      return { value: value, decoded: decodeBase64(value, false) };
    }
  });

  define('slug', {
    description: 'Lowercase URL slug',
    pattern: /^(?<slug>[a-z0-9]+(?:-[a-z0-9]+)*)$/,
    detect: false,
    examples: ['bare-metal-tools', 'hello-world']
  });

  define('domain', {
    description: 'Domain name with optional subdomain',
    pattern: /^(?<domain>(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?<tld>[A-Z]{2,63}))$/i,
    examples: ['example.com', 'api.example.co.uk'],
    extract: function(value, match) {
      return { domain: match.groups.domain.toLowerCase(), tld: deriveTld(match.groups.domain) };
    }
  });

  define('hashtag', {
    description: 'Social media hashtag',
    pattern: /^(?<tag>#[\p{L}\p{N}_]{1,139})$/u,
    examples: ['#JavaScript', '#100DaysOfCode'],
    extract: function(value, match) {
      return { tag: match.groups.tag.slice(1), value: match.groups.tag };
    }
  });

  define('mention', {
    description: 'User mention',
    pattern: /^(?<mention>@[A-Za-z0-9_](?:[A-Za-z0-9_.-]{0,28}[A-Za-z0-9_])?)$/,
    examples: ['@octocat', '@user_name'],
    extract: function(value, match) {
      return { username: match.groups.mention.slice(1), value: match.groups.mention };
    }
  });

  define('alphanumeric', {
    description: 'Letters and numbers only',
    pattern: /^(?<value>[A-Za-z0-9]+)$/,
    detect: false,
    examples: ['ABC123']
  });

  define('alpha', {
    description: 'Letters only including unicode',
    pattern: /^(?<value>[\p{L}\p{M}]+)$/u,
    detect: false,
    examples: ['Résumé', '東京']
  });

  define('numeric', {
    description: 'Signed decimal number',
    pattern: /^(?<number>-?(?:\d+\.\d+|\d+|\.\d+))$/,
    detect: false,
    examples: ['42', '-3.14'],
    extract: function(value, match) {
      return { number: match.groups.number, numeric: parseFloat(match.groups.number) };
    }
  });

  define('integer', {
    description: 'Signed integer',
    pattern: /^(?<integer>-?\d+)$/,
    detect: false,
    examples: ['42', '-17'],
    extract: function(value, match) {
      return { integer: match.groups.integer, numeric: parseInt(match.groups.integer, 10) };
    }
  });

  define('whitespace', {
    description: 'Whitespace only',
    pattern: /^(?<value>\s+)$/,
    detect: false,
    prepare: str,
    examples: ['   ', '\t\n'],
    extract: function(value) {
      return { value: value, length: value.length };
    }
  });

  define('noWhitespace', {
    description: 'No whitespace characters',
    pattern: /^(?<value>\S+)$/,
    detect: false,
    prepare: str,
    examples: ['NoSpaces123']
  });

  define('strongPassword', {
    description: 'Strong password with upper lower digit special',
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/,
    detect: false,
    examples: ['Sup3r$ecret!'],
    extract: function(value) {
      return { length: value.length };
    }
  });

  define('username', {
    description: 'Username 3-20 chars',
    pattern: /^(?<username>[A-Za-z0-9_-]{3,20})$/,
    detect: false,
    examples: ['john_doe', 'user-123']
  });

  define('htmlTag', {
    description: 'HTML or XML tag',
    pattern: /^<(?<closing>\/)?(?<name>[A-Za-z][A-Za-z0-9:-]*)(?<attrs>(?:\s+[A-Za-z_:][A-Za-z0-9:._-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(?<selfClosing>\/?)>$/,
    examples: ['<div class="card">', '</div>', '<img src="x" />'],
    extract: function(value, match) {
      return { name: match.groups.name, closing: match.groups.closing === '/', selfClosing: match.groups.selfClosing === '/', attributes: (match.groups.attrs || '').trim() };
    }
  });

  define('cssSelector', {
    description: 'Basic CSS selector',
    pattern: /^(?=[^{}]+$)(?=.*(?:[#.\[*:A-Za-z]))(?<selector>(?:[A-Za-z*][\w-]*|[#.][\w-]+|\[[^\]\r\n]+\]|::?[\w-]+(?:\([^)]*\))?|[\s>+~,])+)$/,
    detect: false,
    examples: ['.card > a[href]', '#app .item.active'],
    extract: function(value, match) {
      return { selector: match.groups.selector.trim() };
    }
  });

  define('jsonString', {
    description: 'JSON string literal',
    pattern: /^"(?<content>(?:\\(?:["\\\/bfnrt]|u[0-9A-Fa-f]{4})|[^"\\\u0000-\u001F])*)"$/,
    examples: ['"hello"', '"line\\nfeed"'],
    extract: function(value) {
      try { return { value: JSON.parse(value) }; } catch (_) { return null; }
    }
  });

  define('markdownLink', {
    description: 'Markdown inline link',
    pattern: /^\[(?<text>[^\]]+)\]\((?<url>[^\s)]+)\)$/,
    examples: ['[BareMetal](https://example.com)']
  });

  define('dataUri', {
    description: 'Base64 data URI',
    pattern: /^data:(?<mime>[\w.+-]+\/[\w.+-]+(?:;[\w-]+=[\w.+-]+)*);base64,(?<data>[A-Za-z0-9+/]+={0,2})$/i,
    examples: ['data:text/plain;base64,SGVsbG8=', 'data:image/png;base64,iVBORw0KGgo='],
    extract: function(value, match) {
      return { mime: match.groups.mime.toLowerCase(), data: match.groups.data, decoded: decodeBase64(match.groups.data, false) };
    }
  });

  function list() {
    return names.slice();
  }

  function info(name) {
    var item = items[name];
    if (!item) return null;
    return { name: name, description: item.description, pattern: item.pattern, examples: item.examples.slice() };
  }

  function detect(value) {
    var out = [];
    var item;
    var i;
    for (i = 0; i < names.length; i++) {
      item = items[names[i]];
      if (item.detectable && item.test(value)) out.push(names[i]);
    }
    return out;
  }

  function register(name, cfg) {
    if (typeof name !== 'string' || !name || !cfg || !(cfg.pattern instanceof RegExp)) return null;
    return define(name, {
      pattern: cfg.pattern,
      description: cfg.description || '',
      examples: Array.isArray(cfg.examples) ? cfg.examples : [],
      prepare: typeof cfg.prepare === 'function' ? cfg.prepare : trimmed,
      detect: cfg.detect !== false,
      validate: typeof cfg.validate === 'function' ? cfg.validate : null,
      extract: typeof cfg.extract === 'function' ? function(value, match) {
        return cfg.extract(value, match);
      } : null
    });
  }

  api = {
    list: list,
    info: info,
    detect: detect,
    register: register
  };

  for (var i = 0; i < names.length; i++) api[names[i]] = items[names[i]];

  return api;
})();