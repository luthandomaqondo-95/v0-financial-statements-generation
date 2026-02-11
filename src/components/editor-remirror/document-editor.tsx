"use client";

import React, { useCallback, useState } from "react";
import { EditorComponent, Remirror, useRemirror } from "@remirror/react";
import { 
	BoldExtension, ItalicExtension, UnderlineExtension, StrikeExtension, HeadingExtension, BulletListExtension, 
	OrderedListExtension, TaskListExtension, ImageExtension, MarkdownExtension, HardBreakExtension, LinkExtension, 
	PlaceholderExtension, NodeFormattingExtension, TableExtension, BlockquoteExtension, CodeExtension, CodeBlockExtension, 
	HorizontalRuleExtension, DropCursorExtension, GapCursorExtension, SubExtension, SupExtension, TextHighlightExtension, 
	TextColorExtension, TextCaseExtension, FontFamilyExtension, HistoryExtension 
} from "remirror/extensions";
import "remirror/styles/all.css";
import '@/styles/remirror.css'

import { EditorToolbar } from "./editor-toolbar";
import { TableContextMenu } from "./table-context-menu";
import { InlineAIPopup } from "./inline-ai-popup";
import { ChatComponent } from "../chat-component/for-remirror";
import { AiEditExtension } from "./extensions/ai-edit-extension";
import { PanelLeft, PanelLeftClose } from "lucide-react";



export function DocumentEditor() {
	const [showPanel, setShowPanel] = useState(true);

	const { manager, state } = useRemirror({
		extensions: () => [
			new MarkdownExtension({ copyAsMarkdown: false }),
			new BoldExtension({}),
			new ItalicExtension({}),
			new UnderlineExtension(),
			new StrikeExtension({}),
			new HeadingExtension({}),
			new BulletListExtension({}),
			new OrderedListExtension(),
			new TaskListExtension(),
			new ImageExtension({ enableResizing: true }),
			new HardBreakExtension(),
			new LinkExtension({ autoLink: true }),
			new PlaceholderExtension({ placeholder: "Start writing..." }),
			new NodeFormattingExtension({}),
			new TableExtension({}),
			new BlockquoteExtension(),
			new CodeExtension({}),
			new CodeBlockExtension({}),
			new HorizontalRuleExtension({}),
			new DropCursorExtension({}),
			new GapCursorExtension(),
			new SubExtension(),
			new SupExtension(),
			new TextHighlightExtension({}),
			new TextColorExtension({}),
			new TextCaseExtension({}),
			new FontFamilyExtension({}),
			new HistoryExtension({}),
			new AiEditExtension(),
		],
		content: defaultContent,
		selection: "start",
		stringHandler: "markdown",
	});

	const togglePanel = useCallback(() => {
		setShowPanel((prev) => !prev);
	}, []);

	return (
		<div className="flex flex-col h-screen">
			{/* Top bar */}
			<header className="flex items-center justify-between px-4 py-2">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
						<span className="text-sm font-bold text-[hsl(var(--primary-foreground))]">
							D
						</span>
					</div>
					<div>
						<h1 className="text-sm font-semibold text-[hsl(var(--foreground))]">
							Document Editor
						</h1>
						<p className="text-xs text-[hsl(var(--muted-foreground))]">
							Markdown-powered rich text editing
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={togglePanel}
					title={showPanel ? "Hide chat panel" : "Show chat panel"}
					className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer"
				>
					{showPanel ? (
						<PanelLeftClose size={16} />
					) : (
						<PanelLeft size={16} />
					)}
					<span className="hidden sm:inline">
						{showPanel ? "Hide" : "Show"} Chat
					</span>
				</button>
			</header>

			{/* Editor area */}
			<div className="flex flex-1 overflow-hidden ">
				<div className="flex-1 min-w-0 flex flex-col remirror-theme">
					<Remirror manager={manager} initialContent={state}>
						<EditorToolbar />
						<div className="flex-1 overflow-auto relative">
							<div className="max-w-4xl mx-auto px-16 py-6 bg-primary/5">
								<EditorComponent />
							</div>
							<InlineAIPopup />
						</div>
						<TableContextMenu />

						{/* Chat Panel -- inside Remirror context */}
						{showPanel && (
							<div className="hidden lg:block fixed right-0 top-[57px] bottom-0 w-[380px] z-10">
								<ChatComponent />
							</div>
						)}
					</Remirror>
				</div>
			</div>
		</div>
	);
}


// AFS Section 1: Cover Page & Table of Contents
const afsCoverPage = `
# ACME CORPORATION LTD.

## Annual Financial Statements
### For the Year Ended December 31, 2024

---

**Registered Company Number:** 12345678  
**VAT Registration Number:** GB 987 6543 21

---

`

// AFS Section 2: Company Information & Leadership Messages
const afsCompanyInfo = `
## Company Information

| | |
|---|---|
| **Company Name** | Acme Corporation Ltd. |
| **Trading Name** | Acme Corp |
| **Registration Number** | 12345678 |
| **Date of Incorporation** | January 15, 1995 |
| **Country of Incorporation** | United Kingdom |
| **VAT Registration** | GB 987 6543 21 |
| **LEI Number** | 549300ABCDEF123456XY |
| **Registered Office** | 100 Innovation Drive, London, EC2A 4BT |
| **Principal Place of Business** | 100 Innovation Drive, London, EC2A 4BT |
| **Company Secretary** | Margaret Thompson, FCIS |
| **Auditors** | Sterling & Associates LLP |
| **Principal Bankers** | National Westminster Bank PLC |
| **Legal Advisors** | Hammond & Partners LLP |
| **Registrars** | Equiniti Group PLC |

### Principal Activities

Acme Corporation Ltd. is engaged in the design, manufacture, and distribution of precision industrial equipment and automation solutions. The company serves customers across multiple sectors including:

- Manufacturing & Assembly
- Automotive & Aerospace
- Energy & Utilities
- Food & Beverage Processing
- Pharmaceutical & Healthcare

### Geographical Presence

| Region | Revenue Contribution | Employees |
|--------|---------------------|-----------|
| United Kingdom | 45% | 245 |
| Europe (excluding UK) | 30% | 89 |
| North America | 18% | 42 |
| Rest of World | 7% | 24 |
| **Total** | **100%** | **400** |
`

