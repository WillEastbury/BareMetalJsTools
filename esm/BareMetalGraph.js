import { loadIife } from './_loader.js';
const BareMetalGraph = await loadIife('BareMetal.Graph.js', 'Graph');
export default BareMetalGraph;
export const { create } = BareMetalGraph;
