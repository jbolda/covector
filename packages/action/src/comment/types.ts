import { WebhookPayload } from "@actions/github/lib/interfaces";

interface PullRequestBranch {
  ref: string;
  repo: {
    url: string;
  };
  sha: string;
}

export interface PullRequestPayload extends WebhookPayload {
  pull_request: WebhookPayload["pull_request"] & {
    head: PullRequestBranch;
    base: PullRequestBranch;
  };
  repository: WebhookPayload["repository"] & {
    owner: {
      login: string;
    };
  };
}
