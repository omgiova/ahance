import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function SeparatorBlock({ block, updateBlock }) {
  const [style, setStyle] = useState(block.settings?.style || 'solid');
  const [width, setWidth] = useState(block.settings?.width || '100');

  const handleStyleChange = (value) => {
    setStyle(value);
    updateBlock(block.id, {
      settings: { ...block.settings, style: value }
    });
  };

  const handleWidthChange = (value) => {
    setWidth(value);
    updateBlock(block.id, {
      settings: { ...block.settings, width: value }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs uppercase tracking-wider text-zinc-400">Estilo</Label>
          <Select value={style} onValueChange={handleStyleChange}>
            <SelectTrigger className="w-32 bg-black/20 border-white/10 text-zinc-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950/90 backdrop-blur-xl border-white/10 text-zinc-100">
              <SelectItem value="solid">Sólido</SelectItem>
              <SelectItem value="dashed">Tracejado</SelectItem>
              <SelectItem value="dotted">Pontilhado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs uppercase tracking-wider text-zinc-400">Largura</Label>
          <Select value={width} onValueChange={handleWidthChange}>
            <SelectTrigger className="w-32 bg-black/20 border-white/10 text-zinc-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950/90 backdrop-blur-xl border-white/10 text-zinc-100">
              <SelectItem value="25">25%</SelectItem>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Separator Preview */}
      <div className="flex justify-center py-4">
        <div
          className="border-t-2 border-white/20"
          style={{
            width: `${width}%`,
            borderStyle: style
          }}
        />
      </div>
    </div>
  );
}