BareMetal.TestRunner.installGlobals();

describe('BareMetal.SecureTransport', function () {
  it('encrypts an object and decrypts it with an RSA key pair', async function () {
    var pair = await crypto.subtle.generateKey(
      { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['encrypt', 'decrypt']
    );
    var secure = BareMetal.SecureTransport.create({ publicKey: pair.publicKey });
    var envelope = await secure.encryptObject({ customer: 'Ada', total: 42 });
    expect(envelope.algorithms.key).toBe('RSA-OAEP-SHA256');
    expect(envelope.algorithms.content).toBe('AES-256-GCM');
    var clear = await secure.decryptObject(envelope, pair.privateKey);
    expect(clear).toEqual({ customer: 'Ada', total: 42 });
  });
});
