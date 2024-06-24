import { GitHub } from "@actions/github/lib/utils";
import { Operation } from "effection";
import type { WorkflowRunEvent } from "@octokit/webhooks-definitions/schema";
import { Logger } from "@covector/types";
import { postGithubComment } from "./postGithubComment";

export function* postGithubCommentFromArtifact({
  logger,
  octokit,
  payload,
}: {
  logger: Logger;
  octokit: InstanceType<typeof GitHub>;
  payload: WorkflowRunEvent;
}): Operation<void> {
  const {
    repository: {
      name: repo,
      owner: { login: owner },
    },
  } = payload;
  const allArtifacts = yield octokit.rest.actions.listWorkflowRunArtifacts({
    owner: owner,
    repo: repo,
    run_id: payload.workflow_run.id,
  });

  // download the artifact from `pull_request` workflow that generated it
  const commentArtifact = allArtifacts.data.artifacts.filter((artifact) => {
    return artifact.name == "covector-comment";
  })[0];
  const downloadComment = yield octokit.rest.actions.downloadArtifact({
    owner: owner,
    repo: repo,
    artifact_id: commentArtifact.id,
    archive_format: "zip",
  });
  const comment = Buffer.from(downloadComment.data).toString();

  // the `github.context` does not contain a PR number when triggered through a fork
  //  so uploading it as an artifact and downloading it here to comment
  const prNumberArtifact = allArtifacts.data.artifacts.filter((artifact) => {
    return artifact.name == "covector-prNumber";
  })[0];
  const downloadPRNumber = yield octokit.rest.actions.downloadArtifact({
    owner: owner,
    repo: repo,
    artifact_id: prNumberArtifact.id,
    archive_format: "zip",
  });
  const prNumber = parseInt(Buffer.from(downloadPRNumber.data).toString(), 10);

  yield postGithubComment({ logger, comment, octokit, repo, owner, prNumber });
}
