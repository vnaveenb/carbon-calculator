const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, '..', '1.csv');
const MD_FILE = path.join(__dirname, '..', '1.md');

let products = [];

function toNum(v) {
  if (!v || v === '-') return 0;
  const clean = String(v).replace(/[^\d.-]/g, '');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

function parseCSVRow(line) {
  const result = [];
  let inQuotes = false;
  let current = '';
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map(v => v.trim());
}

function loadCSV() {
  if (!fs.existsSync(CSV_FILE)) {
    console.warn('1.csv not found, skipping CSV load');
    return [];
  }
  const text = fs.readFileSync(CSV_FILE, 'utf-8');
  const lines = text.split(/\r?\n/).filter(l => l.trim());

  return lines.slice(1).map(line => {
    const c = parseCSVRow(line);
    if (!c[1] || !c[4]) return null;

    const total_co2 = toNum(c[6]);
    const manufacturing_co2 = toNum(c[13]);
    const hdd = toNum(c[15]);
    const ssd = toNum(c[16]);

    return {
      brand: c[4],
      model: c[1],
      total_co2,
      chassis: toNum(c[14]),
      storage_drive: ssd > 0 ? ssd : hdd,
      power_supply_unit: toNum(c[17]),
      battery: toNum(c[18]),
      soc: toNum(c[19]),
      display: toNum(c[20]),
      packaging: toNum(c[21]),
      optical_drive: toNum(c[22]),
      end_of_life: toNum(c[24]),
      transportation: 0,
      device_usage: Math.max(0, total_co2 - manufacturing_co2),
      source: 'csv',
    };
  }).filter(Boolean);
}

function loadMD() {
  if (!fs.existsSync(MD_FILE)) {
    console.warn('1.md not found, skipping MD load');
    return [];
  }
  const lines = fs.readFileSync(MD_FILE, 'utf-8').split(/\r?\n/);
  const results = [];
  let currentBrand = '';
  let inTable = false;
  let headerParsed = false;

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(.+)/);
    if (sectionMatch) {
      const section = sectionMatch[1].trim();
      if (section === 'Chromebooks') {
        currentBrand = '_chromebook';
      } else if (section.toLowerCase().startsWith('lenovo')) {
        currentBrand = 'Lenovo';
      } else {
        currentBrand = section;
      }
      inTable = false;
      headerParsed = false;
      continue;
    }

    if (line.startsWith('|Model|') || line.startsWith('| Model |')) {
      inTable = true;
      headerParsed = false;
      continue;
    }

    if (inTable && line.startsWith('|---')) {
      headerParsed = true;
      continue;
    }

    if (inTable && headerParsed && line.startsWith('|')) {
      const cols = line.split('|').map(c => c.trim()).filter(c => c !== '');
      if (cols.length < 2) continue;

      const model = cols[0].replace(/\*\*/g, '').replace(/\*/g, '').trim();
      const totalStr = cols[1].replace(/\*\*/g, '').replace(/\*/g, '').trim();
      const withoutUseStr = cols.length >= 3 ? cols[2].replace(/\*\*/g, '').replace(/\*/g, '').replace(/&approx;/g, '').trim() : '';

      const total_co2 = toNum(totalStr);
      const manufacturing_co2 = toNum(withoutUseStr);

      if (!model || model === 'Model' || total_co2 === 0) continue;

      let brand = currentBrand;
      if (brand === '_chromebook') {
        const firstWord = model.split(' ')[0];
        brand = ['Acer', 'Google', 'HP', 'Lenovo'].includes(firstWord) ? firstWord : 'Other';
      }

      const device_usage = manufacturing_co2 > 0 ? total_co2 - manufacturing_co2 : total_co2 * 0.25;

      results.push({
        brand,
        model,
        total_co2,
        chassis: 0,
        storage_drive: 0,
        power_supply_unit: 0,
        battery: 0,
        soc: manufacturing_co2 > 0 ? manufacturing_co2 : total_co2 * 0.75,
        display: 0,
        packaging: 0,
        optical_drive: 0,
        end_of_life: 0,
        transportation: 0,
        device_usage: Math.max(0, device_usage),
        source: 'md',
      });
    }

    if (inTable && !line.startsWith('|') && line.trim() !== '' && !line.trim().startsWith('\\') && !line.trim().startsWith('&') && !line.trim().startsWith('*') && !line.trim().startsWith('†')) {
      inTable = false;
      headerParsed = false;
    }
  }

  return results;
}

function init() {
  const csvData = loadCSV();
  const mdData = loadMD();

  products = [...csvData];

  for (const p of mdData) {
    const exists = products.some(
      e => e.brand.toLowerCase() === p.brand.toLowerCase() && e.model.toLowerCase() === p.model.toLowerCase()
    );
    if (!exists) products.push(p);
  }

  console.log(`Products loaded: ${products.length} total (${csvData.length} CSV, ${mdData.length} MD)`);
}

function getUniqueBrands() {
  return [...new Set(products.map(p => p.brand))].sort();
}

function getModelsForBrand(brand) {
  return products
    .filter(p => p.brand.toLowerCase() === brand.toLowerCase())
    .map(p => p.model)
    .sort();
}

function getProductData(brand, model) {
  return products.find(
    p => p.brand.toLowerCase() === brand.toLowerCase() && p.model.toLowerCase() === model.toLowerCase()
  ) || null;
}

function addProduct(product) {
  const idx = products.findIndex(
    p => p.brand.toLowerCase() === product.brand.toLowerCase() && p.model.toLowerCase() === product.model.toLowerCase()
  );
  if (idx >= 0) {
    products[idx] = { ...products[idx], ...product };
  } else {
    products.push(product);
  }
}

function getAllProducts() {
  return products;
}

module.exports = { init, getUniqueBrands, getModelsForBrand, getProductData, addProduct, getAllProducts };
