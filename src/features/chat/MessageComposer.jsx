import React, { useState } from 'react';

export default function MessageComposer({ onSend }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="flex items-center gap-4 max-w-4xl mx-auto">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Type your message..."
        className="flex-1 bg-sandstone-50 border border-sandstone-300 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-accent/50 text-[13px] text-sandstone-900 placeholder-warm-muted shadow-sm"
      />
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="bg-accent hover:bg-accent-hover text-white p-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-accent/20 transform hover:scale-105 active:scale-95 flex items-center justify-center"
      >
        <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}
