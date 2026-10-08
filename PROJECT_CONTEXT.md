# PROJECT OVERVIEW
A web-based student attendance and point-tracking system for a church Sunday School (Ava Abraam Prep). The application is designed to manage students, track their weekly attendance, award points for participation, flag students needing visitation (Efteqad) after two consecutive absences, and manage multimedia links for lessons. 

**Target Users:**
- **Super Admins:** Full system access, including managing other Admins (Khodam).
- **Admins (Khodam):** Can add/edit students, take attendance, award points, and manage media.
- **Students:** Log in using a unique 5-digit code to view their points, attendance history, leaderboard, and media links.

**Main Features:**
- ✅ **Authentication:** Role-based access control (Superadmin, Admin, Student via code).
- ✅ **Student Management:** Add, edit, list students, and generate 5-digit login codes.
- ✅ **Khodam Management:** Add and delete admins (restricted to Superadmins).
- ✅ **Attendance Tracking:** Mark students as present/absent for specific dates.
- ✅ **Points & Leaderboard:** Award points manually or automatically via attendance, with a ranking dashboard.
- ✅ **Efteqad (Visitation) Tracking:** Automatically flags students absent 2 consecutive times and logs visitation notes.
- ✅ **Media/Links Management:** Admins can share videos, documents, or images with students.
- ✅ **Data Export:** Export student lists to CSV format.

---

# TECH STACK
- **Frontend:** Next.js 14.2.35 (App Router, React 18)
- **Styling:** Tailwind CSS, Shadcn UI (Radix UI primitives + Tailwind), Lucide React icons
- **Backend:** Next.js Server Actions on the Node.js runtime
- **Database:** MySQL (Hostinger) through Prisma 5.22.0; schema in prisma/schema.prisma, migrations in prisma/migrations
- **Authentication:** Custom JWT-based auth using jose; HttpOnly cookie
- **Hosting/Deployment:** Hostinger Node.js web app, imported from GitHub (main branch). Build: npm run build. Start: npm start (runs pending migrations, creates the first superadmin from env, then next start).

---

