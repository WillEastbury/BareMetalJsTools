BareMetal.TestRunner.installGlobals();

describe('BareMetal.Minifier', function () {
  var minifyJS = BareMetal.Minifier.minifyJS;
  var minifyCSS = BareMetal.Minifier.minifyCSS;

  function exec(code) {
    return Function('"use strict";' + code)();
  }

  it('loads', function () {
    expect(BareMetal.Minifier).toBeTruthy();
  });

  it('keeps regex after return', function () {
    var r = minifyJS('function f(x) { return /https?:\\/\\//.test(x); }');
    expect(r.unsupported).toBeFalsy();
    var f = exec(r.code + '; return f;');
    expect(f('https://x')).toBe(true);
    expect(f('ftp://x')).toBe(false);
  });

  it('keeps CSS quoted spaces and colons', function () {
    var r = minifyCSS('a::before { content: "hello : world"; }');
    expect(r.code.indexOf('"hello : world"') >= 0).toBe(true);
  });

  it('does not rewrite ;} inside CSS strings', function () {
    var r = minifyCSS('a::before{content:"x;}y"}');
    expect(r.code.indexOf('"x;}y"') >= 0).toBe(true);
  });

  it('keeps division after parentheses', function () {
    var r = minifyJS('function f(a,b){return (a) / b;}');
    expect(r.unsupported).toBeFalsy();
    var f = exec(r.code + '; return f;');
    expect(f(6, 2)).toBe(3);
  });

  it('keeps division after call, index, ++, and }', function () {
    expect(exec(minifyJS('return (6+2)/2;').code)).toBe(4);
    expect(exec(minifyJS('var a=[8]; return a[0]/2;').code)).toBe(4);
    expect(exec(minifyJS('var i=3; i++; return i / 2;').code)).toBe(2);
    var r = minifyJS('var x = {} / 2');
    expect(r.unsupported).toBeFalsy();
    expect(Number.isNaN(exec(r.code + '; return x;'))).toBe(true);
  });

  it('keeps multiline calls and indexes (no injected semicolon)', function () {
    var src = 'var f=function(x){return x+1}; var r=f\n(2); return r;';
    var r = minifyJS(src);
    expect(r.unsupported).toBeFalsy();
    expect(exec(r.code)).toBe(3);
    expect(exec(minifyJS('var a=[9]; return a\n[0];').code)).toBe(9);
  });

  it('does not break if ( across a newline', function () {
    var r = minifyJS('function f(x){if\n(x) return 1; return 0}');
    expect(r.unsupported).toBeFalsy();
    var f = exec(r.code + '; return f;');
    expect(f(true)).toBe(1);
    expect(f(false)).toBe(0);
  });

  it('keeps a space so 1 .toString() stays valid', function () {
    var r = minifyJS('return 1 .toString();');
    expect(r.unsupported).toBeFalsy();
    expect(function () { new Function(r.code); }).not.toThrow();
    expect(exec(r.code)).toBe('1');
    expect(exec(minifyJS('return 1 .constructor;').code)).toBe(Number);
  });

  it('preserves CR in return block comments', function () {
    var src = 'function f(){return /*\r*/ 1;}';
    var r = minifyJS(src);
    expect(r.unsupported).toBeFalsy();
    expect(exec(r.code + '; return f;')()).toBe(undefined);
  });

  it('preserves ASI between ident and ++', function () {
    var src = 'function f(){let x=0; x\n++x; return x}';
    var r = minifyJS(src);
    expect(r.unsupported).toBeFalsy();
    expect(exec(r.code + '; return f;')()).toBe(1);
  });

  it('preserves newline inside return block comments', function () {
    var src = 'function f(){return /*\n*/ 1;}';
    var r = minifyJS(src);
    expect(r.unsupported).toBeFalsy();
    expect(exec(r.code + '; return f;')()).toBe(undefined);
  });

  it('keeps regex inside template interpolation', function () {
    var r = minifyJS('function t(x){ return `${/https?:\\/\\//.test(x)}`; }');
    expect(r.unsupported).toBeFalsy();
    var t = exec(r.code + '; return t;');
    expect(t('https://a')).toBe('true');
  });

  it('keeps nested templates', function () {
    var t = exec(minifyJS('function t(a,b){ return `${a}${`${b}`}`; }').code + '; return t;');
    expect(t('x', 'y')).toBe('xy');
  });

  it('keeps ASI after return', function () {
    var a = exec(minifyJS('function a(){\n  return\n  1\n}').code + '; return a;');
    expect(a()).toBe(undefined);
  });

  it('is idempotent on a simple function', function () {
    var once = minifyJS('function f(x){return x+1;}').code;
    expect(minifyJS(once).code).toBe(once);
  });

  it('fail-closes on unterminated string', function () {
    var src = '"oops';
    var r = minifyJS(src);
    expect(r.unsupported).toBe(true);
    expect(r.code).toBe(src);
  });

  it('keeps calc operator spaces', function () {
    expect(minifyCSS('div { width: calc(100% - 20px); }').code.indexOf('calc(100% - 20px)') >= 0).toBe(true);
  });

  it('minifies its own source text when provided', function () {
    var src = BareMetal.Minifier.minifyJS.toString();
    var wrapped = '(' + src + ')';
    var r = minifyJS(wrapped);
    expect(r.unsupported).toBeFalsy();
    expect(function () { new Function('return ' + r.code); }).not.toThrow();
  });
});
