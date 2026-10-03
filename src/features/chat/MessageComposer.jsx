import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';

export default function MessageComposer({ onSend }) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    // Use click instead of mousedown to avoid racing with the button's onClick
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, []);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
  };

  return (
    <div className="flex items-center gap-4 max-w-4xl mx-auto relative">
      <div className="flex-1 relative flex items-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent document click
            setShowEmojiPicker(!showEmojiPicker);
          }}
          className="absolute left-4 z-20 p-2 text-[#A49380] hover:text-[#F48E6E] transition-colors rounded-full hover:bg-white/40 cursor-pointer pointer-events-auto"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="w-full bg-white/40 border border-white/60 rounded-[1.5rem] pl-14 pr-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#F48E6E]/50 text-[13px] text-[#4A3B2F] placeholder-[#A49380] shadow-sm backdrop-blur-md transition-all"
        />
        
        {showEmojiPicker && (
          <div ref={pickerRef} className="absolute bottom-[calc(100%+1rem)] left-0 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/50">
            <EmojiPicker onEmojiClick={onEmojiClick} theme="light" />
          </div>
        )}
      </div>
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="bg-gradient-to-br from-[#F48E6E] to-[#D96540] hover:scale-105 text-white p-4.5 w-14 h-14 rounded-[1.25rem] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#F48E6E]/30 active:scale-95 flex items-center justify-center flex-shrink-0"
      >
        <svg className="w-6 h-6 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V6m0 0l-7 7m7-7l7 7" />
        </svg>
      </button>
    </div>
  );
}
