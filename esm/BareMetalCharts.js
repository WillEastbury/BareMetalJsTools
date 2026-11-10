import { loadIife } from './_loader.js';
const BareMetalCharts = await loadIife('BareMetal.Charts.js', 'Charts');
export default BareMetalCharts;
export const { bar, line, sparkline, donut, gauge } = BareMetalCharts;
