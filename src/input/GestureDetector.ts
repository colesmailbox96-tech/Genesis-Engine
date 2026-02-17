export class GestureDetector {
  static isDoubleTap(lastTapTime: number, currentTime: number, threshold: number = 300): boolean {
    return currentTime - lastTapTime < threshold;
  }

  static getSwipeDirection(dx: number, dy: number): 'left' | 'right' | 'up' | 'down' | null {
    const threshold = 30;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      return dx > 0 ? 'right' : 'left';
    }
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > threshold) {
      return dy > 0 ? 'down' : 'up';
    }
    return null;
  }
}
