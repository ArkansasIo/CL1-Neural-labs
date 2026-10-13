from cl1_neural_lab.education import TeachingNode,derivative_polynomial,integrate_polynomial,solve_linear,evaluate

def test_math_basics():
    assert evaluate("2+3*4")==14
    assert solve_linear("2*x+3=11")["solutions"][0]==4
    assert derivative_polynomial("3*x^2+2*x+1")=="6*x+2"
    assert integrate_polynomial("2*x+1")=="1*x**2+1*x+C"

def test_node_learning_and_answer():
    n=TeachingNode("node-001","elementary"); n.learn("E-ARITH",1)
    assert n.state.mastery["E-ARITH"]==1
    assert n.answer("2*x+3=11")["answer"]["solutions"][0]==4