// AFS Section 3: Chairman's Statement
const afsChairmanStatement = `
## Chairman's Statement

**Dear Shareholders,**

I am pleased to present the Annual Financial Statements of Acme Corporation Ltd. for the year ended December 31, 2024. This has been another year of solid performance, demonstrating the resilience of our business model and the dedication of our employees.

### Financial Highlights

The company delivered strong financial results despite challenging market conditions:

- **Revenue increased by 8.3%** to $5.2 million (2023: $4.8 million)
- **Operating profit grew by 11.1%** to $1.0 million (2023: $0.9 million)
- **Net profit after tax rose to $737,500** (2023: $666,250)
- **Return on equity of 22.3%** maintained above our target of 20%

### Strategic Progress

During 2024, we made significant progress on our strategic initiatives:

1. **Digital Transformation:** Completed Phase 2 of our ERP implementation
2. **Market Expansion:** Established presence in three new European markets
3. **Product Innovation:** Launched 4 new product lines with enhanced capabilities
4. **Sustainability:** Reduced carbon emissions by 15% year-over-year

### Board Changes

I would like to welcome Dr. Amanda Foster, who joined the Board as an Independent Non-Executive Director in September 2024. Dr. Foster brings extensive experience in technology and digital innovation.

### Looking Ahead

As we enter 2025, we remain cautiously optimistic. Our strong balance sheet, loyal customer base, and talented workforce position us well for continued growth. We will continue to invest in innovation and operational excellence.

### Dividend

The Board recommends a final dividend of $0.40 per ordinary share, representing a 10% increase from the prior year, reflecting our confidence in the company's future prospects.

I would like to thank our shareholders for their continued support, our customers for their loyalty, and our employees for their unwavering commitment.

**Sir Richard Hamilton, CBE**  
*Chairman*  
March 15, 2025
`

// AFS Section 4: CEO's Report
const afsCEOReport = `
## Chief Executive Officer's Report

### Overview

2024 was a transformative year for Acme Corporation. We achieved record revenues while investing significantly in our future capabilities. Our focus on operational excellence and customer-centricity delivered tangible results across all key metrics.

### Operational Performance

\`\`\`chart
{
  "type": "bar",
  "title": "Revenue vs Expenses (2020-2024)",
  "data": [
    { "year": "2020", "revenue": 3500000, "expenses": 2800000 },
    { "year": "2021", "revenue": 4100000, "expenses": 3200000 },
    { "year": "2022", "revenue": 4500000, "expenses": 3400000 },
    { "year": "2023", "revenue": 4800000, "expenses": 3600000 },
    { "year": "2024", "revenue": 5200000, "expenses": 3900000 }
  ],
  "xAxisKey": "year",
  "dataKeys": ["revenue", "expenses"],
  "colors": ["#2563eb", "#dc2626"]
}
\`\`\`

### Key Achievements

| Strategic Priority | Target | Achieved | Status |
|-------------------|--------|----------|--------|
| Revenue Growth | 7% | 8.3% | ✓ Exceeded |
| Gross Margin | 38% | 40.4% | ✓ Exceeded |
| Customer Satisfaction | 85% | 91% | ✓ Exceeded |
| Employee Engagement | 80% | 84% | ✓ Exceeded |
| Carbon Reduction | 10% | 15% | ✓ Exceeded |
| New Product Launches | 3 | 4 | ✓ Exceeded |

### Business Segment Performance

#### Industrial Equipment (65% of Revenue)

Our core Industrial Equipment segment delivered strong growth of 9.2%, driven by increased demand for automation solutions. Key wins included:

- Multi-year contract with Volkswagen Group worth $1.2M
- Expansion of relationship with Siemens AG
- New partnership with Toyota Manufacturing UK

#### Service & Maintenance (25% of Revenue)

Service revenue grew by 8.3% as our installed base expanded. We launched our predictive maintenance platform, which has been adopted by 40% of our key accounts.

#### Spare Parts & Consumables (10% of Revenue)

This segment grew by 5.1%, driven by increased utilization rates among our customer base.

### Technology & Innovation

We invested $520,000 in R&D during 2024, representing 10% of revenue. Key innovations included:

- **SmartSense 3.0:** Next-generation predictive maintenance platform
- **EcoLine Series:** Energy-efficient equipment range with 30% lower power consumption
- **CloudConnect:** IoT-enabled monitoring and analytics solution

### Our People

Our 400 employees are the foundation of our success. Key initiatives in 2024 included:

| Initiative | Investment | Employees Impacted |
|-----------|------------|-------------------|
| Leadership Development | $85,000 | 45 |
| Technical Training | $120,000 | 280 |
| Apprenticeship Program | $65,000 | 12 |
| Wellness Programs | $35,000 | 400 |

### Outlook for 2025

We expect continued growth in 2025, supported by:

- Strong order backlog of $2.1 million
- Launch of next-generation product platform
- Expansion into Asian markets
- Continued investment in digital capabilities

**John Smith**  
*Chief Executive Officer*  
March 15, 2025
`

