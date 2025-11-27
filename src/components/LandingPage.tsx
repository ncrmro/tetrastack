import { ButtonLink } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-on-background sm:text-5xl md:text-6xl">
              <span className="block">Next.js Boilerplate</span>
              <span className="block text-primary">
                Architectural Patterns Done Right
              </span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-on-surface-variant">
              A production-ready Next.js template showcasing best practices for
              full-stack TypeScript applications. Multi-tenant teams, AI-powered
              features, and comprehensive testing out of the box.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <ButtonLink
                href="/dashboard"
                variant="primary"
                className="px-8 py-3 text-base shadow-lg hover:shadow-xl"
              >
                View Dashboard
              </ButtonLink>
              <ButtonLink
                href="/projects"
                variant="secondary"
                className="px-8 py-3 text-base shadow-md hover:shadow-lg"
              >
                Explore Projects
              </ButtonLink>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-on-surface sm:text-4xl">
              Built-In Features
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-on-surface-variant">
              Everything you need to build a modern web application
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {/* Multi-tenant Teams */}
            <div className="bg-primary-container rounded-lg p-8 shadow-md">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl text-on-primary">👥</span>
              </div>
              <h3 className="text-xl font-bold text-on-primary-container mb-4">
                Multi-tenant Teams
              </h3>
              <p className="text-on-primary-container">
                Built-in team management with role-based access control. Users
                can belong to multiple teams with different permissions.
              </p>
            </div>

            {/* AI-Powered */}
            <div className="bg-secondary-container rounded-lg p-8 shadow-md">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl text-on-secondary">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-on-secondary-container mb-4">
                AI Integration
              </h3>
              <p className="text-on-secondary-container">
                AI agents for generating projects and tasks with streaming
                responses. Demonstrates modern AI integration patterns.
              </p>
            </div>

            {/* Task Management */}
            <div className="bg-tertiary-container rounded-lg p-8 shadow-md">
              <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl text-on-tertiary">✅</span>
              </div>
              <h3 className="text-xl font-bold text-on-tertiary-container mb-4">
                Task Management
              </h3>
              <p className="text-on-tertiary-container">
                Complete project and task management system with status
                tracking, priorities, assignments, and comments.
              </p>
            </div>

            {/* Testing */}
            <div className="bg-primary-container rounded-lg p-8 shadow-md">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl text-on-primary">🧪</span>
              </div>
              <h3 className="text-xl font-bold text-on-primary-container mb-4">
                Comprehensive Testing
              </h3>
              <p className="text-on-primary-container">
                Unit, integration, E2E, and agent tests with factories. 87% less
                test code using best practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-on-background sm:text-4xl">
              Modern Architecture
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-on-surface-variant">
              Clean layered architecture with clear separation of concerns
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-surface rounded-lg p-6 shadow-sm border border-outline">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span className="text-on-primary font-bold">1</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">
                  Database Layer
                </h3>
              </div>
              <p className="text-on-surface-variant">
                Drizzle ORM with TypeScript-first schemas. SQLite locally, Turso
                in production.
              </p>
            </div>

            <div className="bg-surface rounded-lg p-6 shadow-sm border border-outline">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span className="text-on-primary font-bold">2</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">
                  Models Layer
                </h3>
              </div>
              <p className="text-on-surface-variant">
                Business logic and data operations. Bulk operations with WHERE
                IN queries for performance.
              </p>
            </div>

            <div className="bg-surface rounded-lg p-6 shadow-sm border border-outline">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span className="text-on-primary font-bold">3</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">
                  Actions Layer
                </h3>
              </div>
              <p className="text-on-surface-variant">
                Server actions with ActionResult pattern. Type-safe with error
                handling built-in.
              </p>
            </div>

            <div className="bg-surface rounded-lg p-6 shadow-sm border border-outline">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span className="text-on-primary font-bold">4</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">UI Layer</h3>
              </div>
              <p className="text-on-surface-variant">
                Server-first React components with Next.js 15 App Router and
                streaming.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-on-surface sm:text-4xl">
              Modern Tech Stack
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-background rounded-lg p-8 shadow-md border border-outline">
              <h3 className="text-xl font-bold text-on-background mb-6">
                Frontend
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-on-surface-variant">
                    Next.js 15 with App Router and React 19
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-on-surface-variant">
                    TypeScript with strict type checking
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-on-surface-variant">
                    TailwindCSS with Material Design-inspired theme
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-on-surface-variant">
                    Server-Sent Events for AI streaming
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-background rounded-lg p-8 shadow-md border border-outline">
              <h3 className="text-xl font-bold text-on-background mb-6">
                Backend & Testing
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-on-surface-variant">
                    Drizzle ORM with SQLite/Turso
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-on-surface-variant">
                    NextAuth.js v5 for authentication
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-on-surface-variant">
                    Vitest for unit and integration tests
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-on-surface-variant">
                    Playwright for E2E testing
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-on-background sm:text-4xl">
              Ready to Build?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-on-surface-variant">
              Get started with a solid foundation for your next project
            </p>
          </div>
          <div className="bg-tertiary-container rounded-lg p-8 shadow-md max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-on-tertiary-container mb-6 text-center">
              Clone and Customize
            </h3>
            <div className="bg-surface rounded-lg p-6 border border-outline font-mono text-sm text-on-surface mb-6">
              <div>git clone &lt;repository-url&gt;</div>
              <div>cd next-boilerplate</div>
              <div>make up</div>
            </div>
            <p className="text-on-tertiary-container text-center">
              The example project management app demonstrates all patterns.
              Replace it with your own domain logic while keeping the
              architecture.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-primary sm:text-4xl">
            Start Building Your Next Project
          </h2>
          <p className="mt-4 text-xl text-on-primary/90">
            Clean architecture, modern patterns, and production-ready
            infrastructure.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <ButtonLink
              href="/dashboard"
              variant="primary"
              className="px-8 py-3 text-base shadow-lg hover:shadow-xl"
            >
              Try the Demo
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  )
}
