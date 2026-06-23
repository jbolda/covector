import { DefaultArtifactClient } from "@actions/artifact";
import fs from "node:fs/promises";
import path from "node:path";
import type { getOctokit } from "@actions/github";
import { until, Operation } from "effection";
import { Logger } from "@covector/types";

export function* postGithubComment({
  logger,
  comment,
  octokit,
  repo,
  owner,
  prNumber: issue_number,
  artifactOnFailure = true,
}: {
  logger: Logger;
  comment: string;
  octokit: ReturnType<typeof getOctokit>;
  repo: string;
  owner: string;
  prNumber: number;
  artifactOnFailure?: boolean;
}): Operation<void> {
  const tag = "<!-- Covector Action -->\n";
  const body = tag + comment;
  const allComments = yield* until(
    octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number,
    })
  );
  const previousComment =
    allComments.data.length > 0 &&
    allComments.data.find((comment) => comment?.body?.includes(tag));

  // this can fail if the token doesn't have permissions
  try {
    if (previousComment) {
      yield* logger.info("Updating comment in pull request.");
      yield* until(
        octokit.rest.issues.updateComment({
          owner,
          repo,
          comment_id: previousComment.id,
          body,
        })
      );
    } else {
      yield* logger.info("Posting comment in pull request.");
      yield* until(
        octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number,
          body,
        })
      );
    }
  } catch (error) {
    if (artifactOnFailure) {
      yield* logger.error("Posting comment failed, creating artifact instead.");
      const artifactRoot = process.env.RUNNER_TEMP ?? "..";

      const artifactFilename = "./covector-comment.md";
      const artifactAbsolutePath = path.join(artifactRoot, artifactFilename);
      yield* logger.debug(`Writing comment body to ${artifactAbsolutePath}`);
      yield* until(fs.writeFile(artifactAbsolutePath, body));

      const artifactPRNumber = "./covector-prNumber.md";
      const prNumberAbsolutePath = path.join(artifactRoot, artifactPRNumber);
      yield* until(
        fs.writeFile(prNumberAbsolutePath, issue_number.toString())
      );

      const artifact = new DefaultArtifactClient();
      yield* logger.debug(`Uploading comment from ${artifactAbsolutePath}`);
      yield* until(
        artifact.uploadArtifact(
          "covector-comment",
          [artifactAbsolutePath, prNumberAbsolutePath],
          artifactRoot,
          {
            retentionDays: 1,
          }
        )
      );
    } else {
      yield* logger.fatal(`Posting comment failed.`);
    }
  }
}
