import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🫢', '🫣', '🤫', '🤔'],
  'Gestures': ['👍', '👎', '👏', '🙌', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '👋', '🤚', '✋', '🖐️', '👊', '✊', '🤛', '🤜', '💪', '🦾', '🖕', '☝️', '👆', '👇', '👈', '👉'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '🫶'],
  'Objects': ['🏠', '🏡', '🏢', '🏨', '🏰', '✈️', '🚗', '🚕', '🚙', '🗓️', '📅', '📆', '🗺️', '🌍', '🌎', '🌏', '🧳', '💼', '📱', '💻', '⌚', '📷', '🎥', '🔑', '🔐', '💳', '✉️', '📩'],
  'Nature': ['🌞', '🌙', '⭐', '🌈', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '❄️', '🌊', '🌴', '🌳', '🌲', '🌵', '🌸', '🌺', '🌻', '🌷', '🍀', '🌱', '🐶', '🐱', '🦊', '🐻', '🐼', '🐨'],
};

export default function EmojiPicker({ onEmojiSelect }) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Smileys');

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
          <Smile className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="top">
        <div className="p-2">
          {/* Category Tabs */}
          <div className="flex gap-1 mb-2 overflow-x-auto pb-1 border-b border-slate-100">
            {Object.keys(EMOJI_CATEGORIES).map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                  activeCategory === category 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto">
            {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-slate-100 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}