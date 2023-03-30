import { Cycle } from '@types';

export function parseBuild(build = '') {
    // format: pipelineID-imageTag-buildSuffix
    const minLength = 3;

    const out = {
        pipelineID: '',
        imageTag: '',
        buildSuffix: '',
    };

    const parts = build.split('-');
    const length = parts.length;
    if (parts.length >= minLength) {
        out.pipelineID = parts[0];
        out.imageTag = parts[1];
        out.buildSuffix = parts.slice(length - 2, length).join('-');
    }

    return out;
}

const stateCutOff = [
    { cutOff: 100, color: 'green-700', hexColor: '#43A047' },
    { cutOff: 98, color: 'cyan-600', hexColor: '#FFEB3B' },
    { cutOff: 95, color: 'amber-600', hexColor: '#FF9800' },
    { cutOff: 0, color: 'red-600', hexColor: '#F44336' },
];

export function getCycleSummary(cycle: Cycle) {
    const { pass, fail, pending, skipped } = cycle;

    const totalCases = pass + fail + pending + skipped;
    const passingRate = totalCases ? (pass / totalCases) * 100 : 0;

    let color;
    let hexColor;
    for (let i = 0; i < stateCutOff.length; i++) {
        if (passingRate >= stateCutOff[i].cutOff) {
            ({ color, hexColor } = stateCutOff[i]);
            break;
        }
    }

    return {
        totalCases,
        pass,
        fail,
        passingRate: passingRate.toFixed(2),
        passingRateNumber: passingRate,
        color,
        hexColor,
    };
}
