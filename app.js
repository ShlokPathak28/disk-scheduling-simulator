document.addEventListener("DOMContentLoaded", () => {
    const COLORS = {
        FCFS: "#3b82f6",
        SSTF: "#f59e0b",
        SCAN: "#10b981",
        "C-SCAN": "#8b5cf6"
    };
    const toggleBtn = document.getElementById("themeToggle");

// Load saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    toggleBtn.textContent = "☀️ Light";
}

toggleBtn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";

    if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        toggleBtn.textContent = "🌙 Dark";
        localStorage.setItem("theme", "light");
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        toggleBtn.textContent = "☀️ Light";
        localStorage.setItem("theme", "dark");
    }
});

    const COLORS_LIGHT = {
        FCFS: "rgba(59,130,246,0.13)",
        SSTF: "rgba(245,158,11,0.13)",
        SCAN: "rgba(16,185,129,0.13)",
        "C-SCAN": "rgba(139,92,246,0.13)"
    };

    const setupForm = document.getElementById("setupForm");
    const runButton = document.getElementById("runButton");
    const sampleButton = document.getElementById("sampleButton");
    const resetButton = document.getElementById("resetButton");
    const requestQueue = document.getElementById("requestQueue");
    const headPosition = document.getElementById("headPosition");
    const maxCylinder = document.getElementById("maxCylinder");
    const direction = document.getElementById("direction");
    const directionHint = document.getElementById("directionHint");
    const algorithm = document.getElementById("algorithm");
    const algorithmPills = document.getElementById("algorithmPills");
    const statusText = document.getElementById("statusText");
    const inputSummary = document.getElementById("inputSummary");
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

    function setActiveAlgorithm(selectedAlgorithm) {
        algorithm.value = selectedAlgorithm;
        algorithmPills.querySelectorAll(".algorithm-pill").forEach((pill) => {
            pill.classList.toggle("is-active", pill.dataset.algorithm === selectedAlgorithm);
        });
    }

    function updateControlState() {
        const selectedAlgorithm = algorithm.value;

        if (selectedAlgorithm === "FCFS" || selectedAlgorithm === "SSTF") {
            direction.disabled = true;
            directionHint.textContent = "Direction is ignored for FCFS and SSTF.";
            return;
        }

        direction.disabled = false;
        directionHint.textContent = selectedAlgorithm === "ALL"
            ? "Used by SCAN and C-SCAN during comparison."
            : "Used by SCAN and C-SCAN.";
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
        const bestBySeek = [...results].sort((left, right) => left.totalSeekDistance - right.totalSeekDistance)[0];

        totalSeekValue.textContent = firstResult.totalSeekDistance;
        averageSeekValue.textContent = formatNumber(firstResult.averageSeekTime);
        throughputValue.textContent = formatNumber(firstResult.throughput, 4);
        inputSummary.textContent = results.length === 1
            ? `${firstResult.algorithm} result shown. Head path visualization is active.`
            : `${results.length} algorithm results shown. Lowest seek distance: ${bestBySeek.algorithm}.`;

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
                <p><strong>Total seek distance:</strong> ${result.totalSeekDistance}</p>
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
        let defs = `<defs>`;

        // Glow filter
        defs += `
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>`;

        // Gradient fills per algorithm
        results.forEach((result) => {
            const id = result.algorithm.replace("-", "");
            defs += `
                <linearGradient id="grad_${id}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${COLORS[result.algorithm]}" stop-opacity="0.28"/>
                    <stop offset="100%" stop-color="${COLORS[result.algorithm]}" stop-opacity="0.02"/>
                </linearGradient>`;
        });
        defs += `</defs>`;

        let markup = defs;

        // Dashed horizontal grid lines
        for (let tick = 0; tick <= 4; tick += 1) {
            const yValue = Math.round((maxValue / 4) * tick);
            const y = padding.top + innerHeight - (yValue * yScale);
            markup += `<line class="grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>`;
            markup += `<text class="axis-label" x="${padding.left - 12}" y="${y + 4}" text-anchor="end">${yValue}</text>`;
        }

        // Dashed vertical grid lines
        for (let step = 0; step < longestPath; step += 1) {
            const x = padding.left + step * xStep;
            markup += `<line class="grid-line" x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}"></line>`;
            markup += `<text class="axis-label" x="${x}" y="${height - 12}" text-anchor="middle">${step}</text>`;
        }

        markup += `<text class="axis-label axis-title" x="${width / 2}" y="${height - 2}" text-anchor="middle">Service Step</text>`;
        markup += `<text class="axis-label axis-title" x="16" y="${height / 2}" text-anchor="middle" transform="rotate(-90 16 ${height / 2})">Cylinder</text>`;

        // Render each algorithm
        results.forEach((result, idx) => {
            const id = result.algorithm.replace("-", "");
            const points = result.path.map((value, index) => {
                const x = padding.left + index * xStep;
                const y = padding.top + innerHeight - (value * yScale);
                return { x, y, value };
            });

            const polyStr = points.map((p) => `${p.x},${p.y}`).join(" ");

            // Area fill
            const bottomY = padding.top + innerHeight;
            const areaStr = `${points[0].x},${bottomY} ${polyStr} ${points[points.length - 1].x},${bottomY}`;
            markup += `<polygon class="path-area" points="${areaStr}" fill="url(#grad_${id})"></polygon>`;

            // Animated line
            markup += `<polyline class="path-line" points="${polyStr}" stroke="${COLORS[result.algorithm]}" filter="url(#glow)" style="animation-delay:${idx * 0.18}s"></polyline>`;

            // Points with outer ring + value label
            markup += points.map((point) => `
                <circle class="path-point-ring" cx="${point.x}" cy="${point.y}" r="9" stroke="${COLORS[result.algorithm]}" fill="none" stroke-width="1.5" opacity="0.25"/>
                <circle class="path-point" cx="${point.x}" cy="${point.y}" r="5" fill="${COLORS[result.algorithm]}">
                    <title>${result.algorithm}: cylinder ${point.value}</title>
                </circle>
                <text class="point-label" x="${point.x}" y="${point.y - 14}" text-anchor="middle" fill="${COLORS[result.algorithm]}">${point.value}</text>
            `).join("");
        });

        movementChart.innerHTML = markup;

        // Calculate total path length for each polyline to drive stroke animation
        requestAnimationFrame(() => {
            movementChart.querySelectorAll(".path-line").forEach((line) => {
                const length = line.getTotalLength();
                line.style.strokeDasharray = length;
                line.style.strokeDashoffset = length;
                line.classList.add("animate-draw");
            });
        });
    }

    function renderComparisonBars(results) {
        const maxSeek = Math.max(...results.map((result) => result.totalSeekDistance), 1);
        const maxThroughput = Math.max(...results.map((result) => result.throughput), 1);
        const bestAlgo = [...results].sort((a, b) => a.totalSeekDistance - b.totalSeekDistance)[0]?.algorithm;

        comparisonBars.innerHTML = results.map((result) => {
            const seekWidth = (result.totalSeekDistance / maxSeek) * 100;
            const throughputWidth = (result.throughput / maxThroughput) * 100;
            const isBest = result.algorithm === bestAlgo && results.length > 1;
            const winnerBadge = isBest
                ? `<span class="winner-badge">★ Best</span>`
                : "";

            return `
                <article class="comparison-item${isBest ? " comparison-item-best" : ""}">
                    <div class="comparison-top">
                        <strong>${result.algorithm} ${winnerBadge}</strong>
                        <span class="comparison-badge">${result.totalSeekDistance} seek</span>
                    </div>
                    <div class="bar-metric">
                        <div class="bar-label">
                            <span>Seek Distance</span>
                            <span>${result.totalSeekDistance}</span>
                        </div>
                        <div class="bar-track">
                            <span class="bar-fill bar-fill-animated" style="--target-width:${seekWidth}%; background:linear-gradient(90deg, ${COLORS[result.algorithm]}, ${COLORS[result.algorithm]}cc);"></span>
                        </div>
                    </div>
                    <div class="bar-metric">
                        <div class="bar-label">
                            <span>Throughput</span>
                            <span>${formatNumber(result.throughput, 4)}</span>
                        </div>
                        <div class="bar-track">
                            <span class="bar-fill bar-fill-animated" style="--target-width:${throughputWidth}%; background:linear-gradient(90deg, ${COLORS[result.algorithm]}, ${COLORS[result.algorithm]}cc);"></span>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    algorithmPills.addEventListener("click", (event) => {
        const pill = event.target.closest(".algorithm-pill");

        if (!pill) {
            return;
        }

        setActiveAlgorithm(pill.dataset.algorithm);
        updateControlState();
    });

    sampleButton.addEventListener("click", () => {
        requestQueue.value = "98, 183, 37, 122, 14, 124, 65, 67";
        headPosition.value = "53";
        maxCylinder.value = "199";
        direction.value = "right";
        setActiveAlgorithm("ALL");
        updateControlState();
        statusText.textContent = "Sample input loaded. Click Execute Sequence to compare the algorithms.";
        inputSummary.textContent = "Sample queue loaded and ready to run.";
    });

    resetButton.addEventListener("click", () => {
        requestQueue.value = "";
        headPosition.value = "53";
        maxCylinder.value = "199";
        direction.value = "right";
        setActiveAlgorithm("ALL");
        updateControlState();
        statusText.textContent = "Inputs reset. Enter a queue or load the sample to continue.";
        inputSummary.textContent = "Load the sample or enter your own queue, then run the simulator.";
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

        statusText.textContent = "Simulation complete. Review the metrics, graph, and benchmark output below.";
        renderResults(results);
    });

    updateControlState();
    renderEmptyResults();
});
