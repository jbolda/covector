import { GitHub } from "@actions/github/lib/utils";
import { Operation } from "effection";
import { Logger } from "@covector/types";

export function* postGithubComment({
  logger,
  comment,
  octokit,
  repo,
  owner,
  prNumber: issue_number,
}: {
  logger: Logger;
  comment: string;
  octokit: InstanceType<typeof GitHub>;
  repo: string;
  owner: string;
  prNumber: number;
}): Operation<void> {
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
}
