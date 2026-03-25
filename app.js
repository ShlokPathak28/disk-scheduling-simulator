const COLORS = {
    FCFS: "#1f6f8b",
    SSTF: "#b84e2d",
    SCAN: "#4f772d",
    "C-SCAN": "#7a4cc2"
};

function formatNumber(value, digits = 2) {
    return Number(value).toFixed(digits);
}

function parseQueue(rawValue) {
    return rawValue
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .map((entry) => Number(entry));
}

function validateInput(requests, headPosition, maxCylinder) {
    if (requests.length === 0) {
        return "Enter at least one disk request.";
    }

    if (requests.some((request) => Number.isNaN(request) || !Number.isInteger(request))) {
        return "Request queue must contain only integers.";
    }

    if (!Number.isInteger(headPosition) || headPosition < 0) {
        return "Initial head position must be a non-negative integer.";
    }

    if (!Number.isInteger(maxCylinder) || maxCylinder <= 0) {
        return "Max cylinder must be an integer greater than 0.";
    }

    if (headPosition > maxCylinder) {
        return "Initial head position cannot exceed the max cylinder.";
    }

    if (requests.some((request) => request < 0 || request > maxCylinder)) {
        return `Every request must be between 0 and ${maxCylinder}.`;
    }

    return "";
}

function updateControlState() {
    const algorithm = document.getElementById("algorithm").value;
    const directionSelect = document.getElementById("direction");
    const directionHint = document.getElementById("directionHint");

    if (algorithm === "FCFS" || algorithm === "SSTF") {
        directionSelect.disabled = true;
        directionHint.textContent = "Direction is ignored for FCFS and SSTF.";
        return;
    }

    directionSelect.disabled = false;
    directionHint.textContent = algorithm === "ALL"
        ? "Used by SCAN and C-SCAN during comparison."
        : "Used by SCAN and C-SCAN.";
}

function updateInputSummary(input) {
    const summary = document.getElementById("inputSummary");
    const mode = input.algorithm === "ALL" ? "comparing all algorithms" : `running ${input.algorithm}`;
    summary.textContent = `${input.requests.length} requests loaded, head at ${input.headPosition}, max cylinder ${input.maxCylinder}, ${mode}.`;
}

function getSimulationInput() {
    const requestQueue = document.getElementById("requestQueue").value;
    const headPosition = Number(document.getElementById("headPosition").value);
    const maxCylinder = Number(document.getElementById("maxCylinder").value);
    const direction = document.getElementById("direction").value;
    const algorithm = document.getElementById("algorithm").value;

    return {
        requests: parseQueue(requestQueue),
        headPosition,
        maxCylinder,
        direction,
        algorithm
    };
}

function runSelectedAlgorithms(input) {
    const api = window.diskSchedulingAlgorithms;

    if (input.algorithm === "ALL") {
        return api.runAllAlgorithms(input);
    }

    const map = {
        FCFS: () => api.fcfs(input.requests, input.headPosition),
        SSTF: () => api.sstf(input.requests, input.headPosition),
        SCAN: () => api.scan(input.requests, input.headPosition, input.direction, input.maxCylinder),
        "C-SCAN": () => api.cscan(input.requests, input.headPosition, input.direction, input.maxCylinder)
    };

    return [map[input.algorithm]()];
}

function updateTopMetrics(results, selectedMode) {
    const lowestSeek = [...results].sort((left, right) => left.totalSeekDistance - right.totalSeekDistance)[0];
    const highestThroughput = [...results].sort((left, right) => right.throughput - left.throughput)[0];

    document.getElementById("selectedMode").textContent = selectedMode;
    document.getElementById("bestAlgorithm").textContent = lowestSeek.algorithm;
    document.getElementById("bestSeek").textContent = String(lowestSeek.totalSeekDistance);
    document.getElementById("bestThroughput").textContent = formatNumber(highestThroughput.throughput, 4);
}

