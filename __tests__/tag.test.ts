import { describe, expect, it } from 'vitest';
import { parseLevels, parseSourceTag } from '../src/tag.js';

describe('parseLevels', () => {
    it('parses single level', () => {
        expect(parseLevels('major')).toEqual(['major']);
    });

    it('parses multiple levels', () => {
        expect(parseLevels('major,minor')).toEqual(['major', 'minor']);
    });

    it('trims whitespace', () => {
        expect(parseLevels(' major , minor ')).toEqual(['major', 'minor']);
    });

    it('is case-insensitive', () => {
        expect(parseLevels('Major,MINOR')).toEqual(['major', 'minor']);
    });

    it('deduplicates', () => {
        expect(parseLevels('major,major,minor')).toEqual(['major', 'minor']);
    });

    it('filters invalid levels', () => {
        expect(parseLevels('major,patch,minor')).toEqual(['major', 'minor']);
    });

    it('throws on all invalid levels', () => {
        expect(() => parseLevels('patch,foo')).toThrow('Invalid levels');
    });

    it('throws on empty string', () => {
        expect(() => parseLevels('')).toThrow('Invalid levels');
    });
});

describe('parseSourceTag', () => {
    describe('with v prefix', () => {
        it('generates major tag', () => {
            const result = parseSourceTag('v1.3.0', ['major'], 'v');
            expect(result).not.toBeNull();
            expect(result?.tags).toEqual(['v1']);
            expect(result?.isPrerelease).toBe(false);
        });

        it('generates minor tag', () => {
            const result = parseSourceTag('v1.3.0', ['minor'], 'v');
            expect(result).not.toBeNull();
            expect(result?.tags).toEqual(['v1.3']);
        });

        it('generates both major and minor tags', () => {
            const result = parseSourceTag('v2.5.1', ['major', 'minor'], 'v');
            expect(result).not.toBeNull();
            expect(result?.tags).toEqual(['v2', 'v2.5']);
        });
    });

    describe('prerelease detection', () => {
        it('detects prerelease', () => {
            const result = parseSourceTag('v3.0.0-beta.1', ['major'], 'v');
            expect(result).not.toBeNull();
            expect(result?.isPrerelease).toBe(true);
            expect(result?.tags).toEqual(['v3']);
        });

        it('detects stable release', () => {
            const result = parseSourceTag('v1.0.0', ['major'], 'v');
            expect(result?.isPrerelease).toBe(false);
        });
    });

    describe('custom prefix', () => {
        it('handles empty prefix', () => {
            const result = parseSourceTag('1.3.0', ['major', 'minor'], '');
            expect(result).not.toBeNull();
            expect(result?.tags).toEqual(['1', '1.3']);
        });

        it('handles custom prefix', () => {
            const result = parseSourceTag('release-1.3.0', ['major'], 'release-');
            expect(result).not.toBeNull();
            expect(result?.tags).toEqual(['release-1']);
        });
    });

    describe('invalid input', () => {
        it('returns null for non-semver', () => {
            expect(parseSourceTag('not-a-version', ['major'], 'v')).toBeNull();
        });

        it('returns null for empty tag', () => {
            expect(parseSourceTag('', ['major'], 'v')).toBeNull();
        });
    });
});
