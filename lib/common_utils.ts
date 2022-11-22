export function parseBuild(build = '') {
    // format: pipelineID-imageTag-buildSuffix
    const minLength = 3;

    const out = {
        pipelineID: '',
        imageTag: '',
        buildSuffix: '',
    };

    const parts = build.split('-');
    if (parts.length >= minLength) {
        out.pipelineID = parts[0];
        out.imageTag = parts[1];
        out.buildSuffix = parts.slice(2, parts.length).join('-');
    }

    return out;
}
