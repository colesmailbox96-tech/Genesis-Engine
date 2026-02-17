import { DataLogger } from './DataLogger';
import { MetricsCollector } from './MetricsCollector';
import { PhylogeneticTree } from '../evolution/PhylogeneticTree';
import { FoodWeb } from '../ecology/FoodWeb';

export class ExportSystem {
  static downloadJSONL(logger: DataLogger, filename: string = 'genesis_log.jsonl'): void {
    const content = logger.toJSONL();
    ExportSystem.download(content, filename, 'application/jsonl');
  }

  static downloadCSV(metrics: MetricsCollector, filename: string = 'genesis_metrics.csv'): void {
    const content = metrics.toCSV();
    ExportSystem.download(content, filename, 'text/csv');
  }

  static downloadPhylogeny(tree: PhylogeneticTree, filename: string = 'phylogeny.nwk'): void {
    const content = tree.toNewick();
    ExportSystem.download(content, filename, 'text/plain');
  }

  static downloadFoodWeb(foodWeb: FoodWeb, filename: string = 'foodweb.dot'): void {
    const content = foodWeb.toDot();
    ExportSystem.download(content, filename, 'text/plain');
  }

  private static download(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
