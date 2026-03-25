function calculateMetrics(path, requestCount) {
    let totalSeekDistance = 0;

    for (let index = 1; index < path.length; index += 1) {
        totalSeekDistance += Math.abs(path[index] - path[index - 1]);
    }

    return {
        totalSeekDistance,
        averageSeekTime: requestCount > 0 ? totalSeekDistance / requestCount : 0,
        throughput: totalSeekDistance > 0 ? requestCount / totalSeekDistance : 0
    };
}

function createResult(name, path, sequence, requestCount, meta = {}) {
    return {
        algorithm: name,
        path,
        sequence,
        requestCount,
        ...calculateMetrics(path, requestCount),
        ...meta
    };
}

function fcfs(requests, headPosition) {
    const sequence = [...requests];
    const path = [headPosition, ...sequence];
    return createResult("FCFS", path, sequence, requests.length);
}

function sstf(requests, headPosition) {
    const remaining = [...requests];
    const sequence = [];
    const path = [headPosition];
    let currentHead = headPosition;

    while (remaining.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = Math.abs(currentHead - remaining[0]);

        for (let index = 1; index < remaining.length; index += 1) {
            const distance = Math.abs(currentHead - remaining[index]);

            if (distance < nearestDistance || (distance === nearestDistance && remaining[index] < remaining[nearestIndex])) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        }

        const nextRequest = remaining.splice(nearestIndex, 1)[0];
        sequence.push(nextRequest);
        path.push(nextRequest);
        currentHead = nextRequest;
    }

    return createResult("SSTF", path, sequence, requests.length);
}

function scan(requests, headPosition, direction, maxCylinder) {
    const left = requests.filter((request) => request < headPosition).sort((a, b) => b - a);
    const right = requests.filter((request) => request >= headPosition).sort((a, b) => a - b);
    const sequence = direction === "left" ? [...left, ...right] : [...right, ...left];
    const path = [headPosition];

    if (direction === "left") {
        path.push(...left);
        if (path[path.length - 1] !== 0) {
            path.push(0);
        }
        path.push(...right);
    } else {
        path.push(...right);
        if (path[path.length - 1] !== maxCylinder) {
            path.push(maxCylinder);
        }
        path.push(...left);
    }

    return createResult("SCAN", path, sequence, requests.length, { direction });
}

function cscan(requests, headPosition, direction, maxCylinder) {
    const leftAscending = requests.filter((request) => request < headPosition).sort((a, b) => a - b);
    const rightAscending = requests.filter((request) => request >= headPosition).sort((a, b) => a - b);
    const leftDescending = [...leftAscending].sort((a, b) => b - a);
    const rightDescending = [...rightAscending].sort((a, b) => b - a);
    const path = [headPosition];
    let sequence;

    if (direction === "left") {
        sequence = [...leftDescending, ...rightDescending];
        path.push(...leftDescending);
        if (path[path.length - 1] !== 0) {
            path.push(0);
        }
        path.push(maxCylinder);
        path.push(...rightDescending);
    } else {
        sequence = [...rightAscending, ...leftAscending];
        path.push(...rightAscending);
        if (path[path.length - 1] !== maxCylinder) {
            path.push(maxCylinder);
        }
        path.push(0);
        path.push(...leftAscending);
    }

    return createResult("C-SCAN", path, sequence, requests.length, { direction });
}

function runAllAlgorithms({ requests, headPosition, maxCylinder, direction }) {
    return [
        fcfs(requests, headPosition),
        sstf(requests, headPosition),
        scan(requests, headPosition, direction, maxCylinder),
        cscan(requests, headPosition, direction, maxCylinder)
    ];
}

const schedulerBlueprint = {
    algorithms: ["FCFS", "SSTF", "SCAN", "C-SCAN"],
    metrics: ["totalSeekDistance", "averageSeekTime", "throughput"],
    sampleInput: {
        requests: [98, 183, 37, 122, 14, 124, 65, 67],
        headPosition: 53,
        maxCylinder: 199,
        direction: "right"
    }
};

const diskSchedulingAlgorithms = {
    fcfs,
    sstf,
    scan,
    cscan,
    runAllAlgorithms,
    schedulerBlueprint
};

if (typeof window !== "undefined") {
    window.schedulerBlueprint = schedulerBlueprint;
    window.diskSchedulingAlgorithms = diskSchedulingAlgorithms;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = diskSchedulingAlgorithms;
}
