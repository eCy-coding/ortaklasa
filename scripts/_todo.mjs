// Henüz implemente edilmemiş script'ler için ortak placeholder.
// Kullanım: node scripts/_todo.mjs <task-adı> <aşama-no>
const [, , task = '?', stage = '?'] = process.argv;
console.log(`\n[ortaklasa] '${task}' henüz implemente edilmedi.`);
console.log(`Bu görev PLAN.md → Aşama ${stage}'da hazırlanacak.\n`);
process.exit(78); // 78 = EX_CONFIG (sysexits.h)
