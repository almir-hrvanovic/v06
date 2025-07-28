#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

async function fixFinalThree() {
  const filePath = path.join(process.cwd(), 'messages', 'bs.json');
  const content = await fs.readFile(filePath, 'utf-8');
  let translations = JSON.parse(content);
  
  // Fix the specific placeholders
  if (translations.inquiries?.inquiryStats) {
    translations.inquiries.inquiryStats.completed = "Završeno";
    translations.inquiries.inquiryStats.overdue = "Zakasnilo";
  }
  
  if (translations.messages?.info) {
    translations.messages.info.creating = "Kreiranje...";
  }
  
  await fs.writeFile(filePath, JSON.stringify(translations, null, 2) + '\n', 'utf-8');
  console.log('✅ Fixed final 3 placeholders in Bosnian');
}

fixFinalThree().catch(console.error);