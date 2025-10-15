import * as path from 'path';
import * as fs from 'fs';
import * as xlsx from 'node-xlsx';

export type FaqEntry = {
  mainCategory: string;
  subCategory: string;
  question: string;
  priority: string;
  targetAudience: string;
  templateAnswer: string;
  relevancePercent?: number;
};

const currencyMap: Record<string, string> = {
  'белорусский рубль': 'BYN',
  'белорусских рублей': 'BYN',
  'белорусских рублях': 'BYN',
  'белорусские рубли': 'BYN',
  BYN: 'BYN',
  'базовых величин Республики Беларусь': 'BYN',
  'российский рубль': 'RUB',
  'российских рублях': 'RUB',
  'российских рублей': 'RUB',
  'российские рубли': 'RUB',
  рублевый: 'RUB',
  'руб.': 'RUB',
  'российских руб.': 'RUB',
  'доллар США': 'USD',
  долларовый: 'USD',
  'долларах США': 'USD',
  'доллары США': 'USD',
  'долларов США': 'USD',
  доллара: 'USD',
  'долл.': 'USD',
  долларов: 'USD',
  евро: 'EUR',
  евровых: 'EUR',
  'китайский юань': 'CNY',
  'китайских юанях': 'CNY',
  'китайских юаней': 'CNY',
  'китайские юани': 'CNY',
  юани: 'CNY',
  'китайской валюте': 'CNY',
};

function replaceCurrencyMentions(text: string): string {
  let result = text;

  const sortedCurrencyEntries = Object.entries(currencyMap).sort(
    ([keyA], [keyB]) => keyB.length - keyA.length,
  );

  for (const [key, value] of sortedCurrencyEntries) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const regex = new RegExp(escapedKey, 'gi');

    result = result.replace(regex, value);
  }
  return result;
}

export async function parseExcelFile(): Promise<FaqEntry[]> {
  try {
    const excelPath = path.join(
      process.cwd(),
      'src/database/data/smart_support_vtb_belarus_faq_final.xlsx',
    );

    if (!fs.existsSync(excelPath)) {
      console.warn('Excel file not found:', excelPath);
      return [];
    }

    const workSheets = xlsx.parse(fs.readFileSync(excelPath));
    const worksheet = workSheets[0];

    if (!worksheet || !worksheet.data) {
      console.warn('Excel file is empty or has no data');
      return [];
    }

    const rows = worksheet.data.slice(1) as string[][];

    const faqEntries: FaqEntry[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 6) continue;

      const faqEntry = {
        mainCategory: row[0] || '',
        subCategory: row[1] || '',
        question: replaceCurrencyMentions(row[2] || ''),
        priority: row[3] || '',
        targetAudience: row[4] || '',
        templateAnswer: row[5] || '',
      };

      faqEntries.push(faqEntry);
    }

    return faqEntries;
  } catch (error) {
    console.error('Excel file parsing failed:', error);
    throw error;
  }
}
