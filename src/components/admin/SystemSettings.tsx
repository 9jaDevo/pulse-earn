import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Globe,
  Bell,
  Palette,
  Code,
  Save,
  RefreshCw,
  Zap,
  Award,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsService } from '../../services/settingsService';
import { useToast } from '../../hooks/useToast';

export const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'integrations' | 'points'>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, Record<string, any>>>({
    general: {},
    security: {},
    notifications: {},
    integrations: {},
    points: {}
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: serviceError } = await SettingsService.getAllSettings();
      
      if (serviceError) {
        setError(serviceError);
        errorToast(`Failed to load settings: ${serviceError}`);
      } else if (data) {
        // Initialize any missing categories with empty objects
        const completeSettings = {
          general: data.general || {},
          security: data.security || {},
          notifications: data.notifications || {},
          integrations: data.integrations || {},
          points: data.points || {}
        };
        
        setSettings(completeSettings);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading settings';
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      errorToast('You must be logged in to update settings');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Save each category of settings
      const promises = Object.entries(settings).map(([category, categorySettings]) => 
        SettingsService.updateSettings(user.id, category, categorySettings)
      );
      
      const results = await Promise.all(promises);
      
      // Check if any updates failed
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        const errorMessage = errors.map(e => e.error).join(', ');
        setError(`Failed to save some settings: ${errorMessage}`);
        errorToast(`Failed to save some settings: ${errorMessage}`);
      } else {
        successToast('Settings saved successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving settings';
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const renderGeneral = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <Settings className="h-6 w-6 mr-3 text-primary-600" />
        General Settings
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.general.platformName || ''}
                onChange={(e) => updateSetting('general', 'platformName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Description
              </label>
              <textarea
                value={settings.general.platformDescription || ''}
                onChange={(e) => updateSetting('general', 'platformDescription', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Language
              </label>
              <select 
                value={settings.general.defaultLanguage || 'en'}
                onChange={(e) => updateSetting('general', 'defaultLanguage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Theme
              </label>
              <select 
                value={settings.general.defaultTheme || 'light'}
                onChange={(e) => updateSetting('general', 'defaultTheme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allow User Theme Selection
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowThemeSelection"
                  checked={settings.general.allowThemeSelection !== false}
                  onChange={(e) => updateSetting('general', 'allowThemeSelection', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="allowThemeSelection" className="ml-2 block text-sm text-gray-900">
                  Allow users to change theme
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPoints = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <Award className="h-6 w-6 mr-3 text-primary-600" />
        Points & Rewards Settings
      </h2>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Points Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Vote Points
            </label>
            <input
              type="number"
              value={settings.points.pollVotePoints || 50}
              onChange={(e) => updateSetting('points', 'pollVotePoints', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trivia Easy Points
            </label>
            <input
              type="number"
              value={settings.points.triviaEasyPoints || 10}
              onChange={(e) => updateSetting('points', 'triviaEasyPoints', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trivia Medium Points
            </label>
            <input
              type="number"
              value={settings.points.triviaMediumPoints || 20}
              onChange={(e) => updateSetting('points', 'triviaMediumPoints', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trivia Hard Points
            </label>
            <input
              type="number"
              value={settings.points.triviaHardPoints || 30}
              onChange={(e) => updateSetting('points', 'triviaHardPoints', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ad Watch Points
            </label>
            <input
              type="number"
              value={settings.points.adWatchPoints || 15}
              onChange={(e) => updateSetting('points', 'adWatchPoints', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Bonus Points
            </label>
            <input
              type="number"
              value={settings.points.referralBonusPoints || 100}
              onChange={(e) => updateSetting('points', 'referralBonusPoints', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Streak Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Streak Multiplier
            </label>
            <input
              type="number"
              value={settings.points.maxStreakMultiplier || 2.0}
              onChange={(e) => updateSetting('points', 'maxStreakMultiplier', parseFloat(e.target.value))}
              step="0.1"
              min="1.0"
              max="5.0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum multiplier for daily streaks (e.g., 2.0 = double points)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Streak Increment
            </label>
            <input
              type="number"
              value={settings.points.streakIncrement || 0.1}
              onChange={(e) => updateSetting('points', 'streakIncrement', parseFloat(e.target.value))}
              step="0.01"
              min="0.01"
              max="0.5"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">How much the multiplier increases per day (e.g., 0.1 = +10% per day)</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <Shield className="h-6 w-6 mr-3 text-primary-600" />
        Security Settings
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Require Email Verification</p>
                <p className="text-sm text-gray-500">Users must verify their email before accessing the platform</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.security.requireEmailVerification === true}
                  onChange={(e) => updateSetting('security', 'requireEmailVerification', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Enable 2FA for admin accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.security.twoFactorAuth === true}
                  onChange={(e) => updateSetting('security', 'twoFactorAuth', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.security.sessionTimeoutMinutes || 60}
                onChange={(e) => updateSetting('security', 'sessionTimeoutMinutes', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Moderation</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto-moderate Content</p>
                <p className="text-sm text-gray-500">Automatically flag potentially inappropriate content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.security.autoModerateContent !== false}
                  onChange={(e) => updateSetting('security', 'autoModerateContent', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Require Poll Approval</p>
                <p className="text-sm text-gray-500">New polls must be approved before going live</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.security.requirePollApproval === true}
                  onChange={(e) => updateSetting('security', 'requirePollApproval', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Reports Before Auto-hide
              </label>
              <input
                type="number"
                value={settings.security.maxReportsBeforeAutoHide || 5}
                onChange={(e) => updateSetting('security', 'maxReportsBeforeAutoHide', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <Bell className="h-6 w-6 mr-3 text-primary-600" />
        Notification Settings
      </h2>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">New User Registrations</p>
              <p className="text-sm text-gray-500">Notify admins when new users register</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.newUserRegistrations !== false}
                onChange={(e) => updateSetting('notifications', 'newUserRegistrations', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Content Reports</p>
              <p className="text-sm text-gray-500">Notify moderators of new content reports</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.contentReports !== false}
                onChange={(e) => updateSetting('notifications', 'contentReports', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">System Alerts</p>
              <p className="text-sm text-gray-500">Critical system notifications and errors</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.systemAlerts !== false}
                onChange={(e) => updateSetting('notifications', 'systemAlerts', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Poll Comment Notifications</p>
              <p className="text-sm text-gray-500">Notify users when someone comments on their poll</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.pollCommentNotifications !== false}
                onChange={(e) => updateSetting('notifications', 'pollCommentNotifications', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Badge Earned Notifications</p>
              <p className="text-sm text-gray-500">Notify users when they earn a new badge</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.badgeEarnedNotifications !== false}
                onChange={(e) => updateSetting('notifications', 'badgeEarnedNotifications', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Redemption Status Notifications</p>
              <p className="text-sm text-gray-500">Notify users when their redemption status changes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications.redemptionStatusNotifications !== false}
                onChange={(e) => updateSetting('notifications', 'redemptionStatusNotifications', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <Globe className="h-6 w-6 mr-3 text-primary-600" />
        Integrations
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Google AdSense</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publisher ID
              </label>
              <input
                type="text"
                value={settings.integrations.adsenseClientId || ''}
                onChange={(e) => updateSetting('integrations', 'adsenseClientId', e.target.value)}
                placeholder="ca-pub-xxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header Ad Slot
              </label>
              <input
                type="text"
                value={settings.integrations.adsenseHeaderSlot || ''}
                onChange={(e) => updateSetting('integrations', 'adsenseHeaderSlot', e.target.value)}
                placeholder="1234567890"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Enable Ads</p>
                <p className="text-sm text-gray-500">Show advertisements on the platform</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.integrations.adsenseEnabled !== false}
                  onChange={(e) => updateSetting('integrations', 'adsenseEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Service</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.integrations.smtpHost || ''}
                onChange={(e) => updateSetting('integrations', 'smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port
              </label>
              <input
                type="number"
                value={settings.integrations.smtpPort || ''}
                onChange={(e) => updateSetting('integrations', 'smtpPort', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="587"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email
              </label>
              <input
                type="email"
                value={settings.integrations.fromEmail || ''}
                onChange={(e) => updateSetting('integrations', 'fromEmail', e.target.value)}
                placeholder="noreply@pulselearn.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-600">Configure platform settings and integrations</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      )}

      {/* Tabs */}
      {!loading && (
        <>
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { key: 'general', label: 'General', icon: Settings },
                { key: 'points', label: 'Points & Rewards', icon: Zap },
                { key: 'security', label: 'Security', icon: Shield },
                { key: 'notifications', label: 'Notifications', icon: Bell },
                { key: 'integrations', label: 'Integrations', icon: Globe }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          {activeTab === 'general' && renderGeneral()}
          {activeTab === 'points' && renderPoints()}
          {activeTab === 'security' && renderSecurity()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'integrations' && renderIntegrations()}
        </>
      )}
    </div>
  );
};