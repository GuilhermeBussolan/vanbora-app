/**
 * Polyfills necessários no React Native/Hermes.
 *
 * O @stomp/stompjs (v7) usa TextEncoder/TextDecoder para serializar os frames
 * STOMP. Em alguns runtimes do Hermes essas globais não existem — instalamos um
 * fallback mínimo (UTF-8) quando ausentes. Importado no topo de app/_layout.tsx.
 */

function installTextEncoder() {
  const g = globalThis as any;
  if (typeof g.TextEncoder === 'undefined') {
    g.TextEncoder = class {
      readonly encoding = 'utf-8';
      encode(input = ''): Uint8Array {
        const utf8: number[] = [];
        for (let i = 0; i < input.length; i++) {
          let code = input.charCodeAt(i);
          if (code < 0x80) {
            utf8.push(code);
          } else if (code < 0x800) {
            utf8.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
          } else if (code >= 0xd800 && code <= 0xdbff) {
            // par surrogate
            const next = input.charCodeAt(++i);
            code = 0x10000 + ((code & 0x3ff) << 10) + (next & 0x3ff);
            utf8.push(
              0xf0 | (code >> 18),
              0x80 | ((code >> 12) & 0x3f),
              0x80 | ((code >> 6) & 0x3f),
              0x80 | (code & 0x3f),
            );
          } else {
            utf8.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
          }
        }
        return new Uint8Array(utf8);
      }
    };
  }

  if (typeof g.TextDecoder === 'undefined') {
    g.TextDecoder = class {
      readonly encoding = 'utf-8';
      decode(input?: ArrayBuffer | Uint8Array): string {
        if (!input) return '';
        const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
        let result = '';
        let i = 0;
        while (i < bytes.length) {
          let c = bytes[i++];
          if (c > 0x7f) {
            if (c > 0xdf && c < 0xf0) {
              c = ((c & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
            } else if (c > 0xbf) {
              c = ((c & 0x1f) << 6) | (bytes[i++] & 0x3f);
            }
          }
          result += String.fromCharCode(c);
        }
        return result;
      }
    };
  }
}

installTextEncoder();
