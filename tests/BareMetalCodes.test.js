/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path=require('path');
const fs=require('fs');

function loadCodes(fetchImpl){
  const code=fs.readFileSync(path.resolve(__dirname,'../src/BareMetal.Codes.js'),'utf8');
  const bm={};
  const fn=new Function('document','BareMetal','fetch',code+'\nreturn BareMetal;');
  return fn(global.document,bm,fetchImpl).Codes;
}

describe('BareMetal.Codes',()=>{
  test('loads core reference datasets',()=>{
    const C=loadCodes();
    expect(C.countries.list()).toHaveLength(250);
    expect(C.currencies.list().length).toBeGreaterThanOrEqual(150);
    expect(C.languages.list().length).toBeGreaterThanOrEqual(180);
    expect(C.colours.list()).toHaveLength(148);
    expect(C.http.list().length).toBeGreaterThanOrEqual(60);
  });

  test('country, currency, language and timezone lookups work',()=>{
    const C=loadCodes();
    expect(C.countries.get('US')).toMatchObject({code:'US',name:'United States',currency:'USD',phone:'1'});
    expect(C.currencies.get('USD')).toMatchObject({code:'USD',name:'US Dollar',symbol:'$',decimals:2});
    expect(C.languages.get('en')).toMatchObject({code:'en',name:'English',native:'English'});
    expect(C.timezones.get('America/New_York')).toMatchObject({id:'America/New_York',offset:'-05:00',description:'New York'});
  });

  test('search, http, mime, colours, cards and units work',()=>{
    const C=loadCodes();
    expect(C.countries.search('united').map(x=>x.code)).toEqual(expect.arrayContaining(['AE','GB','US']));
    expect(C.http.get(404)).toMatchObject({code:404,phrase:'Not Found',category:'client'});
    expect(C.mime.get('json')).toEqual({ext:'json',type:'application/json'});
    expect(C.mime.fromType('application/json')).toEqual({ext:'json',type:'application/json'});
    expect(C.colours.get('coral')).toEqual({name:'coral',hex:'#FF7F50'});
    expect(C.cards.detect('4111111111111111')).toMatchObject({name:'Visa',cvv:3});
    expect(C.units.convert(100,'km','mi')).toBeCloseTo(62.1371192237334,10);
  });

  test('subdivisions fetches once and caches by uppercased code',async()=>{
    const fetch=jest.fn().mockResolvedValue({ok:true,json:()=>Promise.resolve([{code:'US-CA',name:'California'}])});
    const C=loadCodes(fetch);
    await expect(C.subdivisions('us')).resolves.toEqual([{code:'US-CA',name:'California'}]);
    await expect(C.subdivisions('US')).resolves.toEqual([{code:'US-CA',name:'California'}]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('codes/US.json');
  });
});
