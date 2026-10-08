const fs = require('fs');
let c = fs.readFileSync('src/components/features/PointsLeaderboardClient.tsx', 'utf8');

const newQuickButtons = `const SPIRITUAL_BUTTONS = [
  { label: "حضور قداس", value: 25, variant: "outline" },
  { label: "تسبحة وعشية", value: 20, variant: "outline" },
  { label: "طقس ألحان", value: 15, variant: "outline" },
  { label: "مدارس الأحد", value: 15, variant: "outline" },
  { label: "درس كتاب مقدس", value: 15, variant: "outline" },
];

const SPORT_BUTTONS = [
  { label: "دوري كورة", value: 10, variant: "outline" },
  { label: "دوري شطرنج", value: 15, variant: "outline" },
  { label: "دوري بلايستيشن", value: 15, variant: "outline" },
  { label: "دوري بينج بونج", value: 15, variant: "outline" },
];

const PENALTY_BUTTONS = [
  { label: "خصم سلوك", value: -5, variant: "destructive" },
];
`;

c = c.replace(/const QUICK_BUTTONS = \[\s*\{ label: "دوري كورة"[\s\S]*?\];/, newQuickButtons);

const oldGrid = `<div className="grid grid-cols-2 gap-2">
                {QUICK_BUTTONS.map((btn) => (
                  <Button 
                    key={btn.label}
                    variant={btn.variant as any} 
                    disabled={loading}
                    onClick={() => handleQuickButton(btn)}
                  >
                    {btn.label} ({btn.value > 0 ? \`+\${btn.value}\` : btn.value})
                  </Button>
                ))}
              </div>`;

const newGrid = `<div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary">إضافات روحية</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPIRITUAL_BUTTONS.map((btn) => (
                      <Button key={btn.label} variant={btn.variant as any} disabled={loading} onClick={() => handleQuickButton(btn)} size="sm">
                        {btn.label} (+{btn.value})
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary">إضافات نشاط</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPORT_BUTTONS.map((btn) => (
                      <Button key={btn.label} variant={btn.variant as any} disabled={loading} onClick={() => handleQuickButton(btn)} size="sm">
                        {btn.label} (+{btn.value})
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-destructive">خصومات</Label>
                  <div className="flex flex-wrap gap-2">
                    {PENALTY_BUTTONS.map((btn) => (
                      <Button key={btn.label} variant={btn.variant as any} disabled={loading} onClick={() => handleQuickButton(btn)} size="sm">
                        {btn.label} ({btn.value})
                      </Button>
                    ))}
                  </div>
                </div>
              </div>`;

c = c.replace(oldGrid, newGrid);

fs.writeFileSync('src/components/features/PointsLeaderboardClient.tsx', c);
