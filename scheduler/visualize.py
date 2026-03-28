
from typing import List, Dict
import shutil

def ascii_gantt(timeline: List[Dict]) -> str:
    """
    Build a simple ASCII Gantt chart from timeline segments.
    timeline: list of {"pid": str, "start": int, "end": int}
    """
    if not timeline:
        return "No timeline."
    # Merge adjacent segments of same PID for cleaner display
    merged = []
    for seg in timeline:
        if merged and merged[-1]["pid"] == seg["pid"] and merged[-1]["end"] == seg["start"]:
            merged[-1]["end"] = seg["end"]
        else:
            merged.append(dict(seg))
    # Determine scale/width
    total_time = merged[-1]["end"] if merged else 0
    width = shutil.get_terminal_size((100, 20)).columns
    # Keep a minimum width
    width = max(60, width)
    # Build header with tick markers at reasonable intervals
    chart = []
    chart.append("Gantt Chart")
    chart.append("-" * min(width, 120))
    # Represent each merged block proportionally
    if total_time == 0:
        return "\n".join(chart + ["(empty)"])
    # 1 line with blocks
    line = "|"
    for seg in merged:
        span = seg["end"] - seg["start"]
        block_width = max(1, int((span / total_time) * (width - 2)))
        pid_label = f" {seg['pid']} "
        # Center label inside block space
        if block_width >= len(pid_label):
            left_pad = (block_width - len(pid_label)) // 2
            right_pad = block_width - len(pid_label) - left_pad
            block = " " * left_pad + pid_label + " " * right_pad
        else:
            block = pid_label.strip()[:block_width]
        line += block + "|"
    chart.append(line)
    # Second line with time ticks (every ~10%)
    tick_line = "0"
    steps = max(1, total_time // 10)
    for t in range(1, total_time + 1):
        if t % steps == 0 or t == total_time:
            tick_line += f"{t}".rjust(steps if steps > 1 else 2, " ")
        else:
            tick_line += " "
    chart.append(tick_line)
    return "\n".join(chart)


def pretty_metrics(metrics: Dict) -> str:
    lines = ["\nMetrics"]
    lines.append("-" * 40)
    for k in ["avg_waiting", "avg_turnaround", "avg_response", "throughput", "cpu_utilization", "context_switches", "preemptions", "jain_fairness_wait"]:
        if k in metrics:
            lines.append(f"{k}: {metrics[k]}")
    return "\n".join(lines)
