import type { ChapterResults } from "./chapter.types";
import { sfetch } from "../utils/sfetch";

export interface ChapterArgs {
  manga: string;
  volume?: string;
  chapter?: string;
  offset?: number;
}

export function chapter(args: ChapterArgs) {
  const url = new URL(
    `https://restless-mode-a980.arewecoolyet.workers.dev/chapter`
  );

  url.searchParams.append("manga", args.manga);
  args.volume && url.searchParams.append("volume", args.volume);
  args.chapter && url.searchParams.append("chapter", args.chapter);
  url.searchParams.append("limit", String(10));
  url.searchParams.append("offset", String(args.offset ?? 0));

  return sfetch(url.toString())
    .then((response) => response.json())
    .then((response) => {
      return response as ChapterResults;
    });
}
