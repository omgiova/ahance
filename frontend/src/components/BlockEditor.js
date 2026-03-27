import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Type, Image as ImageIcon, Grid3x3, Play, Link2, Minus, Space } from 'lucide-react';
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
  { type: 'separator', label: 'Separador', icon: Minus },
  { type: 'spacer', label: 'Espaço', icon: Space }
];

export default function BlockEditor({ blocks, setBlocks, setCoverImage }) {
  const [showAddMenu, setShowAddMenu] = useState(false);

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

  const addBlock = (type) => {
    const newBlock = {
      id: uuidv4(),
      type,
      content: {},
      settings: {
        width: '100',
        padding: 'normal'
      }
    };

    setBlocks([...blocks, newBlock]);
    setShowAddMenu(false);
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

  return (
    <div className="space-y-6">
      {/* Blocks List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                updateBlock={updateBlock}
                deleteBlock={deleteBlock}
                duplicateBlock={duplicateBlock}
                setCoverImage={setCoverImage}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      {/* Add Block Button */}
      <div className="relative">
        <motion.button
          data-testid="add-block-btn"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full bg-white/5 backdrop-blur-2xl border-2 border-dashed border-white/20 hover:border-amber-500/50 hover:bg-amber-500/5 rounded-3xl p-8 transition-all duration-300 flex items-center justify-center gap-3 group"
        >
          <Plus className="w-6 h-6 text-zinc-400 group-hover:text-amber-500 transition-colors" />
          <span className="text-zinc-400 group-hover:text-amber-500 transition-colors font-medium">
            Adicionar Bloco
          </span>
        </motion.button>

        {/* Block Type Menu */}
        <AnimatePresence>
          {showAddMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-10"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    data-testid={`add-${type}-block`}
                    onClick={() => addBlock(type)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 transition-all group"
                  >
                    <Icon className="w-6 h-6 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                    <span className="text-sm text-zinc-300 group-hover:text-amber-500 transition-colors">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
