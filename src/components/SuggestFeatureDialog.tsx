"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
            <DialogContent className="sm:max-w-[425px] dark:bg-[#01040D] dark:border-[#9F8BCF]/25">
                <DialogHeader>
                    <DialogTitle>Suggest a Feature</DialogTitle>
                    <DialogDescription>
                        We value your feedback! Let us know what features you'd like to see in the future.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="Feature title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="dark:bg-white/5 dark:border-white/10"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the feature..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px] dark:bg-white/5 dark:border-white/10"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white">
                            {isSubmitting ? "Submitting..." : "Submit Suggestion"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
