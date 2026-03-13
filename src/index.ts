import * as core from '@actions/core';
import { getTagSha, updateTags } from './git.js';
import { parseLevels, parseSourceTag } from './tag.js';

async function run(): Promise<void> {
    try {
        // --- Read inputs ---
        const tag = core.getInput('tag', { required: true });
        const levelsInput = core.getInput('levels');
        const prefix = core.getInput('prefix');
        const skipPrerelease = core.getBooleanInput('skip-prerelease');
        const dryRun = core.getBooleanInput('dry-run');

        // --- Parse levels ---
        const levels = parseLevels(levelsInput);
        core.info(`Tag: ${tag}`);
        core.info(`Levels: ${levels.join(', ')}`);
        core.info(`Prefix: "${prefix}"`);

        // --- Parse source tag ---
        const parsed = parseSourceTag(tag, levels, prefix);
        if (!parsed) {
            throw new Error(`Failed to parse "${tag}" as a valid semver tag`);
        }

        // --- Check prerelease ---
        if (skipPrerelease && parsed.isPrerelease) {
            core.info(`Skipping: "${tag}" is a prerelease version`);
            core.setOutput('skipped', 'true');
            core.setOutput('tags-updated', '');
            core.setOutput('commit-sha', '');
            return;
        }

        // --- Get commit SHA ---
        const sha = dryRun ? '(dry-run)' : await getTagSha(tag);
        core.info(`Commit SHA: ${sha}`);

        // --- Update tags ---
        if (dryRun) {
            core.info('[dry-run] No tags will be modified');
        }

        const results = await updateTags(tag, parsed.tags, dryRun);
        const updatedTags = results.filter((r) => r.created).map((r) => r.tag);

        // --- Set outputs ---
        core.setOutput('skipped', 'false');
        core.setOutput('tags-updated', updatedTags.join(','));
        core.setOutput('commit-sha', sha);

        core.info(`Tags updated: ${updatedTags.join(', ') || '(none)'}`);
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed('An unexpected error occurred');
        }
    }
}

run();
