<script lang="ts">
  import type { ChapterResult } from "../client/chapterClient";
  import type { PageClient } from "../client/pageClient";
  import { makePageClientFactory } from "../client/pageClient";

  export let chapter: ChapterResult | undefined;

  let pageClient: PageClient | undefined;
  let currentPage: string | undefined;
  let loading: boolean = false;

  $: onChapterChanged(chapter);

  function loadImg(options, callback) {
    let seconds = 0,
      maxSeconds = 10,
      complete = false,
      done = false;

    if (options.maxSeconds) {
      maxSeconds = options.maxSeconds;
    }

    function tryImage() {
      if (done) {
        return;
      }
      if (seconds >= maxSeconds) {
        callback({ err: "timeout" });
        done = true;
        return;
      }
      if (complete && img.complete) {
        if (img.width && img.height) {
          callback({ img: img });
          done = true;
          return;
        }
        callback({ err: "404" });
        done = true;
        return;
      } else if (img.complete) {
        complete = true;
      }
      seconds++;
      callback.tryImage = setTimeout(tryImage, 500);
    }
    var img = new Image();
    img.onload = tryImage;
    img.src = options.src;
    tryImage();
  }

  function loadImgPromise(url: string) {
    return new Promise((resolve) =>
      loadImg({ maxSeconds: 10, src: url }, resolve)
    );
  }

  async function onChapterChanged(newChapter: ChapterResult) {
    if (!newChapter) {
      return;
    }

    loading = true;
    pageClient = await makePageClientFactory(newChapter);
    let incomingPage = await pageClient.getNextPage();
    await loadImgPromise(incomingPage);
    currentPage = incomingPage;
    loading = false;
  }

  async function onNextPage() {
    if (pageClient) {
      loading = true;
      let incomingPage = await pageClient.getNextPage();
      await loadImgPromise(incomingPage);
      currentPage = incomingPage;
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
    width: 100vw;
    margin: -16px 0 0px -16px;
  }

  img.loading {
    opacity: 0.85;
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
