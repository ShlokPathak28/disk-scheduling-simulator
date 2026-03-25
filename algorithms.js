// Disk Scheduling Algorithms

/**
 * FCFS (First Come First Served)
 * @param {number[]} requests - Array of cylinder numbers
 * @param {number} head - Initial head position
 * @param {string} [direction] - Not used in FCFS
 * @param {number} [max_cylinder] - Not used in FCFS
 * @returns {{sequence: number[], totalSeek: number}}
 */
function FCFS(requests, head, direction, max_cylinder) {
  let sequence = [];
  let totalSeek = 0;
  let current = head;

  // If no requests, return empty sequence and zero seek
  if (requests.length === 0) {
    return { sequence, totalSeek };
  }

  // Process each request in order
  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    sequence.push(request);
    totalSeek += Math.abs(current - request);
    current = request;
  }

  return { sequence, totalSeek };
}

/**
 * SSTF (Shortest Seek Time First)
 * @param {number[]} requests - Array of cylinder numbers
 * @param {number} head - Initial head position
 * @param {string} [direction] - Not used in SSTF
 * @param {number} [max_cylinder] - Not used in SSTF
 * @returns {{sequence: number[], totalSeek: number}}
 */
function SSTF(requests, head, direction, max_cylinder) {
  let sequence = [];
  let totalSeek = 0;
  let current = head;
  const remaining = [...requests]; // Copy of requests to mark as serviced

  while (remaining.length > 0) {
    // Find the index of the request with minimum seek distance from current head
    let minIndex = 0;
    let minDistance = Math.abs(current - remaining[0]);

    for (let i = 1; i < remaining.length; i++) {
      const distance = Math.abs(current - remaining[i]);
      // If tie, choose the one with lower cylinder number (for determinism)
      if (distance < minDistance || (distance === minDistance && remaining[i] < remaining[minIndex])) {
        minDistance = distance;
        minIndex = i;
      }
    }

    // Service the selected request
    const next = remaining.splice(minIndex, 1)[0];
    sequence.push(next);
    totalSeek += minDistance;
    current = next;
  }

  return { sequence, totalSeek };
}

/**
 * SCAN (Elevator Algorithm)
 * @param {number[]} requests - Array of cylinder numbers
 * @param {number} head - Initial head position
 * @param {string} direction - 'left' for decreasing cylinder numbers, 'right' for increasing
 * @param {number} max_cylinder - Maximum cylinder number (e.g., 199)
 * @returns {{sequence: number[], totalSeek: number}}
 */
function SCAN(requests, head, direction, max_cylinder) {
  let sequence = [];
  let totalSeek = 0;
  let current = head;
  const left = [];  // Requests less than head
  const right = []; // Requests greater than or equal to head

  // Separate requests into left and right of the head
  for (let i = 0; i < requests.length; i++) {
    if (requests[i] < head) {
      left.push(requests[i]);
    } else {
      right.push(requests[i]);
    }
  }

  // Sort left in descending order (so we go from highest to lowest when moving left)
  left.sort((a, b) => b - a);
  // Sort right in ascending order (so we go from lowest to highest when moving right)
  right.sort((a, b) => a - b);

  let sequenceLeft = [];
  let sequenceRight = [];

  if (direction === 'left') {
    // Go left first, then right
    sequenceLeft = left;
    sequenceRight = right;
  } else { // direction === 'right'
    // Go right first, then left
    sequenceLeft = right;
    sequenceRight = left;
  }

  // Combine the sequences: first the direction we start, then the other
  sequence = [...sequenceLeft, ...sequenceRight];

  // Calculate total seek distance
  if (sequence.length > 0) {
    totalSeek += Math.abs(current - sequence[0]); // From head to first request
    for (let i = 1; i < sequence.length; i++) {
      totalSeek += Math.abs(sequence[i - 1] - sequence[i]);
    }
  }

  return { sequence, totalSeek };
}

/**
 * C-SCAN (Circular SCAN)
 * @param {number[]} requests - Array of cylinder numbers
 * @param {number} head - Initial head position
 * @param {string} direction - 'left' for decreasing cylinder numbers, 'right' for increasing
 * @param {number} max_cylinder - Maximum cylinder number (e.g., 199)
 * @returns {{sequence: number[], totalSeek: number}}
 */
function CScan(requests, head, direction, max_cylinder) {
  let sequence = [];
  let totalSeek = 0;
  let current = head;

  if (direction === 'right') {
    // Forward: requests >= head, sorted ascending
    // Backward: requests < head, sorted ascending
    const forward = requests.filter(r => r >= head).sort((a, b) => a - b);
    const backward = requests.filter(r => r < head).sort((a, b) => a - b);
    sequence = [...forward, ...backward];
  } else { // direction === 'left'
    // Forward: requests <= head, sorted descending
    // Backward: requests > head, sorted descending
    const forward = requests.filter(r => r <= head).sort((a, b) => b - a);
    const backward = requests.filter(r => r > head).sort((a, b) => b - a);
    sequence = [...forward, ...backward];
  }

  // Calculate total seek distance
  if (sequence.length > 0) {
    totalSeek += Math.abs(current - sequence[0]); // From head to first request in sequence
    for (let i = 1; i < sequence.length; i++) {
      totalSeek += Math.abs(sequence[i - 1] - sequence[i]);
    }
  }

  return { sequence, totalSeek };
}

// Export functions for use in other files (if using modules)
// Since we are using plain HTML script tags, we'll attach to window if needed.
// But for now, we just define them globally.
// In the HTML, we are including this file directly, so they will be in global scope.

// If we want to export for Node or ES modules, we can do:
// module.exports = { FCFS, SSTF, SCAN, CScan };
// But since we are in browser, we'll just leave them as global.

// However, to avoid polluting global scope too much, we can create a namespace.
// Let's attach to window.diskSchedulingAlgorithms if window exists.
// For simplicity in this project, we'll just leave them as global and hope there are no conflicts.

// Alternatively, we can define them as properties of an object and then assign that object to window.
const diskSchedulingAlgorithms = {
  FCFS,
  SSTF,
  SCAN,
  CScan
};

// Attach to window if available (browser)
if (typeof window !== 'undefined') {
  window.diskSchedulingAlgorithms = diskSchedulingAlgorithms;
}

// Also export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = diskSchedulingAlgorithms;
}
