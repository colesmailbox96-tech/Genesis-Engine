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
        return rng.int(0, 4); // point mutation (substitution)
      }
      return base;
    });

    // Insertion mutation
    if (rng.next() > this.fidelity && newSeq.length < 200) {
      const insertPos = rng.int(0, newSeq.length + 1);
      newSeq.splice(insertPos, 0, rng.int(0, 4));
    }

    // Deletion mutation
    if (rng.next() > this.fidelity && newSeq.length > 2) {
      const delPos = rng.int(0, newSeq.length);
      newSeq.splice(delPos, 1);
    }

    // Duplication mutation (copy a segment)
    if (rng.next() > this.fidelity * 1.5 && newSeq.length < 150) {
      const start = rng.int(0, Math.max(1, newSeq.length - 3));
      const len = rng.int(1, Math.min(5, newSeq.length - start));
      const segment = newSeq.slice(start, start + len);
      const insertAt = rng.int(0, newSeq.length + 1);
      newSeq.splice(insertAt, 0, ...segment);
    }

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
