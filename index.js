import { isotopes } from './isotopes.js';

export function parseFormula(formula) {
  if (typeof formula !== 'string' || !formula.length) throw new Error('Indica una fórmula química.');
  let position = 0;
  const count = () => {
    const digits = /^\d+/.exec(formula.slice(position));
    if (!digits) return 1;
    position += digits[0].length;
    const value = Number(digits[0]);
    if (!Number.isSafeInteger(value) || value < 1 || value > 1000) throw new Error('Cada cantidad debe estar entre 1 y 1000.');
    return value;
  };
  const group = (nested = false) => {
    const atoms = {};
    while (position < formula.length && formula[position] !== ')') {
      let part;
      if (formula[position] === '(') {
        position++;
        part = group(true);
        if (formula[position] !== ')') throw new Error('Paréntesis sin cerrar.');
        position++;
      } else {
        const symbol = /^[A-Z][a-z]?/.exec(formula.slice(position));
        if (!symbol) throw new Error(`Símbolo inválido en la posición ${position + 1}.`);
        position += symbol[0].length;
        if (!Object.hasOwn(isotopes, symbol[0])) throw new Error(`Elemento no soportado: ${symbol[0]}.`);
        part = { [symbol[0]]: 1 };
      }
      const multiplier = count();
      for (const [element, number] of Object.entries(part)) atoms[element] = (atoms[element] || 0) + number * multiplier;
    }
    if (!Object.keys(atoms).length) throw new Error('Grupo vacío.');
    if (!nested && position !== formula.length) throw new Error('Paréntesis de cierre inesperado.');
    return atoms;
  };
  const atoms = group();
  if (Object.values(atoms).reduce((a,b) => a+b,0) > 1000) throw new Error('El máximo es 1000 átomos por fórmula.');
  return atoms;
}

// Agrupa por incremento del número másico; conserva el centroide de masa exacta.
// No resuelve por separado la estructura fina de cada grupo isotópico.
export function calculateDistribution(formula, { charge = 0, minAbundance = 0.01 } = {}) {
  if (!Number.isSafeInteger(charge) || Math.abs(charge) > 100) throw new Error('La carga debe ser un entero entre -100 y 100.');
  if (!Number.isFinite(minAbundance) || minAbundance < 0 || minAbundance > 100) throw new Error('El umbral debe estar entre 0 y 100 (% absoluto).');
  const atoms = parseFormula(formula);
  let distribution = new Map([[0, { probability: 1, mass: 0 }]]);
  let referenceMass = 0;
  for (const [element, count] of Object.entries(atoms)) {
    const table = isotopes[element];
    referenceMass += table[0][1] * count;
    for (let atom = 0; atom < count; atom++) {
      const next = new Map();
      for (const [shift, peak] of distribution) {
        for (const [number, mass, abundance] of table) {
          const key = shift + number - table[0][0];
          const probability = peak.probability * abundance;
          if (!probability) continue;
          const value = next.get(key) || { probability: 0, mass: 0 };
          value.mass += probability * (peak.mass + mass);
          value.probability += probability;
          next.set(key, value);
        }
      }
      for (const value of next.values()) value.mass /= value.probability;
      distribution = next;
    }
  }
  const maximum = Math.max(...Array.from(distribution.values(), p => p.probability));
  const peaks = Array.from(distribution, ([shift, peak]) => ({
    shift,
    mass: peak.mass,
    mz: charge === 0 ? null : (peak.mass - charge * 0.000548579909065) / Math.abs(charge),
    abundance: peak.probability * 100,
    relativeIntensity: peak.probability / maximum * 100
  })).filter(p => p.abundance >= minAbundance).sort((a,b) => a.shift-b.shift);
  return { formula, atoms, charge, referenceMass, minAbundance, retainedAbundance: peaks.reduce((sum,p) => sum+p.abundance,0), peaks };
}
