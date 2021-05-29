import type { SearchResults } from "./search.types";
import { sfetch } from "../utils/sfetch";

export interface SearchArgs {
  title: string;
  offset?: number;
}

export function search(args: SearchArgs) {
  const url = new URL(
    "https://restless-mode-a980.arewecoolyet.workers.dev/manga"
  );
  url.searchParams.append("title", args.title);
  url.searchParams.append("limit", String(10));
  url.searchParams.append("offset", String(args.offset ?? 0));

  return sfetch(url.toString())
    .then((response) => response.json())
    .then((response: SearchResults) => {
      return response.results;
    });
}
