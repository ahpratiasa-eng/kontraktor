
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\Nakise\\kontraktor-pro\\rab\\Book1.xlsx';
const outputPath = 'C:\\Users\\Nakise\\kontraktor-pro\\inspect_output.txt';

let output = '';
const log = (...args) => {
    output += args.join(' ') + '\n';
};

try {
    if (!fs.existsSync(filePath)) {
        log('File not found:', filePath);
    } else {
        const workbook = XLSX.readFile(filePath);
        log('Sheet Names:', JSON.stringify(workbook.SheetNames));

        workbook.SheetNames.forEach(sheetName => {
            log(`\n--- SHEET: ${sheetName} ---`);
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            // Log first 15 rows
            rows.slice(0, 15).forEach((row, index) => {
                log(`Row ${index + 1}: ${JSON.stringify(row)}`);
            });
        });
    }
} catch (err) {
    log('Error reading file:', err);
}

fs.writeFileSync(outputPath, output);
