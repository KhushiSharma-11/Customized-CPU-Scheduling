
# CPU Scheduling Simulator with Custom DABP (Dynamic Aging + Burst Prediction)

This project simulates and visualizes CPU scheduling algorithms and introduces a **new policy**: **DABP — Dynamic Aging with Burst Prediction**. It compares DABP against **FCFS**, **SJF (non-preemptive)**, **RR**, and **Preemptive Priority**.

## Key Ideas

### DABP (Dynamic Aging + Burst Prediction)
- **Aging against starvation:** Effective priority grows the longer a process waits:  
  `effective_priority_i(t) = base_priority_i + γ * age_i(t)` where `age_i(t) = t - last_ready_time_i`.
- **Burst prediction:** Predict next CPU burst by exponential smoothing:  
  `τ_i := α * observed_burst_i + (1 - α) * τ_i` (updated when a process completes).  
  Initialize `τ_i` to the **mean burst** (or provide `--tau0`).
- **Combined score:** At each tick choose the ready process `i` with
  `score_i = effective_priority_i + (sjf_weight / τ_i)`
  (higher score is better; ties break by arrival then PID).
- **Preemptive at tick granularity:** Re-evaluate each time unit, allowing dynamic preemption when another process’s score overtakes.

### Metrics
- Per-process: completion, turnaround, waiting, response.
- Overall: average turnaround/wait/response, throughput, CPU utilization, number of context switches, preemptions, **Jain’s fairness index** on waiting time.

## Project Layout
```
scheduler_project/
  main.py
  scheduler/
    models.py
    sim.py
    visualize.py
  workloads/
    sample.json
  tests/
    test_small.py (optional placeholder)
```

## Requirements
- Python 3.9+ (standard library only). No external deps required.
- Optional: run in any terminal. ASCII Gantt is printed to stdout.

## Usage
Run from the project root:
```bash
python main.py --algo FCFS --workload workloads/sample.json
python main.py --algo SJF --workload workloads/sample.json
python main.py --algo RR --rr_q 3 --workload workloads/sample.json
python main.py --algo PRIORITY --workload workloads/sample.json
python main.py --algo DABP --alpha 0.6 --gamma 0.3 --sjf_weight 1.0 --workload workloads/sample.json
```

### Tuning DABP
- `--alpha` (0..1): trust in the last observed burst (higher → faster adaptation).
- `--gamma` (>0): aging speed (higher → more aggressive starvation prevention).
- `--sjf_weight` (>0): emphasize short predicted bursts more strongly.
- `--tau0`: initial predicted burst. If not supplied or <=0, mean burst is used.

## Workload File Format
```json
{
  "processes": [
    {"pid": "P1", "arrival": 0, "burst": 7, "priority": 2},
    {"pid": "P2", "arrival": 2, "burst": 4, "priority": 1}
  ]
}
```

## How it Works (High Level)
- **Discrete-time** simulation at 1-unit ticks.
- For each tick: admit arrivals, choose next according to algorithm, run for 1 unit, update state.
- **DABP** recomputes scores each tick via `effective_priority + sjf_weight / τ`.

## Real-time / GUI Ideas (next steps)
- The simulator already produces a detailed time-segment timeline. You can plug it into:
  - **Curses/Rich** live tables for queue state snapshot per tick.
  - **Matplotlib** live “Gantt-like” bar chart (update each tick).
  - A **React** front-end that consumes a JSON stream and animates bars.

## Example
Run:
```bash
python main.py --algo DABP --alpha 0.6 --gamma 0.3 --workload workloads/sample.json
```
You’ll get an ASCII Gantt, per-process table, and aggregate metrics.

---

**Why DABP is unique**  
It smoothly blends **aging** (fairness/anti-starvation) with **data-driven burst prediction** (SJF-style efficiency). The single scoring rule yields an interpretable, tunable policy you can benchmark head-to-head with classical baselines.

---

## Run the minimal API + Frontend (local)

This project now includes a simple Flask API and a tiny React frontend to run simulations from the browser.

### 1) Backend (Flask on port 5000)

Requirements are in `backend/requirements.txt`.

```cmd
cd /d x:\OS\cpu_scheduler_dabp_project\scheduler_project\backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Endpoints:
- `GET /` → health text: "Scheduler API running"
- `GET /workloads` → list sample workloads from `workloads/`
- `POST /simulate` → body:
  ```json
  {
    "algorithm": "FCFS",
    "params": {},
    "workload": {"processes": [{"pid": "P1", "arrival": 0, "burst": 5}]}
  }
  ```
  Notes: `arrival_time` is also accepted as an alias for `arrival`.

### 2) Frontend (React on port 3000)

The frontend is a very small CRA-style app under `frontend/`.

```cmd
cd /d x:\OS\cpu_scheduler_dabp_project\scheduler_project\frontend
npm install
npm start
```

The frontend is configured with a development proxy to `http://localhost:5000` so calls like `/simulate` are forwarded to Flask.

### 3) Try it
1. Start the Flask server first (port 5000).
2. Start the React dev server (port 3000).
3. Open http://localhost:3000 and click "Run Simulation".

Results page shows:
- ASCII Gantt chart
- Metrics table
- Raw timeline JSON
