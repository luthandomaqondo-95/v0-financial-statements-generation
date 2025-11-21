import { generateObject } from "ai"
import { z } from "zod"

const financialStatementSchema = z.object({
  companyInfo: z.object({
    name: z.string(),
    registrationNumber: z.string().optional(),
    financialYearEnd: z.string(),
  }),
  statementOfFinancialPosition: z.object({
    nonCurrentAssets: z.array(
      z.object({
        description: z.string(),
        currentYear: z.number(),
        previousYear: z.number(),
      }),
    ),
    currentAssets: z.array(
      z.object({
        description: z.string(),
        currentYear: z.number(),
        previousYear: z.number(),
      }),
    ),
    equity: z
      .array(
        z.object({
          description: z.string(),
          currentYear: z.number(),
          previousYear: z.number(),
        }),
      )
      .optional(),
    liabilities: z
      .array(
        z.object({
          description: z.string(),
          currentYear: z.number(),
          previousYear: z.number(),
        }),
      )
      .optional(),
  }),
  statementOfComprehensiveIncome: z.object({
    revenue: z.number(),
    costOfSales: z.number(),
    operatingExpenses: z.number(),
    financeCosts: z.number().optional(),
    taxExpense: z.number(),
  }),
  notes: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
      }),
    )
    .optional(),
})

export async function POST(req: Request) {
  const { prompt, financialData } = await req.json()

  const { object } = await generateObject({
    model: "openai/gpt-5",
    schema: financialStatementSchema,
    prompt: `Generate a complete Annual Financial Statement based on the following information:
    
${prompt}

${financialData ? `Financial Data: ${JSON.stringify(financialData, null, 2)}` : ""}

Create a comprehensive financial statement with:
1. Company information
2. Statement of Financial Position (Balance Sheet) with assets, equity, and liabilities
3. Statement of Comprehensive Income (Income Statement)
4. Relevant notes to the financial statements

Ensure all numbers are realistic and balanced according to accounting principles.`,
    maxOutputTokens: 4000,
  })

  // Convert structured data to markdown
  const markdown = convertToMarkdown(object)

  return Response.json({
    structuredData: object,
    markdown,
  })
}

function convertToMarkdown(data: z.infer<typeof financialStatementSchema>): string {
  let md = `# Annual Financial Statement ${new Date().getFullYear()}\n\n`

  // Company Information
  md += `## Company Information\n`
  md += `**Company Name:** ${data.companyInfo.name}\n`
  if (data.companyInfo.registrationNumber) {
    md += `**Registration Number:** ${data.companyInfo.registrationNumber}\n`
  }
  md += `**Financial Year End:** ${data.companyInfo.financialYearEnd}\n\n`
  md += `---\n\n`

  // Statement of Financial Position
  md += `## Statement of Financial Position\n\n`

  md += `### Assets\n\n`
  md += `#### Non-Current Assets\n`
  md += `| Description | ${new Date().getFullYear()} ($) | ${new Date().getFullYear() - 1} ($) |\n`
  md += `|-------------|----------|----------|\n`

  const totalNonCurrent = { current: 0, previous: 0 }
  data.statementOfFinancialPosition.nonCurrentAssets.forEach((asset) => {
    md += `| ${asset.description} | ${asset.currentYear.toLocaleString()} | ${asset.previousYear.toLocaleString()} |\n`
    totalNonCurrent.current += asset.currentYear
    totalNonCurrent.previous += asset.previousYear
  })
  md += `| **Total Non-Current Assets** | **${totalNonCurrent.current.toLocaleString()}** | **${totalNonCurrent.previous.toLocaleString()}** |\n\n`

  md += `#### Current Assets\n`
  md += `| Description | ${new Date().getFullYear()} ($) | ${new Date().getFullYear() - 1} ($) |\n`
  md += `|-------------|----------|----------|\n`

  const totalCurrent = { current: 0, previous: 0 }
  data.statementOfFinancialPosition.currentAssets.forEach((asset) => {
    md += `| ${asset.description} | ${asset.currentYear.toLocaleString()} | ${asset.previousYear.toLocaleString()} |\n`
    totalCurrent.current += asset.currentYear
    totalCurrent.previous += asset.previousYear
  })
  md += `| **Total Current Assets** | **${totalCurrent.current.toLocaleString()}** | **${totalCurrent.previous.toLocaleString()}** |\n\n`

  const totalAssets = {
    current: totalNonCurrent.current + totalCurrent.current,
    previous: totalNonCurrent.previous + totalCurrent.previous,
  }
  md += `**Total Assets:** $${totalAssets.current.toLocaleString()}\n\n`
  md += `---\n\n`

  // Statement of Comprehensive Income
  md += `## Statement of Comprehensive Income\n\n`
  md += `### Revenue and Expenses\n\n`
  md += `| Description | ${new Date().getFullYear()} ($) | ${new Date().getFullYear() - 1} ($) |\n`
  md += `|-------------|----------|----------|\n`

  const income = data.statementOfComprehensiveIncome
  md += `| Revenue | ${income.revenue.toLocaleString()} | - |\n`
  md += `| Cost of Sales | (${income.costOfSales.toLocaleString()}) | - |\n`

  const grossProfit = income.revenue - income.costOfSales
  md += `| **Gross Profit** | **${grossProfit.toLocaleString()}** | - |\n`
  md += `| Operating Expenses | (${income.operatingExpenses.toLocaleString()}) | - |\n`

  const operatingProfit = grossProfit - income.operatingExpenses
  md += `| **Operating Profit** | **${operatingProfit.toLocaleString()}** | - |\n`

  if (income.financeCosts) {
    md += `| Finance Costs | (${income.financeCosts.toLocaleString()}) | - |\n`
  }

  const profitBeforeTax = income.financeCosts ? operatingProfit - income.financeCosts : operatingProfit
  md += `| **Profit Before Tax** | **${profitBeforeTax.toLocaleString()}** | - |\n`
  md += `| Income Tax Expense | (${income.taxExpense.toLocaleString()}) | - |\n`

  const profitForYear = profitBeforeTax - income.taxExpense
  md += `| **Profit for the Year** | **${profitForYear.toLocaleString()}** | - |\n\n`
  md += `---\n\n`

  // Notes
  if (data.notes && data.notes.length > 0) {
    md += `## Notes to the Financial Statements\n\n`
    data.notes.forEach((note, index) => {
      md += `### ${index + 1}. ${note.title}\n\n`
      md += `${note.content}\n\n`
    })
    md += `---\n\n`
  }

  // Director's Statement
  md += `## Director's Statement\n\n`
  md += `The directors are responsible for preparing the financial statements in accordance with applicable law and regulations. `
  md += `The directors consider that the financial statements give a true and fair view of the state of affairs of the company.\n\n`
  md += `**Signed:**\n\n`
  md += `_________________________\n`
  md += `Director\n`
  md += `Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n`

  return md
}
