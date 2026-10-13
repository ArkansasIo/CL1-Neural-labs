from cl1_neural_lab.neurocognitive import VirtualNeuronBrain

def test_brain_sections_and_reasoning():
    brain = VirtualNeuronBrain("node-001", "high_school")
    trace = brain.reason("2*x+3=11")
    assert trace.answer["solutions"][0] == 4
    assert "semantic_memory" in trace.sections
    assert brain.introspection()["history_count"] == 1
    assert "virtual reasoning node" in brain.explain_last()
