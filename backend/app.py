import os
import sys
import json
from typing import Any, Dict, List

from flask import Flask, jsonify, request
from flask_cors import CORS

# Ensure we can import the local 'scheduler' package when running from backend/
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scheduler.models import Process  # type: ignore
from scheduler.sim import simulate    # type: ignore
from scheduler.visualize import ascii_gantt  # type: ignore

app = Flask(__name__)
CORS(app)

WORKLOADS_DIR = os.path.join(PROJECT_ROOT, "workloads")


def _parse_process_item(item: Dict[str, Any]) -> Process:
    """
    Accept slightly flexible input keys and normalize to Process dataclass.
    Supported keys for arrival: 'arrival' or 'arrival_time'.
    Supported keys for pid: str or int -> coerced to str.
    Priority defaults to 0 if missing.
    """
    if not isinstance(item, dict):
        raise ValueError("Each process must be a JSON object")

    pid = str(item.get("pid")) if item.get("pid") is not None else None
    if not pid:
        raise ValueError("Process is missing 'pid'")

    # allow 'arrival' or 'arrival_time'
    if "arrival" in item:
        arrival = int(item["arrival"])
    elif "arrival_time" in item:
        arrival = int(item["arrival_time"])
    else:
        raise ValueError("Process is missing 'arrival' or 'arrival_time'")

    if "burst" not in item:
        raise ValueError("Process is missing 'burst'")
    burst = int(item["burst"])

    priority = int(item.get("priority", 0))
    return Process(pid=pid, arrival=arrival, burst=burst, priority=priority)


def _normalize_workload(payload: Dict[str, Any]) -> List[Process]:
    """
    Accept either:
      { "processes": [ {...}, {...} ] }
    or
      [ {...}, {...} ]
    """
    if isinstance(payload, list):
        items = payload
    elif isinstance(payload, dict) and "processes" in payload and isinstance(payload["processes"], list):
        items = payload["processes"]
    else:
        raise ValueError("Workload must be a list of processes or an object with a 'processes' array")

    return [_parse_process_item(it) for it in items]


@app.get("/")
def root():
    return "Scheduler API running", 200


@app.get("/workloads")
def list_workloads():
    """Return available sample workloads and their contents."""
    try:
        files = []
        if os.path.isdir(WORKLOADS_DIR):
            for name in os.listdir(WORKLOADS_DIR):
                if not name.lower().endswith(".json"):
                    continue
                path = os.path.join(WORKLOADS_DIR, name)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    files.append({"filename": name, "data": data})
                except Exception as e:
                    files.append({"filename": name, "error": str(e)})
        return jsonify({"workloads": files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/simulate")
def simulate_endpoint():
    try:
        body = request.get_json(force=True, silent=False)
        if not isinstance(body, dict):
            return jsonify({"error": "Body must be a JSON object"}), 400

        algorithm = body.get("algorithm") or body.get("algo")
        if not algorithm or not isinstance(algorithm, str):
            return jsonify({"error": "Missing 'algorithm' (string)."}), 400

        params = body.get("params") or {}
        if not isinstance(params, dict):
            return jsonify({"error": "'params' must be an object"}), 400

        workload_payload = body.get("workload")
        if workload_payload is None:
            return jsonify({"error": "Missing 'workload'"}), 400

        processes = _normalize_workload(workload_payload)

        result = simulate(processes, algorithm, params)
        gantt = ascii_gantt(result.timeline)

        return jsonify({
            "algorithm": algorithm,
            "params": params,
            "metrics": result.metrics,
            "per_process": result.per_process,
            "timeline": result.timeline,
            "gantt_ascii": gantt,
        })
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        # For unexpected errors, include a minimal message
        return jsonify({"error": f"Simulation failed: {str(e)}"}), 500


if __name__ == "__main__":
    # Run development server on port 5000
    app.run(host="0.0.0.0", port=5000, debug=True)
