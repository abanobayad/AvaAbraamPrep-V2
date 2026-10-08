const fs = require('fs');
let content = fs.readFileSync('src/components/features/PointsLeaderboardClient.tsx', 'utf8');
content = content.replace(
  /const updatedStudent = await awardPoints\(studentId, points, reason, currentUser\);\s+setStudents[^\n]+/,
  `const updatedStudent = await awardPoints(studentId, points, reason, currentUser) as any;
        if (!updatedStudent || updatedStudent.error || updatedStudent.success === false) {
          throw new Error(updatedStudent?.error || 'Failed to award points (500 Error)');
        }
        const finalStudent = updatedStudent.data || updatedStudent;
        setStudents(students.map(s => s.id === studentId ? finalStudent : s));`
);
fs.writeFileSync('src/components/features/PointsLeaderboardClient.tsx', content);
