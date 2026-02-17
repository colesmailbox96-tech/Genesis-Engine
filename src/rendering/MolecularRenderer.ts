import { Molecule } from '../chemistry/Molecule';
import { ELEMENT_PROPERTIES, Element } from '../chemistry/Element';
import { Camera } from './Camera';
import { withAlpha } from '../utils/Color';

export class MolecularRenderer {
  draw(ctx: CanvasRenderingContext2D, molecules: Molecule[], camera: Camera): void {
    for (const mol of molecules) {
      if (!camera.isVisible(mol.position.x, mol.position.y, 20)) continue;

      const screen = camera.worldToScreen(mol.position.x, mol.position.y);
      const size = Math.max(1, 3 * camera.zoom);

      if (camera.zoom >= 6) {
        // Molecular detail: draw atoms and bonds
        this.drawDetailed(ctx, mol, screen.x, screen.y, camera.zoom);
      } else if (camera.zoom >= 1) {
        // Simple dot
        const mainElement = mol.atoms.length > 0 ? mol.atoms[0].element : Element.C;
        const color = ELEMENT_PROPERTIES[mainElement].color;
        ctx.fillStyle = withAlpha(color, 0.7);
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      // Below zoom 1, molecules are part of chemical field visualization
    }
  }

  private drawDetailed(ctx: CanvasRenderingContext2D, mol: Molecule, sx: number, sy: number, zoom: number): void {
    const atomSpacing = 5 * zoom;

    // Draw bonds
    ctx.strokeStyle = 'rgba(100,150,200,0.5)';
    ctx.lineWidth = Math.max(0.5, zoom * 0.3);
    for (const bond of mol.bonds) {
      const ax = sx + (bond.atomA - mol.atoms.length / 2) * atomSpacing;
      const bx = sx + (bond.atomB - mol.atoms.length / 2) * atomSpacing;
      ctx.beginPath();
      ctx.moveTo(ax, sy);
      ctx.lineTo(bx, sy);
      ctx.stroke();
    }

    // Draw atoms
    for (let i = 0; i < mol.atoms.length; i++) {
      const atom = mol.atoms[i];
      const ax = sx + (i - mol.atoms.length / 2) * atomSpacing;
      const props = ELEMENT_PROPERTIES[atom.element];
      const r = Math.max(2, 3 * zoom);

      ctx.fillStyle = withAlpha(props.color, 0.9);
      ctx.beginPath();
      ctx.arc(ax, sy, r, 0, Math.PI * 2);
      ctx.fill();

      // Element label at high zoom
      if (zoom >= 8) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = `${Math.max(8, zoom * 2)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(props.symbol, ax, sy - r - 2);
      }
    }
  }
}