// AFS Section 5: Strategic Report
const afsStrategicReport = `
## Strategic Report

### Business Model

Acme Corporation creates value through our integrated business model:

**Key Resources:**
- Skilled workforce of 400 employees
- State-of-the-art manufacturing facility
- Strong brand and reputation
- Extensive IP portfolio (32 patents)
- Long-standing customer relationships

**Value Creation Activities:**
- Product design and engineering
- Precision manufacturing
- Quality assurance
- Customer support and service
- Continuous innovation

**Outputs & Outcomes:**
- High-quality industrial equipment
- Reliable after-sales service
- Customer productivity improvements
- Shareholder returns
- Employee development

### Strategy

Our strategy is built on four pillars:

#### 1. Customer Excellence
- Achieve Net Promoter Score of 50+
- Reduce customer response time to <4 hours
- Expand service offerings

#### 2. Operational Efficiency
- Implement lean manufacturing principles
- Achieve 95% on-time delivery
- Reduce waste by 20% annually

#### 3. Innovation Leadership
- Invest minimum 8% of revenue in R&D
- Launch 3-5 new products annually
- Build digital service capabilities

#### 4. Sustainable Growth
- Target 8-10% annual revenue growth
- Expand geographical footprint
- Pursue selective acquisitions

### Key Performance Indicators

| KPI | 2024 | 2023 | 2022 | Target 2025 |
|-----|------|------|------|-------------|
| Revenue ($M) | 5.20 | 4.80 | 4.50 | 5.70 |
| Gross Margin (%) | 40.4 | 39.6 | 38.8 | 41.0 |
| Operating Margin (%) | 19.2 | 18.8 | 17.5 | 20.0 |
| ROCE (%) | 28.5 | 27.2 | 25.8 | 30.0 |
| Customer NPS | 47 | 44 | 41 | 52 |
| Employee Engagement (%) | 84 | 81 | 78 | 87 |
| Carbon Intensity (tCO2e/$M) | 42 | 49 | 56 | 36 |

### Market Environment

The industrial equipment market continues to grow, driven by:

- **Automation Trends:** Industry 4.0 adoption accelerating
- **Reshoring:** Manufacturing returning to developed markets
- **Sustainability:** Demand for energy-efficient solutions
- **Digitalization:** Connected equipment and data analytics

Market size is estimated at $45 billion globally, with a CAGR of 6.2% through 2028.

### Section 172 Statement

In accordance with Section 172 of the Companies Act 2006, the directors have acted in a way they consider, in good faith, would promote the success of the company for the benefit of its members as a whole, having regard to:

- The likely consequences of any decision in the long term
- The interests of the company's employees
- The need to foster business relationships with suppliers and customers
- The impact of operations on the community and environment
- The desirability of maintaining high standards of business conduct
- The need to act fairly between members
`

// AFS Section 6: Corporate Governance
const afsCorporateGovernance = `
## Corporate Governance Statement

### Board of Directors

The Board is committed to maintaining high standards of corporate governance and believes that good governance creates long-term value for all stakeholders.

| Director | Role | Appointed | Committee Membership |
|----------|------|-----------|---------------------|
| Sir Richard Hamilton, CBE | Chairman (Non-Executive) | 2015 | N, R |
| John Smith | Chief Executive Officer | 2018 | - |
| Sarah Johnson, CPA | Chief Financial Officer | 2019 | - |
| Michael Chen | Non-Executive Director | 2020 | A (Chair), N, R |
| Emily Williams | Non-Executive Director | 2021 | A, N (Chair), R |
| Dr. Amanda Foster | Non-Executive Director | 2024 | A, R (Chair) |

*Key: A = Audit Committee, N = Nomination Committee, R = Remuneration Committee*

### Board Composition

The Board comprises six directors: two Executive Directors and four Non-Executive Directors, including the Chairman. The Board considers that all Non-Executive Directors are independent.

### Board Effectiveness

During 2024, the Board held 8 scheduled meetings and 3 additional meetings to address specific matters. Attendance was as follows:

| Director | Board (11) | Audit (4) | Nomination (3) | Remuneration (4) |
|----------|-----------|-----------|----------------|-----------------|
| Sir Richard Hamilton | 11/11 | - | 3/3 | 4/4 |
| John Smith | 11/11 | - | - | - |
| Sarah Johnson | 11/11 | - | - | - |
| Michael Chen | 10/11 | 4/4 | 3/3 | 4/4 |
| Emily Williams | 11/11 | 4/4 | 3/3 | 4/4 |
| Dr. Amanda Foster* | 3/3 | 1/1 | - | 1/1 |

*Appointed September 2024*

### Audit Committee Report

The Audit Committee assists the Board in fulfilling its oversight responsibilities relating to financial reporting, internal controls, and external audit.

**Key Activities in 2024:**
- Reviewed quarterly and annual financial statements
- Assessed effectiveness of internal controls
- Oversaw external audit process
- Reviewed risk management framework
- Evaluated cybersecurity posture

### Remuneration Committee Report

The Remuneration Committee sets remuneration policy for Executive Directors and senior management.

**Executive Director Remuneration 2024:**

| Component | CEO ($) | CFO ($) |
|-----------|---------|---------|
| Base Salary | 285,000 | 215,000 |
| Annual Bonus | 142,500 | 96,750 |
| Long-term Incentive | 85,500 | 53,750 |
| Benefits | 25,000 | 22,000 |
| Pension Contribution | 28,500 | 21,500 |
| **Total** | **566,500** | **409,000** |

### Internal Controls

The Board maintains a sound system of internal control to safeguard shareholders' investments and the company's assets. Key elements include:

- Clear organizational structure with defined lines of responsibility
- Comprehensive budgeting and forecasting process
- Monthly management accounts reviewed by the Board
- Segregation of duties in financial processes
- Regular internal audit reviews
- Whistleblowing policy and procedures
`

// AFS Section 7: Risk Management
const afsRiskManagement = `
## Risk Management

### Risk Management Framework

The Board has overall responsibility for risk management. The framework comprises:

- **Risk Identification:** Regular assessment of strategic, operational, financial, and compliance risks
- **Risk Assessment:** Evaluation of likelihood and impact using standardized methodology
- **Risk Mitigation:** Development and implementation of controls and action plans
- **Risk Monitoring:** Ongoing review and reporting to Board and Audit Committee

### Principal Risks and Uncertainties

| Risk | Description | Mitigation | Movement |
|------|-------------|------------|----------|
| **Economic Conditions** | Adverse economic conditions could reduce customer demand | Diversified customer base and geographic markets; flexible cost structure | → Stable |
| **Supply Chain Disruption** | Disruption to supply of critical components | Multiple supplier relationships; strategic inventory holdings; supplier audits | ↓ Decreased |
| **Cyber Security** | IT systems vulnerability to cyber attacks | Robust security protocols; regular penetration testing; employee training; cyber insurance | ↑ Increased |
| **Talent Retention** | Loss of key personnel and skills shortages | Competitive remuneration; career development; succession planning | → Stable |
| **Regulatory Compliance** | Changes in regulations affecting operations | Regulatory monitoring; compliance programs; legal advisors | → Stable |
| **Currency Fluctuations** | Exposure to foreign exchange movements | Natural hedging; forward contracts where appropriate | → Stable |
| **Customer Concentration** | Dependence on key customers | Customer diversification strategy; long-term contracts | ↓ Decreased |
| **Product Quality** | Defects leading to claims or recalls | Quality management system; product testing; insurance coverage | → Stable |

### Risk Heat Map

| | Low Impact | Medium Impact | High Impact |
|---|---|---|---|
| **High Likelihood** | Regulatory Changes | Talent Retention | - |
| **Medium Likelihood** | Currency Risk | Supply Chain | Cyber Security |
| **Low Likelihood** | - | Customer Concentration | Economic Downturn |

### Emerging Risks

The Board monitors emerging risks including:

- **Artificial Intelligence:** Both opportunity and threat from AI adoption in manufacturing
- **Climate Change:** Physical and transitional risks from climate change
- **Geopolitical Instability:** Ongoing global political tensions affecting trade
- **Technology Obsolescence:** Rapid technological change requiring continuous innovation
`

