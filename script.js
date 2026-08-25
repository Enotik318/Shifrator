// ===== Текущий режим =====
let currentMode = 'base64';

// ===== Описания режимов =====
const modeInfo = {
  base64:   'Кодирование / декодирование Base64',
  caesar:   'Шифр Цезаря — сдвиг букв на N позиций',
  rot13:    'ROT13 — сдвиг на 13 позиций (обратим сам собой)',
  vigenere: 'Шифр Виженера — полиалфавитный с ключом',
  atbash:   'Атбаш — зеркальный алфавит (А↔Я, A↔Z)',
  reverse:  'Реверс — переворот строки задом наперёд',
  xor:      'XOR-шифрование с ключом (результат в Base64)',
  hex:      'Перевод в шестнадцатеричный вид (HEX)',
  binary:   'Перевод в двоичный код',
  morse:    'Азбука Морзе',
  a1z26:    'A1Z26 — буквы в числа (A=1 … Z=26)'
};

// ===== Переключение режимов =====
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    document.getElementById('modeDescription').textContent = modeInfo[currentMode];

    // Параметры
    const needsShift = currentMode === 'caesar';
    const needsKey   = ['xor', 'vigenere'].includes(currentMode);

    document.getElementById('caesarParams').style.display = needsShift ? 'flex' : 'none';
    document.getElementById('keyParams').style.display    = needsKey   ? 'flex' : 'none';

    document.getElementById('outputText').value = '';
  });
});

// ===== Основная функция =====
function processText(encrypt) {
  const input = document.getElementById('inputText').value;
  const outputEl = document.getElementById('outputText');

  if (!input.trim()) {
    outputEl.value = 'Введите текст...';
    return;
  }

  try {
    let result = '';

    switch (currentMode) {
      case 'base64':
        result = encrypt ? toBase64(input) : fromBase64(input);
        break;

      case 'caesar': {
        const shift = parseInt(document.getElementById('caesarShift').value) || 3;
        result = caesarCipher(input, encrypt ? shift : -shift);
        break;
      }

      case 'rot13':
        result = caesarCipher(input, 13);
        break;

      case 'vigenere': {
        const key = document.getElementById('cipherKey').value || 'secret';
        result = vigenereCipher(input, key, encrypt);
        break;
      }

      case 'atbash':
        result = atbashCipher(input);
        break;

      case 'reverse':
        result = input.split('').reverse().join('');
        break;

      case 'xor': {
        const key = document.getElementById('cipherKey').value || 'secret';
        if (encrypt) {
          let xored = '';
          for (let i = 0; i < input.length; i++) {
            xored += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
          }
          result = toBase64(xored);
        } else {
          const decoded = fromBase64(input);
          let xored = '';
          for (let i = 0; i < decoded.length; i++) {
            xored += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
          }
          result = xored;
        }
        break;
      }

      case 'hex':
        result = encrypt ? toHex(input) : fromHex(input);
        break;

      case 'binary':
        result = encrypt ? toBinary(input) : fromBinary(input);
        break;

      case 'morse':
        result = encrypt ? toMorse(input) : fromMorse(input);
        break;

      case 'a1z26':
        result = encrypt ? toA1Z26(input) : fromA1Z26(input);
        break;

      default:
        result = 'Неизвестный режим';
    }

    outputEl.value = result;
  } catch (e) {
    outputEl.value = 'Ошибка: ' + (e.message || 'неверный формат данных');
  }
}

// ===== Base64 =====
function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function fromBase64(str) {
  return decodeURIComponent(escape(atob(str)));
}

// ===== Цезарь / ROT13 =====
function caesarCipher(text, shift) {
  const ru = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
  const ruLen = ru.length;

  return text.replace(/[a-zа-яё]/gi, char => {
    const isUpper = char === char.toUpperCase();
    const lower = char.toLowerCase();
    let res;

    if (lower >= 'a' && lower <= 'z') {
      const s = ((shift % 26) + 26) % 26;
      res = String.fromCharCode(((lower.charCodeAt(0) - 97 + s) % 26) + 97);
    } else {
      const idx = ru.indexOf(lower);
      if (idx === -1) return char;
      const s = ((shift % ruLen) + ruLen) % ruLen;
      res = ru[(idx + s) % ruLen];
    }

    return isUpper ? res.toUpperCase() : res;
  });
}

