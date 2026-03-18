<script lang="ts">
  import { Button, Text, Field, Tabs } from '@svar-ui/svelte-core';
  import { getSettings, saveSettings, type AppSettings } from '$lib/services/settings';
  import type { UpdateStatus } from '$lib/services/updater';

  let {
    onSaved,
    onCancel,
    updateStatus,
    onCheckUpdate,
    onInstallUpdate,
  }: {
    onSaved?: () => void;
    onCancel?: () => void;
    updateStatus?: UpdateStatus;
    onCheckUpdate?: () => void;
    onInstallUpdate?: () => void;
  } = $props();

  let settings = $state<AppSettings | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let successMessage = $state<string | null>(null);
  let activeTab = $state<string | number>('user');

  const tabs = [
    { id: 'user', label: 'Bruger' },
    { id: 'api', label: 'API' },
    { id: 'update', label: 'Opdatering' },
  ];

  async function loadSettings() {
    loading = true;
    error = null;
    try {
      settings = await getSettings();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load settings';
    } finally {
      loading = false;
    }
  }

  async function handleSave() {
    if (!settings) return;

    saving = true;
    error = null;
    successMessage = null;

    try {
      await saveSettings(settings);
      successMessage = 'Indstillinger gemt';
      setTimeout(() => successMessage = null, 3000);
      onSaved?.();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save settings';
    } finally {
      saving = false;
    }
  }

  $effect(() => {
    loadSettings();
  });
</script>

<div class="settings-page">
  {#if error}
    <div class="message error">{error}</div>
  {/if}

  {#if successMessage}
    <div class="message success">{successMessage}</div>
  {/if}

  {#if loading}
    <div class="loading">Indlæser indstillinger...</div>
  {:else if settings}
    <Tabs options={tabs} bind:value={activeTab} />

    <div class="tab-content">
      {#if activeTab === 'user'}
        <Field label="Navn">
          <Text bind:value={settings.userName} placeholder="Dit navn" />
        </Field>
        <Field label="Email">
          <Text bind:value={settings.userEmail} placeholder="dig@bookinghuset.dk" />
        </Field>
      {:else if activeTab === 'api'}
        <Field label="GraphQL Endpoint">
          <Text bind:value={settings.graphqlEndpoint} />
        </Field>
        <Field label="API Token">
          <Text bind:value={settings.graphqlToken} placeholder="Bearer token" />
        </Field>
        <Field label="Image Base URL">
          <Text bind:value={settings.imageBaseUrl} />
        </Field>
      {:else if activeTab === 'update'}
        {#if onCheckUpdate}
          <div class="update-row">
            <Button onclick={onCheckUpdate}>Tjek for opdatering</Button>
            {#if updateStatus?.available}
              <span class="update-available">Version {updateStatus.version} tilgængelig</span>
              {#if onInstallUpdate}
                <Button type="primary" onclick={onInstallUpdate}>Installér</Button>
              {/if}
            {:else if updateStatus?.error}
              <span class="update-error">{updateStatus.error}</span>
            {:else}
              <span class="update-current">App er opdateret</span>
            {/if}
          </div>
        {/if}
      {/if}
    </div>

    <div class="actions">
      {#if onCancel}
        <Button onclick={onCancel}>Annullér</Button>
      {/if}
      <Button type="primary" onclick={handleSave} disabled={saving}>
        {saving ? 'Gemmer...' : 'Gem'}
      </Button>
    </div>
  {/if}
</div>

<style>
  .settings-page {
    max-width: 600px;
    text-align: left;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }

  .tab-content {
    padding: 1.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .message {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .message.error {
    background: #fee;
    border: 1px solid #fcc;
    color: #c00;
  }

  .message.success {
    background: #efe;
    border: 1px solid #cfc;
    color: #060;
  }

  .update-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .update-available {
    color: #1976d2;
    font-size: 0.9rem;
  }

  .update-current {
    color: #666;
    font-size: 0.9rem;
  }

  .update-error {
    color: #c00;
    font-size: 0.9rem;
  }

  .loading {
    color: #666;
  }
</style>
