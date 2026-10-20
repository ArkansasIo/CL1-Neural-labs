# Neural Node MLP-GRU 4.0 plugin for CL1 Neural Labs

Integrated from [ArkansasIo/neural-node](https://github.com/ArkansasIo/neural-node/tree/main/plugins/neural-node-mlp-gru-4.0).

Version: `4.0.0-alpha.1`

## Exports

- `DenseLayer`: fully connected layer with linear, ReLU, tanh, or sigmoid activation.
- `MLP`: configurable feed-forward network.
- `GRU`: recurrent sequence encoder with resettable hidden state.
- `GRUMLPModel`: combines temporal sequence features and static features before a dense prediction head.
- Vector helpers and input validation.

## Usage

```ts
import { GRUMLPModel } from './plugins/neural-node-mlp-gru';

const model = new GRUMLPModel({
  sequence: { inputSize: 4, hiddenSize: 8 },
  staticInputSize: 3,
  headHiddenSizes: [8],
  outputSize: 2,
});
const output = model.forward([[0.1, 0.2, 0.3, 0.4]], [0.5, 0.6, 0.7]);
```

The model currently provides inference primitives; it does not implement gradient-based training, checkpoint loading, or calibrated scientific predictions. The default random initialization is for prototyping. For repeatable tests and experiments, inject a deterministic random function.

## Safety

The plugin is disabled by default, consumes caller-provided numeric arrays, and is designed for synthetic/saved research data. It does not open hardware connections, run arbitrary repository plugins, or issue physical stimulation.
