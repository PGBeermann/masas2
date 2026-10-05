import { calculateDistribution } from './index.js';

const args = process.argv.slice(2);
if (!args.length || args.includes('--help')) {
  console.log('Uso: npm start -- C6H12O6 [--charge 1] [--min-abundance 0.01] [--json]\nCarga: composición del ion tal como está escrita; no añade protones.');
  process.exit(args.length ? 0 : 1);
}
try {
  const formula = args.shift();
  const options = {};
  let json = false;
  while (args.length) {
    const flag = args.shift();
    if (flag === '--json') json = true;
    else if (flag === '--charge' || flag === '--min-abundance') {
      const value = args.shift();
      if (value === undefined || value.trim() === '') throw new Error(`Falta el valor de ${flag}.`);
      options[flag === '--charge' ? 'charge' : 'minAbundance'] = Number(value);
    } else throw new Error(`Opción desconocida: ${flag}.`);
  }
  const result = calculateDistribution(formula, options);
  if (json) console.log(JSON.stringify(result,null,2));
  else {
    console.log(`Fórmula: ${formula} | Carga: ${result.charge} | Masa de referencia: ${result.referenceMass.toFixed(6)} u`);
    console.table(result.peaks.map(p => ({ Pico: `M+${p.shift}`, 'Masa (u)': p.mass.toFixed(6), ...(result.charge ? { 'm/z': p.mz.toFixed(6) } : {}), 'Abundancia (%)': p.abundance.toFixed(6), 'Intensidad relativa (%)': p.relativeIntensity.toFixed(4) })));
    console.log(`Abundancia mostrada: ${result.retainedAbundance.toFixed(6)} %`);
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
