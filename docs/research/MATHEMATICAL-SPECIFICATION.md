# Mathematical and Algorithm Specification

This document translates research equations into implementable functions for CL1 Neural Labs. It is a specification for simulation and analysis; it does not certify a model as biologically accurate.

## 1. Core symbols

| Symbol | Meaning | Unit / domain |
|---|---|---|
| (N) | Number of model nodes | positive integer |
| (M) | Number of recording/interface channels | nonnegative integer |
| (t) | Time | seconds internally for rates; preserve source timestamps |
| (\Delta t) | Integration/bin step | seconds, (>0) |
| (V_i) | Model membrane voltage | mV only for a voltage-based model |
| (x_i) | Normalized activity state | dimensionless |
| (w_{ij}) | Directed model edge weight | declared model-specific unit |
| (K_i(T)) | Spikes observed in window (T) | count |
| (r_i) | Firing rate | spikes/s (Hz) |
| (s_i(t)) | Input feature or stimulus | declared scale |
| (\epsilon_i(t)) | Noise term | same units as the value it perturbs |

Do not conflate (N), the number of simulated nodes, with (M), the number of MEA channels, or with the biological neuron count.

## 2. Required analysis functions

### 2.1 Firing rate

\[
r_i=\frac{K_i}{T}
\]

Contract:

```text
firing_rate(spike_times, start, end):
    require end > start
    count events where start <= time < end
    return count / (end - start)
```

Validate monotonic timestamps and define interval edge semantics once. Return an error for a zero or negative duration; never silently return infinity or NaN.

### 2.2 Binned spike counts

For bin width (\Delta t):

\[
X_{i,k}=\sum_j\mathbf{1}[k\Delta t\leq t_{i,j}<(k+1)\Delta t].
\]

Contract: output integer counts and the exact bin edges. Do not use floating-point equality to decide whether a timestamp belongs to a bin when integer timestamp units are available.

### 2.3 Population activity

\[
P_k=\sum_{i=1}^{M}\mathbf{1}[X_{i,k}>0],\qquad
A_k=\frac{P_k}{M}.
\]

If (M=0), return an explicit empty-data result, not (A_k=0). Exclude invalid/unavailable channels according to a recorded mask.

### 2.4 Cross-correlation

For zero-mean binned series (x_k,y_k), one estimate at lag (\ell) is:

\[
C_{xy}(\ell)=\frac{1}{K-|\ell|}\sum_k x_k y_{k+\ell}.
\]

Document normalization, missing-bin handling, maximum lag, and whether the result is normalized. Correlation is an association, not causal proof.

### 2.5 Logistic activation

\[
\sigma(z)=\frac{1}{1+e^{-z}},\qquad
\sigma'(z)=\sigma(z)(1-\sigma(z)).
\]

Use a numerically stable implementation for large positive or negative (z).

### 2.6 Discrete state update

For the optional rate model:

\[
u_i^k=b_i+\sum_j w_{ij}x_j^{k-d_{ij}}+\alpha_i s_i^k+\epsilon_i^k
\]
\[
x_i^{k+1}=(1-\gamma_i)x_i^k+\gamma_i\sigma(u_i^k).
\]

Requirements:
- validate (0<\gamma_i\leq1);
- require nonnegative integer delays (d_{ij});
- initialize delay buffers explicitly;
- clamp or reject non-finite state values;
- record all model parameters and random seeds.

## 3. Calculus for continuous models

A voltage-based model may use:

\[
C_m\frac{dV}{dt}=I_{ext}-I_{ion}
\]

where (C_m) is membrane capacitance and currents must use compatible units. Hodgkin–Huxley expands ionic current into conductance and gating-state terms; see the primary reference in [Research References](./RESEARCH-REFERENCES.md).

The integral of an estimated firing-rate curve over ([a,b]) gives the expected/estimated number of events represented by that rate:

\[
\widehat K\approx\int_a^b \hat r(t)\,dt.
\]

With discrete samples, a trapezoidal approximation is:

\[
\widehat K\approx\sum_{k=0}^{n-1}\frac{r_k+r_{k+1}}{2}(t_{k+1}-t_k).
\]

This is a numerical summary of a rate estimate, not a replacement for counting the original spike events.

## 4. Numerical integration

Forward Euler for (dy/dt=f(t,y)):

\[
y_{k+1}=y_k+\Delta t\,f(t_k,y_k).
\]

It is simple but can be inaccurate or unstable for stiff dynamics or large steps. For a model with fast action-potential dynamics, select the integrator and time step based on convergence tests. Compare outputs at (\Delta t), (\Delta t/2), and (\Delta t/4); report the change in selected metrics.

## 5. Algebra and graph operations

For adjacency/weight matrix (W\in\mathbb{R}^{N\times N}) and state vector (x\in\mathbb{R}^N), the network input is:

\[
u=b+Wx.
\]

Complexity of dense matrix-vector multiplication is (O(N^2)); sparse computation is (O(|E|)). For the current 64-channel representation, a dense (64\times64) matrix has 4,096 entries, but that does not imply 4,096 biological synapses.

Degree:
\[
d_i^{out}=\sum_j\mathbf{1}[w_{ji}\ne0],\qquad
d_i^{in}=\sum_j\mathbf{1}[w_{ij}\ne0].
\]

Weighted strength is the sum of declared edge weights. If weights can be negative, report positive and negative strengths separately.

## 6. Statistical summaries

Mean:
\[
\bar x=\frac{1}{n}\sum_i x_i.
\]

Sample variance:
\[
s^2=\frac{1}{n-1}\sum_i(x_i-\bar x)^2,\quad n>1.
\]

For a mean difference, report effect size and uncertainty, not only a p-value. Choose the unit of replication correctly: repeated bins from one culture are not independent biological replicates.

For multiple exploratory comparisons, report the number of tests and apply an appropriate multiple-comparison procedure. Preregister primary outcomes where feasible.

## 7. Implemented pure-Python helpers

The package module [`math_models.py`](../../python/cl1_neural_lab/math_models.py) currently implements `firing_rate`, `bin_spikes`, `population_activity`, `logistic`, `euler_step`, and `shannon_entropy` using the Python standard library. These are general-purpose analysis/math helpers; they do not control hardware. Regression tests are in [`test_math_models.py`](../../python/tests/test_math_models.py).

## 8. Functional interfaces (proposed)

The analysis layer should expose deterministic, unit-tested functions with explicit data-source metadata:

```text
validate_recording(recording) -> ValidationReport
bin_spikes(spikes, bin_width, interval) -> BinnedSpikeCounts
firing_rate(spikes, interval) -> RateEstimate
population_activity(binned, valid_channel_mask) -> PopulationSeries
detect_bursts(population_series, thresholds) -> BurstEvents
correlation_matrix(binned, method, lag_window) -> ConnectivityEstimate
estimate_entropy(outcomes, log_base=2) -> EntropyEstimate
compare_conditions(control, treatment, design) -> StatisticalReport
```

Each result should include value, units, method/version, parameters, source provenance, sample size, uncertainty when available, and warnings. Proposed interfaces do not imply these functions already exist in the codebase.

## 9. Failure behavior

Reject or explicitly flag:
- non-finite values;
- invalid or reversed time windows;
- duplicate or non-monotonic event identifiers where uniqueness is required;
- unknown channel IDs;
- incompatible units;
- empty input;
- insufficient observations for a statistic;
- missing source provenance;
- unapproved physical-device access.

Never convert missing values to zero without an explicit documented rule.
