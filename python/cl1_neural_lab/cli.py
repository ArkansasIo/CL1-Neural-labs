"""Cross-platform command-line entry point."""
from __future__ import annotations
import argparse, json
from .neural_culture import NeuralCultureSimulator
from .analysis_engine import ElectrophysiologyAnalysisEngine
from .database_store import CL1DatabaseStore

def main(argv=None):
    parser=argparse.ArgumentParser(prog="cl1-neural-lab", description="CL1 Neural Labs Python research simulator")
    parser.add_argument("--steps",type=int,default=10,help="number of simulation frames to compute")
    parser.add_argument("--step-ms",type=int,default=20,help="duration of each simulated frame in milliseconds")
    parser.add_argument("--seed",type=int,default=1,help="random seed for repeatable initialization")
    parser.add_argument("--show-tables",action="store_true",help="list seeded dataset table names")
    args=parser.parse_args(argv)
    if args.steps < 0:
        parser.error('--steps must be non-negative')
    if args.step_ms <= 0:
        parser.error('--step-ms must be positive')
    sim=NeuralCultureSimulator(seed=args.seed)
    for _ in range(max(0,args.steps)): sim.step(args.step_ms)
    analysis=ElectrophysiologyAnalysisEngine(sim).compute_snapshot()
    result={"source":"simulation","seed":args.seed,"steps":args.steps,"timestamp_samples":sim.get_timestamp(),
            "recent_spike_count":len(sim.get_recent_spikes()),"analytics":{
              "average_firing_rate_hz":analysis.average_firing_rate_hz,
              "active_electrode_count":analysis.active_electrode_count,
              "network_criticality_branching_ratio":analysis.network_criticality_branching_ratio,
              "burst_frequency_hz":analysis.burst_frequency_hz}}
    if args.show_tables: result["tables"]=CL1DatabaseStore().get_table_names()
    print(json.dumps(result,indent=2))
if __name__=="__main__": main()