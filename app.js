// Disk Scheduling Simulator - Main Application Logic

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const requestQueueInput = document.getElementById('requestQueue');
  const algoFCFS = document.getElementById('algoFCFS');
  const algoSSTF = document.getElementById('algoSSTF');
  const algoSCAN = document.getElementById('algoSCAN');
  const algoCSCAN = document.getElementById('algoCSCAN');
  const headPositionInput = document.getElementById('headPosition');
  const diskSizeInput = document.getElementById('diskSize');
  const dirLeft = document.getElementById('dirLeft');
  const dirRight = document.getElementById('dirRight');
  const speedSlider = document.getElementById('speedSlider');
  const runButton = document.getElementById('runButton');
  const randomButton = document.getElementById('randomButton');
  const nextButton = document.getElementById('nextButton');
  const pauseButton = document.getElementById('pauseButton');
  const resumeButton = document.getElementById('resumeButton');
  const resetButton = document.getElementById('resetButton');
  const stepControls = document.getElementById('stepControls');
  const seekChartCanvas = document.getElementById('seekChart');
  const totalSeekEl = document.getElementById('totalSeek');
  const avgSeekEl = document.getElementById('avgSeek');
  const throughputEl = document.getElementById('throughput');
  const comparisonTableBody = document.getElementById('tableBody');

  // Chart.js instance
  let seekChart = null;
  let chartData = {
    labels: [], // step indices
    datasets: [] // one dataset per algorithm
  };

  // Simulation state
  let simulationState = {
    isRunning: false,
    isPaused: false,
    currentStep: 0,
    algorithmResults: {}, // {algorithmName: {sequence, totalSeek}}
    currentAlgorithm: null,
    animationInterval: null,
    speed: 3 // 1-5 from slider
  };

  // Initialize Chart.js
  function initChart() {
    const ctx = seekChartCanvas.getContext('2d');
    seekChart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0 // We'll handle animation manually
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: parseInt(diskSizeInput.value) || 199
          },
          x: {
            display: true,
            title: {
              display: true,
              text: 'Step'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Cylinder Number'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      }
    });
  }

  // Update chart Y-axis max based on disk size
  function updateChartYAxis(max) {
    if (seekChart) {
      seekChart.options.scales.y.suggestedMax = max;
      seekChart.update('none');
    }
  }

  // Parse comma-separated input into integer array
  function parseRequestQueue(input) {
    if (!input || input.trim() === '') return [];
    // Split by comma, trim each part, filter out empty strings, convert to numbers
    return input.split(',')
      .map(part => part.trim())
      .filter(part => part !== '')
      .map(part => {
        const num = parseInt(part, 10);
        return isNaN(num) ? null : num;
      })
      .filter(num => num !== null); // Remove invalid numbers
  }

  // Validate requests: ensure they are within [0, diskSize]
  function validateRequests(requests, diskSize) {
    const invalid = requests.filter(r => r < 0 || r > diskSize);
    return invalid.length === 0 ? [] : invalid;
  }

  // Get selected algorithms
  function getSelectedAlgorithms() {
    const selected = [];
    if (algoFCFS.checked) selected.push('FCFS');
    if (algoSSTF.checked) selected.push('SSTF');
    if (algoSCAN.checked) selected.push('SCAN');
    if (algoCSCAN.checked) selected.push('C-SCAN');
    return selected;
  }

  // Get direction
  function getDirection() {
    return dirLeft.checked ? 'left' : 'right';
  }

  // Run the selected algorithms and update UI
  function runSimulation() {
    // Get input values
    const requestQueue = parseRequestQueue(requestQueueInput.value);
    const headPosition = parseInt(headPositionInput.value, 10);
    const diskSize = parseInt(diskSizeInput.value, 10);
    const direction = getDirection();
    const selectedAlgos = getSelectedAlgorithms();

    // Basic validation
    if (requestQueue.length === 0) {
      alert('Please enter a valid request queue (comma-separated numbers).');
      return;
    }
    if (isNaN(headPosition) || headPosition < 0 || headPosition > diskSize) {
      alert(`Please enter a valid head position between 0 and ${diskSize}.`);
      return;
    }
    if (isNaN(diskSize) || diskSize <= 0) {
      alert('Please enter a valid disk size greater than 0.');
      return;
    }
    const invalidRequests = validateRequests(requestQueue, diskSize);
    if (invalidRequests.length > 0) {
      alert(`The following requests are out of range [0-${diskSize}]: ${invalidRequests.join(', ')}`);
      return;
    }
    if (selectedAlgos.length === 0) {
      alert('Please select at least one algorithm.');
      return;
    }

    // Reset simulation state
    simulationState.isRunning = true;
    simulationState.isPaused = false;
    simulationState.currentStep = 0;
    simulationState.algorithmResults = {};
    simulationState.speed = parseInt(speedSlider.value, 10);

    // Update chart Y-axis
    updateChartYAxis(diskSize);

    // Run each selected algorithm
    selectedAlgos.forEach(algo => {
      let result;
      switch (algo) {
        case 'FCFS':
          result = FCFS(requestQueue, headPosition);
          break;
        case 'SSTF':
          result = SSTF(requestQueue, headPosition);
          break;
        case 'SCAN':
          result = SCAN(requestQueue, headPosition, direction, diskSize);
          break;
        case 'C-SCAN':
          result = CScan(requestQueue, headPosition, direction, diskSize);
          break;
        default:
          return;
      }
      simulationState.algorithmResults[algo] = result;
    });

    // Update UI
    updateMetrics();
    updateComparisonTable();
    initializeChart();
    startAnimation();
  }

  // Update metrics dashboard (for the first algorithm or combined?)
  // We'll show metrics for the first selected algorithm for simplicity
  function updateMetrics() {
    const selectedAlgos = getSelectedAlgorithms();
    if (selectedAlgos.length === 0) return;
    const firstAlgo = selectedAlgos[0];
    const result = simulationState.algorithmResults[firstAlgo];
    if (!result) return;

    totalSeekEl.textContent = result.totalSeek;
    const avg = result.totalSeek / requestQueueInput.value.split(',').filter(v => v.trim() !== '').length;
    avgSeekEl.textContent = avg.toFixed(2);
    const throughput = result.totalSeek > 0 ? (requestQueue.length / result.totalSeek).toFixed(2) : 0;
    throughputEl.textContent = throughput;
  }

  // Update comparison table with all algorithms
  function updateComparisonTable() {
    // Clear existing rows
    comparisonTableBody.innerHTML = '';

    const selectedAlgos = getSelectedAlgorithms();
    const requestQueue = parseRequestQueue(requestQueueInput.value);
    const requestCount = requestQueue.length;

    selectedAlgos.forEach(algo => {
      const result = simulationState.algorithmResults[algo];
      if (!result) return;

      const row = document.createElement('tr');

      // Algorithm name
      const algoCell = document.createElement('td');
      algoCell.textContent = algo;
      algoCell.className = 'px-3 py-2';
      row.appendChild(algoCell);

      // Sequence (truncate if too long)
      const seqCell = document.createElement('td');
      const seqStr = result.sequence.join(', ');
      seqCell.textContent = seqStr.length > 50 ? seqStr.substring(0, 50) + '...' : seqStr;
      seq
