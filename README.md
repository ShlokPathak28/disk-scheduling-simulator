# Disk Scheduling Simulator

An interactive HTML, CSS, and JavaScript simulator for visualizing `FCFS`, `SSTF`, `SCAN`, and `C-SCAN` disk scheduling algorithms with seek time and throughput analysis.

## Features

- Enter a custom disk request queue
- Set the initial head position and maximum cylinder
- Choose `FCFS`, `SSTF`, `SCAN`, `C-SCAN`, or compare all at once
- View total seek distance, average seek time, and throughput
- Inspect service order and full head path
- Compare algorithms with a line plot and performance bars

## Project Files

```text
os-project/
├─ index.html
├─ style.css
├─ app.js
├─ algorithms.js
└─ verify-algorithms.js
```

## How to Run

1. Open `index.html` in a browser.
2. Enter a comma-separated request queue.
3. Set the head position, max cylinder, direction, and algorithm.
4. Click `Run Simulation`.

Use `Load Sample` to populate the standard sample queue:

```text
98, 183, 37, 122, 14, 124, 65, 67
```

## Sample Results

For the default sample input with head position `53`, max cylinder `199`, and direction `right`:

- `FCFS`: `640`
- `SSTF`: `236`
- `SCAN`: `331`
- `C-SCAN`: `382`

`SSTF` gives the lowest seek distance for that sample.

## Verification

Run the algorithm checks with:

```bash
node verify-algorithms.js
```

This verifies:

- the standard sample case
- single-request behavior
- repeated-request behavior
- `SCAN` left-direction sequencing
- `C-SCAN` wraparound behavior
