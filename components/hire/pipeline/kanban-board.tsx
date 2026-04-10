"use client"

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, GripVertical } from 'lucide-react';
import { updateTalentStatusAction } from '@/app/(app)/hire/actions';
import { toast } from 'sonner';

interface KanbanBoardProps {
  initialData: Record<string, any[]>;
  stages: { id: string; name: string; icon: any; color: string }[];
}

export function KanbanBoard({ initialData, stages }: KanbanBoardProps) {
  const [items, setItems] = useState(initialData);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string) => {
    if (id in items) return id;
    return Object.keys(items).find((key) => items[key].some((item) => item.id === id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id in items) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setItems((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((item) => item.id === active.id);
      const overIndex = overItems.findIndex((item) => item.id === overId);

      let newIndex;
      if (overId in prev) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowLastItem = over && overIndex === overItems.length - 1;
        const modifier = isBelowLastItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: [...prev[activeContainer].filter((item) => item.id !== active.id)],
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          items[activeContainer][activeIndex],
          ...prev[overContainer].slice(newIndex),
        ],
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over?.id as string);

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      if (overContainer) {
         // Persist change to server
         try {
           await updateTalentStatusAction(active.id as string, overContainer);
           toast.success(`Moved to ${overContainer}`);
         } catch (e) {
           toast.error("Failed to update status");
         }
      }
      setActiveId(null);
      return;
    }

    const activeIndex = items[activeContainer].findIndex((item) => item.id === active.id);
    const overIndex = items[overContainer].findIndex((item) => item.id === over?.id);

    if (activeIndex !== overIndex) {
      setItems((items) => ({
        ...items,
        [overContainer]: arrayMove(items[overContainer], activeIndex, overIndex),
      }));
    }

    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 min-h-[600px] items-start">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            id={stage.id}
            title={stage.name}
            icon={stage.icon}
            items={items[stage.id] || []}
            color={stage.color}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeId ? (
          <CandidateCard 
            candidate={Object.values(items).flat().find(i => i.id === activeId)} 
            isOverlay 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ id, title, icon: Icon, items, color }: any) {
  return (
    <div className="min-w-[240px] w-[240px] flex flex-col gap-3">
      <div className="px-4 py-3 rounded-2xl border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            {Icon && <Icon className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-[11px] text-[#141413]">{items.length} candidates</p>
          </div>
        </div>
      </div>

      <SortableContext id={id} items={items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[150px]">
          {items.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center border border-dashed border-black/[0.08] rounded-2xl">
              <p className="text-xs text-muted-foreground">Drop here</p>
            </div>
          ) : (
            items.map((item: any) => (
              <SortableCandidateCard key={item.id} candidate={item} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableCandidateCard({ candidate }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
        <CandidateCard candidate={candidate} dragListeners={listeners} />
    </div>
  );
}

function CandidateCard({ candidate, isOverlay, dragListeners }: any) {
  if (!candidate) return null;
  
  return (
    <div className={`p-4 bg-[#f5f4ef] text-[#141413] rounded-2xl border border-black/[0.03] shadow-sm shadow-black/[0.02] transition-all group flex flex-col gap-3 ${isOverlay ? 'shadow-md cursor-grabbing' : 'hover:shadow-md'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            {...dragListeners}
            className="cursor-grab p-1 hover:bg-black/[0.04] rounded-md active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-[#141413]" />
          </div>
          <div className="w-8 h-8 rounded-full bg-[#c96442]/10 flex items-center justify-center text-[#c96442] font-bold text-[10px]">
            {candidate.firstName[0]}{candidate.lastName[0]}
          </div>
          <div>
            <h4 className="text-xs font-semibold">{candidate.firstName} {candidate.lastName}</h4>
            <span className="text-[11px] text-[#141413]">{candidate.sourcedFrom || "Direct"}</span>
          </div>
        </div>
        {candidate.linkedinUrl && (
          <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md">
              <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
        )}
      </div>

      {candidate.notes && (
        <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.03]">
          <p className="text-xs text-[#141413] line-clamp-2 leading-relaxed italic">&ldquo;{candidate.notes}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
