import { Vector2 } from '../utils/Vector2';
import { SimplexNoise } from '../utils/SimplexNoise';
import { Element } from '../chemistry/Element';

export type ZoneType = 'deep_ocean' | 'hydrothermal_vent' | 'shallow_pool' | 'tidal_zone' | 'volcanic_shore' | 'ice_region';

export interface EnvironmentZone {
  type: ZoneType;
  temperature: number;
  energyDensity: number;
  flowDirection: Vector2;
  flowSpeed: number;
  mineralConcentrations: Partial<Record<Element, number>>;
  uvIntensity: number;
  pressure: number;
  cyclePhase: number;
  cyclePeriod: number;
  pH: number;
  redoxPotential: number;
  wetness: number;
  catalyticBias: number;
  diffusionRate: number;
  toxinLevel: number;
}

export class EnvironmentMap {
  private zones: Float32Array;
  private gridSize: number;
  private worldSize: number;
  private noise: SimplexNoise;
  private zoneData: EnvironmentZone[][] = [];
  private baseTemperatures: Float32Array;
  private baseUvIntensities: Float32Array;
  phField: Float32Array;
  redoxField: Float32Array;

  constructor(worldSize: number, gridSize: number = 64, seed: number = 42) {
    this.worldSize = worldSize;
    this.gridSize = gridSize;
    this.noise = new SimplexNoise(seed);
    this.zones = new Float32Array(gridSize * gridSize);
    this.baseTemperatures = new Float32Array(gridSize * gridSize);
    this.baseUvIntensities = new Float32Array(gridSize * gridSize);
    this.phField = new Float32Array(gridSize * gridSize).fill(7.0);
    this.redoxField = new Float32Array(gridSize * gridSize);
    this.generateZones();
  }

  private generateZones(): void {
    this.zoneData = [];
    for (let y = 0; y < this.gridSize; y++) {
      this.zoneData[y] = [];
      for (let x = 0; x < this.gridSize; x++) {
        const nx = x / this.gridSize;
        const ny = y / this.gridSize;

        const elevation = this.noise.fbm(nx * 3, ny * 3, 4);
        const moisture = this.noise.fbm(nx * 2 + 100, ny * 2 + 100, 3);
        const heat = this.noise.fbm(nx * 2 + 200, ny * 2 + 200, 3);

        let zoneType: ZoneType;
        let temp: number, energyDensity: number, uv: number, pressure: number;
        let pH: number, redoxPotential: number, catalyticBias: number, diffusionRate: number;

        if (elevation < -0.3) {
          zoneType = 'deep_ocean';
          temp = 0.2; energyDensity = 0.1; uv = 0; pressure = 0.9;
          pH = 7.8; redoxPotential = -0.2; catalyticBias = 0.1; diffusionRate = 0.05;
        } else if (elevation < -0.1 && heat > 0.2) {
          zoneType = 'hydrothermal_vent';
          temp = 0.9; energyDensity = 0.9; uv = 0; pressure = 0.8;
          pH = 3.0; redoxPotential = 0.8; catalyticBias = 0.7; diffusionRate = 0.2;
        } else if (elevation < 0.1 && moisture > 0) {
          zoneType = 'shallow_pool';
          temp = 0.5; energyDensity = 0.5; uv = 0.7; pressure = 0.3;
          pH = 6.5; redoxPotential = 0.3; catalyticBias = 0.3; diffusionRate = 0.15;
        } else if (elevation < 0.2) {
          zoneType = 'tidal_zone';
          temp = 0.4; energyDensity = 0.4; uv = 0.5; pressure = 0.4;
          pH = 7.0; redoxPotential = 0.2; catalyticBias = 0.4; diffusionRate = 0.25;
        } else if (heat > 0.1) {
          zoneType = 'volcanic_shore';
          temp = 0.7; energyDensity = 0.6; uv = 0.3; pressure = 0.3;
          pH = 4.5; redoxPotential = 0.6; catalyticBias = 0.5; diffusionRate = 0.1;
        } else {
          zoneType = 'ice_region';
          temp = 0.1; energyDensity = 0.2; uv = 0.4; pressure = 0.2;
          pH = 7.5; redoxPotential = 0.0; catalyticBias = 0.2; diffusionRate = 0.02;
        }

        const zoneIndex = (['deep_ocean', 'hydrothermal_vent', 'shallow_pool', 'tidal_zone', 'volcanic_shore', 'ice_region'] as ZoneType[]).indexOf(zoneType);
        this.zones[y * this.gridSize + x] = zoneIndex;

        this.zoneData[y][x] = {
          type: zoneType,
          temperature: temp,
          energyDensity,
          flowDirection: new Vector2(
            this.noise.noise2D(nx * 5 + 300, ny * 5) * 0.5,
            this.noise.noise2D(nx * 5, ny * 5 + 300) * 0.5
          ),
          flowSpeed: Math.abs(this.noise.noise2D(nx * 4 + 400, ny * 4 + 400)) * 0.3,
          mineralConcentrations: {
            [Element.S]: zoneType === 'hydrothermal_vent' ? 0.8 : 0.1,
            [Element.P]: zoneType === 'volcanic_shore' ? 0.6 : 0.1,
            [Element.C]: 0.3,
            [Element.N]: zoneType === 'shallow_pool' ? 0.5 : 0.2,
          },
          uvIntensity: uv,
          pressure,
          cyclePhase: 0,
          cyclePeriod: zoneType === 'tidal_zone' ? 500 : 1000,
          pH,
          redoxPotential,
          wetness: 1.0,
          catalyticBias,
          diffusionRate,
          toxinLevel: 0,
        };

        // Store base values for cycle calculations
        const idx = y * this.gridSize + x;
        this.baseTemperatures[idx] = temp;
        this.baseUvIntensities[idx] = uv;
      }
    }
  }

