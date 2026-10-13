# Research Notes

## Scope

CL1 Neural Labs is intended as a research and prototyping environment around biological neural computation.

Relevant research domains include:

- computational neuroscience
- biological computing
- neural signal processing
- electrophysiology
- microelectrode arrays
- neuroplasticity
- closed-loop experiments
- reservoir computing
- neuromorphic computing
- machine learning
- brain-computer interfaces
- organoid intelligence

## Interpretation rules

The application contains models inspired by biological neural systems. A simulation result is not a biological measurement.

Claims about learning, adaptation, information processing, criticality, entropy, or connectivity should specify whether the underlying data are:

1. synthetic simulation data,
2. replayed experimental data,
3. imported biological data, or
4. live device measurements.

## Research library

The application includes a research database in `src/data/researchDatabase.ts` and a research-library UI.

When adding literature, preserve:

- title
- authors
- publication venue
- year
- DOI or stable identifier
- abstract
- key findings
- relevance to CL1
- limitations

## Recommended evidence hierarchy

Prefer:

1. peer-reviewed primary research
2. official Cortical Labs documentation
3. manufacturer technical documentation
4. reputable review articles
5. secondary commentary

Separate established findings from hypotheses and project-specific simulation assumptions.

## Next research milestones

- Formalize the common neural-data model.
- Add deterministic random seeds to the simulator.
- Add automated signal-processing tests.
- Add dataset replay.
- Compare simulator metrics against known reference datasets.
- Implement a read-only official CL API adapter.
- Add provenance metadata to every recording.
- Add controlled benchmarking against digital and neuromorphic baselines.
