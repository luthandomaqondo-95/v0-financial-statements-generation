import { z } from "zod";


// Form schema for project info
export const projectInfoSchema = z.object({
    projectName: z.string().min(1, { message: "Project name is required" }),
    reportingFramework: z.enum(["ifrs-small", "ifrs", "sa-gaap", "micro"], { required_error: "Please select a reporting framework" }),
    category: z.enum(["product", "service", "all"], { required_error: "Please select a category" }),
    natureOfBusiness: z.string().min(3, { message: "Nature of business must be at least 3 characters" }),
    financialYear: z.coerce.date({ required_error: "Please select a financial year end date" }),
    comparativePeriod: z.enum(["none", "1-year", "2-year", "3-year", "4-year"], { required_error: "Please select a comparative period" }),
    country: z.string().min(1, { message: "Country is required" }),
    currency: z.string().min(1, { message: "Currency is required" }),
    directors: z.array(z.string()).min(1, { message: "Director is required" }),
    businessAddress: z.string().optional(),
    postalAddress: z.string().optional(),
    bankers: z.string().optional(),
    preparedBy: z.string().optional(),
    auditor: z.string().min(1, { message: "Auditor is required" }),
});

// Map reporting framework from form to UI format
export const frameworkMapping: Record<string, string> = {
    "ifrs-small": "ifrs-small",
    "ifrs": "ifrs",
    "sa-gaap": "sa-gaap",
    "micro": "micro"
}
export const reverseFrameworkMapping: Record<string, string> = {
    "ifrs-small": "ifrs-small",
    "ifrs": "ifrs",
    "sa-gaap": "sa-gaap",
    "micro": "micro"
}
