import { DefaultArtifactClient } from "@actions/artifact";
import fs from "node:fs/promises";
import path from "node:path";
import type { GitHub } from "@actions/github/lib/utils";
import { Operation } from "effection";
import type { PullRequestPayload } from "./types";
import { Logger } from "@covector/types";

export function* postGithubComment({
  logger,
  comment,
  octokit,
  payload,
}: {
  logger: Logger;
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
  const tag = "<!-- Covector Action -->\n";
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

  // this can fail if the token doesn't have permissions
  try {
    if (previousComment) {
      logger.info("Updating comment in pull request.");
      yield octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: previousComment.id,
        body,
      });
    } else {
      logger.info("Posting comment in pull request.");
      yield octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body,
      });
    }
  } catch (error) {
    logger.error("Posting comment failed, creating artifact instead.");
    const artifactRoot = process.env.RUNNER_TEMP ?? "..";
    const artifactFilename = "./covector-comment.md";
    const artifactAbsolutePath = path.join(artifactRoot, artifactFilename);
    logger.debug(`Writing comment body to ${artifactAbsolutePath}`);
    yield fs.writeFile(artifactAbsolutePath, body);
    const artifact = new DefaultArtifactClient();
    logger.debug(`Uploading comment from ${artifactAbsolutePath}`);
    yield artifact.uploadArtifact(
      "covector-comment",
      [artifactAbsolutePath],
      artifactRoot,
      {
        retentionDays: 1,
      }
    );
  }
}