function renderTable(results) {
    const tableBody = document.getElementById("resultTableBody");
    const bestSeek = Math.min(...results.map((result) => result.totalSeekDistance));
    tableBody.innerHTML = results.map((result) => `
        <tr class="${result.totalSeekDistance === bestSeek ? "is-best" : ""}">
            <td>${result.algorithm}</td>
            <td>${result.sequence.join(", ")}</td>
            <td>${result.totalSeekDistance}</td>
            <td>${formatNumber(result.averageSeekTime)}</td>
            <td>${formatNumber(result.throughput, 4)}</td>
        </tr>
    `).join("");
}

function renderResultCards(results) {
    const resultCards = document.getElementById("resultCards");
    resultCards.innerHTML = results.map((result) => `
        <article class="result-card">
            <div class="result-card-header">
                <div>
                    <p class="eyebrow">${result.algorithm}</p>
                    <h2>${result.algorithm} Output</h2>
                </div>
                <span class="result-badge">${result.totalSeekDistance} tracks</span>
            </div>
            <p class="sequence-text"><strong>Service sequence:</strong> ${result.sequence.join(" -> ")}</p>
            <p class="path-text"><strong>Head path:</strong> ${result.path.join(" -> ")}</p>
            <div class="result-meta">
                <div>
                    <span>Total Seek</span>
                    <strong>${result.totalSeekDistance}</strong>
                </div>
                <div>
                    <span>Average Seek</span>
                    <strong>${formatNumber(result.averageSeekTime)}</strong>
                </div>
                <div>
                    <span>Throughput</span>
                    <strong>${formatNumber(result.throughput, 4)}</strong>
                </div>
            </div>
        </article>
    `).join("");
}

function renderLegend(results) {
    const legend = document.getElementById("chartLegend");
    legend.innerHTML = results.map((result) => `
        <span class="legend-item">
            <span class="legend-swatch" style="background:${COLORS[result.algorithm]};"></span>
            ${result.algorithm}
        </span>
    `).join("");
}

