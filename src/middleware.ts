import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './services/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const path = request.nextUrl.pathname
  const isLoginPage = path === '/'

  // If there is no token and user is not on login page, redirect to login (/)
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If there is a token, verify it
  if (token) {
    const session = await verifyToken(token)
    
    // If token is invalid and user is not on login page, redirect to login
    if (!session && !isLoginPage) {
      const response = NextResponse.redirect(new URL('/', request.url))
      response.cookies.delete('auth_token')
      return response
    }

    if (session) {
      const role = session.role;

      // Handle login page redirect
      if (isLoginPage) {
        if (role === 'superadmin') return NextResponse.redirect(new URL('/superadmin-dashboard', request.url))
        if (role === 'admin') return NextResponse.redirect(new URL('/admin-dashboard', request.url))
        if (role === 'student') return NextResponse.redirect(new URL('/student-portal', request.url))
      }

      // Handle RBAC protection
      if (path.startsWith('/superadmin-dashboard') || path.startsWith('/manage-khodam')) {
        if (role !== 'superadmin') return NextResponse.redirect(new URL('/', request.url))
      }

      if (path.startsWith('/admin-dashboard') || path.startsWith('/add-student') || path.startsWith('/students-list') || path.startsWith('/points-leaderboard')) {
        if (role === 'student') return NextResponse.redirect(new URL('/student-portal', request.url))
      }

      if (path.startsWith('/student-portal')) {
        if (role !== 'student') return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
