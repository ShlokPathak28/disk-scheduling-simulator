document.addEventListener("DOMContentLoaded", () => {
    const COLORS = {
        FCFS: "#1f6f8b",
        SSTF: "#b45833",
        SCAN: "#4f772d",
        "C-SCAN": "#7a4cc2"
    };

    const setupForm = document.getElementById("setupForm");
    const runButton = document.getElementById("runButton");
    const sampleButton = document.getElementById("sampleButton");
    const resetButton = document.getElementById("resetButton");
    const requestQueue = document.getElementById("requestQueue");
    const headPosition = document.getElementById("headPosition");
    const maxCylinder = document.getElementById("maxCylinder");
    const direction = document.getElementById("direction");
    const algorithm = document.getElementById("algorithm");
    const statusText = document.getElementById("statusText");
    const totalSeekValue = document.getElementById("totalSeekValue");
    const averageSeekValue = document.getElementById("averageSeekValue");
    const throughputValue = document.getElementById("throughputValue");
    const resultsTableBody = document.getElementById("resultsTableBody");
    const resultDetail = document.getElementById("resultDetail");
    const chartLegend = document.getElementById("chartLegend");
    const movementChart = document.getElementById("movementChart");
    const comparisonBars = document.getElementById("comparisonBars");

    function parseQueue() {
        return requestQueue.value
            .split(",")
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0)
            .map((entry) => Number(entry));
    }

    function formatNumber(value, digits = 2) {
        return Number(value).toFixed(digits);
    }

    function renderEmptyResults() {
        totalSeekValue.textContent = "--";
        averageSeekValue.textContent = "--";
        throughputValue.textContent = "--";
        resultsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">Run the simulator to show results here.</td>
            </tr>
        `;
        resultDetail.innerHTML = `<p class="empty-state">Run the simulator to inspect service sequence and head path.</p>`;
        chartLegend.innerHTML = "";
        movementChart.innerHTML = "";
        comparisonBars.innerHTML = `<p class="empty-state">Run the simulator to compare algorithms visually.</p>`;
    }

    function validateInput(requests, headValue, maxValue) {
        if (requests.length === 0) {
            return "Enter at least one disk request.";
        }

        if (requests.some((request) => Number.isNaN(request) || !Number.isInteger(request))) {
            return "Request queue must contain only integers.";
        }

        if (!Number.isInteger(headValue) || headValue < 0) {
            return "Initial head must be a non-negative integer.";
        }

        if (!Number.isInteger(maxValue) || maxValue <= 0) {
            return "Max cylinder must be an integer greater than 0.";
        }

        if (headValue > maxValue) {
            return "Initial head cannot be greater than max cylinder.";
        }

        if (requests.some((request) => request < 0 || request > maxValue)) {
            return `All requests must be between 0 and ${maxValue}.`;
        }

        return "";
    }

    function getResults() {
        const requests = parseQueue();
        const headValue = Number(headPosition.value);
        const maxValue = Number(maxCylinder.value);
        const selectedAlgorithm = algorithm.value;
        const validationError = validateInput(requests, headValue, maxValue);

        if (validationError) {
            return { error: validationError };
        }

        const input = {
            requests,
            headPosition: headValue,
            maxCylinder: maxValue,
            direction: direction.value
        };

        if (selectedAlgorithm === "ALL") {
            return { results: window.diskSchedulingAlgorithms.runAllAlgorithms(input) };
        }

        const map = {
            FCFS: () => window.diskSchedulingAlgorithms.fcfs(input.requests, input.headPosition),
            SSTF: () => window.diskSchedulingAlgorithms.sstf(input.requests, input.headPosition),
            SCAN: () => window.diskSchedulingAlgorithms.scan(input.requests, input.headPosition, input.direction, input.maxCylinder),
            "C-SCAN": () => window.diskSchedulingAlgorithms.cscan(input.requests, input.headPosition, input.direction, input.maxCylinder)
        };

        return { results: [map[selectedAlgorithm]()] };
    }

    function renderResults(results) {
        const firstResult = results[0];
        totalSeekValue.textContent = firstResult.totalSeekDistance;
        averageSeekValue.textContent = formatNumber(firstResult.averageSeekTime);
        throughputValue.textContent = formatNumber(firstResult.throughput, 4);

        resultsTableBody.innerHTML = results.map((result) => `
            <tr>
                <td>${result.algorithm}</td>
                <td>${result.sequence.join(", ")}</td>
                <td>${result.totalSeekDistance}</td>
                <td>${formatNumber(result.averageSeekTime)}</td>
                <td>${formatNumber(result.throughput, 4)}</td>
            </tr>
        `).join("");

        resultDetail.innerHTML = results.map((result) => `
            <div class="detail-block">
                <p><strong>${result.algorithm}</strong></p>
                <p><strong>Service sequence:</strong> ${result.sequence.join(" -> ")}</p>
                <p><strong>Head path:</strong> ${result.path.join(" -> ")}</p>
            </div>
        `).join("");

        renderLegend(results);
        renderChart(results);
        renderComparisonBars(results);
    }

    function renderLegend(results) {
        chartLegend.innerHTML = results.map((result) => `
            <span class="legend-item">
                <span class="legend-swatch" style="background:${COLORS[result.algorithm]};"></span>
                ${result.algorithm}
            </span>
        `).join("");
    }

    function renderChart(results) {
        const width = 960;
        const height = 360;
        const padding = { top: 24, right: 24, bottom: 38, left: 52 };
        const innerWidth = width - padding.left - padding.right;
        const innerHeight = height - padding.top - padding.bottom;
        const longestPath = Math.max(...results.map((result) => result.path.length), 2);
        const xStep = longestPath > 1 ? innerWidth / (longestPath - 1) : innerWidth;
        const maxValue = Number(maxCylinder.value);
        const yScale = maxValue > 0 ? innerHeight / maxValue : innerHeight;
        let markup = "";

        for (let tick = 0; tick <= 4; tick += 1) {
            const yValue = Math.round((maxValue / 4) * tick);
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

        movementChart.innerHTML = markup;
    }

    function renderComparisonBars(results) {
        const maxSeek = Math.max(...results.map((result) => result.totalSeekDistance), 1);
        const maxThroughput = Math.max(...results.map((result) => result.throughput), 1);

        comparisonBars.innerHTML = results.map((result) => {
            const seekWidth = (result.totalSeekDistance / maxSeek) * 100;
            const throughputWidth = (result.throughput / maxThroughput) * 100;

            return `
                <article class="comparison-item">
                    <div class="comparison-top">
                        <strong>${result.algorithm}</strong>
                        <span class="comparison-badge">${result.totalSeekDistance} seek</span>
                    </div>
                    <div class="bar-metric">
                        <div class="bar-label">
                            <span>Seek Distance</span>
                            <span>${result.totalSeekDistance}</span>
                        </div>
                        <div class="bar-track">
                            <span class="bar-fill" style="width:${seekWidth}%; background:${COLORS[result.algorithm]};"></span>
                        </div>
                    </div>
                    <div class="bar-metric">
                        <div class="bar-label">
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

    sampleButton.addEventListener("click", () => {
        requestQueue.value = "98, 183, 37, 122, 14, 124, 65, 67";
        headPosition.value = "53";
        maxCylinder.value = "199";
        direction.value = "right";
        algorithm.value = "ALL";
        statusText.textContent = "Sample input loaded. Click Run Simulation to test the connected UI.";
    });

    resetButton.addEventListener("click", () => {
        requestQueue.value = "";
        headPosition.value = "53";
        maxCylinder.value = "199";
        direction.value = "right";
        algorithm.value = "ALL";
        statusText.textContent = "Inputs reset. Day 3 connects the form to real results.";
        renderEmptyResults();
    });

    setupForm.addEventListener("submit", (event) => {
        event.preventDefault();
        runButton.blur();

        const { error, results } = getResults();

        if (error) {
            statusText.innerHTML = `<span class="error-text">${error}</span>`;
            renderEmptyResults();
            return;
        }

        statusText.textContent = "Day 4 complete: the simulator now visualizes head movement and compares algorithm performance.";
        renderResults(results);
    });

    renderEmptyResults();
});
