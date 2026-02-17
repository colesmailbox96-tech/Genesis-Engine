import { Random } from '../utils/Random';
import { getActivation, ActivationType } from './Activations';

// Global innovation counter
let innovationCounter = 0;
export function nextInnovation(): number { return ++innovationCounter; }
export function resetInnovation(): void { innovationCounter = 0; }

export interface NodeGene {
  id: number;
  type: 'input' | 'hidden' | 'output';
  activation: ActivationType;
  bias: number;
}

export interface ConnectionGene {
  innovationNumber: number;
  inNode: number;
  outNode: number;
  weight: number;
  enabled: boolean;
}

export interface NEATGenome {
  nodeGenes: NodeGene[];
  connectionGenes: ConnectionGene[];
  fitness: number;
  species: number;
}

// Create a minimal NEAT genome with direct sensor-to-actuator connections
export function createMinimalGenome(inputCount: number, outputCount: number, rng: Random): NEATGenome {
  const nodes: NodeGene[] = [];

  for (let i = 0; i < inputCount; i++) {
    nodes.push({ id: i, type: 'input', activation: 'sigmoid', bias: 0 });
  }

  for (let i = 0; i < outputCount; i++) {
    nodes.push({ id: inputCount + i, type: 'output', activation: 'tanh', bias: 0 });
  }

  const connections: ConnectionGene[] = [];
  const connectionCount = Math.min(inputCount * outputCount, 3 + rng.int(0, 3));
  const used = new Set<string>();

  for (let i = 0; i < connectionCount; i++) {
    let inIdx: number, outIdx: number;
    let attempts = 0;
    do {
      inIdx = rng.int(0, inputCount);
      outIdx = inputCount + rng.int(0, outputCount);
      attempts++;
    } while (used.has(`${inIdx}-${outIdx}`) && attempts < 20);

    if (!used.has(`${inIdx}-${outIdx}`)) {
      used.add(`${inIdx}-${outIdx}`);
      connections.push({
        innovationNumber: nextInnovation(),
        inNode: inIdx,
        outNode: outIdx,
        weight: rng.gaussian(0, 1),
        enabled: true,
      });
    }
  }

  return { nodeGenes: nodes, connectionGenes: connections, fitness: 0, species: 0 };
}

// Forward pass through NEAT network
export function neatForward(genome: NEATGenome, inputs: number[]): number[] {
  const nodeValues = new Map<number, number>();

  for (let i = 0; i < inputs.length; i++) {
    const node = genome.nodeGenes[i];
    if (node && node.type === 'input') {
      nodeValues.set(node.id, inputs[i]);
    }
  }

  const outputNodes = genome.nodeGenes.filter(n => n.type === 'output');
  const hiddenNodes = genome.nodeGenes.filter(n => n.type === 'hidden');
  const processOrder = [...hiddenNodes, ...outputNodes];

  // Two passes to propagate through hidden layers
  for (let pass = 0; pass < 2; pass++) {
    for (const node of processOrder) {
      let sum = node.bias;
      for (const conn of genome.connectionGenes) {
        if (conn.enabled && conn.outNode === node.id) {
          const inVal = nodeValues.get(conn.inNode) ?? 0;
          sum += inVal * conn.weight;
        }
      }
      const activationFn = getActivation(node.activation);
      nodeValues.set(node.id, activationFn(sum));
    }
  }

  return outputNodes.map(n => nodeValues.get(n.id) ?? 0);
}

