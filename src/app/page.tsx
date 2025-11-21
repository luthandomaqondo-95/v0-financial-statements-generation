import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, Clock, ArrowRight, BarChart3, Settings } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 font-semibold text-xl tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <span>FinGen AI</span>
        </div>
        <nav className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="sm">
            Documentation
          </Button>
          <Button variant="ghost" size="sm">
            Support
          </Button>
          <div className="h-8 w-8 rounded-full bg-secondary"></div>
        </nav>
      </header>

      <main className="container mx-auto p-6 md:p-10">
        <div className="flex flex-col gap-8">
          {/* Hero Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground">Financial Statements</h1>
              <p className="text-muted-foreground mt-1">
                Generate, edit, and manage your Annual Financial Statements with AI assistance.
              </p>
            </div>
            <Link href="/editor">
              <Button size="lg" className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                New Statement
              </Button>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Generated Reports</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+15% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Drafts</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Last edited 2 hours ago</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Documents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Recent Documents</h2>
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Annual Financial Statement 2024",
                  company: "Acme Corp",
                  date: "2 hours ago",
                  status: "Draft",
                },
                { title: "Q3 Management Accounts", company: "Globex Inc", date: "Yesterday", status: "Review" },
                { title: "Consolidated Financials", company: "Soylent Corp", date: "3 days ago", status: "Final" },
              ].map((doc, i) => (
                <Card key={i} className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="font-serif text-lg group-hover:text-primary transition-colors">
                          {doc.title}
                        </CardTitle>
                        <CardDescription>{doc.company}</CardDescription>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doc.status === "Final"
                            ? "bg-green-100 text-green-700"
                            : doc.status === "Review"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {doc.status}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-24 rounded-md bg-muted/50 border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                      Preview Thumbnail
                    </div>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground flex justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Edited {doc.date}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