function renderComparisonBars(results) {
    const barTarget = document.getElementById("comparisonBars");
    const maxSeek = Math.max(...results.map((result) => result.totalSeekDistance), 1);
    const maxThroughput = Math.max(...results.map((result) => result.throughput), 1);

    barTarget.innerHTML = results.map((result) => {
        const seekWidth = (result.totalSeekDistance / maxSeek) * 100;
        const throughputWidth = (result.throughput / maxThroughput) * 100;

        return `
            <article class="bar-card">
                <div class="bar-card-header">
                    <strong>${result.algorithm}</strong>
                    <span class="result-badge">${result.totalSeekDistance} seek</span>
                </div>
                <div class="bar-metric">
                    <div class="bar-metric-label">
                        <span>Seek Distance</span>
                        <span>${result.totalSeekDistance}</span>
                    </div>
                    <div class="bar-track">
                        <span class="bar-fill" style="width:${seekWidth}%; background:${COLORS[result.algorithm]};"></span>
                    </div>
                </div>
                <div class="bar-metric">
                    <div class="bar-metric-label">
                        <span>Throughput</span>
                        <span>${formatNumber(result.throughput, 4)}</span>
                    </div>
                    <div class="bar-track">
                        <span class="bar-fill" style="width:${throughputWidth}%; background:${COLORS[result.algorithm]};"></span>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function renderChart(results, maxCylinder) {
    const chart = document.getElementById("movementChart");
    const width = 960;
    const height = 360;
    const padding = { top: 24, right: 24, bottom: 38, left: 52 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const longestPath = Math.max(...results.map((result) => result.path.length), 2);
    const xStep = longestPath > 1 ? innerWidth / (longestPath - 1) : innerWidth;
    const yScale = maxCylinder > 0 ? innerHeight / maxCylinder : innerHeight;
    let markup = "";

    for (let tick = 0; tick <= 4; tick += 1) {
        const yValue = Math.round((maxCylinder / 4) * tick);
        const y = padding.top + innerHeight - (yValue * yScale);
        markup += `<line class="grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>`;
        markup += `<text class="axis-label" x="${padding.left - 12}" y="${y + 4}" text-anchor="end">${yValue}</text>`;
    }

    for (let step = 0; step < longestPath; step += 1) {
        const x = padding.left + step * xStep;
        markup += `<line class="grid-line" x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}"></line>`;
        markup += `<text class="axis-label" x="${x}" y="${height - 12}" text-anchor="middle">${step}</text>`;
    }

    markup += `<text class="axis-label" x="${width / 2}" y="${height - 4}" text-anchor="middle">Service Step</text>`;
    markup += `<text class="axis-label" x="16" y="${height / 2}" text-anchor="middle" transform="rotate(-90 16 ${height / 2})">Cylinder</text>`;

    results.forEach((result) => {
        const points = result.path.map((value, index) => {
            const x = padding.left + index * xStep;
            const y = padding.top + innerHeight - (value * yScale);
            return { x, y, value };
        });

        markup += `<polyline class="path-line" points="${points.map((point) => `${point.x},${point.y}`).join(" ")}" stroke="${COLORS[result.algorithm]}"></polyline>`;
        markup += points.map((point) => `
            <circle class="path-point" cx="${point.x}" cy="${point.y}" r="4.5" fill="${COLORS[result.algorithm]}">
                <title>${result.algorithm}: cylinder ${point.value}</title>
            </circle>
        `).join("");
    });

    chart.innerHTML = markup;
}

function showError(message) {
    document.getElementById("errorMessage").textContent = message;
}

function runSimulation() {
    const input = getSimulationInput();
    const validationError = validateInput(input.requests, input.headPosition, input.maxCylinder);

    if (validationError) {
        showError(validationError);
        return;
    }

    showError("");
    updateInputSummary(input);
    const results = runSelectedAlgorithms(input);
    const selectedMode = input.algorithm === "ALL" ? "Compare All" : input.algorithm;

    updateTopMetrics(results, selectedMode);
    renderTable(results);
    renderResultCards(results);
    renderLegend(results);
    renderComparisonBars(results);
    renderChart(results, input.maxCylinder);
}

function loadSample() {
    const sample = window.schedulerBlueprint.sampleInput;
    document.getElementById("requestQueue").value = sample.requests.join(", ");
    document.getElementById("headPosition").value = sample.headPosition;
    document.getElementById("maxCylinder").value = sample.maxCylinder;
    document.getElementById("direction").value = sample.direction;
    document.getElementById("algorithm").value = "ALL";
    updateControlState();
    showError("");
    runSimulation();
}

function resetSimulator() {
    document.getElementById("simulatorForm").reset();
    document.getElementById("requestQueue").value = "";
    document.getElementById("headPosition").value = 53;
    document.getElementById("maxCylinder").value = 199;
    document.getElementById("direction").value = "right";
    document.getElementById("algorithm").value = "ALL";
    updateControlState();
    document.getElementById("selectedMode").textContent = "Compare All";
    document.getElementById("bestAlgorithm").textContent = "Not Run";
    document.getElementById("bestSeek").textContent = "0";
    document.getElementById("bestThroughput").textContent = "0.0000";
    document.getElementById("chartLegend").innerHTML = "";
    document.getElementById("movementChart").innerHTML = "";
    document.getElementById("comparisonBars").innerHTML = `<p class="empty-state">Run the simulator to compare performance visually.</p>`;
    document.getElementById("resultTableBody").innerHTML = `
        <tr>
            <td colspan="5" class="empty-state">Run the simulator to see results.</td>
        </tr>
    `;
    document.getElementById("resultCards").innerHTML = `<p class="empty-state">No simulation has been run yet.</p>`;
    showError("");
    document.getElementById("inputSummary").textContent = "Load the sample data or enter your own queue to begin.";
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("simulatorForm").addEventListener("submit", (event) => {
        event.preventDefault();
        runSimulation();
    });

    document.getElementById("algorithm").addEventListener("change", updateControlState);
    document.getElementById("sampleButton").addEventListener("click", loadSample);
    document.getElementById("resetButton").addEventListener("click", resetSimulator);
    updateControlState();
    loadSample();
});
