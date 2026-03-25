const assert = require("assert");
const api = require("./algorithms.js");

function verifySampleCase() {
    const results = api.runAllAlgorithms(api.schedulerBlueprint.sampleInput);
    const byName = Object.fromEntries(results.map((result) => [result.algorithm, result]));

    assert.strictEqual(byName.FCFS.totalSeekDistance, 640, "FCFS sample total seek mismatch");
    assert.strictEqual(byName.SSTF.totalSeekDistance, 236, "SSTF sample total seek mismatch");
    assert.strictEqual(byName.SCAN.totalSeekDistance, 331, "SCAN sample total seek mismatch");
    assert.strictEqual(byName["C-SCAN"].totalSeekDistance, 382, "C-SCAN sample total seek mismatch");
}

function verifyEdgeCases() {
    const single = api.fcfs([40], 40);
    assert.deepStrictEqual(single.path, [40, 40], "Single-request path should include the starting head and request");
    assert.strictEqual(single.totalSeekDistance, 0, "Single request at the head should require zero seek");

    const repeated = api.sstf([20, 20, 20], 10);
    assert.deepStrictEqual(repeated.sequence, [20, 20, 20], "Repeated requests should all be serviced");
    assert.strictEqual(repeated.totalSeekDistance, 10, "Repeated requests should not add extra movement once reached");

    const scanLeft = api.scan([10, 20, 90], 50, "left", 199);
    assert.deepStrictEqual(scanLeft.sequence, [20, 10, 90], "SCAN left sequence mismatch");
    assert.strictEqual(scanLeft.path[scanLeft.path.length - 1], 90, "SCAN left should finish on the far-right pending request");

    const cscanRight = api.cscan([10, 20, 90], 50, "right", 199);
    assert.deepStrictEqual(cscanRight.sequence, [90, 10, 20], "C-SCAN right sequence mismatch");
    assert.ok(cscanRight.path.includes(199) && cscanRight.path.includes(0), "C-SCAN should wrap between disk ends");
}

verifySampleCase();
verifyEdgeCases();
console.log("Algorithm verification passed.");
