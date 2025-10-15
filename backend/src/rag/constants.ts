export const PRODUCT_NAMES = [
  'MORE',
  'Форсаж',
  'Комплимент',
  'Signature',
  'PLAT/ON',
  'Портмоне 2.0',
  'Отличник',
  'ЧЕРЕПАХА',
  'КСТАТИ',
  'На всё про всё',
  'Дальше - меньше',
  'Легко платить',
  'Всё только начинается',
  'Старт',
  'Проще в онлайн',
  'СуперСемь',
  'Mir Pay',
];

function createProductMapping(names: string[]) {
  const mappings: Record<string, string> = {};
  for (const name of names) {
    mappings[name.toLowerCase()] = name;

    if (/[A-Z]/.test(name)) {
      const russianApprox = name
        .replace(/MORE/i, 'МОРЕ')
        .replace(/PLAT\/ON/i, 'ПЛАТ/ОН')
        .replace(/MIR PAY/i, 'МИР ПЭЙ')
        .replace(/\s/g, '');

      if (russianApprox !== name) {
        mappings[russianApprox.toLowerCase()] = name;
      }
    }
  }
  return mappings;
}

export const PRODUCT_MAP = createProductMapping(PRODUCT_NAMES);

export const PRODUCT_MAPPING_STRING = Object.entries(PRODUCT_MAP)
  .map(([key, value]) => `если найдено "${key}" -> заменить на "${value}"`)
  .join('\n');