# FOLDER STRUCTURE
```
/
├── prisma/
│   ├── schema.prisma       # Database schema definition
│   └── dev.db              # Local SQLite database for development
├── src/
│   ├── app/
│   │   ├── actions/        # Next.js Server Actions (auth.ts, db.ts)
│   │   ├── admin-dashboard/
│   │   ├── attendance/
│   │   ├── efteqad/
│   │   ├── manage-khodam/
│   │   ├── media/
│   │   ├── points-leaderboard/
│   │   ├── student-portal/
│   │   ├── students-list/
│   │   ├── superadmin-dashboard/
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Login entry point
│   ├── components/
│   │   ├── features/       # Complex, feature-specific client components (e.g. StudentList)
│   │   └── ui/             # Reusable Shadcn UI components (buttons, dialogs, etc.)
│   ├── config/             # Constants and configuration
│   ├── lib/                # Utility functions and Prisma client setup (prisma.ts)
│   ├── services/           # JWT and Auth logic (auth.ts)
│   └── middleware.ts       # Edge middleware for route protection
├── components.json         # Shadcn configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

---

# DEPENDENCIES
*From package.json:*
```json
{
  "dependencies": {
    "@cloudflare/next-on-pages": "^1.13.16",
    "@prisma/adapter-d1": "5.22.0",
    "@prisma/client": "5.22.0",
    "@radix-ui/react-*": "^1.x - 2.x",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "jose": "^6.2.12",
    "lucide-react": "^0.378.0",
    "next": "14.2.35",
    "next-themes": "^0.4.6",
    "prisma": "5.22.0",
    "qrcode.react": "^3.1.0",
    "react": "^18",
    "react-dom": "^18",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

---

# CONFIGURATION
- **Environment variables (see .env.example):**
  - DATABASE_URL: mysql://USER:PASSWORD@127.0.0.1:3306/DATABASE (use 127.0.0.1 on Hostinger)
  - JWT_SECRET: at least 32 random characters
  - ADMIN_USERNAME / ADMIN_PASSWORD: first superadmin, created on start if no superadmin exists
- Local development keeps these in a git-ignored .env file.
- The previous Cloudflare Pages / D1 setup (next-on-pages, wrangler, D1 SQL files) was removed on 2026-10-08.

---

# ARCHITECTURE & DATA FLOW
- **Runtime:** The entire application runs on the **Edge Runtime** (`export const runtime = 'edge'` in root layout).
- **Frontend ↔ Backend Communication:** Client Components interact with the database via **Server Actions** (`src/app/actions/db.ts`).
- **Edge Serialization:** Because Next.js Server Actions on Cloudflare Edge struggle to serialize Prisma `Date` objects, all data fetched from the DB is serialized using `JSON.parse(JSON.stringify(data))` before crossing the Server/Client boundary.
- **State Management:** Local React state (`useState`) within Feature Components. Cache invalidation is handled natively via `revalidatePath()` in Server Actions.
- **Routing:** 
  - `/` (Login)
  - `/admin-dashboard` & `/superadmin-dashboard`
  - `/students-list`, `/add-student`
  - `/attendance`, `/efteqad`, `/manage-khodam`
  - `/points-leaderboard`, `/media`, `/student-portal`

---

# DATABASE / DATA MODELS
Using Cloudflare D1 (SQLite) via Prisma.

1. **`Khadem` (Admin User):**
   - `id`, `name`, `username` (unique), `password`, `role` (superadmin/admin/student), `createdAt`.
2. **`Student`:**
   - `id`, `name`, `studentCode` (unique 5-digit login), `studentClass`, `phone`, `address`, `notes`, `totalPoints`, `needsEfteqad`, `createdAt`, `updatedAt`.
3. **`Transaction`:**
   - `id`, `studentId`, `actionName`, `pointsChanged`, `addedBy`, `timestamp`.
4. **`Attendance`:**
   - `id`, `studentId`, `date`, `status` (boolean), `recordedBy`, `createdAt`.
5. **`EfteqadLog` (Visitation):**
   - `id`, `studentId`, `date`, `khademName`, `notes`.
6. **`Media`:**
   - `id`, `title`, `url`, `type` (video/document/image/link), `createdAt`.

---

# AUTHENTICATION & AUTHORIZATION
- **Mechanism:** JWTs generated/verified via the edge-compatible `jose` library (`src/services/auth.ts`).
- **Storage:** Stored in an HttpOnly cookie (`auth_token`).
- **Protection:** `src/middleware.ts` intercepts all requests, verifies the JWT, and enforces RBAC (Role-Based Access Control) using `NextResponse.redirect`.
- **Roles:**
  - `superadmin`: Access to everything + `/manage-khodam`.
  - `admin`: Access to dashboards, students, attendance, but NOT khodam management.
  - `student`: Access strictly locked to `/student-portal`, `/media`, `/points-leaderboard`.

---

# KEY CODE FILES

### 1. `src/lib/prisma.ts` (DB Initialization for Edge)
```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

export interface Env { DB: D1Database }
let prisma: PrismaClient | undefined

export const getPrisma = (env: Env) => {
  if (prisma) return prisma
  const adapter = new PrismaD1(env.DB)
  prisma = new PrismaClient({ adapter })
  return prisma
}
```

### 2. `src/app/actions/db.ts` (Example Server Action with Serialization)
```typescript
export async function addStudent(data: any) {
  try {
    const prisma = getPrisma(getRequestContext().env as any);
    const student = await prisma.student.create({ ... });
    
    try { revalidatePath("/students-list"); } catch (e) { console.warn("revalidatePath error on edge", e); }
    
    // Crucial: Serialize Prisma Dates for Edge runtime
    return { success: true, data: JSON.parse(JSON.stringify(student)) };
  } catch (err: any) {
    return { success: false, error: err.message || "Internal Server Error" };
  }
}
```

### 3. `src/services/auth.ts` (JWT handling)
```typescript
import { SignJWT, jwtVerify } from "jose";
const secretKey = "<REDACTED>";
const encodedKey = new TextEncoder().encode(secretKey);

export async function createToken(payload: UserSession) {
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(encodedKey);
}
```

---

# HOW TO RUN
1. **Install:** npm install (runs prisma generate)
2. **Configure:** copy .env.example to .env and fill DATABASE_URL, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
3. **Create tables:** npm run db:migrate
4. **Development server:** npm run dev
5. **Production:** npm run build then npm start

---

# CURRENT STATE
- **Recently Completed:** The project was just updated to resolve critical Next.js Server Action serialization bugs on the Edge runtime. All Prisma outputs are safely stripped of `Date` objects before client transmission. TypeScript strict typing for client components (e.g. `ExportDataCard.tsx`) was fully resolved to pass Cloudflare CI.
- **Status:** Fully functional and deployed.
- **Bugs/Warnings:** No known bugs or console warnings at this time.
- **TODO/FIXME:** None explicitly left in the code.
- **Incomplete Features:** None. MVP is delivered.

---

# GIT HISTORY
```text
8467196 Fix: Add type annotation to fix TS build error
b2b310a Fix: Serialize all findMany and findUnique returns in db.ts
64473b1 Fix: Serialize Prisma objects in Server Actions to avoid 500 error on Edge
e5cd18f Fix: Serialize Prisma dates for Client Components and add fallback UI
27fa75a Fix: Update Prisma for D1 Edge runtime and handle 500 errors gracefully
1c89852 Standardize API error handling and fix frontend crashes
ddcb129 Fix addKhadem API error handling (return error object instead of 500)
669962c Fix ManageKhodamClient to properly handle API errors without crashing
8d52e89 Fresh start: Clean Next.js project ready for Cloudflare Pages
61c710f Completely remove wrangler to force Cloudflare Pages detection
15b3b95 Rename wrangler.toml to fix Cloudflare Pages CI detection
2ab0709 Prepare project for Cloudflare Pages: Update dependencies, fix vulnerabilities, and configure Prisma Edge
04b3273 Revert Cloudflare migration and return to standard local Next.js + SQLite
8adf165 Ready for Cloudflare
```

---

# RECOMMENDATIONS (For the next Developer)
1. **Security Vulnerability:** User passwords in `src/app/actions/auth.ts` and `src/app/actions/db.ts` (`addKhadem`) are currently compared and stored in **Plain Text**. You MUST implement password hashing. Since the app runs on Cloudflare Edge, standard Node.js `bcrypt` will NOT work. You must use an edge-compatible hashing library like Web Crypto API, `bcrypt-ts`, or `oslo/password`.
2. **Security Vulnerability:** The JWT secret key in `src/services/auth.ts` is hardcoded as a plain text string. This should be moved to a Cloudflare Pages Environment Variable and accessed via `getRequestContext().env.JWT_SECRET`.
3. **TypeScript:** A few client components now heavily rely on `any` types or `JSON.parse(JSON.stringify)` bypassing type safety for Dates. Consider defining explicit types for serialized Prisma outputs where `createdAt` is typed as `string` instead of `Date` for better frontend autocompletion.
