import { loadIife } from './_loader.js';
const BareMetalCharts = loadIife('BareMetalCharts.js', 'BareMetalCharts');
export default BareMetalCharts;
export const { bar, line, sparkline, donut, gauge } = BareMetalCharts;
