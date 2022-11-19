import { KnownIssue, KnownIssueObj, KnownIssueCaseObj } from '@types';

export const defaultBuildSuffix = 'onprem-ent';
export const defaultKnownIssueType = 'require_verification';

export function getCaseTitle(title: string[] = []) {
    return title ? title.join(' > ') : '';
}

export function knownIssuesToObject(knownIssues?: KnownIssue[]) {
    if (!knownIssues?.length) {
        return {};
    }

    return knownIssues.reduce<KnownIssueObj>((specs, spec) => {
        const casesObj = spec.cases.reduce<KnownIssueCaseObj>((ces, ce) => {
            ces[ce.title] = ce;
            return ces;
        }, {});

        specs[spec.spec_file] = { ...spec, casesObj };
        return specs;
    }, {});
}

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
