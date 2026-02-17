import { Random } from '../utils/Random';

export class InformationPolymer {
  sequence: number[]; // 0-3 for 4 "bases"
  fidelity: number;
  age: number = 0;

  constructor(sequence: number[], fidelity: number = 0.9) {
    this.sequence = sequence;
    this.fidelity = fidelity;
  }

  get length(): number {
    return this.sequence.length;
  }

  copy(rng: Random): InformationPolymer {
    const newSeq = this.sequence.map(base => {
      if (rng.next() > this.fidelity) {
        return rng.int(0, 4); // mutation
      }
      return base;
    });
    return new InformationPolymer(newSeq, this.fidelity);
  }

  similarity(other: InformationPolymer): number {
    const minLen = Math.min(this.length, other.length);
    if (minLen === 0) return 0;
    let matches = 0;
    for (let i = 0; i < minLen; i++) {
      if (this.sequence[i] === other.sequence[i]) matches++;
    }
    return matches / Math.max(this.length, other.length);
  }

  static createRandom(length: number, rng: Random): InformationPolymer {
    const seq = Array.from({ length }, () => rng.int(0, 4));
    return new InformationPolymer(seq, 0.85 + rng.next() * 0.1);
  }
}
