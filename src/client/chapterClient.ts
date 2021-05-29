import { chapter, ChapterArgs } from "../api/chapter";

export interface ChapterResult {
  id: string;
  title: string;
  volume: number;
  chapter: number;
  hash: string;
  dataSaverPageHashes: string[];
}

export interface ChapterClient {
  changeMangaQuery(query: Pick<ChapterArgs, "manga">): void;
  getNextPageOfResults(): Promise<ChapterResult[]>;
}

export function makeChapterClient(): ChapterClient {
  let query: Pick<ChapterArgs, "manga"> | undefined;
  let currentOffset = 0;

  return {
    changeMangaQuery: (newQuery) => {
      query = newQuery;
      currentOffset = 0;
    },
    getNextPageOfResults: async () => {
      if (query) {
        const chapterResponse = await chapter({
          ...query,
          offset: currentOffset,
        });
        currentOffset += 10;

        return chapterResponse.results.map((chapterResult) => ({
          id: chapterResult.data.id,
          title: chapterResult.data.attributes.title,
          volume: Number(chapterResult.data.attributes.volume || 0),
          chapter: Number(chapterResult.data.attributes.chapter || 0),
          hash: chapterResult.data.attributes.hash,
          dataSaverPageHashes: chapterResult.data.attributes.dataSaver,
        }));
      } else {
        return [];
      }
    },
  };
}
