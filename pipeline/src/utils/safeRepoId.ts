/**
 * Return a safe display name for a repo in logs.
 * Private repos are redacted to avoid leaking names into CI logs.
 */
function safeRepoId(owner: string, repo: string, isPrivate: boolean): string {
    return isPrivate ? "[private]" : `${owner}/${repo}`;
}

export default safeRepoId;
