import type { AiProvider, AppSettings } from '../types';
import { PROVIDER_PRESETS } from '../storage';
import { Button, Card, Field, TextInput, inputClass } from '../components/ui';

export function Settings({
  settings,
  onChange,
}: {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}) {
  const update = (patch: Partial<AppSettings>) =>
    onChange({ ...settings, ...patch });

  const switchProvider = (p: AiProvider) => {
    const preset = PROVIDER_PRESETS[p];
    update({
      provider: p,
      baseURL: preset.baseURL || settings.baseURL,
      model: preset.model || settings.model,
    });
  };

  const preset = PROVIDER_PRESETS[settings.provider];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure the AI advisor and app preferences. Stored locally in your browser.
        </p>
      </div>

      <Card title="AI Advisor">
        <div className="space-y-4">
          <Field
            label="Provider"
            tooltip="Switching a provider auto-fills sensible defaults for base URL and model. You can still edit both below."
          >
            <select
              className={inputClass}
              value={settings.provider}
              onChange={(e) => switchProvider(e.target.value as AiProvider)}
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          {preset.note && (
            <div className="text-xs text-slate-500 dark:text-slate-400 -mt-2">{preset.note}</div>
          )}

          <Field
            label="API key"
            tooltip="Sent directly from your browser to the base URL below. Stored only in LocalStorage on this machine."
          >
            <TextInput
              value={settings.apiKey}
              onChange={(v) => update({ apiKey: v })}
              placeholder={
                settings.provider === 'openai'
                  ? 'sk-...'
                  : settings.provider === 'anthropic'
                  ? 'sk-ant-...'
                  : settings.provider === 'openrouter'
                  ? 'sk-or-...'
                  : 'your API key'
              }
            />
          </Field>

          <Field
            label="Base URL"
            tooltip="Any OpenAI-compatible endpoint. Editable in case you self-host a gateway or use a region-specific URL."
          >
            <TextInput
              value={settings.baseURL}
              onChange={(v) => update({ baseURL: v })}
              placeholder="https://api.openai.com/v1"
            />
          </Field>

          <Field
            label="Model"
            tooltip="The exact model id the provider expects. Switching providers pre-fills a sensible default — override as needed."
          >
            <TextInput
              value={settings.model}
              onChange={(v) => update({ model: v })}
              placeholder={preset.model || 'e.g. gpt-4o'}
            />
          </Field>

          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900 p-3 text-xs text-yellow-900 dark:text-yellow-200">
            Your key is stored only in this browser's LocalStorage and is sent directly from
            your browser to the base URL above. Do not use a shared machine. Rotate the key
            from the provider's console if in doubt.
          </div>
        </div>
      </Card>

      <Card title="Appearance">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Dark mode</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Toggle with the sun/moon icon in the top bar at any time.
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => update({ darkMode: !settings.darkMode })}
          >
            {settings.darkMode ? 'On' : 'Off'}
          </Button>
        </div>
      </Card>

      <Card title="Danger zone">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Reset onboarding</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Show the welcome flow again the next time the app loads.
            </div>
          </div>
          <Button
            variant="danger"
            onClick={() => update({ onboardingCompleted: false })}
          >
            Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}