  getZoneAt(x: number, y: number): EnvironmentZone {
    const gx = Math.floor((x / this.worldSize) * this.gridSize) % this.gridSize;
    const gy = Math.floor((y / this.worldSize) * this.gridSize) % this.gridSize;
    const cx = Math.max(0, Math.min(this.gridSize - 1, gx));
    const cy = Math.max(0, Math.min(this.gridSize - 1, gy));
    return this.zoneData[cy][cx];
  }

  getZoneTypeAt(x: number, y: number): ZoneType {
    return this.getZoneAt(x, y).type;
  }

  updateCycles(tick: number): void {
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const zone = this.zoneData[y][x];
        const idx = y * this.gridSize + x;
        zone.cyclePhase = (tick % zone.cyclePeriod) / zone.cyclePeriod;

        // Restore UV from base value before applying cycle modulation
        const baseUv = this.baseUvIntensities[idx];

        // Day/night for UV
        if (zone.type === 'shallow_pool' || zone.type === 'tidal_zone') {
          zone.uvIntensity = baseUv * (0.5 + 0.5 * Math.sin(zone.cyclePhase * Math.PI * 2));
        }

        // Tidal flow changes
        if (zone.type === 'tidal_zone') {
          zone.flowSpeed = 0.1 + 0.3 * Math.abs(Math.sin(zone.cyclePhase * Math.PI * 2));
        }

        // Wet/dry cycles (tidal and shallow zones oscillate)
        if (zone.type === 'tidal_zone' || zone.type === 'shallow_pool') {
          const wetDryPhase = (tick % 5000) / 5000;
          zone.wetness = 0.3 + 0.7 * Math.abs(Math.sin(wetDryPhase * Math.PI));
        }

        // Seasonal temperature variation — compute from base value to avoid drift
        const baseTemp = this.baseTemperatures[idx];
        if (zone.type !== 'hydrothermal_vent') {
          const seasonalPhase = (tick % 20000) / 20000;
          const seasonalFactor = 0.85 + 0.15 * Math.sin(seasonalPhase * Math.PI * 2);
          zone.temperature = baseTemp * seasonalFactor;
        }

        // Toxin decay
        zone.toxinLevel = Math.max(0, zone.toxinLevel * 0.999);
      }
    }
  }

  getGrid(): EnvironmentZone[][] { return this.zoneData; }
  getGridSize(): number { return this.gridSize; }

  buildFlowField(): (gx: number, gy: number) => Vector2 {
    return (gx: number, gy: number) => {
      const zone = this.getZoneAt(gx * (this.worldSize / this.gridSize), gy * (this.worldSize / this.gridSize));
      if (!zone) return Vector2.zero();
      return zone.flowDirection.mul(zone.flowSpeed);
    };
  }

  modifyLocalChemistry(worldX: number, worldY: number, pHDelta: number, redoxDelta: number): void {
    const gx = Math.max(0, Math.min(this.gridSize - 1, Math.floor((worldX / this.worldSize) * this.gridSize)));
    const gy = Math.max(0, Math.min(this.gridSize - 1, Math.floor((worldY / this.worldSize) * this.gridSize)));
    const i = gy * this.gridSize + gx;
    this.phField[i] = Math.max(0, Math.min(14, this.phField[i] + pHDelta));
    this.redoxField[i] = Math.max(-1, Math.min(1, this.redoxField[i] + redoxDelta));
  }

  getLocalPH(worldX: number, worldY: number): number {
    const gx = Math.max(0, Math.min(this.gridSize - 1, Math.floor((worldX / this.worldSize) * this.gridSize)));
    const gy = Math.max(0, Math.min(this.gridSize - 1, Math.floor((worldY / this.worldSize) * this.gridSize)));
    return this.phField[gy * this.gridSize + gx];
  }

  getLocalRedox(worldX: number, worldY: number): number {
    const gx = Math.max(0, Math.min(this.gridSize - 1, Math.floor((worldX / this.worldSize) * this.gridSize)));
    const gy = Math.max(0, Math.min(this.gridSize - 1, Math.floor((worldY / this.worldSize) * this.gridSize)));
    return this.redoxField[gy * this.gridSize + gx];
  }

  decayChemistry(rate: number = 0.001): void {
    for (let i = 0; i < this.phField.length; i++) {
      this.phField[i] += (7.0 - this.phField[i]) * rate;
      this.redoxField[i] += (0.0 - this.redoxField[i]) * rate;
    }
  }
}
