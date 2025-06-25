import { supabase, Database } from '../lib/supabase';
import type { ServiceResponse } from './profileService';
import type { ModeratorAction, ModeratorActionRequest, ContentReport } from '../types/api';

type ModeratorActionRow = Database['public']['Tables']['moderator_actions']['Row'];
type ModeratorActionInsert = Database['public']['Tables']['moderator_actions']['Insert'];

/**
 * Moderation Service
 * 
 * This service handles all moderation-related operations including:
 * - Recording moderator actions
 * - Managing content approval/rejection
 * - User management actions
 * - Moderation history and reporting
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class ModerationService {
  /**
   * Record a moderator action
   */
  static async recordAction(
    moderatorId: string,
    actionData: ModeratorActionRequest
  ): Promise<ServiceResponse<ModeratorAction>> {
    try {
      const actionInsert: ModeratorActionInsert = {
        moderator_id: moderatorId,
        action_type: actionData.action_type,
        target_id: actionData.target_id,
        target_table: actionData.target_table,
        reason: actionData.reason,
        metadata: actionData.metadata || {}
      };

      const { data, error } = await supabase
        .from('moderator_actions')
        .insert(actionInsert)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to record moderator action'
      };
    }
  }

  /**
   * Get moderator actions history
   */
  static async getModeratorActions(
    moderatorId?: string,
    options: {
      limit?: number;
      actionType?: string;
      targetTable?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ServiceResponse<ModeratorAction[]>> {
    try {
      const { limit = 50, actionType, targetTable, startDate, endDate } = options;

      let query = supabase
        .from('moderator_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (moderatorId) {
        query = query.eq('moderator_id', moderatorId);
      }

      if (actionType) {
        query = query.eq('action_type', actionType);
      }

      if (targetTable) {
        query = query.eq('target_table', targetTable);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get moderator actions'
      };
    }
  }

  /**
   * Approve content (polls, trivia questions, etc.)
   */
  static async approveContent(
    moderatorId: string,
    targetId: string,
    targetTable: string,
    reason?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Record the action
      const { error: actionError } = await this.recordAction(moderatorId, {
        action_type: 'approve',
        target_id: targetId,
        target_table: targetTable,
        reason,
        metadata: { approved: true }
      });

      if (actionError) {
        return { data: null, error: actionError };
      }

      // Update the target content to approved status
      // This would depend on the specific table structure
      // For now, we'll just record the action
      
      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to approve content'
      };
    }
  }

  /**
   * Reject content
   */
  static async rejectContent(
    moderatorId: string,
    targetId: string,
    targetTable: string,
    reason: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Record the action
      const { error: actionError } = await this.recordAction(moderatorId, {
        action_type: 'reject',
        target_id: targetId,
        target_table: targetTable,
        reason,
        metadata: { approved: false }
      });

      if (actionError) {
        return { data: null, error: actionError };
      }

      // Update the target content to rejected status
      // This would depend on the specific table structure
      
      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to reject content'
      };
    }
  }

  /**
   * Ban user
   */
  static async banUser(
    moderatorId: string,
    userId: string,
    reason: string,
    duration?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Record the action
      const { error: actionError } = await this.recordAction(moderatorId, {
        action_type: 'ban',
        target_id: userId,
        target_table: 'profiles',
        reason,
        metadata: { duration, banned: true }
      });

      if (actionError) {
        return { data: null, error: actionError };
      }

      // In a real implementation, you would update the user's status
      // For now, we'll just record the action
      
      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to ban user'
      };
    }
  }

  /**
   * Unban user
   */
  static async unbanUser(
    moderatorId: string,
    userId: string,
    reason?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Record the action
      const { error: actionError } = await this.recordAction(moderatorId, {
        action_type: 'unban',
        target_id: userId,
        target_table: 'profiles',
        reason,
        metadata: { banned: false }
      });

      if (actionError) {
        return { data: null, error: actionError };
      }

      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to unban user'
      };
    }
  }

  /**
   * Get moderation statistics
   */
  static async getModerationStats(
    moderatorId?: string,
    timeframe: 'day' | 'week' | 'month' = 'month'
  ): Promise<ServiceResponse<{
    totalActions: number;
    approvals: number;
    rejections: number;
    bans: number;
    actionsByType: { type: string; count: number }[];
  }>> {
    try {
      let startDate = new Date();
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      let query = supabase
        .from('moderator_actions')
        .select('action_type')
        .gte('created_at', startDate.toISOString());

      if (moderatorId) {
        query = query.eq('moderator_id', moderatorId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      const actions = data || [];
      const totalActions = actions.length;
      const approvals = actions.filter(a => a.action_type === 'approve').length;
      const rejections = actions.filter(a => a.action_type === 'reject').length;
      const bans = actions.filter(a => a.action_type === 'ban').length;

      // Count actions by type
      const actionCounts: Record<string, number> = {};
      actions.forEach(action => {
        actionCounts[action.action_type] = (actionCounts[action.action_type] || 0) + 1;
      });

      const actionsByType = Object.entries(actionCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      return {
        data: {
          totalActions,
          approvals,
          rejections,
          bans,
          actionsByType
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get moderation statistics'
      };
    }
  }

  /**
   * Get content reports
   */
  static async getContentReports(
    options: {
      status?: 'pending' | 'reviewed' | 'resolved' | 'rejected';
      contentType?: 'poll' | 'comment';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ServiceResponse<ContentReport[]>> {
    try {
      const { status, contentType, limit = 50, offset = 0 } = options;

      let query = supabase
        .from('content_reports')
        .select(`
          *,
          reporter:reporter_id(name, email),
          resolver:resolved_by(name, email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get content reports'
      };
    }
  }

  /**
   * Update content report status
   */
  static async updateReportStatus(
    moderatorId: string,
    reportId: string,
    status: 'reviewed' | 'resolved' | 'rejected',
    notes?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({
          status,
          resolved_by: status === 'pending' ? null : moderatorId,
          resolution_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) {
        return { data: null, error: error.message };
      }

      // Record the action
      await this.recordAction(moderatorId, {
        action_type: `report_${status}`,
        target_id: reportId,
        target_table: 'content_reports',
        reason: notes,
        metadata: { status }
      });

      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update report status'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  recordAction,
  getModeratorActions,
  approveContent,
  rejectContent,
  banUser,
  unbanUser,
  getModerationStats,
  getContentReports,
  updateReportStatus
} = ModerationService;