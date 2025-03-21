import type { CovectorStatus } from "@covector/types";
import type { webhooks } from "@octokit/openapi-webhooks-types";
type PullRequestEvent = webhooks["pull-request-synchronize"]["post"]["requestBody"]["content"]["application/json"];
export declare function formatComment({ covectored, payload, projectReadmeExists, changeFolder, }: {
    covectored: CovectorStatus;
    payload: PullRequestEvent;
    projectReadmeExists: boolean;
    changeFolder: string;
}): string | undefined;
export {};
//# sourceMappingURL=formatGithubComment.d.ts.map