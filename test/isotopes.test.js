import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFormula, calculateDistribution } from '../index.js';
import { spawnSync } from 'node:child_process';

const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual-expected) < tolerance, `${actual} != ${expected}`);
test('fórmulas y paréntesis anidados', () => {
  assert.deepEqual(parseFormula('C6H12O6'), {C:6,H:12,O:6});
  assert.deepEqual(parseFormula('Mg(OH)2'), {Mg:1,O:2,H:2});
  assert.deepEqual(parseFormula('C((H)2)3'), {C:1,H:6});
});
test('rechaza fórmulas inválidas o elementos no soportados', () => {
  for (const formula of ['', 'C0', 'C1.5', 'X2', 'CH)', '(CH', '()', 'C1001', '(C1000)2', 'C6H12O6+']) assert.throws(() => parseFormula(formula));
});
test('cloro: probabilidades binomiales y masas exactas', () => {
  const result = calculateDistribution('Cl2', {minAbundance:0});
  assert.deepEqual(result.peaks.map(p => p.shift), [0,2,4]);
  close(result.peaks[0].abundance, 100 * 0.7576 ** 2);
  close(result.peaks[1].abundance, 100 * 2 * 0.7576 * 0.2424);
  close(result.peaks[2].mass, 2 * 36.965902602);
  close(result.retainedAbundance, 100);
});
test('glucosa: masa de referencia y conservación de probabilidad', () => {
  const result = calculateDistribution('C6H12O6', {minAbundance:0});
  close(result.referenceMass,180.06338810418);
  close(result.retainedAbundance,100);
  close(result.peaks[0].relativeIntensity,100);
});
test('carga positiva y negativa: corrección de electrones', () => {
  for (const charge of [1,2,-1]) {
    const result = calculateDistribution('C', {charge});
    close(result.peaks[0].mz,(12-charge*0.000548579909065)/Math.abs(charge));
  }
  assert.equal(calculateDistribution('C').peaks[0].mz,null);
});
test('umbral no renormaliza las abundancias y valida opciones', () => {
  const result = calculateDistribution('C', {minAbundance:2});
  assert.equal(result.peaks.length,1);
  close(result.retainedAbundance,98.93);
  for (const options of [{charge:0.5},{charge:NaN},{minAbundance:-1},{minAbundance:101}]) assert.throws(() => calculateDistribution('C',options));
});
test('interfaz CLI: JSON y errores', () => {
  const result = spawnSync(process.execPath,['cli.js','Br2','--json'],{encoding:'utf8'});
  assert.equal(result.status,0);
  assert.equal(JSON.parse(result.stdout).peaks.length,3);
  const invalid = spawnSync(process.execPath,['cli.js','C0'],{encoding:'utf8'});
  assert.equal(invalid.status,1);
  assert.match(invalid.stderr,/Error:/);
});
