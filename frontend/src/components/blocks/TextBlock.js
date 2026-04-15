import { useEffect, useRef, useState } from 'react';
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

const toRichTextHtml = (value = '') => {
  if (!value) return '';
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
};

export default function TextBlock({ block, updateBlock }) {
  const editorRef = useRef(null);
  const [text, setText] = useState(block.content.text || '');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [fontSize, setFontSize] = useState(block.settings?.fontSize || 'base');
  const [fontFamily, setFontFamily] = useState(block.settings?.fontFamily || 'serif');

  useEffect(() => {
    const nextHtml = block.content.html || toRichTextHtml(block.content.text || '');
    setText(block.content.text || '');
    if (editorRef.current && editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [block.id, block.content.html, block.content.text]);

  const syncContent = () => {
    const newHtml = editorRef.current?.innerHTML || '';
    const plainText = (editorRef.current?.innerText || '').replace(/\n\n+/g, '\n\n');
    setText(plainText);
    updateBlock(block.id, {
      content: { ...block.content, text: plainText, html: newHtml }
    });
  };

  const updateFormatState = () => {
    setIsBold(Boolean(document.queryCommandState?.('bold')));
    setIsItalic(Boolean(document.queryCommandState?.('italic')));
  };

  const applyFormat = (command) => {
    editorRef.current?.focus();
    document.execCommand(command, false, null);
    syncContent();
    updateFormatState();
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
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat('bold')}
            className={`${isBold ? 'bg-black/10' : ''} text-black hover:text-black hover:bg-black/5`}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat('italic')}
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
      <div className="relative">
        {!text.trim() && (
          <div
            className={`absolute top-3 left-3 text-black/40 pointer-events-none ${currentFontSize?.class || 'text-base'}`}
            style={{ fontFamily: currentFontStyle }}
          >
            Escreva seu texto aqui...
          </div>
        )}
        <div
          ref={editorRef}
          data-testid="text-block-input"
          contentEditable
          suppressContentEditableWarning
          onInput={syncContent}
          onBlur={syncContent}
          onKeyUp={updateFormatState}
          onMouseUp={updateFormatState}
          className={`w-full min-h-[160px] rounded-md border border-black/20 bg-white px-3 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#e38e4d] whitespace-pre-wrap ${currentFontSize?.class || 'text-base'}`}
          style={{ fontFamily: currentFontStyle }}
        />
      </div>
    </div>
  );
}
