import { GitHub } from "@actions/github/lib/utils";
import { Operation } from "effection";
import { WebhookPayload } from "@actions/github/lib/interfaces";

interface PullRequestBranch {
  ref: string;
  repo: {
    url: string;
  };
  sha: string;
}

interface PullRequestPayload extends WebhookPayload {
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

export function* postGithubComment({
  comment,
  octokit,
  payload,
}: {
  comment: string;
  octokit: InstanceType<typeof GitHub>;
  payload: PullRequestPayload;
}): Operation<void> {
  const {
    repository: {
      name: repo,
      owner: { login: owner },
    },
    pull_request: { number: issue_number },
  } = payload;
  const tag = "<!-- Covector Action -->";
  const body = tag + comment;
  const allComments = yield octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number,
  });
  const previousComment =
    allComments.data.length > 0 &&
    allComments.data.find((comment: { body: string | string[] }) =>
      comment.body.includes(tag)
    );

  if (previousComment) {
    console.log("Updating comment in pull request.");
    yield octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: previousComment.id,
      body,
    });
  } else {
    console.log("Posting comment in pull request.");
    yield octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });
  }
}
