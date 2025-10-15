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
};

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

    const headers = worksheet.data[0] as string[];
    const rows = worksheet.data.slice(1) as string[][];

    console.log('Excel headers:', headers);
    console.log(`Found ${rows.length} FAQ entries`);

    const faqEntries: FaqEntry[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 6) continue;

      const faqEntry = {
        mainCategory: row[0] || '',
        subCategory: row[1] || '',
        question: row[2] || '',
        priority: row[3] || '',
        targetAudience: row[4] || '',
        templateAnswer: row[5] || '',
      };

      faqEntries.push(faqEntry);
    }

    console.log('FAQ Entries:', faqEntries);

    return faqEntries;
  } catch (error) {
    console.error('Excel file parsing failed:', error);
    throw error;
  }
}
