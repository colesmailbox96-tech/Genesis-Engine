import { Camera } from './Camera';
import { EnvironmentRenderer } from './EnvironmentRenderer';
import { ChemicalFieldRenderer } from './ChemicalFieldRenderer';
import { MolecularRenderer } from './MolecularRenderer';
import { ProtocellRenderer } from './ProtocellRenderer';
import { OrganismRenderer } from './OrganismRenderer';
import { FluidRenderer } from './FluidRenderer';
import { TrailRenderer } from './TrailRenderer';
import { ParticleSystem } from './ParticleSystem';
import { LightingSystem } from './LightingSystem';
import { PostProcessing } from './PostProcessing';
import { Molecule } from '../chemistry/Molecule';
import { Protocell } from '../proto/Protocell';
import { Organism } from '../organisms/Organism';
import { EnergySource } from '../chemistry/EnergySource';
import { EnvironmentMap } from '../ecology/EnvironmentZone';
import { ChemicalField } from '../chemistry/ChemicalField';
import { SimConfig } from '../engine/Config';

export class Renderer {
  camera: Camera;
  private environmentRenderer: EnvironmentRenderer;
  private chemFieldRenderer: ChemicalFieldRenderer;
  private molecularRenderer: MolecularRenderer;
  private protocellRenderer: ProtocellRenderer;
  private organismRenderer: OrganismRenderer;
  private fluidRenderer: FluidRenderer;
  private trailRenderer: TrailRenderer;
  particleSystem: ParticleSystem;
  private lightingSystem: LightingSystem;
  private postProcessing: PostProcessing;

  constructor() {
    this.camera = new Camera();
    this.environmentRenderer = new EnvironmentRenderer();
    this.chemFieldRenderer = new ChemicalFieldRenderer();
    this.molecularRenderer = new MolecularRenderer();
    this.protocellRenderer = new ProtocellRenderer();
    this.organismRenderer = new OrganismRenderer();
    this.fluidRenderer = new FluidRenderer();
    this.trailRenderer = new TrailRenderer();
    this.particleSystem = new ParticleSystem();
    this.lightingSystem = new LightingSystem();
    this.postProcessing = new PostProcessing();
  }

  render(
    ctx: CanvasRenderingContext2D,
    config: SimConfig,
    tick: number,
    envMap: EnvironmentMap,
    chemField: ChemicalField,
    molecules: Molecule[],
    protocells: Protocell[],
    organisms: Organism[],
    energySources: EnergySource[],
  ): void {
    const { width, height } = ctx.canvas;
    this.camera.resize(width, height);
    this.camera.update();

    // Clear
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Environment zones
    this.environmentRenderer.draw(ctx, envMap, this.camera);

    // Chemical field
    this.chemFieldRenderer.draw(ctx, chemField, this.camera, config.worldSize);

    // Fluid flow
    this.fluidRenderer.draw(ctx, envMap, this.camera, config.worldSize, tick);

    // Energy source glow
    for (const source of energySources) {
      if (!this.camera.isVisible(source.position.x, source.position.y, 100)) continue;
      const screen = this.camera.worldToScreen(source.position.x, source.position.y);
      const screenRadius = source.radius * this.camera.zoom;
      this.lightingSystem.drawEnergySourceGlow(ctx, source, screen.x, screen.y, screenRadius, tick);
    }

    // Molecules (only at high zoom)
    if (this.camera.zoom >= 1) {
      this.molecularRenderer.draw(ctx, molecules, this.camera);
    }

    // Protocells
    this.protocellRenderer.draw(ctx, protocells, this.camera);

    // Organism trails
    this.trailRenderer.update(organisms);
    this.trailRenderer.draw(ctx, this.camera);

    // Organisms
    this.organismRenderer.draw(ctx, organisms, this.camera, tick);

    // Particles
    this.particleSystem.update();
    this.particleSystem.draw(
      ctx,
      (x, y) => {
        const s = this.camera.worldToScreen(x, y);
        return { x: s.x, y: s.y };
      },
      this.camera.zoom
    );

    // Post-processing
    this.postProcessing.vignette(ctx, width, height, config.vignetteStrength);
    this.postProcessing.scanLines(ctx, width, height, config.scanLineOpacity);
  }
}
