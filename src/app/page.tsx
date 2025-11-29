import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Sparkles, Shield, Zap, ArrowRight, Check, BarChart3, Users, Globe } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
                            <FileText className="h-5 w-5 text-slate-900" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">FinGen AI</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a>
                        <a href="#testimonials" className="text-sm text-slate-400 hover:text-white transition-colors">Testimonials</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10">
                            Sign In
                        </Button>
                        <Link href="/dashboard">
                            <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-semibold">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto text-center max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
                        <Sparkles className="h-4 w-4" />
                        Powered by Advanced AI
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        Generate Financial Statements in Minutes
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Create IFRS-compliant Annual Financial Statements, management accounts, and financial reports with AI-powered automation. Save hours of manual work.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/dashboard">
                            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-semibold px-8 h-12 text-base gap-2">
                                Start Free Trial
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-white/5 px-8 h-12 text-base">
                            Watch Demo
                        </Button>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-500" />
                            No credit card required
                        </span>
                        <span className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-500" />
                            14-day free trial
                        </span>
                    </div>
                </div>

                {/* Hero Visual */}
                <div className="container mx-auto mt-16 max-w-5xl">
                    <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-2 shadow-2xl shadow-emerald-500/10">
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-cyan-500/5 rounded-2xl" />
                        <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <span className="text-xs text-slate-500 ml-2">Annual Financial Statement 2024</span>
                            </div>
                            <div className="p-8 grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="h-8 w-3/4 rounded bg-slate-800/50" />
                                    <div className="h-4 w-full rounded bg-slate-800/30" />
                                    <div className="h-4 w-5/6 rounded bg-slate-800/30" />
                                    <div className="h-32 rounded-lg bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-slate-800 flex items-center justify-center">
                                        <BarChart3 className="h-12 w-12 text-emerald-500/50" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-4 w-full rounded bg-slate-800/30" />
                                    <div className="h-4 w-4/5 rounded bg-slate-800/30" />
                                    <div className="h-4 w-full rounded bg-slate-800/30" />
                                    <div className="h-4 w-3/4 rounded bg-slate-800/30" />
                                    <div className="h-24 rounded-lg bg-slate-800/20 border border-slate-800" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 border-y border-slate-800 bg-slate-900/30">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: "10,000+", label: "Statements Generated" },
                            { value: "500+", label: "Companies Trust Us" },
                            { value: "95%", label: "Time Saved" },
                            { value: "99.9%", label: "Accuracy Rate" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need for Financial Reporting</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Powerful features designed to streamline your financial statement generation workflow.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Sparkles,
                                title: "AI-Powered Generation",
                                description: "Generate complete financial statements from your data using advanced AI. IFRS and GAAP compliant.",
                            },
                            {
                                icon: FileText,
                                title: "Rich Document Editor",
                                description: "Edit statements with a powerful markdown editor. Add tables, charts, and professional formatting.",
                            },
                            {
                                icon: Shield,
                                title: "Compliance Ready",
                                description: "Built-in templates following IFRS, GAAP, and local accounting standards. Always audit-ready.",
                            },
                            {
                                icon: Zap,
                                title: "Instant Export",
                                description: "Export to PDF, Word, or Excel with one click. Perfect formatting every time.",
                            },
                            {
                                icon: Users,
                                title: "Team Collaboration",
                                description: "Work together with your team in real-time. Review, comment, and approve statements.",
                            },
                            {
                                icon: Globe,
                                title: "Multi-Currency Support",
                                description: "Handle multi-currency consolidations and translations automatically.",
                            },
                        ].map((feature, i) => (
                            <Card key={i} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors group">
                                <CardContent className="p-6">
                                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:from-emerald-500/30 group-hover:to-cyan-500/30 transition-colors">
                                        <feature.icon className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2 text-white">{feature.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="relative rounded-3xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 border border-slate-800 p-12 text-center overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)]" />
                        <div className="relative">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Ready to Transform Your Financial Reporting?
                            </h2>
                            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                                Join hundreds of companies already using FinGen AI to create professional financial statements in minutes.
                            </p>
                            <Link href="/dashboard">
                                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-semibold px-8 h-12 text-base gap-2">
                                    Start Your Free Trial
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-12 px-6">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
                                <FileText className="h-4 w-4 text-slate-900" />
                            </div>
                            <span className="font-semibold">FinGen AI</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-500">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                        <div className="text-sm text-slate-600">
                            © 2024 FinGen AI. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
