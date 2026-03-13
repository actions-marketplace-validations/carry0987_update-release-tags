import * as core from '@actions/core';
import * as exec from '@actions/exec';
import type { TagUpdateResult } from './tag.js';

/**
 * Configure git user for tagging.
 */
async function configureGit(): Promise<void> {
    await exec.exec('git', ['config', 'user.name', 'github-actions[bot]']);
    await exec.exec('git', ['config', 'user.email', 'github-actions[bot]@users.noreply.github.com']);
}

/**
 * Get the commit SHA that a tag points to.
 */
export async function getTagSha(tag: string): Promise<string> {
    let sha = '';
    await exec.exec('git', ['rev-parse', tag], {
        listeners: {
            stdout: (data: Buffer) => {
                sha += data.toString();
            }
        }
    });
    return sha.trim();
}

/**
 * Create or update a tag pointing to the source tag's commit.
 */
async function updateTag(slidingTag: string, sourceTag: string, dryRun: boolean): Promise<boolean> {
    if (dryRun) {
        core.info(`[dry-run] Would update tag "${slidingTag}" → "${sourceTag}"`);
        return true;
    }

    await exec.exec('git', ['tag', '-fa', slidingTag, sourceTag, '-m', `Update ${slidingTag} tag to ${sourceTag}`]);
    await exec.exec('git', ['push', '-f', 'origin', slidingTag]);
    core.info(`Updated tag "${slidingTag}" → "${sourceTag}"`);
    return true;
}

/**
 * Update all sliding tags for the given source tag.
 */
export async function updateTags(
    sourceTag: string,
    slidingTags: string[],
    dryRun: boolean
): Promise<TagUpdateResult[]> {
    if (!dryRun) {
        await configureGit();
    }

    const results: TagUpdateResult[] = [];
    for (const tag of slidingTags) {
        const created = await updateTag(tag, sourceTag, dryRun);
        results.push({ tag, created });
    }

    return results;
}
