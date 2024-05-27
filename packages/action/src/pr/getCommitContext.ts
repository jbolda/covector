import { getOctokit } from "@actions/github";

export function* getCommitContext(
  client: ReturnType<typeof getOctokit>["graphql"],
  owner: string,
  name: string,
  commits: string[]
) {
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
            associatedPullRequests(first: 5) {
              nodes {
                number
                author {
                  login
                }
                reviews(first: 10) {
                  nodes {
                    author {
                      login
                    }
                  }
                }
              }
            }
          }
        }`;
          })
          .join("\n")}
        }
      }
      rateLimit {
        cost
        nodeCount
      }
  `;

  console.dir({ query });

  const response = yield client(query, {
    owner,
    name,
  });

  return response;
}
