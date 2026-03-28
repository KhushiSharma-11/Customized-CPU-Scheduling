
from dataclasses import dataclass

@dataclass(frozen=True)
class Process:
    """
    A simple CPU-only process model with a single CPU burst.
    Fields:
      pid: unique identifier string
      arrival: arrival time (int)
      burst: total CPU burst time (int > 0)
      priority: higher number = higher priority (int, can be 0)
    """
    pid: str
    arrival: int
    burst: int
    priority: int = 0
