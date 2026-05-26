// Approximate electricity grid emission factors (kg CO2e per kWh) — IEA estimates
const defaultFactors = {
  US: 0.386, GB: 0.233, DE: 0.366, CN: 0.555, IN: 0.708, AU: 0.656,
  FR: 0.085, CA: 0.160, JP: 0.473, KR: 0.459, BR: 0.078, MX: 0.461,
  ZA: 0.928, NG: 0.430, EG: 0.431, IT: 0.233, ES: 0.207, NL: 0.402,
  SE: 0.013, NO: 0.019, DK: 0.176, FI: 0.126, PL: 0.726, CZ: 0.491,
  RU: 0.332, TR: 0.485, TH: 0.511, SG: 0.408, MY: 0.585, ID: 0.646,
  PH: 0.610, VN: 0.491, PK: 0.374, BD: 0.583, AR: 0.351, CL: 0.314,
  CO: 0.206, PE: 0.238, NZ: 0.090, CH: 0.024, AT: 0.117, BE: 0.167,
  PT: 0.253, GR: 0.583, HU: 0.246, RO: 0.293, UA: 0.330, KZ: 0.635,
  SA: 0.698, AE: 0.577, QA: 0.571, IL: 0.468, NG: 0.430,
};

let adminOverrides = {};

function getFactor(countryCode) {
  if (adminOverrides[countryCode] !== undefined) return adminOverrides[countryCode];
  return defaultFactors[countryCode] !== undefined ? defaultFactors[countryCode] : 0.5;
}

function getAllFactors() {
  const result = [];
  const allCodes = new Set([...Object.keys(defaultFactors), ...Object.keys(adminOverrides)]);
  for (const country of allCodes) {
    result.push({
      country,
      component: 'device_usage',
      emissions_factor: getFactor(country),
    });
  }
  return result.sort((a, b) => a.country.localeCompare(b.country));
}

function getUniqueCountries() {
  return [...new Set([...Object.keys(defaultFactors), ...Object.keys(adminOverrides)])].sort();
}

function upsertFactor(country, component, emissions_factor) {
  adminOverrides[country] = parseFloat(emissions_factor);
}

module.exports = { getFactor, getAllFactors, getUniqueCountries, upsertFactor };
