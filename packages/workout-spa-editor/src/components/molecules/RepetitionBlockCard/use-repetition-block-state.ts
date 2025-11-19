import { useState } from "react";
import type { RepetitionBlock } from "../../../types/krd";

export const useRepetitionBlockState = (
  block: RepetitionBlock,
  onEditRepeatCount?: (count: number) => void
) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingCount, setIsEditingCount] = useState(false);
  const [editValue, setEditValue] = useState(block.repeatCount.toString());

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEditClick = () => {
    setIsEditingCount(true);
    setEditValue(block.repeatCount.toString());
  };

  const handleSaveCount = () => {
    const newCount = parseInt(editValue, 10);
    if (!isNaN(newCount) && newCount >= 2) {
      onEditRepeatCount?.(newCount);
      setIsEditingCount(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingCount(false);
    setEditValue(block.repeatCount.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveCount();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return {
    isExpanded,
    isEditingCount,
    editValue,
    setEditValue,
    handleToggleExpand,
    handleEditClick,
    handleSaveCount,
    handleCancelEdit,
    handleKeyDown,
  };
};
