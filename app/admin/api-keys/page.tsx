'use client'

import { useState, useEffect } from 'react'

interface ApiKey {
  id: string
  service: string
  has_key: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState('')
  const [newKey, setNewKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const services = ['companies_house', 'google_places']

  const loadKeys = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/api-keys')
      const data = await response.json()
      setKeys(data.keys || [])
    } catch (error) {
      console.error('Failed to load API keys:', error)
      setMessage({ type: 'error', text: 'Failed to load API keys' })
    } finally {
      setLoading(false)
    }
  }

  const saveKey = async () => {
    if (!selectedService || !newKey) {
      setMessage({ type: 'error', text: 'Please select a service and enter an API key' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: selectedService, apiKey: newKey }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'API key saved successfully' })
        setNewKey('')
        await loadKeys()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save API key' })
      }
    } catch (error) {
      console.error('Failed to save API key:', error)
      setMessage({ type: 'error', text: 'Failed to save API key' })
    } finally {
      setSaving(false)
    }
  }

  const deleteKey = async (service: string) => {
    if (!confirm(`Are you sure you want to delete the API key for ${service}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/api-keys/${service}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'API key deleted successfully' })
        await loadKeys()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete API key' })
      }
    } catch (error) {
      console.error('Failed to delete API key:', error)
      setMessage({ type: 'error', text: 'Failed to delete API key' })
    }
  }

  const getServiceLabel = (service: string) => {
    const labels: Record<string, string> = {
      'companies_house': 'Companies House',
      'google_places': 'Google Places',
    }
    return labels[service] || service
  }

  // Load keys on component mount
  useEffect(() => {
    loadKeys()
  }, [])

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API Key Management</h1>

        {/* Add/Edit Key Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 mb-8 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">Add or Update API Key</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {getServiceLabel(service)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                API Key
              </label>
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Enter API key..."
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              />
              <p className="text-sm text-zinc-500 mt-1">
                Your API key is encrypted and stored securely. It will never be displayed in plain text.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveKey}
                disabled={saving || !selectedService || !newKey}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Saving...' : 'Save API Key'}
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Existing Keys */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Existing API Keys</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-zinc-500">Loading...</div>
          ) : keys.length === 0 ? (
            <div className="p-6 text-center text-zinc-500">
              No API keys configured. Add your first API key above.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left p-4 font-medium">Service</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Key Present</th>
                  <th className="text-left p-4 font-medium">Last Updated</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="p-4">{getServiceLabel(key.service)}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
                          key.is_active
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      {key.has_key ? (
                        <span className="text-zinc-500">****</span>
                      ) : (
                        <span className="text-zinc-400">No key</span>
                      )}
                    </td>
                    <td className="p-4 text-zinc-500">
                      {new Date(key.updated_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteKey(key.service)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Notes */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold mb-2">Security Notes</h3>
          <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
            <li>• API keys are encrypted using AES-256-GCM before storage</li>
            <li>• Keys are never displayed in plain text in the UI</li>
            <li>• Keys are only decrypted server-side when needed for API calls</li>
            <li>• Only administrators should have access to this page</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
