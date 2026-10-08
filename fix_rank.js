const fs = require('fs');
let c = fs.readFileSync('src/components/features/StudentPortalClient.tsx', 'utf8');

const oldRankLoop = `  let currentRank = 1;
  let prevPoints: number | null = null;
  let rankOffset = 0;
  
  const rankedStudents = students.map((s, idx) => {
    if (prevPoints !== null && s.totalPoints === prevPoints) {
      rankOffset++;
    } else {
      currentRank += rankOffset;
      if (prevPoints === null) currentRank = 1; 
      else currentRank = idx + 1;
      rankOffset = 0;
    }
    prevPoints = s.totalPoints;
    return { ...s, rank: currentRank };
  });`;

const newRankLoop = `  let currentRank = 1;
  let prevPoints: number | null = null;
  
  const rankedStudents = students.map((s, idx) => {
    if (idx === 0 || s.totalPoints !== prevPoints) currentRank = idx + 1;
    prevPoints = s.totalPoints;
    return { ...s, rank: currentRank };
  });`;

c = c.replace(oldRankLoop, newRankLoop);
fs.writeFileSync('src/components/features/StudentPortalClient.tsx', c);
