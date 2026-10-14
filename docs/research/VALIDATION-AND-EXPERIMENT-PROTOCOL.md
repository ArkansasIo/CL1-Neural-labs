# Validation and Experiment Protocol

## 1. Purpose

Provide reproducible procedures for evaluating software algorithms and, separately, analyzing authorized recordings. This protocol does not authorize physical CL1 stimulation. Default execution is sandbox/simulator or offline replay; physical access remains isolated and read-only.

## 2. Source and provenance record

Every run must persist:

- experiment ID and UTC start/end times;
- repository commit and software version;
- source mode: synthetic, replay, imported biological, or physical CL1 read-only;
- recording ID and file hash when applicable;
- random seed and simulator configuration;
- channel map and invalid-channel mask;
- sampling rate and time units;
- preprocessing and analysis versions;
- declared primary and secondary outcomes;
- exclusions, warnings, and failure state.

If any field required for interpretation is absent, flag the result as incomplete rather than silently filling it with guessed values.

## 3. Candidate hypotheses

These are testable hypotheses, not established findings:

**H1 — Simulator determinism.** Given the same seed, configuration, and inputs, the deterministic simulation mode produces the same output sequence.  
Outcome: exact event equality or a documented numerical tolerance.

**H2 — Rate-estimator correctness.** For a known synthetic spike train, estimated firing rate equals spike count divided by observation duration.  
Outcome: unit tests with hand-calculated fixtures, including empty and boundary cases.

**H3 — Burst detector calibration.** On synthetic data with known injected burst intervals, sensitivity and false-positive rate change predictably with threshold settings.  
Outcome: precision, recall, F1, and threshold-sensitivity plots; do not tune and report on the same test fixture only.

**H4 — Connectivity estimator controls.** A connectivity estimator should return stronger apparent association for intentionally coupled synthetic signals than for independently generated controls under a declared model.  
Outcome: effect size and uncertainty across repeated seeds. This validates the algorithm against a synthetic ground truth only.

**H5 — Numerical convergence.** Halving the integration time step causes the chosen numerical error metric to decrease for a well-posed model and appropriate integrator.  
Outcome: convergence table across time steps and documented tolerances.

**H6 — Provenance preservation.** Import, analysis, database storage, and export preserve source-mode and recording identity.  
Outcome: end-to-end round-trip tests and explicit rejection of missing provenance where required.

## 4. Minimum control conditions

For simulated experiments:
- seeded random baseline;
- no-input baseline;
- fixed-policy or null model;
- known synthetic positive-control dataset;
- malformed/truncated input fixtures.

For biological recordings, where authorized and available:
- document biological preparation and acquisition configuration;
- include baseline and appropriate control conditions defined by the study protocol;
- report culture/batch as the biological unit where applicable;
- avoid treating individual time bins or spikes as independent biological replicates;
- predefine exclusions and artifact-handling rules.

## 5. Analysis plan

1. Validate schema, units, timestamps, channel identifiers, and provenance.
2. Freeze preprocessing and parameter choices before the confirmatory evaluation.
3. Calculate primary outcome metrics and descriptive statistics.
4. Report effect sizes and uncertainty intervals.
5. Check distributional assumptions and model fit.
6. Correct for multiple comparisons where appropriate.
7. Run sensitivity analyses for bin width, thresholds, and excluded channels.
8. Save the exact analysis configuration with the results.
9. Export both machine-readable results and a human-readable report.

## 6. Acceptance gates for code

- deterministic fixtures pass;
- edge cases and invalid input tests pass;
- no NaN/Infinity escapes a validated API boundary;
- units and interval conventions are tested;
- results carry source provenance;
- simulator results are visibly labelled synthetic;
- no physical device operation occurs in the sandbox;
- unavailable hardware never triggers silent simulator fallback;
- physical mode remains read-only unless a separate, explicitly authorized and independently validated procedure is approved.

## 7. Interpretation limits

A synthetic model passing its own tests shows internal consistency, not biological validity. Agreement with a single recording does not prove generalization. A statistical association between channels does not prove a direct synaptic connection. A task score improving across trials is not by itself proof of learning: compare against controls, account for nonstationarity, and replicate at the appropriate experimental unit.

## 8. Reporting template

```text
Experiment:
Hypothesis:
Primary outcome:
Source mode:
Dataset/recording hash:
Software commit:
Configuration hash:
Random seed:
Preprocessing:
Analysis method/version:
Sample size / biological replicate count:
Controls:
Estimate and units:
Uncertainty interval:
Sensitivity checks:
Limitations:
Result: supported / not supported / inconclusive
```
