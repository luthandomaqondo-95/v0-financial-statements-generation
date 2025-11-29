"use client"

import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, Clock, ArrowRight, BarChart3, TrendingUp, Calendar, MoreHorizontal, Download, Eye, Edit2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const recentDocuments = [
    {
        id: 1,
        title: "Annual Financial Statement 2024",
        company: "Acme Corporation Ltd.",
        date: "2 hours ago",
        status: "Draft",
        type: "AFS",
    },
    {
        id: 2,
        title: "Q3 Management Accounts",
        company: "Globex Industries",
        date: "Yesterday",
        status: "Review",
        type: "Management",
    },
    {
        id: 3,
        title: "Consolidated Financials FY24",
        company: "Soylent Corp",
        date: "3 days ago",
        status: "Final",
        type: "Consolidated",
    },
    {
        id: 4,
        title: "Interim Financial Report H1",
        company: "Initech Holdings",
        date: "1 week ago",
        status: "Final",
        type: "Interim",
    },
    {
        id: 5,
        title: "Tax Computation 2024",
        company: "Umbrella Corp",
        date: "2 weeks ago",
        status: "Draft",
        type: "Tax",
    },
]

const upcomingDeadlines = [
    { company: "Acme Corporation", deadline: "Dec 15, 2024", type: "Annual Filing", daysLeft: 16 },
    { company: "Globex Industries", deadline: "Dec 31, 2024", type: "Q4 Reports", daysLeft: 32 },
    { company: "Initech Holdings", deadline: "Jan 15, 2025", type: "Tax Returns", daysLeft: 47 },
]

export default function DashboardPage() {
    return (

                <main className="flex-1 overflow-auto">
                    <div className="p-6 md:p-8 space-y-8">
                        {/* Welcome Section */}
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Welcome back, John</h1>
                            <p className="text-muted-foreground">Here's an overview of your financial statements and recent activity.</p>
                        </div>

                        {/* Stats Overview */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">24</div>
                                    <p className="text-xs text-muted-foreground">+4 from last month</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">AI Generated</CardTitle>
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">18</div>
                                    <p className="text-xs text-muted-foreground">75% of all documents</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Drafts</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">5</div>
                                    <p className="text-xs text-muted-foreground">3 pending review</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">47h</div>
                                    <p className="text-xs text-muted-foreground">This month</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Recent Documents */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold tracking-tight">Recent Documents</h2>
                                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                                        View all <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {recentDocuments.map((doc) => (
                                        <Card key={doc.id} className="group hover:shadow-md transition-all hover:border-primary/20">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                            <FileText className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-medium group-hover:text-primary transition-colors">
                                                                    {doc.title}
                                                                </h3>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    doc.status === "Final"
                                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                        : doc.status === "Review"
                                                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                                            : "bg-secondary text-secondary-foreground"
                                                                }`}>
                                                                    {doc.status}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                                <span>{doc.company}</span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {doc.date}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Edit2 className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Export PDF
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Upcoming Deadlines */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold tracking-tight">Upcoming Deadlines</h2>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </div>

                                <Card>
                                    <CardContent className="p-0 divide-y">
                                        {upcomingDeadlines.map((item, i) => (
                                            <div key={i} className="p-4 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-sm">{item.company}</span>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                        item.daysLeft <= 20
                                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                            : item.daysLeft <= 35
                                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    }`}>
                                                        {item.daysLeft} days
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                    <span>{item.type}</span>
                                                    <span>{item.deadline}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Quick Actions */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-2">
                                        <Link href="/dashboard/editor">
                                            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                                                <Plus className="h-4 w-4" />
                                                Create New Statement
                                            </Button>
                                        </Link>
                                        <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                                            <BarChart3 className="h-4 w-4" />
                                            Generate AI Report
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                                            <FileText className="h-4 w-4" />
                                            Browse Templates
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
    )
}
