import type { ChapterResult } from "./chapterClient";
import { sfetch } from "../utils/sfetch";
import { atHomeUrl as fetchAtHomeUrl } from "../api/atHomeUrl";

export type PageClient = {
  getNextPage: () => Promise<string>;
  getPreviousPage: () => Promise<string>;
};

export async function makePageClientFactory(chapter: ChapterResult) {
  const homeUri = await fetchAtHomeUrl(chapter.id);
  return makePageClient(homeUri, chapter);
}

export function makePageClient(
  atHomeUrl: string,
  chapter: ChapterResult
): PageClient {
  let currentPageNumber = -1;

  const urlPageMap: Record<string, string> = {};

  async function swapAtHomeServer() {
    atHomeUrl = await fetchAtHomeUrl(chapter.id);
  }

  async function getPage(pageNumber: number): Promise<string> {
    pageNumber = Math.min(pageNumber, chapter.dataSaverPageHashes.length - 1);
    pageNumber = Math.max(pageNumber, 0);

    const url = new URL(
      `${atHomeUrl}/data-saver/${chapter.hash}/${chapter.dataSaverPageHashes[pageNumber]}`
    );

    if (urlPageMap[url.toString()]) {
      return urlPageMap[url.toString()];
    }

    // mangadex wants us to report how long requests take
    const beforeTime = performance.now();

    try {
      const fetchedPageResponse = await sfetch(url.toString());

      // report the success
      sfetch("https://api.mangadex.network/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: fetchedPageResponse.url,
          success:
            fetchedPageResponse.status >= 200 &&
            fetchedPageResponse.status < 300,
          bytes:
            fetchedPageResponse.headers.get("Content-Length") &&
            Number.parseInt(fetchedPageResponse.headers.get("Content-Length")),
          cached: fetchedPageResponse.headers.get("X-Cache")?.startsWith("HIT"),
          duration: performance.now() - beforeTime,
        }),
      });

      // cache the page URL
      urlPageMap[url.toString()] = fetchedPageResponse.url;
      return fetchedPageResponse.url;
    } catch (err) {
      console.error("Failed to fetch page", err);

      // report the failure
      sfetch("https://api.mangadex.network/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.toString(),
          success: false,
          bytes: 0,
          cached: false,
          duration: performance.now() - beforeTime,
        }),
      });

      // get a new server and try again...
      await swapAtHomeServer();
      return await getPage(pageNumber);
    }
  }

  return {
    getNextPage: async () => {
      const nextPage = await getPage(++currentPageNumber);

      // cache the ahead page too!
      // but don't wait on it
      setTimeout(() => getPage(currentPageNumber + 1), 250);

      return nextPage;
    },
    getPreviousPage: () => getPage(--currentPageNumber),
  };
}
