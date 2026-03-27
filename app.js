document.addEventListener("DOMContentLoaded", () => {
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
    const chartPlaceholder = document.getElementById("chartPlaceholder");

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
        chartPlaceholder.innerHTML = `<span>Day 4 will turn this area into a head movement graph. Day 3 only shows the computed path as text.</span>`;
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

        chartPlaceholder.innerHTML = `<span>Day 3 complete. Current selected output shows the head path as text below; Day 4 will convert it into a graph.</span>`;
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

        statusText.textContent = "Day 3 complete: the UI is now connected to the algorithm engine.";
        renderResults(results);
    });

    renderEmptyResults();
});
