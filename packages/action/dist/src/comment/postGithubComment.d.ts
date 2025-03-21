import type { getOctokit } from "@actions/github";
import { Operation } from "effection";
import { Logger } from "@covector/types";
export declare function postGithubComment({ logger, comment, octokit, repo, owner, prNumber: issue_number, artifactOnFailure, }: {
    logger: Logger;
    comment: string;
    octokit: ReturnType<typeof getOctokit>;
    repo: string;
    owner: string;
    prNumber: number;
    artifactOnFailure?: boolean;
}): Operation<void>;
//# sourceMappingURL=postGithubComment.d.ts.map