"use client"

import { useState, useEffect, useCallback, useRef, use } from "react"
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Save, FileText, ChevronLeft, Check, Loader } from "lucide-react"
import StepIndicator from "@/components/financials/StepIndicator"
// import { Step1Info } from "@/components/financials/process-steps/step-1-info";
// import { Step2Uploads } from "@/components/financials/process-steps/step-2-uploads";
// import { Step3GLAndTrial } from "@/components/financials/process-steps/step-3-gl-and-trial";
// import { Step4FS } from "@/components/financials/process-steps/step-4-fs";
import { projectInfoSchema } from "@/lib/definitions";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebouce";
// import { PDFExport } from "@/components/pdf-export";
import { FinalAFSSkeleton } from "@/components/financials/final-afs-skeleton";
import { sleep } from "@/lib/utils";

const StepFullAFS = dynamic(
    () =>
        import("@/components/financials/process-steps/step-full-afs-remirror").then(
            async (mod) => sleep(300).then(() => mod.StepFullAFS)
        ),
    {
        ssr: false,
        loading: () => (
            <FinalAFSSkeleton />
        ),
    }
);

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};


const steps = [
  "Project Info", "Documents",
  "Trial Balance", "Financial Statements",
  "Finalize"
];
const totalSteps = steps.length;


type Params = Promise<{ id: string }>
export default function AFS(props: { params: Params }) {
  const myParams = use(props.params);
  const project_id = myParams?.id;

  const router = useRouter()


  const [projectName, setProjectName] = useState("Untitled Project")
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0); // 1 = forward, -1 = backward

  // Use refs to avoid infinite loops in callbacks
  const isSavingRef = useRef(false);
  const currentStepRef = useRef(currentStep);

  // Keep refs in sync with state
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // Debounce the unsaved changes flag to prevent rapid-fire saves
  const debouncedHasUnsavedChanges = useDebounce(hasUnsavedChanges, 1500);

  const projectInfoForm = useForm<z.infer<typeof projectInfoSchema>>({
    resolver: zodResolver(projectInfoSchema),
    defaultValues: {
      reportingFramework: "ifrs",
      category: undefined,
      natureOfBusiness: "",
      financialYear: undefined,
      country: "",
      currency: "ZAR",
      directors: [],
      businessAddress: "",
      postalAddress: "",
      bankers: "",
      preparedBy: "",
      auditor: "",
    },
  });

  const handleStepClick = (step: number) => {
    setDirection(step > currentStep ? 1 : -1)
    setCurrentStep(step)
  }

  const handlePrevClick = () => {
    setDirection(-1)
    setCurrentStep(currentStep - 1)
  }

  const handleNextClick = () => {
    setDirection(1)
    setCurrentStep(currentStep + 1)
  }

  /**
   * Save project info data
   * This is called by auto-save and manual save
   */
  const saveProjectInfo = useCallback(async (showToast: boolean = false): Promise<boolean> => {
    const isValid = await projectInfoForm.trigger();

    if (!isValid) {
      if (showToast) {
        const errors = projectInfoForm.formState.errors;
        const errorMessages = Object.values(errors)
          .map((error: any) => error.message)
          .filter(Boolean)
          .join("\n");

        toast.error("Please fix the errors before saving", {
          description: errorMessages,
          duration: 3000
        });
      }
      return false;
    }

    const formData = projectInfoForm.getValues();

    // TODO: Replace with actual API call when ready
    // Example: await fetch(`/api/afs/${project_id}/project-info`, {
    //     method: 'PUT',
    //     body: JSON.stringify(formData)
    // });

    // For now, save to localStorage as a placeholder
    if (project_id) {
      localStorage.setItem(`afs-project-info-${project_id}`, JSON.stringify(formData));
    }

    if (showToast) {
      toast.success("Project info saved successfully");
    }

    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project_id]);

  /**
   * Perform auto-save based on current step
   */
  const performAutoSave = useCallback(async () => {
    // Use ref to check current saving state without causing re-renders
    if (isSavingRef.current) return;

    setIsSaving(true);
    isSavingRef.current = true;

    try {
      let saveSuccess = false;

      if (currentStepRef.current === 0) {
        saveSuccess = await saveProjectInfo(false);
      } else {
        // Handle other steps' auto-save here when implemented
        saveSuccess = true;
      }

      if (saveSuccess) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast.error("Auto-save failed. Please save manually.");
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [saveProjectInfo]);

  /**
   * Manual save handler - shows toast feedback
   */
  const handleManualSave = useCallback(async () => {
    if (isSavingRef.current) return;

    setIsSaving(true);
    isSavingRef.current = true;

    try {
      let saveSuccess = false;

      if (currentStepRef.current === 0) {
        saveSuccess = await saveProjectInfo(true);
      } else {
        // Handle other steps' manual save here
        saveSuccess = true;
      }

      if (saveSuccess) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [saveProjectInfo]);

  // Auto-save effect - triggers on debounced changes
  useEffect(() => {
    if (debouncedHasUnsavedChanges) {
      performAutoSave();
    }
  }, [debouncedHasUnsavedChanges, performAutoSave]);

  // Load saved project info on mount
  useEffect(() => {
    if (project_id) {
      const savedData = localStorage.getItem(`afs-project-info-${project_id}`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Reset form with saved data
          projectInfoForm.reset(parsedData);
        } catch (error) {
          console.error("Failed to load saved project info:", error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project_id])


  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 shrink-0">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-lg font-medium bg-transparent border-none outline-none focus:outline-none px-2 py-1 rounded hover:bg-muted/50 focus:bg-muted/50"
            placeholder="Untitled Project"
          />
        </div>

        {/* Auto-save indicator */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 cursor-pointer"
            onClick={handleManualSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
          {isSaving ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : hasUnsavedChanges ? (
            <div className="flex items-center gap-2 text-amber-500 text-sm">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Unsaved changes</span>
            </div>
          ) : lastSaved ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check className="h-4 w-4" />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          ) : null}

          {/* <PDFExport content={`fullContent`} /> */}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StepIndicator
            variant="dropdown"
            currentStep={currentStep}
            totalSteps={totalSteps}
            steps={steps}
            onStepClick={handleStepClick}
            onPrevClick={handlePrevClick}
            onNextClick={handleNextClick}
          />
          {/* <FinancialTemplates onSelectTemplate={handleTemplateSelect} /> */}
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="h-full"
          >
            {/* {currentStep === 0 && <Step1Info projectInfoForm={projectInfoForm} setIsSaving={setIsSaving} setHasUnsavedChanges={setHasUnsavedChanges} />}
						{currentStep === 1 && <Step2Uploads project_id={project_id} handleNextStep={handleNextClick} handlePreviousStep={handlePrevClick} />}
						{currentStep === 2 && <Step3GLAndTrial />}
						{currentStep === 3 && <Step4FS />}
						{
						currentStep === 4 
						&&  */}
            <StepFullAFS project_id={project_id} setIsSaving={setIsSaving} setHasUnsavedChanges={setHasUnsavedChanges} />
            {/* } */}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}