// AFS Section 8: Financial Statements
const afsFinancialPosition = `
## Statement of Financial Position
*As at December 31, 2024*

### Assets

#### Non-Current Assets
| Description | Note | 2024 ($) | 2023 ($) |
|-------------|------|----------|----------|
| Property, Plant & Equipment | 5 | 2,450,000 | 2,100,000 |
| Right-of-Use Assets | 6 | 180,000 | 210,000 |
| Intangible Assets | 7 | 350,000 | 280,000 |
| Investment in Associates | 8 | 125,000 | 100,000 |
| Deferred Tax Assets | 9 | 45,000 | 38,000 |
| **Total Non-Current Assets** | | **3,150,000** | **2,728,000** |

#### Current Assets
| Description | Note | 2024 ($) | 2023 ($) |
|-------------|------|----------|----------|
| Inventories | 10 | 380,000 | 320,000 |
| Trade Receivables | 11 | 620,000 | 540,000 |
| Other Receivables | 12 | 85,000 | 72,000 |
| Prepayments | | 42,000 | 35,000 |
| Cash and Cash Equivalents | 13 | 450,000 | 380,000 |
| **Total Current Assets** | | **1,577,000** | **1,347,000** |

**Total Assets:** **$4,727,000** (2023: $4,075,000)

---

### Equity and Liabilities

#### Equity
| Description | Note | 2024 ($) | 2023 ($) |
|-------------|------|----------|----------|
| Share Capital | 14 | 500,000 | 500,000 |
| Share Premium | 14 | 250,000 | 250,000 |
| Retained Earnings | | 1,987,500 | 1,450,000 |
| Other Reserves | | 120,000 | 95,000 |
| **Total Equity** | | **2,857,500** | **2,295,000** |

#### Non-Current Liabilities
| Description | Note | 2024 ($) | 2023 ($) |
|-------------|------|----------|----------|
| Long-term Borrowings | 15 | 650,000 | 720,000 |
| Lease Liabilities | 16 | 145,000 | 175,000 |
| Deferred Tax Liabilities | 9 | 62,000 | 55,000 |
| Provisions | 17 | 85,000 | 70,000 |
| **Total Non-Current Liabilities** | | **942,000** | **1,020,000** |

#### Current Liabilities
| Description | Note | 2024 ($) | 2023 ($) |
|-------------|------|----------|----------|
| Trade Payables | 18 | 485,000 | 420,000 |
| Other Payables | 19 | 142,500 | 125,000 |
| Current Tax Liabilities | | 165,000 | 138,000 |
| Lease Liabilities (Current) | 16 | 35,000 | 32,000 |
| Short-term Borrowings | 15 | 100,000 | 45,000 |
| **Total Current Liabilities** | | **927,500** | **760,000** |

**Total Equity and Liabilities:** **$4,727,000** (2023: $4,075,000)

---

## Financial Performance Overview

### Five-Year Revenue Trend

\`\`\`chart
{
  "type": "bar",
  "title": "Revenue vs Expenses (2020-2024)",
  "data": [
    { "year": "2020", "revenue": 3500000, "expenses": 2800000 },
    { "year": "2021", "revenue": 4100000, "expenses": 3200000 },
    { "year": "2022", "revenue": 4500000, "expenses": 3400000 },
    { "year": "2023", "revenue": 4800000, "expenses": 3600000 },
    { "year": "2024", "revenue": 5200000, "expenses": 3900000 }
  ],
  "xAxisKey": "year",
  "dataKeys": ["revenue", "expenses"],
  "colors": ["#2563eb", "#dc2626"]
}
\`\`\`

### Key Financial Metrics

| Metric | 2024 | 2023 | Change |
|--------|------|------|--------|
| Revenue Growth | 8.3% | 6.7% | +1.6% |
| Gross Margin | 40.4% | 39.6% | +0.8% |
| Operating Margin | 17.3% | 16.7% | +0.6% |
| Return on Equity | 22.3% | 24.7% | -2.4% |
| Current Ratio | 1.70 | 1.77 | -0.07 |
| Debt-to-Equity | 0.33 | 0.42 | -0.09 |

---

## Statement of Comprehensive Income
*For the year ended December 31, 2024*

### Revenue and Expenses

| Description | Note | 2024 ($) | 2023 ($) |
|-------------|------|----------|----------|
| **Revenue** | 3 | **5,200,000** | **4,800,000** |
| Cost of Sales | | (3,100,000) | (2,900,000) |
| **Gross Profit** | | **2,100,000** | **1,900,000** |
| | | | |
| Distribution Costs | | (420,000) | (385,000) |
| Administrative Expenses | | (650,000) | (595,000) |
| Other Operating Income | | 75,000 | 55,000 |
| Other Operating Expenses | | (105,000) | (75,000) |
| **Operating Profit** | | **1,000,000** | **900,000** |
| | | | |
| Finance Income | | 18,000 | 12,000 |
| Finance Costs | 4 | (68,000) | (57,000) |
| Share of Profit of Associates | | 25,000 | 18,000 |
| **Profit Before Tax** | | **975,000** | **873,000** |
| | | | |
| Income Tax Expense | 9 | (237,500) | (206,750) |
| **Profit for the Year** | | **737,500** | **666,250** |

### Other Comprehensive Income

| Description | 2024 ($) | 2023 ($) |
|-------------|----------|----------|
| Foreign currency translation | 15,000 | (8,000) |
| Revaluation of investments | 10,000 | 12,000 |
| **Total Comprehensive Income** | **762,500** | **670,250** |

---

## Statement of Cash Flows
*For the year ended December 31, 2024*

### Cash Flows from Operating Activities

| Description | 2024 ($) | 2023 ($) |
|-------------|----------|----------|
| Profit before tax | 975,000 | 873,000 |
| Adjustments for: | | |
| - Depreciation and amortization | 285,000 | 248,000 |
| - Finance costs | 68,000 | 57,000 |
| - Finance income | (18,000) | (12,000) |
| - Share of profit of associates | (25,000) | (18,000) |
| Operating cash before working capital | 1,285,000 | 1,148,000 |
| | | |
| Changes in working capital: | | |
| - Increase in inventories | (60,000) | (45,000) |
| - Increase in receivables | (93,000) | (78,000) |
| - Increase in payables | 82,500 | 65,000 |
| Cash generated from operations | 1,214,500 | 1,090,000 |
| | | |
| Interest paid | (68,000) | (57,000) |
| Income taxes paid | (210,500) | (185,000) |
| **Net Cash from Operating Activities** | **936,000** | **848,000** |

### Cash Flows from Investing Activities

| Description | 2024 ($) | 2023 ($) |
|-------------|----------|----------|
| Purchase of property, plant & equipment | (520,000) | (380,000) |
| Purchase of intangible assets | (95,000) | (65,000) |
| Investment in associates | (25,000) | (20,000) |
| Interest received | 18,000 | 12,000 |
| **Net Cash Used in Investing Activities** | **(622,000)** | **(453,000)** |

### Cash Flows from Financing Activities

| Description | 2024 ($) | 2023 ($) |
|-------------|----------|----------|
| Repayment of borrowings | (70,000) | (85,000) |
| New borrowings | 55,000 | 40,000 |
| Payment of lease liabilities | (27,000) | (25,000) |
| Dividends paid | (200,000) | (180,000) |
| **Net Cash Used in Financing Activities** | **(242,000)** | **(250,000)** |

| | 2024 ($) | 2023 ($) |
|-------------|----------|----------|
| **Net Increase in Cash** | **72,000** | **145,000** |
| Cash at beginning of year | 380,000 | 235,000 |
| Exchange differences | (2,000) | 0 |
| **Cash at End of Year** | **450,000** | **380,000** |

---

## Notes to the Financial Statements

### 1. General Information

Acme Corporation Ltd. is a private company limited by shares, incorporated and domiciled in the United Kingdom. The company's principal activity is the manufacturing and distribution of industrial equipment to commercial clients across Europe and North America.

### 2. Basis of Preparation

These financial statements have been prepared in accordance with International Financial Reporting Standards (IFRS) as adopted by the United Kingdom and the Companies Act 2006. The financial statements are presented in US Dollars ($), which is the company's functional currency.

**Going Concern:** The directors have assessed the company's ability to continue as a going concern and are satisfied that the company has adequate resources to continue operations for the foreseeable future.

### 3. Revenue Recognition

Revenue is recognized when control of goods or services is transferred to the customer. The company recognizes revenue from the following major sources:

- **Product Sales:** Revenue is recognized at the point in time when control transfers to the customer, typically upon delivery.
- **Service Contracts:** Revenue is recognized over time as services are rendered.
- **Installation Services:** Revenue is recognized upon completion of installation.

| Revenue by Segment | 2024 ($) | 2023 ($) |
|-------------------|----------|----------|
| Product Sales | 4,160,000 | 3,840,000 |
| Service Contracts | 780,000 | 720,000 |
| Installation Services | 260,000 | 240,000 |
| **Total Revenue** | **5,200,000** | **4,800,000** |

### 4. Finance Costs

| Description | 2024 ($) | 2023 ($) |
|-------------|----------|----------|
| Interest on bank borrowings | 42,000 | 38,000 |
| Interest on lease liabilities | 18,000 | 14,000 |
| Other finance charges | 8,000 | 5,000 |
| **Total Finance Costs** | **68,000** | **57,000** |

### 5. Property, Plant & Equipment

| Category | Land & Buildings | Plant & Machinery | Fixtures | Motor Vehicles | Total |
|----------|-----------------|-------------------|----------|----------------|-------|
| Cost at 1 Jan 2024 | 1,800,000 | 1,250,000 | 180,000 | 220,000 | 3,450,000 |
| Additions | 200,000 | 250,000 | 35,000 | 35,000 | 520,000 |
| Disposals | - | (45,000) | (8,000) | (25,000) | (78,000) |
| Cost at 31 Dec 2024 | 2,000,000 | 1,455,000 | 207,000 | 230,000 | 3,892,000 |
| Accumulated Depreciation | (520,000) | (685,000) | (112,000) | (125,000) | (1,442,000) |
| **Net Book Value** | **1,480,000** | **770,000** | **95,000** | **105,000** | **2,450,000** |

---

## Independent Auditor's Report

**To the Members of Acme Corporation Ltd.**

### Opinion

We have audited the financial statements of Acme Corporation Ltd. for the year ended December 31, 2024, which comprise the Statement of Financial Position, Statement of Comprehensive Income, Statement of Cash Flows, Statement of Changes in Equity, and notes to the financial statements.

In our opinion, the financial statements:
- Give a true and fair view of the state of the company's affairs as at December 31, 2024 and of its profit for the year then ended;
- Have been properly prepared in accordance with IFRS as adopted by the United Kingdom; and
- Have been prepared in accordance with the requirements of the Companies Act 2006.

### Basis for Opinion

We conducted our audit in accordance with International Standards on Auditing (UK) (ISAs UK) and applicable law. We are independent of the company and have fulfilled our ethical responsibilities in accordance with the FRC's Ethical Standard.

### Key Audit Matters

- **Revenue Recognition:** We tested controls over revenue recognition and performed substantive testing on a sample of transactions.
- **Inventory Valuation:** We attended physical inventory counts and tested the valuation methodology.
- **Going Concern:** We reviewed management's assessment and concluded it is appropriate.

**Sterling & Associates LLP**  
Chartered Accountants  
Registered Auditors  
London, United Kingdom  
Date: March 10, 2025

---

## Director's Statement

The directors present their report together with the audited financial statements for the year ended December 31, 2024.

### Principal Activities

The company continued its principal activities of manufacturing and distributing industrial equipment during the year.

### Results and Dividends

The profit for the year after taxation was $737,500 (2023: $666,250). The directors recommend a final dividend of $0.40 per share (2023: $0.36 per share), totaling $200,000.

### Directors

The directors who served during the year were:
- John Smith (Chief Executive Officer)
- Sarah Johnson (Chief Financial Officer)
- Michael Chen (Non-Executive Director)
- Emily Williams (Non-Executive Director)

### Statement of Directors' Responsibilities

The directors are responsible for preparing the Annual Report and financial statements in accordance with applicable law and regulations. Company law requires the directors to prepare financial statements that give a true and fair view.

**Approved by the Board and signed on its behalf:**

_________________________  
**John Smith**  
Chief Executive Officer  
Date: March 15, 2025

_________________________  
**Sarah Johnson**  
Chief Financial Officer  
Date: March 15, 2025
`

