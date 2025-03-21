import type { getOctokit } from "@actions/github";
import { type Operation } from "effection";
import type { Logger } from "@covector/types";
import type { webhooks } from "@octokit/openapi-webhooks-types";
type WorkflowRunEvent = webhooks["workflow-run-requested"]["post"]["requestBody"]["content"]["application/json"];
export declare function postGithubCommentFromArtifact({ logger, octokit, token, payload, }: {
    logger: Logger;
    octokit: ReturnType<typeof getOctokit>;
    token: string;
    payload: WorkflowRunEvent;
}): Operation<void>;
export {};
//# sourceMappingURL=postGithubCommentFromArtifact.d.ts.map