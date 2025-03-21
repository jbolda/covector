import { getOctokit } from "@actions/github";
import { Operation } from "effection";
export type CommitResponse = {
    repository: Record<string, Commit>;
};
type Commit = {
    abbreviatedOid: string;
    associatedPullRequests: {
        nodes: {
            number: number;
            author: {
                login: string;
            };
            reviews?: {
                nodes: {
                    author: {
                        login: string;
                    };
                }[];
            };
        }[];
    };
};
export declare function getCommitContext(client: ReturnType<typeof getOctokit>["graphql"], owner: string, name: string, commits: string[]): Operation<CommitResponse>;
export {};
//# sourceMappingURL=getCommitContext.d.ts.map