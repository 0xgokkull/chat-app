import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../auth/useAuth';

export default function ActionResponseModal({ request, onClose }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('completed');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // For MVP, we insert directly into the table, relying on RLS for security.
      // Alternatively, we can call the respond-to-action Edge Function here.
      const { error: insertError } = await supabase.from('action_responses').insert([{
        action_request_id: request.id,
        responder_id: request.assigned_user_id,
        response_status: status,
        response_note: note
      }]);

      if (insertError) throw insertError;

      // Update the request state to responded
      const { error: updateError } = await supabase.from('action_requests')
        .update({ state: 'responded', resolved_at: new Date().toISOString() })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Post a system message in the chat!
      const { error: msgError } = await supabase.from('messages').insert([{
        group_id: request.group_id,
        sender_id: user.id,
        body: `✅ Task Update: ${request.title} is now **${status.replace('_', ' ')}**. ${note ? `\nNote: ${note}` : ''}`,
        message_type: 'action_result'
      }]);

      if (msgError) throw msgError;

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sandstone-900/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-sandstone-50 border border-sandstone-300 p-6 rounded-2xl w-full max-w-md shadow-xl animate-float-delayed relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
        
        <h3 className="text-xl font-bold text-sandstone-900 mb-2">Respond to Action</h3>
        <p className="text-sm text-sandstone-800 mb-6 border-l-2 border-accent pl-3">
          {request.title}
        </p>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-500 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-warm-muted uppercase tracking-wide mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-white border border-sandstone-300 rounded-xl px-4 py-3 text-sandstone-900 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 shadow-sm"
            >
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-muted uppercase tracking-wide mb-1">Notes / Evidence</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add details, links, or proof of completion..."
              className="w-full bg-white border border-sandstone-300 rounded-xl px-4 py-3 text-sandstone-900 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 resize-none placeholder-warm-muted shadow-sm"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sandstone-800 hover:text-sandstone-900 hover:bg-sandstone-200 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold shadow-sm shadow-accent/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
