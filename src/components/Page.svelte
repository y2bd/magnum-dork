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
    currentPage = await loadNextPage();
    loading = false;

    window.scrollTo({ top: 0 });
  }

  async function loadNextPage() {
    const nextPageUrl = await pageClient.getNextPage();

    const loadedNextPageUrl = await new Promise<string>((resolve) => {
      const img = new Image();

      img.addEventListener("load", function onLoad(evt: Event) {
        img.removeEventListener("load", onLoad);
        resolve(img.src);
      });

      img.src = nextPageUrl;
    });

    return loadedNextPageUrl;
  }

  async function onNextPage() {
    if (pageClient) {
      loading = true;
      currentPage = await loadNextPage();
      loading = false;

      window.scrollTo({ top: 0 });
    }
  }

  async function onPreviousPage() {
    if (pageClient) {
      loading = true;
      currentPage = await pageClient.getPreviousPage();
      loading = false;

      window.scrollTo({ top: 0 });
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

{#if loading}
  <div id="progress" class="loading">&nbsp;</div>
{/if}

{#if currentPage}
  <img
    alt={currentPage}
    src={currentPage}
    on:mouseup={onPageClick}
    class:loading={!!loading}
  />
  <footer>
    <button id="prevPage" on:click={onPreviousPage}>{"← prev"}</button>
    <button id="nextPage" on:click={onNextPage}>{"next →"}</button>
  </footer>
{/if}

<style>
  img {
    display: block;
    width: calc(100% + 32px);
    margin-top: -16px;
    margin-left: -16px;

    transition: opacity 0.3s ease;
  }

  img.loading {
    opacity: 0.85;
  }

  #progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: steelblue;

    z-index: 10000;
  }

  #progress.loading {
    opacity: 1;
    animation-duration: 1s;
    animation-name: pulse;
    animation-iteration-count: infinite;
    animation-direction: alternate;
  }

  @keyframes pulse {
    from {
      opacity: 0.2;
    }

    to {
      opacity: 1;
    }
  }

  footer {
    width: calc(100% + 32px);
    margin-left: -16px;
    display: flex;
  }

  footer button {
    height: 3em;

    background: #000;
    border: 1px solid white;
    color: white;

    flex: 1;
  }

  footer button:first {
    border-right: none;
  }
</style>
