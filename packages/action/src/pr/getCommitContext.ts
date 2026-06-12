import { getOctokit } from "@actions/github";
import { call, Operation } from "effection";

export type CommitResponse = {
  repository: Record<string, Commit>;
};
type Commit = {
  abbreviatedOid: string;
  associatedPullRequests: {
    nodes: {
      number: number;
      author: { login: string };
      reviews?: { nodes: { author: { login: string } }[] };
    }[];
  };
};

export function* getCommitContext(
  client: ReturnType<typeof getOctokit>["graphql"],
  owner: string,
  name: string,
  commits: string[]
): Operation<CommitResponse> {
  const query = /* GraphQL */ `
    query RepositoryCommits($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        ${commits
          .map((commit) => {
            return /* GraphQL */ `sha_${commit}: object(
          expression: "${commit}"
        ) {
          ... on Commit {
            abbreviatedOid
            associatedPullRequests(first: 1) {
              nodes {
                number
                author {
                  login
                }
                # Hard to support reviewers without possible excessive verbosity and spam, disabling
                # reviews(first: 5, states: [APPROVED]) {
                #   nodes {
                #     author {
                #       login
                #     }
                #   }
                # }
              }
            }
          }
        }`;
          })
          .join("\n")}
        }
    #   rateLimit {
    #     cost
    #     nodeCount
    #   }
    }`;

  const response = yield* call(async () =>
    client(query, {
      owner,
      name,
    })
  ) as Operation<CommitResponse>;

  return response;
}
