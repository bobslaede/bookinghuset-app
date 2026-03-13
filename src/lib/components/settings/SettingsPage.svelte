<script lang="ts">
  import { Button, Text, Field } from '@svar-ui/svelte-core';
  import { getSettings, saveSettings, type AppSettings } from '$lib/services/settings';

  let { onSaved, onCancel }: { onSaved?: () => void; onCancel?: () => void } = $props();

  let settings = $state<AppSettings | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let successMessage = $state<string | null>(null);

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
    <section>
      <h2>Bruger</h2>
      <Field label="Navn">
        <Text bind:value={settings.userName} placeholder="Dit navn" />
      </Field>
      <Field label="Email">
        <Text bind:value={settings.userEmail} placeholder="dig@bookinghuset.dk" />
      </Field>
    </section>

    <section>
      <h2>GraphQL / Hygraph</h2>
      <Field label="Endpoint">
        <Text bind:value={settings.graphqlEndpoint} />
      </Field>
      <Field label="API Token">
        <Text bind:value={settings.graphqlToken} placeholder="Bearer token" />
      </Field>
      <Field label="Image Base URL">
        <Text bind:value={settings.imageBaseUrl} />
      </Field>
    </section>

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
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }

  h2 {
    font-size: 1.1rem;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e0e0e0;
  }

  section {
    margin-bottom: 2rem;
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

  .loading {
    color: #666;
  }
</style>
