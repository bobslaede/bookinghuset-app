<script lang="ts">
  import { marked } from 'marked';
  import { Button, TextArea, Checkbox, Segmented, Field, Combo } from '@svar-ui/svelte-core';
  import { dndzone } from 'svelte-dnd-action';
  import { listen } from '@tauri-apps/api/event';
  import { fetchArtists, fetchCategories, resizeImage } from '$lib/services/graphql';
  import { getSettings } from '$lib/services/settings';
  import { generateEmailHtml } from '$lib/services/email-template';
  import {
    getPricelistArtists,
    loadPricelist,
    addArtist,
    addArtists,
    removeArtist,
    removeAll,
    setArtists,
    updateArtist,
    sortAllByName,
  } from '$lib/services/pricelist.svelte';
  import type { Artist, Category } from '$lib/types';
  import { GraphCMSStatus } from '$lib/types';

  let allArtists = $state<Artist[]>([]);
  let allCategories = $state<Category[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let priceType = $state('price');
  let priceFallback = $state(false);
  let introText = $state('');
  let introTextHtml = $derived(marked(introText) as string);
  let emailHtml = $state('');
  let expandedSlug = $state<string | null>(null);
  let imageBaseUrl = $state('');
  let emailImageWidth = $state(200);
  let emailImageHeight = $state(125);

  const priceTypeOptions = [
    { id: 'price', label: 'Firma' },
    { id: 'priceVenue', label: 'Spillested' },
    { id: 'priceFestival', label: 'Festival' },
    { id: 'pricePrivat', label: 'Privat' },
  ];

  let selectedArtists = $derived(getPricelistArtists());

  let artistOptions = $derived(
    allArtists.map((a) => ({ id: a.slug, label: a.name, artist: a })),
  );

  let categoryOptions = $derived(
    allCategories.map((c) => ({ id: c.slug, label: c.name, category: c })),
  );

  let selectedArtistCombo = $state('');
  let selectedCategoryCombo = $state('');

  async function init() {
    loading = true;
    error = null;
    try {
      await loadPricelist();
      const settings = await getSettings();
      imageBaseUrl = settings.imageBaseUrl;
      emailImageWidth = settings.emailImageWidth;
      emailImageHeight = settings.emailImageHeight;
      addIntroText(settings.userName);

      const [artists, categories] = await Promise.all([
        fetchArtists(),
        fetchCategories(),
      ]);
      allArtists = artists;
      allCategories = categories;
    } catch (e) {
      console.error('Init error:', e);
      error = e instanceof Error ? e.message : 'Failed to load data';
    } finally {
      loading = false;
    }
  }

  function addIntroText(userName: string) {
    introText = `Hej

Tak for din mail.

Hermed fremsendes vejledende priser på XXXXX

Du må endelig sige til, hvis jeg skal reservere noget til dig.

Jeg ser frem til at høre fra dig - og hvis du har spørgsmål, er du velkommen til at ringe eller skrive.

Med venlig hilsen
${userName}`;
  }

  async function onArtistComboChange(ev: { value: string | number }) {
    if (!ev.value) return;
    const val = String(ev.value);
    const option = artistOptions.find((o) => o.id === val);
    if (option) {
      await addArtist(option.artist);
    }
    selectedArtistCombo = '';
  }

  async function onCategoryComboChange(ev: { value: string | number }) {
    if (!ev.value) return;
    const val = String(ev.value);
    const option = categoryOptions.find((o) => o.id === val);
    if (option) {
      await addArtists(option.category.artists);
    }
    selectedCategoryCombo = '';
  }

  function onGenerate() {
    const fallbackType = priceFallback ? 'price' : '';
    emailHtml = generateEmailHtml(
      selectedArtists,
      introTextHtml,
      priceType,
      fallbackType,
      imageBaseUrl,
      emailImageWidth,
      emailImageHeight,
    );
  }

  function toggleExpanded(slug: string) {
    expandedSlug = expandedSlug === slug ? null : slug;
  }

  // Drag and drop via svelte-dnd-action
  // dndzone needs items with an `id` field
  let dndItems = $state<(Artist & { id: string })[]>([]);

  $effect(() => {
    dndItems = selectedArtists.map((a) => ({ ...a, id: a.slug }));
  });

  function handleDndConsider(e: CustomEvent) {
    dndItems = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent) {
    dndItems = e.detail.items;
    setArtists(dndItems);
  }

  $effect(() => {
    init();
  });

  async function updateSelected() {
    const freshMap = new Map(allArtists.map((a) => [a.slug, a]));
    const merged = getPricelistArtists().map((stored) => {
      const fresh = freshMap.get(stored.slug);
      return fresh ? { ...fresh } : stored;
    });
    await setArtists(merged);
  }

  $effect(() => {
    const unlisten = listen<string>('menu-event', (event) => {
      if (event.payload === 'refresh') init();
      if (event.payload === 'update_selected') updateSelected();
    });
    return () => { unlisten.then((fn) => fn()); };
  });
</script>

{#if loading}
  <div class="loading">Henter kunstnere...</div>
{:else if error}
  <div class="error-message">{error}</div>
{:else}
  <div class="main-grid">
    <div class="left-panel">
      <div class="fields-section">
        <div class="search-row">
          <div class="search-field">
            <Field label="Kunstner">
              <Combo
                options={artistOptions}
                textField="label"
                placeholder="Søg kunstner..."
                bind:value={selectedArtistCombo}
                onchange={onArtistComboChange}
                clear
              >
                {#snippet children({ option })}
                  <div class="combo-artist-option">
                    {#if option.artist?.thumbnail}
                      <img
                        src={resizeImage(option.artist.thumbnail.handle, { width: 40, height: 25, align: 'faces', fit: 'crop' }, imageBaseUrl)}
                        alt=""
                        class="combo-thumb"
                      />
                    {/if}
                    <span class="status-icon">{option.artist?.stage === GraphCMSStatus.PUBLISHED ? '🌐' : '🚫'}</span>
                    <span>{option.label}</span>
                  </div>
                {/snippet}
              </Combo>
            </Field>
          </div>
          <div class="search-field">
            <Field label="Kategori">
              <Combo
                options={categoryOptions}
                textField="label"
                placeholder="Søg kategori..."
                bind:value={selectedCategoryCombo}
                onchange={onCategoryComboChange}
                clear
              />
            </Field>
          </div>
        </div>

        <Field label="Pristype">
          <div class="price-type-row">
            <Segmented options={priceTypeOptions} bind:value={priceType} />
            <Checkbox label="Firma fallback" bind:value={priceFallback} />
          </div>
        </Field>

        <Field label="Intro tekst (markdown)">
          <TextArea bind:value={introText} />
        </Field>
      </div>

      <div class="list-section">
        <div class="actions">
          <Button onclick={() => sortAllByName()}>Sortér A-Å</Button>
          <Button type="danger" onclick={removeAll}>Ryd liste</Button>
          <Button type="primary" onclick={onGenerate}>Generér prisliste</Button>
        </div>

        <div
          class="artist-list"
          use:dndzone={{ items: dndItems, flipDurationMs: 200 }}
          onconsider={handleDndConsider}
          onfinalize={handleDndFinalize}
        >
          {#each dndItems as artist (artist.id)}
            <div class="artist-item">
              <div class="artist-header-row">
                <button
                  class="artist-header"
                  type="button"
                  onclick={() => toggleExpanded(artist.slug)}
                >
                  <span class="drag-handle">⠿</span>
                  <span class="artist-name">{artist.name}</span>
                  <span class="status-icon">{artist.stage === GraphCMSStatus.PUBLISHED ? '🌐' : '🚫'}</span>
                </button>
                <Button type="danger" onclick={() => removeArtist(artist)}>✕</Button>
              </div>

              {#if expandedSlug === artist.slug}
                <div class="artist-detail">
                  <div class="price-fields">
                    <Field label="Firma">
                      <TextArea
                        value={artist.price}
                        onchange={(ev) => updateArtist(artist.slug, { price: ev.value })}
                      />
                    </Field>
                    <Field label="Spillested">
                      <TextArea
                        value={artist.priceVenue}
                        onchange={(ev) => updateArtist(artist.slug, { priceVenue: ev.value })}
                      />
                    </Field>
                    <Field label="Festival">
                      <TextArea
                        value={artist.priceFestival}
                        onchange={(ev) => updateArtist(artist.slug, { priceFestival: ev.value })}
                      />
                    </Field>
                    <Field label="Privat">
                      <TextArea
                        value={artist.pricePrivat}
                        onchange={(ev) => updateArtist(artist.slug, { pricePrivat: ev.value })}
                      />
                    </Field>
                  </div>
                  {#if artist.thumbnail}
                    <img
                      class="artist-thumb"
                      src={resizeImage(artist.thumbnail.handle, { width: 200, height: 125, align: 'faces', fit: 'crop' }, imageBaseUrl)}
                      alt={artist.name}
                    />
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="preview">
      <iframe srcdoc={emailHtml} title="Prisliste preview"></iframe>
    </div>
  </div>
{/if}

<style>
  .loading {
    color: #666;
    padding: 2rem;
  }

  .error-message {
    padding: 1rem;
    background: #fee;
    border: 1px solid #fcc;
    color: #c00;
    border-radius: 4px;
  }

  .main-grid {
    display: grid;
    grid-template-columns: 4fr 5fr;
    gap: 1rem;
    flex: 1;
    min-height: 0;
  }

  /* Left panel: fields on top, artist list on bottom */
  .left-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
  }

  .fields-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex-shrink: 0;
    --wx-field-width: 100%;
  }

  .search-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .price-type-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .combo-artist-option {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .combo-thumb {
    border-radius: 2px;
    flex-shrink: 0;
  }

  .status-icon {
    font-size: 0.7rem;
    margin-right: 0.25rem;
  }

  /* List section fills remaining space and scrolls */
  .list-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
    flex: 1;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .artist-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .artist-item {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .artist-header-row {
    display: flex;
    align-items: center;
  }

  .artist-header {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    cursor: pointer;
    user-select: none;
    flex: 1;
    background: none;
    border: none;
    font: inherit;
    color: inherit;
    text-align: left;
  }

  .drag-handle {
    cursor: grab;
    margin-right: 0.5rem;
    color: #999;
    font-size: 1.1rem;
  }

  .artist-name {
    flex: 1;
    font-size: 0.9rem;
  }

  .artist-detail {
    display: flex;
    padding: 0.5rem 0.5rem 0.75rem;
    border-top: 1px solid #e0e0e0;
    gap: 1rem;
  }

  .price-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .artist-thumb {
    align-self: flex-start;
    border-radius: 4px;
  }

  .preview {
    background: #f1f1f1;
    border-radius: 4px;
    min-height: 0;
  }

  .preview iframe {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 4px;
  }
</style>
