# Education Teaching Architecture

The lab now includes a curriculum and symbolic teaching layer spanning kindergarten, elementary, middle school, high school, college, and university mathematics.

## Per-node teaching state
Each virtual teaching node can have a curriculum level, lesson mastery table, attempts, correct answers, and learned lesson IDs. This is a software abstraction and does not imply human-like cognition in an individual neuron.

## Curriculum
- Kindergarten: counting, comparison, shapes.
- Elementary: arithmetic, fractions, measurement, perimeter/area.
- Middle school: variables, order of operations, linear equations, ratios.
- High school: quadratics, systems, polynomials, functions, exponents, trigonometry.
- College: vectors, matrices, linear maps, calculus foundations.
- University: multivariable calculus, ODE, analysis, numerical methods.

## Current symbolic engine
- Restricted arithmetic/function evaluation.
- Linear equations of the form ax+b=c in x.
- Basic polynomial derivatives.
- Basic polynomial antiderivatives.
- No arbitrary Python execution and no claim of general symbolic intelligence.

Example results:
- 2+3*4 -> 14
- 2*x+3=11 -> x=4
- d/dx 3*x^2+2*x+1 -> 6*x+2
- integral 2*x+1 -> x^2+x+C

## Teaching pipeline
question -> lesson retrieval -> constrained solve/explanation -> score -> mastery update -> provenance record -> next lesson.

## Future mathematical expansion
Polynomial factoring, quadratic formula, systems of equations, limits, derivative rules, definite integrals, numerical integration, vectors/matrices, ODE/PDE, optimization, and adaptive lesson selection.

## Relationship to neural experiments
Educational tasks can produce structured targets for simulation experiments, but the educational engine and neural signal layer remain separate. Biological recordings must retain source provenance and must never be silently reclassified as simulated learning.
