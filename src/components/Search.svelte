<script lang="ts">
  import sh from "sanitize-html";
  import { createEventDispatcher } from "svelte";

  import type { SearchResult } from "../client/searchClient";
  import { makeSearchClient } from "../client/searchClient";

  const dispatch = createEventDispatcher();

  const searchClient = makeSearchClient();

  let searchQuery: string = "";
  let searchResults: SearchResult[] = [];
  let loading = false;

  async function onSearch() {
    loading = true;
    searchResults = [];
    searchClient.changeSearchQuery({ title: searchQuery });
    searchResults = await searchClient.getNextPageOfResults();
    loading = false;
  }

  async function onFetchMore() {
    loading = true;
    searchResults = searchResults.concat(
      await searchClient.getNextPageOfResults()
    );
    loading = false;
  }

  function onClickSearchResult(searchResult: SearchResult) {
    dispatch("mangaSelected", { mangaId: searchResult.id });
  }
</script>

<header>
  <input
    type="search"
    placeholder="search..."
    bind:value={searchQuery}
    on:keyup={(evt) => evt.key === "Enter" && onSearch()}
  />
  <button on:click={onSearch}>search</button>
</header>

<ul>
  {#each searchResults as result}
    <li>
      <a
        href="#/manga/{result.id}"
        on:click|preventDefault={() => onClickSearchResult(result)}
        >{result.title}</a
      >
      <p>{@html sh(result.description)}</p>
      <p>Volumes: {result.volumeCount}</p>
    </li>
  {/each}
</ul>
{#if loading}
  <aside class="ender">loading...</aside>
{/if}
{#if !loading && searchResults.length > 0}
  <button class="ender" on:click={onFetchMore}>fetch more...</button>
{/if}

<style>
  header {
    width: 100%;
    display: flex;
  }

  header input,
  header button {
    height: 3em;

    background: #000;
    border: 1px solid white;
    color: white;
  }

  header input {
    flex-grow: 1;
    border-right: none;
    font-size: 1m;

    border-radius: 0;
  }

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
    font-size: 1.5em;
  }

  .ender {
    display: block;
    margin-bottom: 16px;
  }
</style>
