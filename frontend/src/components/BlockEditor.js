import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Type, Image as ImageIcon, Grid3x3, Play, Link2, Minus, Space, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SortableBlock from '@/components/SortableBlock';
import { v4 as uuidv4 } from 'uuid';

const BLOCK_TYPES = [
  { type: 'text', label: 'Texto', icon: Type },
  { type: 'image', label: 'Imagem', icon: ImageIcon },
  { type: 'grid', label: 'Grid', icon: Grid3x3 },
  { type: 'carousel', label: 'Carrossel', icon: Play },
  { type: 'video', label: 'Vídeo', icon: Play },
  { type: 'embed', label: 'Embed', icon: Link2 },
  { type: 'pdf', label: 'PDF', icon: FileText },
  { type: 'separator', label: 'Separador', icon: Minus },
  { type: 'spacer', label: 'Espaço', icon: Space }
];

export default function BlockEditor({ blocks, setBlocks, setCoverImage }) {
  const [addMenuAt, setAddMenuAt] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addBlock = (type, insertAt) => {
    const newBlock = {
      id: uuidv4(),
      type,
      content: {},
      settings: {
        width: '100',
        padding: 'normal'
      }
    };

    if (insertAt !== undefined && insertAt !== null) {
      const newBlocks = [...blocks];
      newBlocks.splice(insertAt, 0, newBlock);
      setBlocks(newBlocks);
    } else {
      setBlocks([...blocks, newBlock]);
    }
    setAddMenuAt(null);
  };

  const updateBlock = (id, updates) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id) => {
    setBlocks(blocks.filter(block => block.id !== id));
  };

  const duplicateBlock = (id) => {
    const blockToDuplicate = blocks.find(block => block.id === id);
    if (blockToDuplicate) {
      const newBlock = {
        ...blockToDuplicate,
        id: uuidv4()
      };
      const index = blocks.findIndex(block => block.id === id);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
    }
  };

  const blockTypeMenu = (index) => (
    <AnimatePresence>
      {addMenuAt === index && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="absolute top-full left-0 right-0 mt-1 bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-20"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                data-testid={`add-${type}-block`}
                onClick={() => addBlock(type, index)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 transition-all group"
              >
                <Icon className="w-6 h-6 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                <span className="text-sm text-zinc-300 group-hover:text-amber-500 transition-colors">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const insertDivider = (index) => (
    <div key={`ins-${index}`} className="relative flex items-center justify-center group/ins" style={{ height: '2rem', margin: '2px 0' }}>
      <div className="absolute inset-x-0 top-1/2 h-px bg-white/0 group-hover/ins:bg-white/10 transition-colors" />
      <button
        onClick={() => setAddMenuAt(addMenuAt === index ? null : index)}
        className="relative z-10 w-7 h-7 rounded-full bg-zinc-900 border border-white/10 hover:border-amber-500/70 hover:bg-amber-500/10 flex items-center justify-center opacity-0 group-hover/ins:opacity-100 transition-all"
      >
        <Plus className="w-3.5 h-3.5 text-zinc-400" />
      </button>
      {blockTypeMenu(index)}
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Blocks List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, i) => (
            <div key={block.id}>
              {i === 0 && insertDivider(0)}
              <SortableBlock
                block={block}
                updateBlock={updateBlock}
                deleteBlock={deleteBlock}
                duplicateBlock={duplicateBlock}
                setCoverImage={setCoverImage}
              />
              {insertDivider(i + 1)}
            </div>
          ))}
        </SortableContext>
      </DndContext>

      {/* Add Block Button */}
      <div className="relative mt-4">
        <motion.button
          data-testid="add-block-btn"
          onClick={() => setAddMenuAt(addMenuAt === blocks.length ? null : blocks.length)}
          className="w-full bg-white/5 backdrop-blur-2xl border-2 border-dashed border-white/20 hover:border-amber-500/50 hover:bg-amber-500/5 rounded-3xl p-8 transition-all duration-300 flex items-center justify-center gap-3 group"
        >
          <Plus className="w-6 h-6 text-zinc-400 group-hover:text-amber-500 transition-colors" />
          <span className="text-zinc-400 group-hover:text-amber-500 transition-colors font-medium">
            Adicionar Bloco
          </span>
        </motion.button>
        {blockTypeMenu(blocks.length)}
      </div>
    </div>
  );
}
