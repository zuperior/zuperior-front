"use client";

import Link from "next/link";

export function AuthFooter() {
    return (
        <footer className="lg:hidden w-full bg-black/95 backdrop-blur-sm border-t border-purple-500/20 text-white text-xs mt-4">
            <div className="px-4 py-4 space-y-3">
                {/* Risk Warning */}
                <div>
                    <h3 className="font-semibold text-purple-300 mb-1">Risk Warning:</h3>
                    <p className="text-white/60 text-[10px] leading-relaxed">
                        Trading forex and other leveraged financial products involves a high level of risk and may not be suitable
                        for all individuals. These products can result in both gains and losses, and losses may exceed the amount
                        originally invested. It is important to understand the risks involved before trading. Independent
                        professional advice should be sought if necessary.
                    </p>
                </div>

                {/* Restricted Region */}
                <div>
                    <h3 className="font-semibold text-purple-300 mb-1">Restricted Region:</h3>
                    <p className="text-white/60 text-[10px] leading-relaxed">
                        Zuperior does not offer services to residents or citizens of the United States, North Korea, Cuba, Myanmar,
                        Iraq, Sudan, or any other jurisdiction where such services would violate local laws or regulations. Access to
                        Zuperior's platform is not intended for use by any person in any country where the offering of our services
                        would be in conflict with applicable legal or regulatory requirements.
                    </p>
                </div>

                {/* Disclaimer */}
                <div>
                    <h3 className="font-semibold text-purple-300 mb-1">Disclaimer:</h3>
                    <p className="text-white/60 text-[10px] leading-relaxed">
                        The information provided on this website is for general informational and educational purposes only. It does not constitute financial or investment advice, nor does it represent an offer, recommendation, or solicitation to
                        engage in any trading or investment activities. The use of any voluntary information. All content is not intended to promote or offer Zuperior's financial products or
                        services in jurisdictions where such offerings may be restricted or unlawful. All materials on this website are the intellectual property of Zuperior and may not be copied, reproduced, or distributed without prior written
                        authorisation.
                    </p>
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-3 text-[10px] justify-center border-t border-purple-500/20 pt-3">
                    <Link href="https://zuperior.com/privacy-policies" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 transition">
                        Privacy Policy
                    </Link>
                    <span className="text-white/30">•</span>
                    <Link href="https://zuperior.com/disclosure-notice" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 transition">
                        Risk Warning & Disclosure Notice
                    </Link>
                    <span className="text-white/30">•</span>
                    <Link href="https://zuperior.com/financial-integrity" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 transition">
                        Financial Integrity
                    </Link>
                    <span className="text-white/30">•</span>
                    <Link href="https://zuperior.com/account-delete" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 transition">
                        Account Deletion
                    </Link>
                </div>

                {/* Copyright */}
                <div className="text-center text-white/40 text-[10px] pb-2">
                    © {new Date().getFullYear()} Reserved by Zuperior.com
                </div>
            </div>
        </footer>
    );
}