// AFS Section 9: Detailed Notes (6-20)
const afsDetailedNotes = `
## Notes to the Financial Statements (Continued)

### 6. Right-of-Use Assets

The company leases office space, warehouse facilities, and certain equipment under lease agreements.

| Category | Buildings | Equipment | Motor Vehicles | Total |
|----------|-----------|-----------|----------------|-------|
| Cost at 1 Jan 2024 | 280,000 | 85,000 | 45,000 | 410,000 |
| Additions | 15,000 | 12,000 | 8,000 | 35,000 |
| Disposals | - | (5,000) | (10,000) | (15,000) |
| Cost at 31 Dec 2024 | 295,000 | 92,000 | 43,000 | 430,000 |
| Accumulated Depreciation | (168,000) | (52,000) | (30,000) | (250,000) |
| **Net Book Value** | **127,000** | **40,000** | **13,000** | **180,000** |

### 7. Intangible Assets

| Category | Software | Patents | Development Costs | Total |
|----------|----------|---------|-------------------|-------|
| Cost at 1 Jan 2024 | 180,000 | 120,000 | 150,000 | 450,000 |
| Additions | 45,000 | 25,000 | 25,000 | 95,000 |
| Amortization | (65,000) | (40,000) | (90,000) | (195,000) |
| **Net Book Value** | **160,000** | **105,000** | **85,000** | **350,000** |

**Useful lives applied:**
- Software: 3-5 years
- Patents: 10-20 years (legal life)
- Development costs: 5-7 years

### 8. Investment in Associates

The company holds a 25% interest in TechParts Manufacturing Ltd., a supplier of precision components.

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| At beginning of year | 100,000 | 82,000 |
| Share of profit | 25,000 | 18,000 |
| **At end of year** | **125,000** | **100,000** |

**Summary financial information of TechParts Manufacturing Ltd.:**

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| Total assets | 850,000 | 720,000 |
| Total liabilities | (350,000) | (320,000) |
| Net assets | 500,000 | 400,000 |
| Revenue | 1,200,000 | 1,050,000 |
| Profit for the year | 100,000 | 72,000 |

### 9. Deferred Tax

| | Assets ($) | Liabilities ($) | Net ($) |
|---|----------|----------------|---------|
| Accelerated capital allowances | - | (62,000) | (62,000) |
| Provisions | 28,000 | - | 28,000 |
| Lease liabilities | 12,000 | - | 12,000 |
| Share-based payments | 5,000 | - | 5,000 |
| **Net deferred tax** | **45,000** | **(62,000)** | **(17,000)** |

### 10. Inventories

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| Raw materials | 125,000 | 105,000 |
| Work in progress | 95,000 | 82,000 |
| Finished goods | 160,000 | 133,000 |
| **Total inventories** | **380,000** | **320,000** |

Inventories are stated at the lower of cost and net realizable value. During 2024, inventory write-downs of $12,000 (2023: $8,000) were recognized in cost of sales.

### 11. Trade Receivables

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| Trade receivables - gross | 648,000 | 562,000 |
| Less: Expected credit losses | (28,000) | (22,000) |
| **Trade receivables - net** | **620,000** | **540,000** |

**Aging analysis:**

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| Not past due | 485,000 | 420,000 |
| Past due 1-30 days | 95,000 | 82,000 |
| Past due 31-60 days | 42,000 | 38,000 |
| Past due 61-90 days | 18,000 | 15,000 |
| Past due over 90 days | 8,000 | 7,000 |
| **Gross receivables** | **648,000** | **562,000** |

### 12. Other Receivables

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| VAT recoverable | 45,000 | 38,000 |
| Staff advances | 8,000 | 6,000 |
| Deposits | 22,000 | 20,000 |
| Other | 10,000 | 8,000 |
| **Total other receivables** | **85,000** | **72,000** |

### 13. Cash and Cash Equivalents

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| Bank current accounts | 285,000 | 245,000 |
| Bank deposit accounts | 150,000 | 125,000 |
| Cash in hand | 15,000 | 10,000 |
| **Total cash** | **450,000** | **380,000** |

Cash and cash equivalents include short-term deposits with original maturities of three months or less.

### 14. Share Capital

| | Number | Ordinary Shares ($) | Share Premium ($) | Total ($) |
|---|--------|--------------------|--------------------|-----------|
| At 1 January 2024 | 500,000 | 500,000 | 250,000 | 750,000 |
| Issued during year | - | - | - | - |
| **At 31 December 2024** | **500,000** | **500,000** | **250,000** | **750,000** |

The company has one class of ordinary shares with a par value of $1 per share. All shares carry equal voting rights and entitlement to dividends.

### 15. Borrowings

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| **Non-current:** | | |
| Bank loan - secured | 450,000 | 520,000 |
| Equipment financing | 200,000 | 200,000 |
| **Total non-current** | **650,000** | **720,000** |
| | | |
| **Current:** | | |
| Bank loan - current portion | 70,000 | 45,000 |
| Overdraft facility | 30,000 | - |
| **Total current** | **100,000** | **45,000** |
| | | |
| **Total borrowings** | **750,000** | **765,000** |

**Bank loan terms:**
- Principal: $700,000 (originally)
- Interest rate: 5.25% fixed
- Maturity: March 2029
- Security: First charge over freehold property
- Covenants: Interest cover >3x, Debt/EBITDA <2.5x

### 16. Lease Liabilities

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| Current | 35,000 | 32,000 |
| Non-current | 145,000 | 175,000 |
| **Total lease liabilities** | **180,000** | **207,000** |

**Maturity analysis:**

| | 2024 ($) |
|---|----------|
| Within 1 year | 42,000 |
| 1-2 years | 38,000 |
| 2-5 years | 95,000 |
| Over 5 years | 25,000 |
| **Total minimum lease payments** | **200,000** |
| Less: future finance charges | (20,000) |
| **Present value** | **180,000** |

### 17. Provisions

| | Warranty ($) | Restructuring ($) | Legal ($) | Total ($) |
|---|-------------|-------------------|-----------|-----------|
| At 1 January 2024 | 42,000 | 15,000 | 13,000 | 70,000 |
| Charged to profit/loss | 35,000 | - | 8,000 | 43,000 |
| Utilized | (22,000) | (6,000) | - | (28,000) |
| **At 31 December 2024** | **55,000** | **9,000** | **21,000** | **85,000** |

**Warranty provision:** Covers expected costs of repairs and replacements under product warranties (12-24 months).

**Restructuring provision:** Relates to facility consolidation announced in Q3 2023, expected to complete in 2025.

**Legal provision:** Covers ongoing litigation matters.

### 18. Trade Payables

All trade payables are due within normal credit terms of 30-60 days. Trade payables include amounts due to:

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| Raw material suppliers | 285,000 | 248,000 |
| Service providers | 125,000 | 108,000 |
| Capital goods suppliers | 75,000 | 64,000 |
| **Total trade payables** | **485,000** | **420,000** |

### 19. Other Payables

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| Accrued expenses | 68,500 | 62,000 |
| Payroll taxes | 35,000 | 30,000 |
| VAT payable | 24,000 | 20,000 |
| Other creditors | 15,000 | 13,000 |
| **Total other payables** | **142,500** | **125,000** |

### 20. Related Party Transactions

**Key management compensation:**

| | 2024 ($) | 2023 ($) |
|---|----------|----------|
| Short-term employee benefits | 1,150,000 | 1,050,000 |
| Post-employment benefits | 115,000 | 105,000 |
| Share-based payments | 85,000 | 72,000 |
| **Total** | **1,350,000** | **1,227,000** |

**Transactions with related parties:**

During the year, the company purchased goods totaling $180,000 (2023: $155,000) from TechParts Manufacturing Ltd., an associate company. At year end, $22,000 (2023: $18,000) was outstanding.

All transactions were conducted at arm's length on normal commercial terms.

### 21. Financial Instruments

**Financial risk management:**

The company's activities expose it to various financial risks including credit risk, liquidity risk, and market risk (foreign exchange and interest rate).

**Credit risk:**
Maximum exposure to credit risk equals the carrying value of financial assets. The company mitigates credit risk through credit checks, credit limits, and credit insurance on major accounts.

**Liquidity risk:**
The company maintains adequate reserves and banking facilities to meet its payment obligations.

**Foreign exchange risk:**
Approximately 35% of revenue is denominated in foreign currencies (EUR, USD). Natural hedging is used where possible.

### 22. Contingent Liabilities

The company has contingent liabilities in respect of:

1. **Legal claims:** The company is defending a patent infringement claim. Legal advisors estimate maximum exposure at $150,000. No provision has been made as management believes the claim is without merit.

2. **Performance guarantees:** Bank guarantees of $85,000 have been issued to customers in respect of contract performance.

3. **Environmental:** No material environmental liabilities have been identified.

### 23. Capital Commitments

At 31 December 2024, the company had capital commitments of $320,000 (2023: $185,000) relating to:

| | 2024 ($) |
|---|----------|
| Manufacturing equipment | 220,000 |
| IT infrastructure upgrade | 65,000 |
| Facility improvements | 35,000 |
| **Total commitments** | **320,000** |

### 24. Events After the Reporting Period

**Dividend:** On March 15, 2025, the Board proposed a final dividend of $0.40 per share ($200,000 in total).

**Acquisition:** On February 28, 2025, the company signed a letter of intent to acquire PrecisionTech GmbH, a German manufacturer of precision components, for approximately €1.2 million. Due diligence is ongoing.

No other material events have occurred between the reporting date and the date of authorization of these financial statements.
`

