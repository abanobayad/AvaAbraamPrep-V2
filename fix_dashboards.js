const fs = require('fs');

function addChangeOwnPass(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  if (!c.includes('ChangeOwnPasswordDialog')) {
    c = c.replace(/import Link from "next\/link";/, 'import Link from "next/link";\nimport { ChangeOwnPasswordDialog } from "@/components/features/ChangeOwnPasswordDialog";');
    c = c.replace(/<form action=\{handleLogout\}>/, '<ChangeOwnPasswordDialog />\n        <form action={handleLogout}>');
    // wrap them in a div flex
    c = c.replace(/<ChangeOwnPasswordDialog \/>\n\s*<form action=\{handleLogout\}>/, 
      `<div className="flex gap-2">
          <ChangeOwnPasswordDialog />
          <form action={handleLogout}>`);
    c = c.replace(/<LogOut className="h-4 w-4 ml-2" \/>\n\s*تسجيل خروج\n\s*<\/Button>\n\s*<\/form>/, 
      `<LogOut className="h-4 w-4 ml-2" />
            تسجيل خروج
          </Button>
        </form>
        </div>`);
    fs.writeFileSync(filePath, c);
  }
}

addChangeOwnPass('src/app/admin-dashboard/page.tsx');
addChangeOwnPass('src/app/superadmin-dashboard/page.tsx');
