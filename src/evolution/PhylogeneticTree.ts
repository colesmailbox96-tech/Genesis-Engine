export interface PhyloNode {
  id: string;
  parentId: string | null;
  species: number;
  birthTick: number;
  deathTick: number | null;
  generation: number;
  metabolismType: string;
  children: string[];
}

export class PhylogeneticTree {
  nodes: Map<string, PhyloNode> = new Map();

  addNode(id: string, parentId: string | null, species: number, birthTick: number, generation: number, metabolismType: string): void {
    this.nodes.set(id, {
      id, parentId, species, birthTick, deathTick: null, generation, metabolismType, children: [],
    });
    if (parentId) {
      const parent = this.nodes.get(parentId);
      if (parent) parent.children.push(id);
    }
  }

  markDeath(id: string, tick: number): void {
    const node = this.nodes.get(id);
    if (node) node.deathTick = tick;
  }

  getRoots(): PhyloNode[] {
    return Array.from(this.nodes.values()).filter(n => !n.parentId);
  }

  getLineage(id: string): PhyloNode[] {
    const lineage: PhyloNode[] = [];
    let current = this.nodes.get(id);
    while (current) {
      lineage.unshift(current);
      current = current.parentId ? this.nodes.get(current.parentId) : undefined;
    }
    return lineage;
  }

  // Export in Newick format
  toNewick(): string {
    const roots = this.getRoots();
    if (roots.length === 0) return '();';
    return '(' + roots.map(r => this.nodeToNewick(r)).join(',') + ');';
  }

  private nodeToNewick(node: PhyloNode): string {
    if (node.children.length === 0) {
      return `${node.species}_${node.id}:${node.deathTick ? node.deathTick - node.birthTick : 0}`;
    }
    const childNodes = node.children.map(cid => this.nodes.get(cid)).filter(Boolean) as PhyloNode[];
    return `(${childNodes.map(c => this.nodeToNewick(c)).join(',')})${node.species}_${node.id}:${node.deathTick ? node.deathTick - node.birthTick : 0}`;
  }

  prune(maxNodes: number): void {
    if (this.nodes.size <= maxNodes) return;
    // Keep only the most recent nodes
    const sorted = Array.from(this.nodes.values()).sort((a, b) => b.birthTick - a.birthTick);
    const keep = new Set(sorted.slice(0, maxNodes).map(n => n.id));
    for (const id of this.nodes.keys()) {
      if (!keep.has(id)) this.nodes.delete(id);
    }
  }
}
