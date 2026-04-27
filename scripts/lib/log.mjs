// Tutarlı, prefix'li log. NO_COLOR'a saygı duyar; non-TTY'de renk kapanır.

const RESET  = '\x1b[0m';
const DIM    = '\x1b[2m';
const BOLD   = '\x1b[1m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';

const NO_COLOR = process.env.NO_COLOR || !process.stdout.isTTY;
const c = (color, s) => NO_COLOR ? s : `${color}${s}${RESET}`;

export function log(...a)  { console.log(c(DIM,    '[log]'), ...a); }
export function info(...a) { console.log(c(CYAN,   '[i]'),   ...a); }
export function ok(...a)   { console.log(c(GREEN,  '[OK]'),  ...a); }
export function warn(...a) { console.warn(c(YELLOW,'[!]'),   ...a); }
export function err(...a)  { console.error(c(RED,  '[X]'),   ...a); }

export function step(n, total, ...a) {
  console.log(c(BOLD, `[${n}/${total}]`), ...a);
}

export function header(title) {
  const len = Math.max(40, title.length + 4);
  const line = '─'.repeat(len);
  console.log('\n' + line);
  console.log('  ' + c(BOLD, title));
  console.log(line + '\n');
}

export function bail(msg, code = 1) {
  err(msg);
  process.exit(code);
}
