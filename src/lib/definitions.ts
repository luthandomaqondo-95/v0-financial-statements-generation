import { z } from "zod";


// Form schema for project info
export const projectInfoSchema = z.object({
    reportingFramework: z.enum(["IFRS-SMALL", "IFRS", "GAAP", "GRAP"], { required_error: "Please select a reporting framework" }),
    category: z.enum(["product", "service", "all"], { required_error: "Please select a category" }),
    natureOfBusiness: z.string().min(3, { message: "Nature of business must be at least 3 characters" }),
    financialYear: z.coerce.date({ required_error: "Please select a financial year end date" }),
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
    "IFRS-SMALL": "ifrs-sme",
    "IFRS": "ifrs-full",
    "GAAP": "sa-gaap",
    "GRAP": "micro"
}
export const reverseFrameworkMapping: Record<string, string> = {
    "ifrs-sme": "IFRS-SMALL",
    "ifrs-full": "IFRS",
    "sa-gaap": "GAAP",
    "micro": "GRAP"
}
