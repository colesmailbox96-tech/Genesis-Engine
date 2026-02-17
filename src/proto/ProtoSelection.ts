import { Protocell } from './Protocell';

export interface SelectionMetrics {
  protocellId: string;
  survivalTime: number;
  replicationCount: number;
  energyEfficiency: number;
  complexity: number;
}

export class ProtoSelection {
  metrics: Map<string, SelectionMetrics> = new Map();

  track(protocell: Protocell): void {
    const existing = this.metrics.get(protocell.id);
    if (existing) {
      existing.survivalTime = protocell.age;
      existing.energyEfficiency = protocell.metabolismRate;
      existing.complexity = protocell.complexityScore;
    } else {
      this.metrics.set(protocell.id, {
        protocellId: protocell.id,
        survivalTime: protocell.age,
        replicationCount: 0,
        energyEfficiency: protocell.metabolismRate,
        complexity: protocell.complexityScore,
      });
    }
  }

  recordDivision(parentId: string): void {
    const m = this.metrics.get(parentId);
    if (m) m.replicationCount++;
  }

  getMostFit(count: number = 10): SelectionMetrics[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => {
        const fitA =
          a.survivalTime * 0.3 + a.replicationCount * 10 + a.energyEfficiency * 5;
        const fitB =
          b.survivalTime * 0.3 + b.replicationCount * 10 + b.energyEfficiency * 5;
        return fitB - fitA;
      })
      .slice(0, count);
  }

  prune(activeIds: Set<string>): void {
    for (const id of this.metrics.keys()) {
      if (!activeIds.has(id)) {
        this.metrics.delete(id);
      }
    }
  }
}
