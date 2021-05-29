<script lang="ts">
  import Search from "./components/Search.svelte";
  import Chapter from "./components/Chapter.svelte";
  import Page from "./components/Page.svelte";
  import type { ChapterResult } from "./client/chapterClient";

  let focusedMangaId: string | undefined;
  let focusedChapter: ChapterResult | undefined;
</script>

{#if focusedChapter}
  <Page chapter={focusedChapter} />
{/if}

{#if focusedMangaId}
  <Chapter
    mangaId={focusedMangaId}
    on:chapterSelected={(evt) => (focusedChapter = evt.detail.chapter)}
  />
{/if}

<Search on:mangaSelected={(evt) => (focusedMangaId = evt.detail.mangaId)} />

<style>
</style>