// AFS Section 10: Five-Year Summary & Additional Information
const afsFiveYearSummary = `
## Five-Year Financial Summary

| | 2024 | 2023 | 2022 | 2021 | 2020 |
|---|------|------|------|------|------|
| **Income Statement ($'000)** | | | | | |
| Revenue | 5,200 | 4,800 | 4,500 | 4,100 | 3,500 |
| Gross profit | 2,100 | 1,900 | 1,746 | 1,558 | 1,260 |
| Operating profit | 1,000 | 900 | 788 | 697 | 525 |
| Profit before tax | 975 | 873 | 755 | 665 | 490 |
| Profit after tax | 738 | 666 | 574 | 506 | 368 |
| | | | | | |
| **Balance Sheet ($'000)** | | | | | |
| Total assets | 4,727 | 4,075 | 3,650 | 3,280 | 2,850 |
| Total equity | 2,858 | 2,295 | 1,809 | 1,415 | 1,089 |
| Net debt | 300 | 385 | 420 | 485 | 550 |
| | | | | | |
| **Cash Flow ($'000)** | | | | | |
| Operating cash flow | 936 | 848 | 765 | 682 | 545 |
| Capital expenditure | (640) | (445) | (380) | (320) | (265) |
| Free cash flow | 296 | 403 | 385 | 362 | 280 |
| | | | | | |
| **Key Ratios** | | | | | |
| Gross margin (%) | 40.4 | 39.6 | 38.8 | 38.0 | 36.0 |
| Operating margin (%) | 19.2 | 18.8 | 17.5 | 17.0 | 15.0 |
| Return on equity (%) | 22.3 | 24.7 | 28.3 | 32.1 | 28.9 |
| Return on capital employed (%) | 28.5 | 27.2 | 25.8 | 24.5 | 22.0 |
| Current ratio | 1.70 | 1.77 | 1.85 | 1.92 | 1.78 |
| Debt/equity ratio | 0.26 | 0.33 | 0.42 | 0.54 | 0.65 |
| Interest cover (times) | 14.7 | 15.3 | 14.2 | 13.5 | 11.8 |
| | | | | | |
| **Per Share Data ($)** | | | | | |
| Earnings per share | 1.48 | 1.33 | 1.15 | 1.01 | 0.74 |
| Dividend per share | 0.40 | 0.36 | 0.32 | 0.28 | 0.22 |
| Net asset value per share | 5.72 | 4.59 | 3.62 | 2.83 | 2.18 |
| | | | | | |
| **Other Statistics** | | | | | |
| Average employees | 400 | 385 | 368 | 345 | 320 |
| Revenue per employee ($'000) | 13.0 | 12.5 | 12.2 | 11.9 | 10.9 |
| Carbon emissions (tCO2e) | 218 | 235 | 252 | 275 | 301 |
`

