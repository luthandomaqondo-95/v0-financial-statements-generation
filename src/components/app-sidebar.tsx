"use client"

import * as React from "react"
import { FileText, LayoutDashboard, FolderOpen, Clock, Settings, Users, Building2, Sparkles, FileStack, Calculator, HelpCircle, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavUser } from "@/components/nav-user"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail } from "@/components/ui/sidebar"

const user = {
    name: "John Smith",
    email: "john@acmecorp.com",
    avatar: "/placeholder-user.jpg",
}

const navigation = {
    main: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        // {
        //     title: "Documents",
        //     url: "#",
        //     icon: FolderOpen,
        //     items: [
        //         { title: "All Documents", url: "/dashboard/documents" },
        //         { title: "Drafts", url: "/dashboard/documents/drafts" },
        //         { title: "Under Review", url: "/dashboard/documents/review" },
        //         { title: "Finalized", url: "/dashboard/documents/finalized" },
        //     ],
        // },
        {
            title: "AI Generation",
            url: "#",
            icon: Sparkles,
            items: [
                { title: "MDX Editor", url: "/dashboard/editor/mdx" },
                { title: "Lexical Editor", url: "/dashboard/editor/lexical" },
                { title: "Tiptap Editor", url: "/dashboard/editor/tiptap" },
                { title: "Remirror Editor", url: "/dashboard/editor/remirror" },
                // { title: "Generate Statement", url: "/dashboard/editor" },
                // { title: "Templates", url: "/dashboard/templates" },
                // { title: "History", url: "/dashboard/history" },
            ],
        },
        // {
        //     title: "Recent",
        //     url: "/dashboard/recent",
        //     icon: Clock,
        // },
    ],
    // workspace: [
    //     {
    //         title: "Companies",
    //         url: "/dashboard/companies",
    //         icon: Building2,
    //     },
    //     {
    //         title: "Team",
    //         url: "/dashboard/team",
    //         icon: Users,
    //     },
    //     {
    //         title: "Reports",
    //         url: "#",
    //         icon: FileStack,
    //         items: [
    //             { title: "Annual Reports", url: "/dashboard/reports/annual" },
    //             { title: "Management Accounts", url: "/dashboard/reports/management" },
    //             { title: "Tax Computations", url: "/dashboard/reports/tax" },
    //         ],
    //     },
    //     {
    //         title: "Calculations",
    //         url: "/dashboard/calculations",
    //         icon: Calculator,
    //     },
    // ],
    other: [
        {
            title: "Settings",
            url: "/dashboard/settings",
            icon: Settings,
        },
        {
            title: "Help & Support",
            url: "/dashboard/help",
            icon: HelpCircle,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">FinGen AI</span>
                                    <span className="truncate text-xs text-muted-foreground">Financial Statements</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Main</SidebarGroupLabel>
                    <SidebarMenu>
                        {navigation.main.map((item) => (
                            item.items ? (
                                <Collapsible key={item.title} asChild defaultOpen={true} className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip={item.title}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items.map((subItem) => (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                                            <Link href={subItem.url}>
                                                                <span>{subItem.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            ) : (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                                        <Link href={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* <SidebarGroup>
                    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                    <SidebarMenu>
                        { navigation.workspace.map((item) => (
                            item.items ? (
                                <Collapsible key={item.title} asChild defaultOpen={false} className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip={item.title}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items.map((subItem) => (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                                            <Link href={subItem.url}>
                                                                <span>{subItem.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            ) : (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                                        <Link href={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        ))}
                    </SidebarMenu>
                </SidebarGroup> */}

                <SidebarGroup className="mt-auto">
                    <SidebarMenu>
                        {navigation.other.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                                    <Link href={item.url}>
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
