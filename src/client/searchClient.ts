import { search, SearchArgs } from "../api/search";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  volumeCount: number;
}

export interface SearchClient {
  changeSearchQuery(query: Pick<SearchArgs, "title">);
  getNextPageOfResults(): Promise<SearchResult[]>;
}

export function makeSearchClient(): SearchClient {
  let query: Pick<SearchArgs, "title"> | undefined;
  let currentOffset = 0;

  return {
    changeSearchQuery: (newQuery) => {
      query = newQuery;
      currentOffset = 0;
    },
    getNextPageOfResults: async () => {
      if (query) {
        const searchResults = await search({ ...query, offset: currentOffset });
        currentOffset += 10;

        return searchResults.map((searchResult) => ({
          id: searchResult.data.id,
          title: searchResult.data.attributes.title.en,
          description: searchResult.data.attributes.description.en,
          volumeCount: Number(
            searchResult.data.attributes.lastVolume ||
              searchResult.data.attributes.lastChapter ||
              1
          ),
        }));
      } else {
        return [];
      }
    },
  };
}
