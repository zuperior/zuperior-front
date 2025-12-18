
"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Import country list helper if available, otherwise just use text input or simple list
// For now, using simple text input for Country to avoid dependency issues if react-select-country-list isn't there

const API_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000").replace(/\/api$/, "");

interface IBApplicationModalProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function IBApplicationModal({ trigger, onSuccess }: IBApplicationModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        country: "",
        referral_code: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("userToken");
            if (!token) {
                toast.error("You must be logged in to apply.");
                return;
            }

            const response = await axios.post(
                `${API_URL}/api/ib-request/create`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                toast.success("IB Application submitted successfully!");
                setOpen(false);
                if (onSuccess) onSuccess();
            } else {
                toast.error(response.data.message || "Failed to submit application.");
            }
        } catch (error: any) {
            console.error("IB Application Error:", error);
            const msg = error.response?.data?.message || "An error occurred. Please try again.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Apply Now</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] bg-[#09090b] border-[#27272a] text-white p-6 rounded-xl shadow-2xl">
                <DialogHeader className="mb-4 space-y-2">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-white">Apply for IB Program</DialogTitle>
                    <DialogDescription className="text-zinc-400 text-sm">
                        Fill in your details to apply for the Introducing Broker program.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="full_name" className="text-sm font-medium text-zinc-200">
                            Full Name
                        </Label>
                        <Input
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="bg-[#18181b] border-[#27272a] text-white placeholder:text-zinc-500 focus:ring-[#a370f0] focus:border-[#a370f0] h-11 transition-all"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-medium text-zinc-200">
                            Email
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="bg-[#18181b] border-[#27272a] text-white placeholder:text-zinc-500 focus:ring-[#a370f0] focus:border-[#a370f0] h-11 transition-all"
                            placeholder="Enter your email address"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password" className="text-sm font-medium text-zinc-200">
                            IB Password
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="bg-[#18181b] border-[#27272a] text-white placeholder:text-zinc-500 focus:ring-[#a370f0] focus:border-[#a370f0] h-11 transition-all"
                            required
                            placeholder="Set a password for IB panel"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="country" className="text-sm font-medium text-zinc-200">
                            Country
                        </Label>
                        <Input
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="bg-[#18181b] border-[#27272a] text-white placeholder:text-zinc-500 focus:ring-[#a370f0] focus:border-[#a370f0] h-11 transition-all"
                            required
                            placeholder="Enter your country"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="referral_code" className="text-sm font-medium text-zinc-200">
                            Referral Code <span className="text-zinc-500 font-normal">(Optional)</span>
                        </Label>
                        <Input
                            id="referral_code"
                            name="referral_code"
                            value={formData.referral_code}
                            onChange={handleChange}
                            className="bg-[#18181b] border-[#27272a] text-white placeholder:text-zinc-500 focus:ring-[#a370f0] focus:border-[#a370f0] h-11 transition-all"
                            placeholder="Enter referral code if any"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#a370f0] hover:bg-[#925bd6] text-white font-semibold h-11 text-[15px] transition-all shadow-[0_0_20px_-5px_#a370f0]"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Application
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
