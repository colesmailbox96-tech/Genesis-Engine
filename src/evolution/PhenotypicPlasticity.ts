import { Organism } from '../organisms/Organism';
import { EnvironmentZone } from '../ecology/EnvironmentZone';
import { clamp } from '../utils/Math';

/**
 * Phenotypic Plasticity: real-time trait adjustments based on local environment.
 * 
 * Unlike genetic evolution (which changes across generations), plasticity allows
 * individual organisms to tune their expressed phenotype within genetically-set
 * bounds. This obeys Rule 3 (Genome is Truth) — plasticity range is itself
 * genome-encoded via regulatory gene levels.
 */

export interface PlasticityModifiers {
  metabolicEfficiencyMod: number;   // multiplicative modifier
  speedMod: number;                 // multiplicative modifier
  shellMod: number;                 // additive modifier
  sensorSensitivityMod: number;     // multiplicative modifier
}

const NEUTRAL_MODIFIERS: PlasticityModifiers = {
  metabolicEfficiencyMod: 1.0,
  speedMod: 1.0,
  shellMod: 0,
  sensorSensitivityMod: 1.0,
};

/**
 * Compute plasticity modifiers for an organism based on its current zone.
 * The magnitude of plasticity is bounded by the average regulatory level
 * of the organism's genes (higher regulatory = more plastic).
 */
export function computePlasticityModifiers(
  org: Organism,
  zone: EnvironmentZone
): PlasticityModifiers {
  // Plasticity range is bounded by average gene regulatory level
  const genes = org.genome.genes.filter(g => g.enabled);
  if (genes.length === 0) return { ...NEUTRAL_MODIFIERS };

  const avgRegulatory = genes.reduce((s, g) => s + g.regulatory, 0) / genes.length;
  const plasticityRange = avgRegulatory * 0.3; // max ±30% at full regulatory

  const mods: PlasticityModifiers = { ...NEUTRAL_MODIFIERS };

  // Temperature adaptation: extreme temps reduce efficiency unless adapted
  const optimalTemp = getOptimalTemperature(org.phenotype.metabolismType);
  const tempDelta = Math.abs(zone.temperature - optimalTemp);
  // Organisms can partially compensate for non-optimal temperature
  const tempCompensation = clamp(1 - tempDelta * 0.5, 1 - plasticityRange, 1);
  mods.metabolicEfficiencyMod = tempCompensation;

  // UV adaptation: high UV zones favor slower, tougher organisms
  if (zone.uvIntensity > 0.5) {
    mods.speedMod = 1 - plasticityRange * 0.3 * zone.uvIntensity;
    mods.shellMod = plasticityRange * 0.1 * zone.uvIntensity;
  }

  // Pressure adaptation: high pressure zones reduce speed, enhance sensing
  if (zone.pressure > 0.6) {
    mods.speedMod *= clamp(1 - (zone.pressure - 0.6) * plasticityRange, 0.7, 1);
    mods.sensorSensitivityMod = 1 + (zone.pressure - 0.6) * plasticityRange;
  }

  // Toxin response: boost shell in toxic zones
  if (zone.toxinLevel > 0.3) {
    mods.shellMod += plasticityRange * 0.15 * zone.toxinLevel;
  }

  return mods;
}

/**
 * Apply plasticity modifiers to an organism's effective traits for this tick.
 * Modifies the organism's energy metabolism and movement without altering genome.
 */
export function applyPlasticity(
  org: Organism,
  zone: EnvironmentZone
): void {
  const mods = computePlasticityModifiers(org, zone);

  // Adjust metabolic efficiency for this tick
  // The metabolize() call in the main loop uses phenotype.metabolicEfficiency directly,
  // so we apply the modifier to the energy gain via a small bonus/penalty
  const efficiencyDelta = (mods.metabolicEfficiencyMod - 1) * org.phenotype.metabolicEfficiency;
  org.energy += efficiencyDelta * 0.01; // small per-tick effect

  // Speed is handled through velocity damping
  if (mods.speedMod < 1) {
    org.velocity.mulMut(mods.speedMod);
  }

  // Shell bonus provides temporary damage resistance via integrity boost
  if (mods.shellMod > 0) {
    org.integrity = clamp(org.integrity + mods.shellMod * 0.001, 0, 1);
  }
}

function getOptimalTemperature(metabolismType: string): number {
  switch (metabolismType) {
    case 'chemosynthesis': return 0.7;   // thermophilic
    case 'photosynthesis': return 0.45;  // moderate
    case 'heterotrophy': return 0.5;     // moderate
    case 'fermentation': return 0.3;     // mesophilic
    default: return 0.5;
  }
}
