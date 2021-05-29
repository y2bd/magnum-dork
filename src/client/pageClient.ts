import type { ChapterResult } from "./chapterClient";
import { sfetch } from "../utils/sfetch";
import { atHomeUrl } from "../api/atHomeUrl";

export type PageClient = {
  getNextPage: () => Promise<string>;
  getPreviousPage: () => Promise<string>;
};

export async function makePageClientFactory(chapter: ChapterResult) {
  const homeUri = await atHomeUrl(chapter.id);
  return makePageClient(homeUri, chapter);
}

export function makePageClient(
  atHomeUrl: string,
  chapter: ChapterResult
): PageClient {
  let currentPageNumber = -1;

  const urlPageMap: Record<string, string> = {};

  function getPage(pageNumber: number) {
    pageNumber = Math.min(pageNumber, chapter.dataSaverPageHashes.length - 1);
    pageNumber = Math.max(pageNumber, 0);

    const url = new URL(
      `${atHomeUrl}/data-saver/${chapter.hash}/${chapter.dataSaverPageHashes[pageNumber]}`
    );

    if (urlPageMap[url.toString()]) {
      return Promise.resolve(urlPageMap[url.toString()]);
    }

    return sfetch(url.toString()).then((response) => {
      sfetch("https://api.mangadex.network/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: response.url,
          success: response.status >= 200 && response.status < 300,
          bytes:
            response.headers.get("Content-Length") &&
            Number.parseInt(response.headers.get("Content-Length")),
          cached: response.headers.get("X-Cache")?.startsWith("HIT"),
        }),
      });

      urlPageMap[url.toString()] = response.url;

      return response.url;
    });
  }

  return {
    getNextPage: () =>
      getPage(currentPageNumber + 2) && getPage(++currentPageNumber),
    getPreviousPage: () => getPage(--currentPageNumber),
  };
}
