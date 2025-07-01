import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Alert } from '../components/ui/Alert';
import { apiKeysAPI } from '../utils/api';
import { Key, Plus, Search, MoreVertical, Copy, Edit2, Trash2, Globe, Clock, Activity } from 'lucide-react';

export function ApiKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    description: '',
    domainRestrictions: '',
    rateLimitPerHour: 1000
  });

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeysAPI.getAll();
      setApiKeys(response.data.apiKeys);
    } catch (err) {
      setError('Failed to load API keys');
      console.error('Error loading API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (e) => {
    e.preventDefault();
    try {
      const domainRestrictions = newKeyForm.domainRestrictions
        ? newKeyForm.domainRestrictions.split(',').map(d => d.trim()).filter(d => d)
        : [];

      const response = await apiKeysAPI.create({
        name: newKeyForm.name,
        description: newKeyForm.description,
        domainRestrictions: domainRestrictions.length > 0 ? domainRestrictions : undefined,
        rateLimitPerHour: parseInt(newKeyForm.rateLimitPerHour)
      });

      setSuccess(`API key "${response.data.apiKey.name}" created successfully!`);
      setShowCreateModal(false);
      setNewKeyForm({ name: '', description: '', domainRestrictions: '', rateLimitPerHour: 1000 });
      loadApiKeys();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create API key');
    }
  };

  const toggleApiKeyStatus = async (id, currentStatus) => {
    try {
      await apiKeysAPI.update(id, {
        isActive: !currentStatus
      });
      setSuccess('API key status updated');
      loadApiKeys();
    } catch (err) {
      setError('Failed to update API key status');
    }
  };

  const deleteApiKey = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the API key "${name}"?`)) {
      return;
    }

    try {
      await apiKeysAPI.delete(id);
      setSuccess('API key deleted successfully');
      loadApiKeys();
    } catch (err) {
      setError('Failed to delete API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('API key copied to clipboard');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredApiKeys = apiKeys.filter(key =>
    key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate overview stats
  const totalKeys = apiKeys.length;
  const activeKeys = apiKeys.filter(key => key.is_active).length;
  const totalUsage = apiKeys.reduce((sum, key) => sum + (key.usage_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="h-6 w-6 text-blue-600" />
            Domain Authorization
          </h1>
          <p className="text-gray-600">Manage domain-based authentication for widgets. Add your website domains to allow widget access.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert type="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Keys</p>
                <p className="text-2xl font-bold text-gray-900">{totalKeys}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Keys</p>
                <p className="text-2xl font-bold text-gray-900">{activeKeys}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsage.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Authentication Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How Domain Authentication Works</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Secure by Design:</strong> Widgets authenticate using your website's domain origin, 
                  eliminating the need for API keys in client-side code.
                </p>
                <p>
                  <strong>Simple Setup:</strong> Add your website domains to the "Domain Restrictions" field below. 
                  Widgets will automatically work on those domains without additional configuration.
                </p>
                <p>
                  <strong>No Security Risk:</strong> Unlike traditional API keys, domain authentication cannot be 
                  compromised by viewing page source code.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search API keys by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys ({filteredApiKeys.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading API keys...</div>
          ) : filteredApiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No API keys match your search.' : 'No API keys found. Create one to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      API Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain Restrictions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{key.name}</div>
                          {key.description && (
                            <div className="text-sm text-gray-500">{key.description}</div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {key.key_id}
                            </code>
                            <Button
                              onClick={() => copyToClipboard(key.key_secret)}
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleApiKeyStatus(key.id, key.is_active)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                            key.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {key.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4 text-gray-400" />
                          <span>{key.usage_count || 0} requests</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Limit: {key.rate_limit_per_hour}/hour
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {key.domain_restrictions && key.domain_restrictions.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            <span>{key.domain_restrictions.join(', ')}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Any domain</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(key.created_at)}</span>
                        </div>
                        {key.last_used_at && (
                          <div className="text-xs text-gray-400">
                            Last used: {formatDate(key.last_used_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => deleteApiKey(key.id, key.name)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New API Key</h3>
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>

              <form onSubmit={createApiKey} className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Name *</Label>
                  <Input
                    id="keyName"
                    value={newKeyForm.name}
                    onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Company Website"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="keyDescription">Description</Label>
                  <Input
                    id="keyDescription"
                    value={newKeyForm.description}
                    onChange={(e) => setNewKeyForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="domainRestrictions">Domain Restrictions</Label>
                  <Input
                    id="domainRestrictions"
                    value={newKeyForm.domainRestrictions}
                    onChange={(e) => setNewKeyForm(prev => ({ ...prev, domainRestrictions: e.target.value }))}
                    placeholder="example.com, *.example.com (comma-separated)"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to allow usage from any domain
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="rateLimit">Rate Limit (requests per hour)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={newKeyForm.rateLimitPerHour}
                    onChange={(e) => setNewKeyForm(prev => ({ ...prev, rateLimitPerHour: e.target.value }))}
                    min="1"
                    max="10000"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" variant="primary" className="flex-1">
                    Create API Key
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiKeys;