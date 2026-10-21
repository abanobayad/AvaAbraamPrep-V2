/** Meeting / activity types and the points each attendee earns. Keep in sync with the quick-award buttons. */
export const MEETING_TYPES = [
  { key: "MASS", label: "حضور قداس", points: 100 },
  { key: "SUNDAY_SCHOOL", label: "مدارس الأحد", points: 75 },
  { key: "PRAISE_VESPERS", label: "تسبحة وعشية", points: 75 },
  { key: "HYMNS", label: "درس الألحان", points: 50 },
  { key: "BIBLE_STUDY", label: "درس الكتاب", points: 50 },
  { key: "GAME", label: "دوري / نشاط", points: 50 },
  { key: "OTHER", label: "أخرى", points: 25 },
] as const;

export type MeetingTypeKey = (typeof MEETING_TYPES)[number]["key"];

export function meetingTypeLabel(key: string): string {
  return MEETING_TYPES.find((t) => t.key === key)?.label ?? key;
}
