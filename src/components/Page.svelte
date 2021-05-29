<script lang="ts">
  import type { ChapterResult } from "../client/chapterClient";
  import type { PageClient } from "../client/pageClient";
  import { makePageClientFactory } from "../client/pageClient";

  export let chapter: ChapterResult | undefined;

  let pageClient: PageClient | undefined;
  let currentPage: string | undefined;
  let loading: boolean = false;

  $: onChapterChanged(chapter);

  async function onChapterChanged(newChapter: ChapterResult) {
    if (!newChapter) {
      return;
    }

    loading = true;
    pageClient = await makePageClientFactory(newChapter);
    currentPage = await pageClient.getNextPage();
    loading = false;
  }

  async function onNextPage() {
    if (pageClient) {
      loading = true;
      currentPage = await pageClient.getNextPage();
      loading = false;

      window.scrollTo(0, 0);
    }
  }

  async function onPreviousPage() {
    if (pageClient) {
      loading = true;
      currentPage = await pageClient.getPreviousPage();
      loading = false;

      window.scrollTo(0, 0);
    }
  }

  function onPageClick(evt: MouseEvent) {
    if (evt.pageX >= (3.0 / 5.0) * window.innerWidth) {
      onNextPage();
    } else {
      onPreviousPage();
    }
  }
</script>

{#if currentPage}
  <img alt={currentPage} src={currentPage} on:mouseup={onPageClick} />
  <footer>
    <button id="prevPage" on:click={onPreviousPage}>{"← prev"}</button>
    <button id="nextPage" on:click={onNextPage}>{"next →"}</button>
  </footer>
{/if}

<style>
  img {
    display: block;
    width: 100vw;
    margin: -16px 0 0px -16px;
  }

  footer {
    width: 100vw;
    display: flex;
    margin-left: -16px;
  }

  footer button {
    height: 3em;

    background: #000;
    border: 1px solid white;
    color: white;

    flex: 1;
  }
</style>
