import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-6xl">
            GS-CMS v05
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Customer Relationship & Quote Management System
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
            Modern workflow management from inquiry to production
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Inquiry Management</CardTitle>
              <CardDescription>
                Create and manage customer inquiries with multiple items and priority levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <li>• Multi-item inquiries</li>
                <li>• Priority assignment</li>
                <li>• Customer tracking</li>
                <li>• Deadline management</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role-Based Workflow</CardTitle>
              <CardDescription>
                Structured assignment system with VPP, VP, Manager, and Tech roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <li>• VPP item assignment</li>
                <li>• VP cost calculations</li>
                <li>• Manager approvals</li>
                <li>• Tech officer tasks</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quote Generation</CardTitle>
              <CardDescription>
                Automated quote generation with margin control and approval workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <li>• Cost-based pricing</li>
                <li>• Margin management</li>
                <li>• Quote validation</li>
                <li>• Production conversion</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/dashboard">Access Dashboard</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 border-t border-slate-200 dark:border-slate-700 pt-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                System Features
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>✓ Next.js 15 with App Router</li>
                <li>✓ TypeScript for type safety</li>
                <li>✓ Prisma ORM with PostgreSQL</li>
                <li>✓ NextAuth.js authentication</li>
                <li>✓ Tailwind CSS & shadcn/ui</li>
                <li>✓ Role-based permissions</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Business Workflow
              </h3>
              <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>1. Sales creates customer inquiries</li>
                <li>2. VPP assigns items to VPs</li>
                <li>3. VPs calculate production costs</li>
                <li>4. Managers approve calculations</li>
                <li>5. Sales generates quotes</li>
                <li>6. System converts to production orders</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}