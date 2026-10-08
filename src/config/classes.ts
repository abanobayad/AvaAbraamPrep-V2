/** The three preparatory classes, in display order. One source of truth for every form and filter. */
export const CLASSES = ["أولى إعدادي", "ثانية إعدادي", "ثالثة إعدادي"] as const;
export type ClassName = (typeof CLASSES)[number];
