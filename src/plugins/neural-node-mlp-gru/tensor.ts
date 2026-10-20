/**
 * Adapted from ArkansasIo/neural-node/plugins/neural-node-mlp-gru-4.0.
 * CPU-first inference primitives for simulated/research data only.
 */
export type Vector = number[];

export function assertVector(value: Vector, name: string): void {
  if (!Array.isArray(value) || value.length === 0) throw new TypeError(`${name} must be a non-empty vector`);
  if (value.some((item) => !Number.isFinite(item))) throw new TypeError(`${name} must contain only finite values`);
}

export function zeros(size: number): Vector {
  if (!Number.isInteger(size) || size <= 0) throw new RangeError('size must be a positive integer');
  return new Array(size).fill(0);
}

export function concat(...vectors: Vector[]): Vector {
  vectors.forEach((vector, index) => assertVector(vector, `vectors[${index}]`));
  return vectors.flat();
}

export function dot(a: Vector, b: Vector): number {
  if (a.length !== b.length) throw new RangeError('vector dimensions must match');
  return a.reduce((sum, value, index) => sum + value * b[index]!, 0);
}

export function sigmoid(value: number): number {
  if (!Number.isFinite(value)) throw new TypeError('sigmoid input must be finite');
  if (value >= 0) {
    const z = Math.exp(-value);
    return 1 / (1 + z);
  }
  const z = Math.exp(value);
  return z / (1 + z);
}
