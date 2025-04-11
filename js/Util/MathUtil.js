export class MathUtil {

  // Linear interpolation 
  // of t on a to b
  static lerp(a, b, t) {
    return a + t * (b - a);
  }

  // Maps value x (in range a, b)
  // to a value in range (c, d)
  static map(x, a, b, c, d) {
    return (x-a)/(b-a) * (d-c) + c;
  }

  static getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  

}