import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const { data } = await adminAPI.getSettings();
      setSettings(data);
    } catch (e) {}
    setLoading(false);
  };

  const saveSettings = async () => {
    try {
      await adminAPI.updateSettings(settings);
      toast.success('Settings saved');
    } catch (e) {
      toast.error('Failed to save');
    }
  };

  if (loading) return <div className="text-center py-10 text-dark-400">Loading...</div>;

  const fields = [
    { key: 'site_name', label: 'Site Name', type: 'text' },
    { key: 'site_tagline', label: 'Tagline', type: 'text' },
    { key: 'marquee_text', label: 'Marquee Text', type: 'text' },
    { key: 'min_deposit', label: 'Min Deposit (₹)', type: 'number' },
    { key: 'max_deposit', label: 'Max Deposit (₹)', type: 'number' },
    { key: 'min_withdrawal', label: 'Min Withdrawal (₹)', type: 'number' },
    { key: 'max_withdrawal', label: 'Max Withdrawal (₹)', type: 'number' },
    { key: 'default_commission', label: 'Default Commission (%)', type: 'number' },
    { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text' },
    { key: 'telegram_link', label: 'Telegram Link', type: 'text' },
    { key: 'support_hours', label: 'Support Hours', type: 'text' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>

      <div className="card p-6 space-y-4">
        {fields.map(field => (
          <div key={field.key}>
            <label className="text-sm text-dark-400 mb-1 block">{field.label}</label>
            <input
              type={field.type}
              className="input-field"
              value={settings[field.key] || ''}
              onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
            />
          </div>
        ))}

        <div>
          <label className="text-sm text-dark-400 mb-1 block">Maintenance Mode</label>
          <select className="input-field" value={settings.maintenance_mode || '0'} onChange={e => setSettings({ ...settings, maintenance_mode: e.target.value })}>
            <option value="0">Off</option>
            <option value="1">On</option>
          </select>
        </div>

        <button onClick={saveSettings} className="btn-primary w-full py-3">Save Settings</button>
      </div>
    </div>
  );
}
