import { postGithubComment } from "./postGithubComment";
import { DefaultArtifactClient } from "@actions/artifact";
import fs from "node:fs/promises";
import path from "node:path";
import type { GitHub } from "@actions/github/lib/utils";
import type { Operation } from "effection";
import type { WorkflowRunEvent } from "@octokit/webhooks-definitions/schema";
import type { Logger } from "@covector/types";

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

  const artifact = new DefaultArtifactClient();
  const artifactRoot = process.env.RUNNER_TEMP ?? "..";
  const { downloadPath } = yield artifact.downloadArtifact(commentArtifact.id, {
    // optional: download destination path. otherwise defaults to $GITHUB_WORKSPACE
    path: artifactRoot,
  });

  const comment = yield fs.readFile(
    path.join(downloadPath, "covector-comment.md"),
    { encoding: "utf8" }
  );
  // the `github.context` does not contain a PR number when triggered through a fork
  //  so uploading it as an artifact and downloading it here to comment
  const prNumberAsString = yield fs.readFile(
    path.join(downloadPath, "covector-prNumber.md"),
    { encoding: "utf8" }
  );
  const prNumber = parseInt(prNumberAsString, 10);

  yield postGithubComment({ logger, comment, octokit, repo, owner, prNumber });
}
