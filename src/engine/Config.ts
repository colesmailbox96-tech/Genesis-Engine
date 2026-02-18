export interface SimConfig {
  worldSize: number;
  tickRate: number;
  elementCount: number;
  reactionDistance: number;
  baseReactionProbability: number;
  catalystBoost: number;
  diffusionRate: number;
  moleculeDecayRate: number;
  maxMoleculeComplexity: number;
  ventCount: number;
  ventPower: number;
  uvIntensityMax: number;
  lightningProbability: number;
  lightningEnergy: number;
  energyDissipationRate: number;
  membraneFormationThreshold: number;
  membraneStabilityBase: number;
  protocellSplitThreshold: number;
  basalMetabolicRate: number;
  movementEnergyCost: number;
  divisionEnergyCost: number;
  maxOrganismAge: number;
  sensorRange: number;
  neatWeightMutationRate: number;
  neatWeightPerturbation: number;
  neatAddConnectionRate: number;
  neatAddNodeRate: number;
  neatToggleConnectionRate: number;
  neatSpeciationThreshold: number;
  neatC1: number;
  neatC2: number;
  neatC3: number;
  neatPopulationShare: boolean;
  mutationRateBase: number;
  crossoverRate: number;
  speciationDistanceThreshold: number;
  maxPopulation: number;
  carryingCapacityPerZone: number;
  dayNightPeriod: number;
  seasonalPeriod: number;
  volcanicEruptionRate: number;
  asteroidImpactRate: number;
  o2ToxicityThreshold: number;
  wetDryCyclePeriod: number;
  redoxGradientStrength: number;
  electricalStormProbability: number;
  polymerHydrolysisRate: number;
  toxinAccumulationRate: number;
  uvBurstProbability: number;
  heatSpikeProbability: number;
  autocatalysisBoost: number;
  horizontalTransferRate: number;
  backgroundColor: string;
  bloomThreshold: number;
  bloomIntensity: number;
  scanLineOpacity: number;
  vignetteStrength: number;
  maxEntities: number;
  spatialHashCellSize: number;
  cullingMargin: number;
  lodThresholds: number[];
}

export const DEFAULT_CONFIG: SimConfig = {
  worldSize: 512,
  tickRate: 60,
  elementCount: 6,
  reactionDistance: 2.0,
  baseReactionProbability: 0.01,
  catalystBoost: 5.0,
  diffusionRate: 0.1,
  moleculeDecayRate: 0.0001,
  maxMoleculeComplexity: 50,
  ventCount: 6,
  ventPower: 10.0,
  uvIntensityMax: 5.0,
  lightningProbability: 0.002,
  lightningEnergy: 100.0,
  energyDissipationRate: 0.001,
  membraneFormationThreshold: 20,
  membraneStabilityBase: 0.8,
  protocellSplitThreshold: 50,
  basalMetabolicRate: 0.01,
  movementEnergyCost: 0.005,
  divisionEnergyCost: 0.4,
  maxOrganismAge: 50000,
  sensorRange: 15.0,
  neatWeightMutationRate: 0.8,
  neatWeightPerturbation: 0.1,
  neatAddConnectionRate: 0.05,
  neatAddNodeRate: 0.03,
  neatToggleConnectionRate: 0.01,
  neatSpeciationThreshold: 3.0,
  neatC1: 1.0,
  neatC2: 1.0,
  neatC3: 0.4,
  neatPopulationShare: true,
  mutationRateBase: 0.01,
  crossoverRate: 0.3,
  speciationDistanceThreshold: 5.0,
  maxPopulation: 3000,
  carryingCapacityPerZone: 500,
  dayNightPeriod: 1000,
  seasonalPeriod: 20000,
  volcanicEruptionRate: 0.000001,
  asteroidImpactRate: 0.0000001,
  o2ToxicityThreshold: 0.3,
  wetDryCyclePeriod: 5000,
  redoxGradientStrength: 0.5,
  electricalStormProbability: 0.0005,
  polymerHydrolysisRate: 0.0002,
  toxinAccumulationRate: 0.0001,
  uvBurstProbability: 0.00005,
  heatSpikeProbability: 0.00005,
  autocatalysisBoost: 2.0,
  horizontalTransferRate: 0.001,
  backgroundColor: '#0a0a12',
  bloomThreshold: 0.6,
  bloomIntensity: 0.4,
  scanLineOpacity: 0.03,
  vignetteStrength: 0.3,
  maxEntities: 5000,
  spatialHashCellSize: 16,
  cullingMargin: 2,
  lodThresholds: [0.5, 1.0, 3.0, 6.0],
};

export const PRESET_PRIMORDIAL_SOUP: Partial<SimConfig> = {
  ventCount: 3,
  ventPower: 8,
  uvIntensityMax: 3,
  diffusionRate: 0.15,
  wetDryCyclePeriod: 2000,
  lightningProbability: 0.003,
};

export const PRESET_HYDROTHERMAL_VENT: Partial<SimConfig> = {
  ventCount: 10,
  ventPower: 20,
  uvIntensityMax: 0,
  diffusionRate: 0.2,
  redoxGradientStrength: 0.9,
  basalMetabolicRate: 0.015,
};

export const PRESET_ICE_WORLD: Partial<SimConfig> = {
  ventCount: 1,
  ventPower: 3,
  uvIntensityMax: 1,
  diffusionRate: 0.02,
  wetDryCyclePeriod: 50000,
  moleculeDecayRate: 0.00001,
};

export const PRESET_TIDAL_FLATS: Partial<SimConfig> = {
  ventCount: 2,
  ventPower: 5,
  uvIntensityMax: 6,
  diffusionRate: 0.12,
  wetDryCyclePeriod: 1000,
  autocatalysisBoost: 3.0,
};

export const PRESET_STORM_PLANET: Partial<SimConfig> = {
  ventCount: 4,
  ventPower: 12,
  uvIntensityMax: 8,
  lightningProbability: 0.02,
  lightningEnergy: 200,
  electricalStormProbability: 0.005,
  asteroidImpactRate: 0.000001,
};

export type PresetName = 'primordial_soup' | 'hydrothermal_vent' | 'ice_world' | 'tidal_flats' | 'storm_planet';

export function applyPreset(base: SimConfig, preset: PresetName): SimConfig {
  const presets: Record<PresetName, Partial<SimConfig>> = {
    primordial_soup: PRESET_PRIMORDIAL_SOUP,
    hydrothermal_vent: PRESET_HYDROTHERMAL_VENT,
    ice_world: PRESET_ICE_WORLD,
    tidal_flats: PRESET_TIDAL_FLATS,
    storm_planet: PRESET_STORM_PLANET,
  };
  return { ...base, ...presets[preset] };
}