// AFS Section 11: Shareholder Information
const afsShareholderInfo = `
## Shareholder Information

### Dividend Information

| | 2024 | 2023 |
|---|------|------|
| Interim dividend per share | - | - |
| Final dividend per share (proposed) | $0.40 | $0.36 |
| Total dividend per share | $0.40 | $0.36 |
| Dividend cover (times) | 3.7x | 3.7x |
| Total dividend paid ($'000) | 200 | 180 |

**Ex-dividend date:** April 10, 2025  
**Record date:** April 11, 2025  
**Payment date:** May 15, 2025

### Share Price Performance

| | 2024 | 2023 |
|---|------|------|
| Year high ($) | 12.85 | 10.45 |
| Year low ($) | 8.92 | 7.65 |
| Year end ($) | 11.50 | 9.80 |
| Price/earnings ratio | 7.8x | 7.4x |
| Market capitalization ($M) | 5.75 | 4.90 |

### Major Shareholders

As at December 31, 2024:

| Shareholder | Shares Held | Percentage |
|-------------|-------------|------------|
| Hamilton Family Trust | 125,000 | 25.0% |
| Institutional Investors Ltd. | 85,000 | 17.0% |
| Director Holdings (aggregate) | 62,500 | 12.5% |
| Employee Share Trust | 25,000 | 5.0% |
| Other shareholders | 202,500 | 40.5% |
| **Total** | **500,000** | **100.0%** |

### Directors' Shareholdings

| Director | Ordinary Shares | % of Issued Capital |
|----------|-----------------|---------------------|
| Sir Richard Hamilton | 45,000 | 9.0% |
| John Smith | 10,000 | 2.0% |
| Sarah Johnson | 5,000 | 1.0% |
| Michael Chen | 1,500 | 0.3% |
| Emily Williams | 1,000 | 0.2% |
| Dr. Amanda Foster | - | - |

### Shareholder Communication

The company is committed to maintaining open communication with shareholders through:

- Annual General Meeting
- Annual and interim reports
- Company website: www.acmecorp.com/investors
- Regulatory announcements
- Direct shareholder enquiry service

### Annual General Meeting

The Annual General Meeting will be held on May 20, 2025 at 10:00 AM at:

The Grand Conference Centre  
200 Business Park Way  
London, EC2A 5BT

Notice of the AGM accompanies this Annual Report.

### Financial Calendar 2025

| Event | Date |
|-------|------|
| Annual General Meeting | May 20, 2025 |
| Final dividend payment | May 15, 2025 |
| Half-year results announcement | August 28, 2025 |
| Financial year end | December 31, 2025 |
| Preliminary results announcement | March 2026 |
`

