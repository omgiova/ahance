import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Bold, Italic } from 'lucide-react';

const FONT_FAMILIES = [
  { value: 'serif', label: 'Serif (EB Garamond)', style: 'EB Garamond, serif' },
  { value: 'sans', label: 'Sans Serif (Arial)', style: 'Arial, sans-serif' },
  { value: 'mono', label: 'Monospace (Courier)', style: 'Courier New, monospace' },
  { value: 'georgia', label: 'Georgia', style: 'Georgia, serif' },
  { value: 'verdana', label: 'Verdana', style: 'Verdana, sans-serif' }
];

const FONT_SIZES = [
  { value: 'sm', label: 'Pequeno', class: 'text-sm' },
  { value: 'base', label: 'Normal', class: 'text-base' },
  { value: 'lg', label: 'Grande', class: 'text-lg' },
  { value: 'xl', label: 'Extra Grande', class: 'text-xl' },
  { value: '2xl', label: 'Muito Grande', class: 'text-2xl' }
];

export default function TextBlock({ block, updateBlock }) {
  const [text, setText] = useState(block.content.text || '');
  const [isBold, setIsBold] = useState(block.settings?.bold || false);
  const [isItalic, setIsItalic] = useState(block.settings?.italic || false);
  const [fontSize, setFontSize] = useState(block.settings?.fontSize || 'base');
  const [fontFamily, setFontFamily] = useState(block.settings?.fontFamily || 'serif');

  const handleChange = (value) => {
    setText(value);
    updateBlock(block.id, {
      content: { ...block.content, text: value }
    });
  };

  const toggleBold = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    updateBlock(block.id, {
      settings: { ...block.settings, bold: newBold }
    });
  };

  const toggleItalic = () => {
    const newItalic = !isItalic;
    setIsItalic(newItalic);
    updateBlock(block.id, {
      settings: { ...block.settings, italic: newItalic }
    });
  };

  const handleFontSizeChange = (value) => {
    setFontSize(value);
    updateBlock(block.id, {
      settings: { ...block.settings, fontSize: value }
    });
  };

  const handleFontFamilyChange = (value) => {
    setFontFamily(value);
    updateBlock(block.id, {
      settings: { ...block.settings, fontFamily: value }
    });
  };

  const currentFontStyle = FONT_FAMILIES.find(f => f.value === fontFamily)?.style || 'EB Garamond, serif';
  const currentFontSize = FONT_SIZES.find(f => f.value === fontSize);

  return (
    <div className="space-y-4">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleBold}
            className={`${isBold ? 'bg-black/10' : ''} text-black hover:text-black hover:bg-black/5`}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleItalic}
            className={`${isItalic ? 'bg-black/10' : ''} text-black hover:text-black hover:bg-black/5`}
          >
            <Italic className="w-4 h-4" />
          </Button>
        </div>

        {/* Font Size Selector */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-black/60" style={{ fontFamily: 'EB Garamond, serif' }}>
            Tamanho
          </Label>
          <Select value={fontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-32 h-8 bg-white border-black/20 text-black text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#fffeec] border-black/20 text-black">
              {FONT_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value} className="text-xs">
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Family Selector */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-black/60" style={{ fontFamily: 'EB Garamond, serif' }}>
            Fonte
          </Label>
          <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="w-40 h-8 bg-white border-black/20 text-black text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#fffeec] border-black/20 text-black">
              {FONT_FAMILIES.map((font) => (
                <SelectItem 
                  key={font.value} 
                  value={font.value} 
                  className="text-xs"
                  style={{ fontFamily: font.style }}
                >
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Text Input */}
      <Textarea
        data-testid="text-block-input"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Escreva seu texto aqui..."
        rows={6}
        className={`w-full bg-white border-black/20 text-black placeholder:text-black/40 focus-visible:ring-1 focus-visible:ring-[#e38e4d] resize-none ${
          currentFontSize?.class || 'text-base'
        } ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''}`}
        style={{ fontFamily: currentFontStyle }}
      />
    </div>
  );
}
