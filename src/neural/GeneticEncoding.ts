import { NEATGenome } from './NEAT';

export function encodeGenomeToGenes(neatGenome: NEATGenome): number[] {
  const genes: number[] = [];
  // Encode nodes: [type(0-2), activation(0-4), bias]
  for (const node of neatGenome.nodeGenes) {
    const typeVal = node.type === 'input' ? 0 : node.type === 'hidden' ? 1 : 2;
    const actMap: Record<string, number> = { sigmoid: 0, tanh: 1, relu: 2, gaussian: 3, sine: 4 };
    genes.push(typeVal, actMap[node.activation] ?? 0, node.bias);
  }
  // Encode connections: [inNode, outNode, weight, enabled(0/1)]
  for (const conn of neatGenome.connectionGenes) {
    genes.push(conn.inNode, conn.outNode, conn.weight, conn.enabled ? 1 : 0);
  }
  return genes;
}

export function computeNeuralCost(genome: NEATGenome): number {
  const nodeCount = genome.nodeGenes.length;
  let enabledConnCount = 0;
  for (const c of genome.connectionGenes) {
    if (c.enabled) enabledConnCount++;
  }
  return (nodeCount * 0.001 + enabledConnCount * 0.0005);
}
