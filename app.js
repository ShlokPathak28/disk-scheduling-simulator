document.addEventListener("DOMContentLoaded", () => {
    const sampleButton = document.getElementById("sampleButton");
    const resetButton = document.getElementById("resetButton");
    const requestQueue = document.getElementById("requestQueue");
    const headPosition = document.getElementById("headPosition");
    const maxCylinder = document.getElementById("maxCylinder");
    const direction = document.getElementById("direction");
    const algorithm = document.getElementById("algorithm");
    const statusText = document.getElementById("statusText");

    sampleButton.addEventListener("click", () => {
        requestQueue.value = "98, 183, 37, 122, 14, 124, 65, 67";
        headPosition.value = "53";
        maxCylinder.value = "199";
        direction.value = "right";
        algorithm.value = "ALL";
        statusText.textContent = "Sample input loaded. Day 2 will connect this form to the algorithms.";
    });

    resetButton.addEventListener("click", () => {
        requestQueue.value = "";
        headPosition.value = "53";
        maxCylinder.value = "199";
        direction.value = "right";
        algorithm.value = "ALL";
        statusText.textContent = "Inputs reset. Day 1 setup is ready.";
    });
});
