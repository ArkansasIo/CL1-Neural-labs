# Research References and Evidence Register

This bibliography supports the theories and mathematical models used by CL1 Neural Labs. The references are not evidence that this repository's simulator is biologically validated.

## Official CL1 / SDK documentation

1. **Cortical Labs. _Developer Guide: CL API and CL SDK Simulator_.** Official developer documentation. https://docs.corticallabs.com/  
   Use for supported concepts such as recordings, spike events, raw samples, channel sets, stimulation designs, simulator/replay behavior, and limitations. Consult the current official documentation before implementing device-specific code.

2. **Cortical Labs. _CL API Reference_.** https://docs.corticallabs.com/cl  
   Use as the API reference for supported interface behavior. Do not infer undocumented electrical safety limits or hardware wiring from a software example.

3. **Cortical-Labs. _cl-sdk: Cortical Labs CL API Simulator_.** Source repository. https://github.com/Cortical-Labs/cl-sdk  
   Use for SDK simulator installation, tests, replay configuration, and simulator limitations. The simulator is not a biological culture and should not be used as evidence of learning or biological response.

4. **Cortical-Labs. _cl-api-doc_.** https://github.com/Cortical-Labs/cl-api-doc  
   Public examples and notebooks for recordings, real-time visualization, raw data, and stimulation. Check its status and current official guidance before relying on older examples.

## Human brain neuron counts

5. **Azevedo, F. A. C., et al. (2009).** “Equal numbers of neuronal and nonneuronal cells make the human brain an isometrically scaled-up primate brain.” *Journal of Comparative Neurology*, 513(5), 532–541. https://doi.org/10.1002/cne.21974  
   A foundational source for the widely cited estimate of roughly 86 billion neurons in the adult human brain. Treat this as a population-level estimate, not a fixed count for each person.

6. **“Eighty-six billion and counting: do we know the number of neurons in the human brain?” (2025).** *Brain*. https://academic.oup.com/brain/article/148/3/689/7909879  
   A critical discussion of neuron-count estimates and methodological limitations. Useful for communicating uncertainty rather than treating the familiar estimate as exact.

## Mathematical neuron models

7. **Hodgkin, A. L., & Huxley, A. F. (1952).** “A quantitative description of membrane current and its application to conduction and excitation in nerve.” *The Journal of Physiology*, 117(4), 500–544. https://doi.org/10.1113/jphysiol.1952.sp004764  
   Foundational conductance-based membrane model. Use for differential equations, ionic currents, and gating variables.

8. **FitzHugh, R. (1961).** “Impulses and physiological states in theoretical models of nerve membrane.” *Biophysical Journal*, 1(6), 445–466. https://doi.org/10.1016/S0006-3495(61)86902-6  
   Reduced excitable-membrane model suitable for studying qualitative dynamics.

9. **Nagumo, J., Arimoto, S., & Yoshizawa, S. (1962).** “An active pulse transmission line simulating nerve axon.” *Proceedings of the IRE*, 50(10), 2061–2070. https://doi.org/10.1109/JRPROC.1962.288235  
   Circuit realization associated with the FitzHugh–Nagumo formulation.

10. **Izhikevich, E. M. (2003).** “Simple model of spiking neurons.” *IEEE Transactions on Neural Networks*, 14(6), 1569–1572. https://doi.org/10.1109/TNN.2003.820440  
    Efficient two-variable spiking model with reset rules; useful for large-scale computational demonstrations.

11. **Hindmarsh, J. L., & Rose, R. M. (1982).** “A model of the nerve impulse using two first-order differential equations.” *Nature*, 296, 162–164. https://doi.org/10.1038/296162a0  
    Reduced model intended to capture selected impulse dynamics.

## Neural recording and statistical analysis

12. **Nam, Y., & Wheeler, B. C. (2011).** “In vitro microelectrode array technology and neural recordings.” *Critical Reviews in Biomedical Engineering*, 39(1), 45–61. https://doi.org/10.1615/CritRevBiomedEng.v39.i1.40  
    Discusses cultured-neuron MEAs and how the cell-electrode interface affects signal yield, waveform, and signal-to-noise ratio.

13. **“In vivo microelectrode arrays for neuroscience.”** *Nature Reviews Methods Primers* (2025). https://www.nature.com/articles/s43586-025-00399-7  
    A methods overview covering extracellular spikes, recording quality, spike sorting, and analysis. Its in-vivo focus means that not every protocol directly transfers to an in-vitro culture.

14. **“Statistical Issues in the Analysis of Neuronal Data.”** *Journal of Neurophysiology*. https://journals.physiology.org/doi/full/10.1152/jn.00648.2004  
    Discusses point-process models, Poisson baselines, and issues in analyzing neuronal firing. Use model diagnostics because real recordings may violate Poisson assumptions.

## Biological neural networks and closed-loop learning

15. **Kagan, B. J., et al. (2022).** “In vitro neurons learn and exhibit sentience when embodied in a simulated game-world.” *Neuron*, 110(23), 3952–3969.e8. https://doi.org/10.1016/j.neuron.2022.09.001  
    The DishBrain study that reported adaptive behavior in a closed-loop Pong-like environment. Interpret the claims in the context of the authors' experimental design; do not generalize them into a claim that all cultured networks learn all tasks or possess human-like cognition.

## Evidence-use rules

- Prefer primary papers for mathematical definitions and official vendor documentation for device/API behavior.
- Record access date and version for changing online documentation.
- Mark every project-specific equation as **established model**, **proposed model**, or **empirical estimate**.
- Never label generated CSV values as real CL1 recordings unless provenance proves that origin.
- Do not infer individual neurons from MEA channels without a validated spike-sorting or source-separation method.
- Cite a source beside the claim it supports in user-facing documentation and papers.
