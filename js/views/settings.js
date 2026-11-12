/* ==========================================================================
   BudgetBuddy - Settings & Data Management View Controller
   ========================================================================== */

class SettingsView {
  constructor(store) {
    this.store = store;
  }

  render() {
    const container = document.getElementById('view-settings');
    if (!container) return;

    const settings = this.store.getSettings();
    const currentTheme = settings.theme || 'light';
    const currentName = settings.userName || 'Rahul Sharma';
    const txCount = this.store.getTransactions().length;
    const subCount = this.store.getSubscriptions().length;
    const goalCount = this.store.getSavingsGoals().length;

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Settings</h2>
          <p class="section-subtitle">Manage your student profile, theme preferences, and local data backups.</p>
        </div>
      </div>

      <div class="settings-grid">
        <div class="card">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 14px;">
            <span aria-hidden="true">👤</span> Student Profile
          </h3>

          <div class="form-group">
            <label class="form-label" for="settingUserName">Your Name</label>
            <input type="text" id="settingUserName" class="form-input" maxlength="60" value="${escapeHTML(currentName)}" placeholder="e.g. Rahul Sharma">
            <small style="color: var(--text-secondary); font-size: 0.74rem;">Shown on your dashboard greeting.</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="settingCurrencyDisplay">Currency</label>
            <input type="text" id="settingCurrencyDisplay" class="form-input" value="₹ (Indian Rupee - INR)" disabled style="opacity: 0.85; background: var(--bg-subtle);">
          </div>

          <button type="button" class="btn btn-primary" onclick="window.appController.saveProfileSettings()">
            Save Name
          </button>
        </div>

        <div class="card">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 14px;">
            <span aria-hidden="true">🎨</span> Theme Selection
          </h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 16px;">
            Toggle between clean light and modern dark themes. Saved locally in your browser.
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" role="group" aria-label="Theme selection">
            <button type="button" class="card" aria-pressed="${currentTheme === 'light'}" style="padding: 14px; text-align: center; cursor: pointer; border: 2px solid ${currentTheme === 'light' ? 'var(--color-primary)' : 'var(--border-light)'}; background: ${currentTheme === 'light' ? 'var(--color-primary-light)' : 'var(--bg-card)'};"
              onclick="window.appController.switchTheme('light')">
              <span style="font-size: 1.3rem;" aria-hidden="true">☀️</span>
              <div style="font-size: 0.86rem; font-weight: 700; margin-top: 4px; color: var(--text-primary);">Light Mode</div>
            </button>

            <button type="button" class="card" aria-pressed="${currentTheme === 'dark'}" style="padding: 14px; text-align: center; cursor: pointer; border: 2px solid ${currentTheme === 'dark' ? 'var(--color-primary)' : 'var(--border-light)'}; background: ${currentTheme === 'dark' ? 'var(--color-primary-light)' : 'var(--bg-card)'};"
              onclick="window.appController.switchTheme('dark')">
              <span style="font-size: 1.3rem;" aria-hidden="true">🌙</span>
              <div style="font-size: 0.86rem; font-weight: 700; margin-top: 4px; color: var(--text-primary);">Dark Mode</div>
            </button>
          </div>
        </div>

        <div class="card" style="grid-column: 1 / -1;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
            <span aria-hidden="true">💾</span> Data Backup & Storage Notice
          </h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 14px;">
            BudgetBuddy stores data in your browser's LocalStorage with no remote server. Export JSON backups regularly, and avoid storing passwords, PINs, or sensitive financial credentials.
          </p>

          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px;">
            <span class="badge badge-neutral" style="padding: 6px 12px;">Transactions: <strong>${txCount}</strong></span>
            <span class="badge badge-neutral" style="padding: 6px 12px;">Subscriptions: <strong>${subCount}</strong></span>
            <span class="badge badge-neutral" style="padding: 6px 12px;">Savings Goals: <strong>${goalCount}</strong></span>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary" onclick="window.appStore.exportJSON()">
              <span aria-hidden="true">📤</span> Export Backup (JSON)
            </button>

            <button type="button" class="btn btn-secondary" onclick="document.getElementById('importFileInput').click()">
              <span aria-hidden="true">📥</span> Import Backup (JSON)
            </button>
            <label for="importFileInput" class="sr-only">Import JSON backup file</label>
            <input type="file" id="importFileInput" accept=".json" style="display: none;"
              onchange="window.appController.handleFileImport(event)">

            <button type="button" class="btn btn-outline" onclick="window.appController.loadSampleData()">
              <span aria-hidden="true">🔄</span> Reset to College Sample Data
            </button>

            <button type="button" class="btn btn-danger" style="margin-left: auto;" onclick="window.appController.confirmWipeAllData()">
              <span aria-hidden="true">🗑️</span> Clear All Data
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

window.settingsView = new SettingsView(window.appStore);
