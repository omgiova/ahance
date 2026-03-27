import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List } from 'lucide-react';

export default function TextBlock({ block, updateBlock }) {
  const [text, setText] = useState(block.content.text || '');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const handleChange = (value) => {
    setText(value);
    updateBlock(block.id, {
      content: { ...block.content, text: value }
    });
  };

  return (
    <div className="space-y-4">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsBold(!isBold)}
          className={`${isBold ? 'bg-white/10' : ''} text-zinc-400 hover:text-zinc-100`}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsItalic(!isItalic)}
          className={`${isItalic ? 'bg-white/10' : ''} text-zinc-400 hover:text-zinc-100`}
        >
          <Italic className="w-4 h-4" />
        </Button>
      </div>

      {/* Text Input */}
      <Textarea
        data-testid="text-block-input"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Escreva seu texto aqui..."
        rows={6}
        className={`w-full bg-black/20 border-white/10 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-amber-500 resize-none ${
          isBold ? 'font-bold' : ''
        } ${isItalic ? 'italic' : ''}`}
        style={{ fontFamily: 'Manrope, sans-serif' }}
      />
    </div>
  );
}