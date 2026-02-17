export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  add(v: Vector2): Vector2 { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v: Vector2): Vector2 { return new Vector2(this.x - v.x, this.y - v.y); }
  mul(s: number): Vector2 { return new Vector2(this.x * s, this.y * s); }
  div(s: number): Vector2 { return s === 0 ? new Vector2() : new Vector2(this.x / s, this.y / s); }
  dot(v: Vector2): number { return this.x * v.x + this.y * v.y; }
  length(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
  lengthSq(): number { return this.x * this.x + this.y * this.y; }
  normalize(): Vector2 {
    const len = this.length();
    return len === 0 ? new Vector2() : this.div(len);
  }
  distanceTo(v: Vector2): number { return this.sub(v).length(); }
  distanceSqTo(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }
  angle(): number { return Math.atan2(this.y, this.x); }
  rotate(angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }
  clone(): Vector2 { return new Vector2(this.x, this.y); }
  set(x: number, y: number): void { this.x = x; this.y = y; }
  lerp(v: Vector2, t: number): Vector2 {
    return new Vector2(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t);
  }

  // In-place mutation methods to reduce GC pressure in hot loops
  addMut(v: Vector2): this { this.x += v.x; this.y += v.y; return this; }
  subMut(v: Vector2): this { this.x -= v.x; this.y -= v.y; return this; }
  mulMut(s: number): this { this.x *= s; this.y *= s; return this; }
  setFrom(v: Vector2): this { this.x = v.x; this.y = v.y; return this; }
  wrapMut(worldSize: number): this {
    this.x = ((this.x % worldSize) + worldSize) % worldSize;
    this.y = ((this.y % worldSize) + worldSize) % worldSize;
    return this;
  }

  static fromAngle(angle: number, length: number = 1): Vector2 {
    return new Vector2(Math.cos(angle) * length, Math.sin(angle) * length);
  }
  static zero(): Vector2 { return new Vector2(0, 0); }
}
