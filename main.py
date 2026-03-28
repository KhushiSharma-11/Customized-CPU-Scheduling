
import argparse, json, sys
from scheduler.models import Process
from scheduler.sim import simulate
from scheduler.visualize import ascii_gantt, pretty_metrics

def load_workload(path: str):
    with open(path, "r") as f:
        data = json.load(f)
    procs = []
    for item in data["processes"]:
        procs.append(Process(
            pid=str(item["pid"]),
            arrival=int(item["arrival"]),
            burst=int(item["burst"]),
            priority=int(item.get("priority", 0))
        ))
    return procs

def main():
    parser = argparse.ArgumentParser(description="CPU Scheduler Simulator with custom DABP")
    parser.add_argument("--algo", type=str, required=True,
                        choices=["FCFS","SJF","RR","PRIORITY","DABP"],
                        help="Scheduling algorithm")
    parser.add_argument("--workload", type=str, required=True, help="Path to workload JSON")
    parser.add_argument("--rr_q", type=int, default=4, help="RR quantum")
    parser.add_argument("--alpha", type=float, default=0.5, help="DABP: exponential smoothing factor for burst prediction")
    parser.add_argument("--gamma", type=float, default=0.2, help="DABP: linear aging weight per time unit")
    parser.add_argument("--sjf_weight", type=float, default=1.0, help="DABP: weight for 1/tau in score")
    parser.add_argument("--tau0", type=float, default=-1.0, help="DABP: initial tau (<=0 to use mean burst)")
    args = parser.parse_args()

    procs = load_workload(args.workload)
    params = {
        "rr_q": args.rr_q,
        "alpha": args.alpha,
        "gamma": args.gamma,
        "sjf_weight": args.sjf_weight,
    }
    if args.tau0 > 0:
        params["tau0"] = args.tau0

    result = simulate(procs, args.algo, params)
    print(ascii_gantt(result.timeline))
    print()
    # Per-process table
    print("Per-Process Metrics")
    print("-"*40)
    print("PID  Arr  Burst  Prio  Comp  Turn  Wait  Resp")
    for pid, row in sorted(result.per_process.items(), key=lambda x: x[0]):
        print(f"{pid:>3}  {row['arrival']:>3}  {row['burst']:>5}  {row['priority']:>4}  {row['completion']:>4}  {row['turnaround']:>4}  {row['waiting']:>4}  {row['response']:>4}")
    print()
    print(pretty_metrics(result.metrics))

if __name__ == "__main__":
    main()
