<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { ChapterResult } from "../client/chapterClient";
  import { makeChapterClient } from "../client/chapterClient";

  export let mangaId: string = "";

  const dispatch = createEventDispatcher();

  const chapterClient = makeChapterClient();
  let loading: boolean = false;
  let chapterResults: ChapterResult[] = [];

  $: onMangaChanged(mangaId);

  async function onMangaChanged(newMangaId: string) {
    if (!newMangaId) {
      return;
    }

    loading = true;
    chapterResults = [];
    chapterClient.changeMangaQuery({ manga: newMangaId });
    chapterResults = await chapterClient.getNextPageOfResults();
    loading = false;
  }

  async function onFetchMore() {
    loading = true;
    chapterResults = chapterResults.concat(
      await chapterClient.getNextPageOfResults()
    );
    loading = false;
  }

  function onClickChapterResult(chapterResult: ChapterResult) {
    dispatch("chapterSelected", { chapter: chapterResult });
  }
</script>

<ul>
  {#each chapterResults as result}
    <li>
      <a
        href="#/manga/{result.id}"
        on:click|preventDefault={() => onClickChapterResult(result)}
        >v{result.volume}c{result.chapter} {result.title}</a
      >
    </li>
  {/each}
</ul>
{#if loading}
  <aside class="ender">loading...</aside>
{/if}
{#if !loading && chapterResults.length > 0}
  <button class="ender" on:click={onFetchMore}>fetch more...</button>
{/if}

<style>
  ul {
    padding: 0;
  }

  li {
    margin-bottom: 8px;
    list-style: none;
  }

  li a {
    color: white;
    font-weight: 600;
    font-size: 1.2em;
  }

  .ender {
    display: block;
    margin-bottom: 16px;
  }
</style>
