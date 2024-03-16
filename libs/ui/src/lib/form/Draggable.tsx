import clsx from 'clsx';
import React from 'react';

type Props<T extends { uid: string }> = {
  items: T[];
  renderItem: (item: T, i: number) => React.ReactNode;
  handleMove: (srcIndex: number, dstIndex: number) => void;
};

export function Draggable<T extends { uid: string }>({ items, renderItem, handleMove }: Props<T>) {
  const handleAllowDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.getData('text/plain').startsWith('app-image-')) {
      const draggedIndex = Number(e.dataTransfer.getData('text/plain').split('-')[2]);
      const currentIndex = Number(e.currentTarget.dataset.dragIndex);
      if (draggedIndex > currentIndex) {
        e.currentTarget.classList.remove('after:hidden');
        e.preventDefault();
      } else if (draggedIndex < currentIndex) {
        e.currentTarget.classList.remove('before:hidden');
        e.preventDefault();
      }
    }
  };

  const clearVisuals = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.add('after:hidden');
    e.currentTarget.classList.add('before:hidden');
  };

  return items.map((item, i) => (
    <div
      key={item.uid}
      draggable
      data-drag-index={i}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', 'app-image-' + i);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnter={handleAllowDrop}
      onDragOver={handleAllowDrop}
      onDragExit={clearVisuals}
      onDrop={(e) => {
        clearVisuals(e);
        e.preventDefault();
        const srcIndex = e.dataTransfer.getData('text/plain').split('-')[2];
        if (srcIndex !== i.toString()) {
          handleMove(Number(srcIndex), i);
        }
      }}
      className={clsx(
        'relative',
        "after:content-[''] after:hidden after:absolute after:left-0 after:top-0 after:bottom-0 after:w-2 after:bg-primary-100",
        "before:content-[''] before:hidden before:absolute before:right-0 before:top-0 before:bottom-0 before:w-2 before:bg-primary-100"
      )}
    >
      {renderItem(item, i)}
    </div>
  ));
}
