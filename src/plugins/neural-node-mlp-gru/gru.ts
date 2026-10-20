import { assertVector, sigmoid, zeros, type Vector } from './tensor';

export interface GRUConfig {
  inputSize: number;
  hiddenSize: number;
}

export class GRU {
  readonly inputSize: number;
  readonly hiddenSize: number;
  private state: Vector;
  private wz: number[][];
  private wr: number[][];
  private wh: number[][];
  private bz: Vector;
  private br: Vector;
  private bh: Vector;

  constructor(config: GRUConfig, random: () => number = Math.random) {
    if (!Number.isInteger(config.inputSize) || config.inputSize <= 0 ||
        !Number.isInteger(config.hiddenSize) || config.hiddenSize <= 0) {
      throw new RangeError('GRU dimensions must be positive integers');
    }
    this.inputSize = config.inputSize;
    this.hiddenSize = config.hiddenSize;
    this.state = zeros(config.hiddenSize);
    const joinedSize = config.inputSize + config.hiddenSize;
    const init = () => Array.from({ length: this.hiddenSize }, () =>
      Array.from({ length: joinedSize }, () => (random() * 2 - 1) * Math.sqrt(1 / joinedSize)),
    );
    this.wz = init();
    this.wr = init();
    this.wh = init();
    this.bz = zeros(this.hiddenSize);
    this.br = zeros(this.hiddenSize);
    this.bh = zeros(this.hiddenSize);
  }

  reset(): void {
    this.state.fill(0);
  }

  step(input: Vector): Vector {
    assertVector(input, 'GRU input');
    if (input.length !== this.inputSize) throw new RangeError('GRU input dimension mismatch');
    const joined = [...input, ...this.state];
    const z = this.wz.map((row, i) => sigmoid(this.dot(row, joined) + this.bz[i]!));
    const r = this.wr.map((row, i) => sigmoid(this.dot(row, joined) + this.br[i]!));
    const candidateInput = [...input, ...this.state.map((value, i) => value * r[i]!)];
    const candidate = this.wh.map((row, i) => Math.tanh(this.dot(row, candidateInput) + this.bh[i]!));
    this.state = this.state.map((previous, i) => (1 - z[i]!) * previous + z[i]! * candidate[i]!);
    return [...this.state];
  }

  forward(sequence: Vector[]): Vector {
    if (!Array.isArray(sequence) || sequence.length === 0) throw new TypeError('GRU sequence must not be empty');
    this.reset();
    for (const frame of sequence) this.step(frame);
    return [...this.state];
  }

  private dot(a: Vector, b: Vector): number {
    return a.reduce((sum, value, index) => sum + value * b[index]!, 0);
  }
}
