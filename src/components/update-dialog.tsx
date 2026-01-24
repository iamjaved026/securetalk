
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "./ui/badge";
import { CheckCircle, Bug, PartyPopper } from "lucide-react";

type UpdateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
  title: string;
  features?: string[];
  bugFixes?: string[];
};

export function UpdateDialog({ open, onOpenChange, version, title, features, bugFixes }: UpdateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className="text-center items-center">
            <div className="p-3 bg-primary/10 rounded-full mb-2">
                <PartyPopper className="h-8 w-8 text-primary" />
            </div>
          <AlertDialogTitle className="text-2xl font-headline">
            {title || "What's New"}
          </AlertDialogTitle>
           {version && <Badge variant="outline">Version {version}</Badge>}
          <AlertDialogDescription>
            Here are the latest improvements and fixes we've made to Secure Talk.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-60 overflow-y-auto pr-4 space-y-4 text-sm">
            {features && features.length > 0 && (
                <div>
                    <h3 className="font-bold flex items-center gap-2 mb-2"><CheckCircle className="h-5 w-5 text-green-500"/> New Features</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {features.map((item, index) => <li key={`feat-${index}`}>{item}</li>)}
                    </ul>
                </div>
            )}
            {bugFixes && bugFixes.length > 0 && (
                <div>
                    <h3 className="font-bold flex items-center gap-2 mb-2"><Bug className="h-5 w-5 text-red-500"/> Bug Fixes</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {bugFixes.map((item, index) => <li key={`fix-${index}`}>{item}</li>)}
                    </ul>
                </div>
            )}
        </div>

        <AlertDialogFooter>
          <AlertDialogAction className="w-full">Got it!</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
