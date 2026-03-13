<script lang="ts">
  import { Willow, Modal } from '@svar-ui/svelte-core';
  import SettingsPage from '$lib/components/settings/SettingsPage.svelte';
  import { getSettings, getMissingSettings } from '$lib/services/settings';
  import { checkForUpdate, installUpdate, type UpdateStatus } from '$lib/services/updater';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  let settingsReady = $state(false);
  let missingFields = $state<string[]>([]);
  let checking = $state(true);
  let showSettingsModal = $state(false);
  let updateStatus = $state<UpdateStatus>({ available: false });

  const settingsMissing = $derived(!settingsReady && !checking);

  async function checkSettings() {
    checking = true;
    try {
      const settings = await getSettings();
      missingFields = getMissingSettings(settings);
      settingsReady = missingFields.length === 0;
    } catch {
      settingsReady = false;
    } finally {
      checking = false;
    }
  }

  // Auto-open modal when settings are missing
  $effect(() => {
    if (settingsMissing) {
      showSettingsModal = true;
    }
  });

  async function onSettingsSaved() {
    await checkSettings();
    if (settingsReady) {
      showSettingsModal = false;
    }
  }

  function openSettings() {
    showSettingsModal = true;
  }

  function closeSettings() {
    if (settingsReady) {
      showSettingsModal = false;
    }
  }

  $effect(() => {
    checkSettings();
  });

  $effect(() => {
    if (settingsReady) {
      checkForUpdate().then((status) => {
        if (!status.error) updateStatus = status;
      });
    }
  });
</script>

<Willow>
<main class="container">
  <button class="settings-btn" type="button" onclick={openSettings} title="Indstillinger">⚙️</button>

  {#if updateStatus.available}
    <div class="update-banner">
      <span>Version {updateStatus.version} er tilgængelig.</span>
      <button type="button" onclick={installUpdate}>Opdatér nu</button>
    </div>
  {/if}

  {#if checking}
    <div class="loading">Indlæser...</div>
  {:else if settingsReady}
    {@render children()}
  {:else}
    <div class="setup-message">
      <p>Indstillinger mangler. Klik ⚙️ for at komme i gang.</p>
    </div>
  {/if}
</main>

{#if showSettingsModal}
  <Modal
    buttons={[]}
    oncancel={closeSettings}
  >
    {#snippet header()}
      <div class="modal-header">
        <span class="modal-title">{settingsMissing ? 'Velkommen til Bookinghuset' : 'Indstillinger'}</span>
        {#if !settingsMissing}
          <button class="modal-close" type="button" onclick={closeSettings} title="Luk">✕</button>
        {/if}
      </div>
    {/snippet}
    {#if settingsMissing}
      <p class="modal-info">Udfyld venligst dine indstillinger for at komme i gang.</p>
      {#if missingFields.length > 0}
        <p class="modal-missing">Mangler: {missingFields.join(', ')}</p>
      {/if}
    {/if}
    <SettingsPage
      onSaved={onSettingsSaved}
      onCancel={settingsMissing ? undefined : closeSettings}
      {updateStatus}
      onCheckUpdate={async () => updateStatus = await checkForUpdate()}
      onInstallUpdate={installUpdate}
    />
  </Modal>
{/if}
</Willow>

<style>
  :global(:root) {
    font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: #0f0f0f;
    background-color: #f6f6f6;
  }

  :global(body) {
    margin: 0;
  }

  .container {
    padding: 1rem 2rem;
    height: 100dvh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .settings-btn {
    position: fixed;
    top: 0.75rem;
    right: 1.5rem;
    font-size: 1.6rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
  }

  .settings-btn:hover {
    opacity: 0.7;
  }

  .update-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: #e8f4fd;
    border: 1px solid #b3d9f2;
    border-radius: 4px;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
  }

  .update-banner button {
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.25rem 0.75rem;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .update-banner button:hover {
    background: #1565c0;
  }

  .loading {
    color: #666;
    padding: 2rem;
  }

  .setup-message {
    text-align: center;
    padding: 3rem 1rem;
    color: #666;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .modal-title {
    font-size: 1.2rem;
    font-weight: 600;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #666;
    padding: 0.25rem 0.5rem;
    line-height: 1;
    border-radius: 4px;
  }

  .modal-close:hover {
    background: #eee;
    color: #333;
  }

  .modal-info {
    color: #666;
    margin: 0 0 0.25rem 0;
    text-align: left;
  }

  .modal-missing {
    font-size: 0.85rem;
    color: #d32f2f;
    margin: 0 0 1rem 0;
    text-align: left;
  }

  @media (prefers-color-scheme: dark) {
    :global(:root) {
      color: #f6f6f6;
      background-color: #2f2f2f;
    }

    .loading {
      color: #aaa;
    }

    .setup-message {
      color: #aaa;
    }

    .modal-close {
      color: #aaa;
    }

    .modal-close:hover {
      background: #444;
      color: #eee;
    }

    .modal-info {
      color: #aaa;
    }

    .modal-missing {
      color: #faa;
    }
  }
</style>