// AFS Section 12: Corporate Directory & Glossary
const afsCorporateDirectory = `
## Corporate Directory

### Board of Directors

**Sir Richard Hamilton, CBE** - *Chairman*  
Appointed: 2015  
Sir Richard has over 40 years of experience in the manufacturing sector. He serves on the boards of several FTSE 250 companies.

**John Smith** - *Chief Executive Officer*  
Appointed: 2018  
John joined Acme in 2010 and has led the company's growth strategy since becoming CEO.

**Sarah Johnson, CPA** - *Chief Financial Officer*  
Appointed: 2019  
Sarah is a qualified CPA with extensive experience in financial management in the manufacturing sector.

**Michael Chen** - *Independent Non-Executive Director*  
Appointed: 2020  
Michael is a former audit partner with experience across multiple industries.

**Emily Williams** - *Independent Non-Executive Director*  
Appointed: 2021  
Emily brings expertise in HR and organizational development.

**Dr. Amanda Foster** - *Independent Non-Executive Director*  
Appointed: 2024  
Dr. Foster is a technology expert with experience in digital transformation.

### Executive Management Team

| Name | Position |
|------|----------|
| John Smith | Chief Executive Officer |
| Sarah Johnson | Chief Financial Officer |
| David Brown | Chief Operating Officer |
| Lisa Martinez | Chief Technology Officer |
| Robert Taylor | VP Sales & Marketing |
| Jennifer White | VP Human Resources |
| Mark Anderson | VP Manufacturing |

### Professional Advisors

**Auditors:**  
Sterling & Associates LLP  
1 Audit Square, London EC4A 1AB

**Legal Advisors:**  
Hammond & Partners LLP  
50 Legal Lane, London WC2B 4AZ

**Principal Bankers:**  
National Westminster Bank PLC  
Corporate Banking Centre, London

**Registrars:**  
Equiniti Group PLC  
Aspect House, Spencer Road, Lancing BN99 6DA

### Company Information

**Registered Office:**  
100 Innovation Drive  
London EC2A 4BT  
United Kingdom

**Company Registration Number:** 12345678  
**VAT Registration Number:** GB 987 6543 21

**Website:** www.acmecorp.com  
**Email:** investors@acmecorp.com  
**Telephone:** +44 (0)20 1234 5678

---

### Glossary of Terms

| Term | Definition |
|------|------------|
| **EBITDA** | Earnings before interest, tax, depreciation, and amortization |
| **EPS** | Earnings per share |
| **IFRS** | International Financial Reporting Standards |
| **NPS** | Net Promoter Score |
| **ROCE** | Return on capital employed |
| **ROE** | Return on equity |
| **tCO2e** | Tonnes of carbon dioxide equivalent |
| **Working Capital** | Current assets less current liabilities |
`

// Combine all sections into the full AFS
const defaultContent = [
	afsCoverPage,
	afsCompanyInfo,
	afsChairmanStatement,
	afsCEOReport,
	afsStrategicReport,
	afsCorporateGovernance,
	afsRiskManagement,
	afsFinancialPosition,
	afsDetailedNotes,
	afsFiveYearSummary,
	afsShareholderInfo,
	afsCorporateDirectory,
].join("\n\n---\n\n")
