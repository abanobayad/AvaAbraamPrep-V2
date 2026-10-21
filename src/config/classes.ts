/** The three preparatory classes, in display order. */
export const CLASSES = ["أولى إعدادي", "ثانية إعدادي", "ثالثة إعدادي"] as const;
export type ClassName = (typeof CLASSES)[number];
