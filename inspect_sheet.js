import XLSX from 'xlsx';
import fs from 'fs';

const wb = XLSX.readFile('AHSP.xlsx');
const targetSheet = wb.SheetNames.find(n => n.toLowerCase().includes('upah') || n.toLowerCase().includes('bahan'));
console.log(`Inspecting Sheet: ${targetSheet}`);

if (targetSheet) {
    const ws = wb.Sheets[targetSheet];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(JSON.stringify(data.slice(0, 20), null, 2));
} else {
    console.log("No matching sheet found.");
}