// Mutate a NEAT genome
export function mutateGenome(genome: NEATGenome, rng: Random, config: {
  weightMutationRate: number;
  weightPerturbation: number;
  addConnectionRate: number;
  addNodeRate: number;
  toggleConnectionRate: number;
}): NEATGenome {
  const result: NEATGenome = {
    nodeGenes: genome.nodeGenes.map(n => ({ ...n })),
    connectionGenes: genome.connectionGenes.map(c => ({ ...c })),
    fitness: 0,
    species: genome.species,
  };

  // Weight mutations
  for (const conn of result.connectionGenes) {
    if (rng.next() < config.weightMutationRate) {
      if (rng.next() < 0.8) {
        conn.weight += rng.gaussian(0, config.weightPerturbation);
      } else {
        conn.weight = rng.gaussian(0, 1);
      }
    }
  }

  // Bias mutations
  for (const node of result.nodeGenes) {
    if (node.type !== 'input' && rng.next() < config.weightMutationRate * 0.5) {
      node.bias += rng.gaussian(0, config.weightPerturbation);
    }
  }

  // Add connection
  if (rng.next() < config.addConnectionRate) {
    const possibleIn = result.nodeGenes.filter(n => n.type !== 'output');
    const possibleOut = result.nodeGenes.filter(n => n.type !== 'input');
    if (possibleIn.length > 0 && possibleOut.length > 0) {
      const inNode = rng.pick(possibleIn);
      const outNode = rng.pick(possibleOut);
      if (inNode.id !== outNode.id) {
        const exists = result.connectionGenes.some(
          c => c.inNode === inNode.id && c.outNode === outNode.id
        );
        if (!exists) {
          result.connectionGenes.push({
            innovationNumber: nextInnovation(),
            inNode: inNode.id,
            outNode: outNode.id,
            weight: rng.gaussian(0, 1),
            enabled: true,
          });
        }
      }
    }
  }

  // Add node by splitting an existing connection
  if (rng.next() < config.addNodeRate && result.connectionGenes.length > 0) {
    const enabledConns = result.connectionGenes.filter(c => c.enabled);
    if (enabledConns.length > 0) {
      const conn = rng.pick(enabledConns);
      conn.enabled = false;

      const newNodeId = Math.max(...result.nodeGenes.map(n => n.id)) + 1;
      const activations: ActivationType[] = ['sigmoid', 'tanh', 'relu', 'gaussian', 'sine'];

      result.nodeGenes.push({
        id: newNodeId,
        type: 'hidden',
        activation: rng.pick(activations),
        bias: 0,
      });

      result.connectionGenes.push({
        innovationNumber: nextInnovation(),
        inNode: conn.inNode,
        outNode: newNodeId,
        weight: 1.0,
        enabled: true,
      });

      result.connectionGenes.push({
        innovationNumber: nextInnovation(),
        inNode: newNodeId,
        outNode: conn.outNode,
        weight: conn.weight,
        enabled: true,
      });
    }
  }

  // Toggle connection
  if (rng.next() < config.toggleConnectionRate && result.connectionGenes.length > 0) {
    const conn = rng.pick(result.connectionGenes);
    conn.enabled = !conn.enabled;
  }

  return result;
}

// Crossover two NEAT genomes
export function crossoverGenomes(parent1: NEATGenome, parent2: NEATGenome, rng: Random): NEATGenome {
  const [fit, less] = parent1.fitness >= parent2.fitness ? [parent1, parent2] : [parent2, parent1];

  const childConnections: ConnectionGene[] = [];
  const lessMap = new Map(less.connectionGenes.map(c => [c.innovationNumber, c]));

  for (const conn of fit.connectionGenes) {
    const matchingConn = lessMap.get(conn.innovationNumber);
    if (matchingConn) {
      childConnections.push({ ...(rng.bool() ? conn : matchingConn) });
    } else {
      childConnections.push({ ...conn });
    }
  }

  // Collect all node IDs referenced by child connections
  const nodeIds = new Set<number>();
  for (const c of childConnections) {
    nodeIds.add(c.inNode);
    nodeIds.add(c.outNode);
  }

  const childNodes: NodeGene[] = [];
  const fitNodeMap = new Map(fit.nodeGenes.map(n => [n.id, n]));
  const lessNodeMap = new Map(less.nodeGenes.map(n => [n.id, n]));

  for (const id of nodeIds) {
    const node = fitNodeMap.get(id) ?? lessNodeMap.get(id);
    if (node) childNodes.push({ ...node });
  }

  // Preserve all input/output nodes from fitter parent
  for (const node of fit.nodeGenes) {
    if (node.type !== 'hidden' && !childNodes.some(n => n.id === node.id)) {
      childNodes.push({ ...node });
    }
  }

  childNodes.sort((a, b) => a.id - b.id);

  return { nodeGenes: childNodes, connectionGenes: childConnections, fitness: 0, species: 0 };
}

// Measure genetic distance between two NEAT genomes
export function geneticDistance(g1: NEATGenome, g2: NEATGenome, c1: number, c2: number, c3: number): number {
  const innov1 = new Set(g1.connectionGenes.map(c => c.innovationNumber));

  let matching = 0;
  let weightDiffSum = 0;
  let disjoint = 0;
  let excess = 0;

  const maxInnov1 = g1.connectionGenes.length > 0 ? Math.max(...g1.connectionGenes.map(c => c.innovationNumber)) : 0;
  const maxInnov2 = g2.connectionGenes.length > 0 ? Math.max(...g2.connectionGenes.map(c => c.innovationNumber)) : 0;
  const maxInnovShared = Math.min(maxInnov1, maxInnov2);

  const g2Map = new Map(g2.connectionGenes.map(c => [c.innovationNumber, c]));

  for (const c of g1.connectionGenes) {
    const match = g2Map.get(c.innovationNumber);
    if (match) {
      matching++;
      weightDiffSum += Math.abs(c.weight - match.weight);
    } else if (c.innovationNumber <= maxInnovShared) {
      disjoint++;
    } else {
      excess++;
    }
  }

  for (const c of g2.connectionGenes) {
    if (!innov1.has(c.innovationNumber)) {
      if (c.innovationNumber <= maxInnovShared) {
        disjoint++;
      } else {
        excess++;
      }
    }
  }

  const N = Math.max(g1.connectionGenes.length, g2.connectionGenes.length, 1);
  const avgWeightDiff = matching > 0 ? weightDiffSum / matching : 0;

  return (c1 * excess) / N + (c2 * disjoint) / N + c3 * avgWeightDiff;
}
