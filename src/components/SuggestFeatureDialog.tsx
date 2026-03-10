"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { featureSuggestionService } from "@/services/api.service";

interface SuggestFeatureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SuggestFeatureDialog({ open, onOpenChange }: SuggestFeatureDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            await featureSuggestionService.create({ title, description });
            toast.success("Feature suggestion submitted successfully!");
            setTitle("");
            setDescription("");
            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting feature suggestion:", error);
            toast.error("Failed to submit suggestion. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-2 border-transparent p-6 dark:text-white/75 rounded-[18px] w-full bg-white [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border gap-8">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-center">Suggest a Feature</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 w-full">
                    <p className="text-sm text-muted-foreground text-center -mt-4">
                        We value your feedback! Let us know what features you&apos;d like to see in the future.
                    </p>
                    <div className="space-y-1 flex flex-col items-start">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="Feature title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1 flex flex-col items-start">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the feature..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white">
                            {isSubmitting ? "Submitting..." : "Submit Suggestion"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
