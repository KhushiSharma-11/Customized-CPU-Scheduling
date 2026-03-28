
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from .models import Process
import math

@dataclass
class SimResult:
    timeline: List[Dict]   # list of segments {"pid": str, "start": int, "end": int}
    metrics: Dict          # computed metrics
    per_process: Dict      # per-process metrics


def simulate(processes: List[Process], algorithm: str, params: Dict) -> SimResult:
    """
    Discrete-time simulator (tick = 1 unit). CPU-only, single burst per process.
    Supported algorithms: FCFS, SJF (non-preemptive), RR, PRIORITY (preemptive), DABP (custom).
    params: dict of algorithm-specific knobs (see README)
    """
    procs = sorted(processes, key=lambda p: (p.arrival, p.pid))
    n = len(procs)
    if n == 0:
        return SimResult([], {}, {})

    # State
    remaining = {p.pid: p.burst for p in procs}
    completed = set()
    first_start = {p.pid: None for p in procs}
    completion = {p.pid: None for p in procs}
    last_ready_time = {p.pid: None for p in procs}  # for DABP aging
    base_priority = {p.pid: p.priority for p in procs}
    # For RR
    rr_q = int(params.get("rr_q", 4))
    rr_quantum_left = 0
    rr_queue: List[str] = []

    # For SJF (non-preemptive): pick shortest burst among ready when CPU idle
    # For PRIORITY (preemptive): each tick choose highest priority

    # For DABP: burst prediction + dynamic aging
    alpha = float(params.get("alpha", 0.5))
    gamma = float(params.get("gamma", 0.2))  # aging weight per time unit
    sjf_weight = float(params.get("sjf_weight", 1.0))
    # initialize tau (predicted burst) to mean burst
    mean_burst = sum(p.burst for p in procs) / n
    tau = {p.pid: float(params.get("tau0", mean_burst)) for p in procs}

    time = 0
    ready: List[Process] = []
    running: Optional[str] = None
    timeline: List[Dict] = []
    context_switches = 0
    preemptions = 0
    last_pid_for_segment: Optional[str] = None

    def add_segment(pid: Optional[str], start: int, end: int):
        nonlocal timeline, last_pid_for_segment
        if start == end:
            return
        if pid is None:
            # idle segment can be represented as "IDLE"
            pid = "IDLE"
        if timeline and timeline[-1]["pid"] == pid and timeline[-1]["end"] == start:
            timeline[-1]["end"] = end
        else:
            timeline.append({"pid": pid, "start": start, "end": end})

    # Helper: push arrivals at current time
    def push_arrivals(t: int):
        nonlocal ready, rr_queue
        for p in procs:
            if p.arrival == t:
                ready.append(p)
                last_ready_time[p.pid] = t
                if algorithm.upper() == "RR":
                    rr_queue.append(p.pid)

    # Helper: pick next based on algorithm
    def pick_next(t: int, running_pid: Optional[str]) -> Optional[str]:
        nonlocal rr_quantum_left, preemptions
        alg = algorithm.upper()
        # Filter unfinished ready pids
        ready_pids = [p.pid for p in ready if remaining[p.pid] > 0]
        if not ready_pids:
            return None

        if alg == "FCFS":
            # arrival order -> among ready, pick earliest arrival (tie by pid)
            ordered = sorted([p for p in ready if remaining[p.pid] > 0], key=lambda x: (x.arrival, x.pid))
            return ordered[0].pid

        if alg == "SJF":
            # Non-preemptive: if running exists, keep it until finish
            if running_pid and remaining[running_pid] > 0:
                return running_pid
            # pick ready with smallest burst (original burst, not remaining for SJF classic)
            ordered = sorted([p for p in ready if remaining[p.pid] > 0], key=lambda x: (x.burst, x.arrival, x.pid))
            return ordered[0].pid

        if alg == "RR":
            # Round Robin with fixed quantum
            if running_pid and rr_quantum_left > 0 and remaining[running_pid] > 0:
                return running_pid
            # otherwise pull next from queue that still has remaining time
            while rr_queue and remaining[rr_queue[0]] <= 0:
                rr_queue.pop(0)
            if not rr_queue:
                # rebuild from ready order
                rr_queue.extend([p.pid for p in sorted(ready, key=lambda x: (x.arrival, x.pid)) if remaining[p.pid] > 0])
                if not rr_queue:
                    return None
            pid = rr_queue.pop(0)
            rr_queue.append(pid)  # rotate
            return pid

        if alg == "PRIORITY":
            # Preemptive priority: pick highest (larger value = higher priority), tie by arrival, then pid
            ordered = sorted([p for p in ready if remaining[p.pid] > 0],
                             key=lambda x: (-x.priority, x.arrival, x.pid))
            chosen = ordered[0].pid
            if running_pid and chosen != running_pid and remaining[running_pid] > 0:
                preemptions += 1
            return chosen

        if alg == "DABP":
            # Dynamic Aging + Burst Prediction (combined score)
            # score = (base_priority + gamma * age) + sjf_weight / tau
            best_pid = None
            best_score = -1e18
            # compute on-the-fly; O(n) but fine for teaching simulator
            for p in ready:
                if remaining[p.pid] <= 0:
                    continue
                age = t - (last_ready_time[p.pid] if last_ready_time[p.pid] is not None else t)
                eff_prio = base_priority[p.pid] + gamma * age
                score = eff_prio + (sjf_weight / max(tau[p.pid], 1e-9))
                # prefer earlier arrival on ties, then pid
                tie_break = (-p.arrival, -ord(p.pid[0])) if p.pid else (0, 0)  # not actually used numerically
                if score > best_score:
                    best_score = score
                    best_pid = p.pid
            if running_pid and best_pid != running_pid and remaining[running_pid] > 0:
                preemptions += 1
            return best_pid

        raise ValueError(f"Unknown algorithm: {algorithm}")

    # Main loop
    t = 0
    last_dispatch_time = 0
    current_pid: Optional[str] = None
    rr_quantum_left = rr_q
    # While there exists any process remaining
    while len(completed) < n:
        push_arrivals(t)
        # Remove finished from ready
        ready = [p for p in ready if remaining[p.pid] > 0]

        # Pick next
        next_pid = pick_next(t, current_pid)

        if next_pid is None:
            # CPU idle
            if current_pid is not None:
                current_pid = None
                rr_quantum_left = rr_q
            add_segment(None, t, t+1)
            t += 1
            continue

        # Context switch check
        if current_pid != next_pid:
            if current_pid is not None:
                context_switches += 1
            current_pid = next_pid
            # Response time
            if first_start[current_pid] is None:
                first_start[current_pid] = t
            # Reset RR quantum when switching to a new PID
            if algorithm.upper() == "RR":
                rr_quantum_left = rr_q

        # Run current_pid for 1 tick
        # Aging bookkeeping: everyone else in ready accumulates waiting -> age increases via t - last_ready_time[p]
        # Update last_ready_time for the running one (it leaves ready)
        for p in ready:
            if p.pid == current_pid:
                continue
            # they remain in ready -> no immediate state change needed
            pass
        # The running process is not waiting; set its last_ready_time to None to indicate it's not in ready
        last_ready_time[current_pid] = None

        # Add segment (extend if same pid)
        add_segment(current_pid, t, t+1)

        # Advance time and update remaining
        remaining[current_pid] -= 1
        t += 1

        # RR: decrease quantum
        if algorithm.upper() == "RR":
            rr_quantum_left -= 1

        # If finished
        if remaining[current_pid] == 0:
            completion[current_pid] = t
            completed.add(current_pid)
            # Update tau with observed actual burst for DABP (exponential smoothing)
            if algorithm.upper() == "DABP":
                # find original burst from process list
                b = next(p.burst for p in procs if p.pid == current_pid)
                tau[current_pid] = alpha * b + (1 - alpha) * tau[current_pid]
            # Running process leaves CPU
            current_pid = None
            rr_quantum_left = rr_q
        else:
            # Not finished: if preemptive algorithms may switch next tick; if not preemptive, stay put
            # For SJF non-preemptive: force stickiness by keeping last_ready_time None and not adding back to ready
            pass

        # Any process that is not running and not completed but "ready" should have last_ready_time set (if not already)
        for p in procs:
            if remaining[p.pid] > 0 and p.arrival <= t:
                # if it is not running now and not completed
                if p.pid != current_pid and p not in ready:
                    # ensure it's in ready
                    # For SJF non-preemptive: ready contains all arrived unfinished except running one
                    if p.pid not in [rp.pid for rp in ready]:
                        ready.append(p)
                # update last_ready_time if it's in ready
                if p.pid != current_pid:
                    if last_ready_time[p.pid] is None:
                        last_ready_time[p.pid] = t

    # Compute metrics
    waits = {}
    turns = {}
    responses = {}
    total_busy = sum(seg["end"] - seg["start"] for seg in timeline if seg["pid"] != "IDLE")
    makespan = timeline[-1]["end"] if timeline else 0
    for p in procs:
        turns[p.pid] = completion[p.pid] - p.arrival
        waits[p.pid] = turns[p.pid] - p.burst
        responses[p.pid] = first_start[p.pid] - p.arrival if first_start[p.pid] is not None else 0

    def avg(d):
        return sum(d.values()) / len(d) if d else 0.0

    # Jain's fairness index on waiting time
    wvals = list(waits.values())
    if wvals:
        num = (sum(wvals)) ** 2
        den = len(wvals) * sum(v * v for v in wvals)
        jain = (num / den) if den > 0 else 1.0
    else:
        jain = 1.0

    metrics = {
        "avg_waiting": round(avg(waits), 3),
        "avg_turnaround": round(avg(turns), 3),
        "avg_response": round(avg(responses), 3),
        "throughput": round(len(procs) / makespan, 3) if makespan else 0.0,
        "cpu_utilization": round(100.0 * total_busy / makespan, 2) if makespan else 0.0,
        "context_switches": context_switches,
        "preemptions": preemptions,
        "jain_fairness_wait": round(jain, 4),
        "makespan": makespan,
    }

    per_process = {}
    for p in procs:
        per_process[p.pid] = {
            "arrival": p.arrival,
            "burst": p.burst,
            "priority": p.priority,
            "completion": completion[p.pid],
            "turnaround": turns[p.pid],
            "waiting": waits[p.pid],
            "response": responses[p.pid],
        }

    return SimResult(timeline=timeline, metrics=metrics, per_process=per_process)