// ===== Виженер =====
function vigenereCipher(text, key, encrypt) {
  if (!key) key = 'secret';
  const ru = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
  key = key.toLowerCase().replace(/[^a-zа-яё]/g, '');
  if (!key) key = 'a';

  let keyIdx = 0;
  return text.replace(/[a-zа-яё]/gi, char => {
    const isUpper = char === char.toUpperCase();
    const lower = char.toLowerCase();
    const k = key[keyIdx % key.length];
    keyIdx++;

    let res;
    if (lower >= 'a' && lower <= 'z') {
      const shift = k.charCodeAt(0) - 97;
      const s = encrypt ? shift : -shift;
      res = String.fromCharCode(((lower.charCodeAt(0) - 97 + s + 26) % 26) + 97);
    } else {
      const idx = ru.indexOf(lower);
      const kIdx = ru.indexOf(k) !== -1 ? ru.indexOf(k) : (k.charCodeAt(0) - 97) % ru.length;
      if (idx === -1) return char;
      const s = encrypt ? kIdx : -kIdx;
      res = ru[(idx + s + ru.length) % ru.length];
    }
    return isUpper ? res.toUpperCase() : res;
  });
}

// ===== Атбаш =====
function atbashCipher(text) {
  const en = 'abcdefghijklmnopqrstuvwxyz';
  const ru = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';

  return text.replace(/[a-zа-яё]/gi, char => {
    const isUpper = char === char.toUpperCase();
    const lower = char.toLowerCase();
    let res;

    if (lower >= 'a' && lower <= 'z') {
      res = en[25 - en.indexOf(lower)];
    } else {
      const idx = ru.indexOf(lower);
      if (idx === -1) return char;
      res = ru[ru.length - 1 - idx];
    }
    return isUpper ? res.toUpperCase() : res;
  });
}

// ===== HEX =====
function toHex(str) {
  return Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ');
}
function fromHex(str) {
  return str.trim().split(/\s+/)
    .filter(Boolean)
    .map(h => String.fromCharCode(parseInt(h, 16)))
    .join('');
}

// ===== Binary =====
function toBinary(str) {
  return Array.from(str)
    .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');
}
function fromBinary(str) {
  return str.trim().split(/\s+/)
    .filter(Boolean)
    .map(b => String.fromCharCode(parseInt(b, 2)))
    .join('');
}

// ===== Морзе =====
const morseMap = {
  'а': '.-',    'б': '-...',  'в': '.--',   'г': '--.',   'д': '-..',
  'е': '.',     'ё': '.',     'ж': '...-',  'з': '--..',  'и': '..',
  'й': '.---',  'к': '-.-',   'л': '.-..',  'м': '--',    'н': '-.',
  'о': '---',   'п': '.--.',  'р': '.-.',   'с': '...',   'т': '-',
  'у': '..-',   'ф': '..-.',  'х': '....',  'ц': '-.-.',  'ч': '---.',
  'ш': '----',  'щ': '--.-',  'ъ': '--.--', 'ы': '-.--',  'ь': '-..-',
  'э': '..-..', 'ю': '..--',  'я': '.-.-',
  'a': '.-',    'b': '-...',  'c': '-.-.',  'd': '-..',   'e': '.',
  'f': '..-.',  'g': '--.',   'h': '....',  'i': '..',    'j': '.---',
  'k': '-.-',   'l': '.-..',  'm': '--',    'n': '-.',    'o': '---',
  'p': '.--.',  'q': '--.-',  'r': '.-.',   's': '...',   't': '-',
  'u': '..-',   'v': '...-',  'w': '.--',   'x': '-..-',  'y': '-.--',
  'z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--',
  ' ': '/'
};

const reverseMorse = {};
for (const [k, v] of Object.entries(morseMap)) {
  if (!reverseMorse[v]) reverseMorse[v] = k;
}

function toMorse(str) {
  return str.toLowerCase().split('').map(c => morseMap[c] || c).join(' ');
}
function fromMorse(str) {
  return str.trim().split(/\s+/).map(code => reverseMorse[code] || code).join('');
}

// ===== A1Z26 =====
function toA1Z26(str) {
  return str.split('').map(c => {
    const lower = c.toLowerCase();
    if (lower >= 'a' && lower <= 'z') return (lower.charCodeAt(0) - 96).toString();
    const ru = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
    const idx = ru.indexOf(lower);
    if (idx !== -1) return (idx + 1).toString();
    return c;
  }).join(' ');
}

function fromA1Z26(str) {
  const ru = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
  return str.trim().split(/\s+/).map(token => {
    const n = parseInt(token, 10);
    if (isNaN(n)) return token;
    if (n >= 1 && n <= 26) return String.fromCharCode(96 + n);
    if (n >= 1 && n <= 33) return ru[n - 1] || token;
    return token;
  }).join('');
}