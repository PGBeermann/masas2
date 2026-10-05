# masas2

Calculadora de distribución isotópica natural para fragmentos químicos en Node.js 20 o superior, sin dependencias externas.

```bash
npm start -- C6H12O6
npm start -- 'Mg(OH)2'
npm start -- C6H13O6 --charge 1
npm start -- C2H5Cl --min-abundance 0.001 --json
npm test
```

Acepta símbolos químicos, cantidades enteras y paréntesis anidados, hasta 1000 átomos. Elementos disponibles: H, C, N, O, F, Na, Mg, Si, P, S, Cl, K, Br e I. Rechaza elementos no soportados; no acepta notación de isótopos enriquecidos, hidratos con punto ni cargas dentro de la fórmula.

Cada pico muestra su masa media exacta en unidades de masa atómica (u), abundancia absoluta (%) e intensidad relativa al pico más intenso (100%). Agrupa las combinaciones isotópicas por incremento del número másico respecto a los isótopos más ligeros (`M`, `M+1`, etc.); no separa su estructura fina. La masa de referencia utiliza el isótopo más ligero tabulado de cada elemento.

El umbral predeterminado es 0.01% de abundancia absoluta. Se aplica después del cálculo y no renormaliza los resultados; también se informa la abundancia total mostrada. Las abundancias naturales son representativas y pueden variar en muestras reales. Datos y fuente en `isotopes.js`.

Con `--charge`, la fórmula debe contener todos los átomos del ion: para glucosa protonada escribe `C6H13O6 --charge 1`. La carga no añade ni elimina átomos. El programa calcula `m/z = (masa − carga × masa del electrón) / |carga|`; las masas sin carga corresponden a átomos neutros.

También se puede usar como módulo:

```js
import { calculateDistribution } from './index.js';
const result = calculateDistribution('C2H5Cl', { charge: 1, minAbundance: 0.01 });
console.log(result.peaks);
```
