# Disk Scheduling Simulator

A polished browser-based simulator for comparing common disk scheduling algorithms. The app lets you enter a request queue, choose an algorithm, and inspect seek behavior through live metrics, a head-movement chart, ranked comparison cards, and a benchmark table.

## Supported Algorithms

- `FCFS`
- `SSTF`
- `SCAN`
- `C-SCAN`
- `Compare All` mode for side-by-side analysis

## Features

- Custom comma-separated request queue input
- Adjustable initial head position and maximum cylinder range
- Direction control for `SCAN` and `C-SCAN`
- Instant calculation of:
  - total seek distance
  - average seek time
  - throughput
- SVG-based head movement visualization
- Comparison cards for seek distance and throughput
- Detailed result breakdown with service sequence and head path
- Responsive layout for desktop and mobile

## Tech Stack

- `HTML`
- `CSS`
- `JavaScript`
- `SVG` for chart rendering

## Project Structure

```text
disk-scheduling-simulator/
|-- index.html
|-- style.css
|-- app.js
|-- algorithms.js
|-- verify-algorithms.js
|-- favicon.svg
```

## Run Locally

1. Clone the repository.
2. Open `index.html` directly in a browser, or serve the folder with a local static server.
3. Enter a request queue or use the sample input.
4. Choose an algorithm and click `Execute Sequence`.

Example sample queue:

```text
98, 183, 37, 122, 14, 124, 65, 67
```

Sample setup:

- Initial head: `53`
- Max cylinder: `199`
- Direction: `right`

## Sample Results

Using the sample setup above:

- `FCFS`: total seek `640`
- `SSTF`: total seek `236`
- `SCAN`: total seek `331`
- `C-SCAN`: total seek `382`

For this input, `SSTF` gives the lowest total seek distance.

## Verification

Run:

```bash
node verify-algorithms.js
```

This verifies:

- sample-case correctness
- single-request handling
- repeated-request behavior
- `SCAN` left-direction traversal
- `C-SCAN` wraparound behavior

## UI Overview

The interface is organized into:

- a simulation input panel
- performance summary cards
- a head movement graph
- comparison panels
- a benchmark results table

## Repository

GitHub repository:

`https://github.com/ShlokPathak28/disk-scheduling-simulator`
