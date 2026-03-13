import * as semver from 'semver';

export type TagLevel = 'major' | 'minor';

export interface TagUpdateResult {
    tag: string;
    created: boolean;
}

export interface ParsedTag {
    version: semver.SemVer;
    tags: string[];
    isPrerelease: boolean;
}

/**
 * Parse a source tag and determine which sliding tags should be created/updated.
 * Returns null if the tag is not a valid semver.
 */
export function parseSourceTag(tag: string, levels: TagLevel[], prefix: string): ParsedTag | null {
    // Strip prefix for parsing
    const raw = prefix && tag.startsWith(prefix) ? tag.slice(prefix.length) : tag;
    const version = semver.parse(raw);
    if (!version) {
        return null;
    }

    const isPrerelease = version.prerelease.length > 0;
    const tags: string[] = [];

    for (const level of levels) {
        switch (level) {
            case 'major':
                tags.push(`${prefix}${version.major}`);
                break;
            case 'minor':
                tags.push(`${prefix}${version.major}.${version.minor}`);
                break;
        }
    }

    return { version, tags, isPrerelease };
}

/**
 * Parse a comma-separated levels string into an array of TagLevel values.
 */
export function parseLevels(input: string): TagLevel[] {
    const valid: TagLevel[] = ['major', 'minor'];
    const levels = input
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s): s is TagLevel => valid.includes(s as TagLevel));

    if (levels.length === 0) {
        throw new Error(`Invalid levels: "${input}". Must be a comma-separated list of: major, minor`);
    }

    // Deduplicate while preserving order
    return [...new Set(levels)];
}
