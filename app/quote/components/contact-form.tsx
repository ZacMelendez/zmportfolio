import React, { useEffect, useState } from "react";
import { Link, useTransitionRouter } from "next-view-transitions";
import { quoteAtom } from "../atoms/quoteAtom";
import { useAtomValue } from "jotai";
import { addOnServices, services } from "./quote";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QuoteSummary } from "./quote-summary";
import { sendEmail } from "./actions/sendEmail";
import { cn } from "@/app/utils";
import { CheckCircleIcon } from "lucide-react";

interface SelectedService {
    name: string;
    tier: string;
    quantity: number;
    price: number;
}

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    company: z.string().optional(),
    phone: z.string().optional(),
    projectDescription: z.string().optional(),
    timeline: z.string().optional(),
});

export type FormType = z.infer<typeof schema>;

export function ContactForm() {
    const quote = useAtomValue(quoteAtom);
    const router = useTransitionRouter();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (quote.total < 1) {
            router.push("/quote");
        }
    }, [quote]);

    useEffect(() => {
        if (success) {
            setTimeout(() => {
                router.push("/");
            }, 5000);
        }
    }, [success]);

    const onSubmit = async (formData: FormType) => {
        setIsLoading(true);
        try {
            const response = await sendEmail(
                JSON.stringify({ quote, formData })
            );

            if (response.error) {
                throw new Error("Failed to submit quote");
            }
            setSuccess(
                "Quote request submitted! I'll get back to you within 24 hours."
            );
        } catch (error) {
            setError((error as any).toString() as string);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedServices = Object.entries(quote?.services || {})
        .map(([serviceId, value]) => {
            const { tier, quantity } = value as {
                tier: number;
                quantity: number;
            };
            const service = services.find((s) => s.id === serviceId);
            if (!service) return null;

            return {
                name: service.name,
                tier: service.tiers[tier]?.name || "Standard",
                quantity,
                price:
                    service.basePrice *
                    (service.tiers[tier]?.multiplier || 1) *
                    quantity *
                    (quote?.complexity || 1),
            };
        })
        .filter((s): s is SelectedService => Boolean(s));

    const addOns =
        quote?.addOns
            .map((addOnId: string) => {
                const addOn = addOnServices.find((a) => a.id === addOnId);
                return addOn
                    ? { id: addOnId, name: addOn.name, price: addOn.price }
                    : null;
            })
            .filter((a): a is { id: string; name: string; price: number } =>
                Boolean(a)
            ) || [];

    return (
        <section className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-6 lg:space-y-8 pb-20 md:pb-10">
            <div className="space-y-4">
                <Link
                    href="/quote"
                    className="text-forest-400 hover:text-forest-300 flex items-center gap-2 text-sm"
                >
                    ← Back to Services
                </Link>
                <h2 className="text-3xl font-semibold text-white tracking-tight">
                    Quote Summary
                </h2>
            </div>

            <div
                className={
                    "grid lg:grid-cols-2 gap-8 transition-all duration-300"
                }
            >
                <QuoteSummary
                    selectedServices={selectedServices}
                    addOns={addOns}
                    total={quote?.total || 0}
                />
                <div
                    className={cn(
                        "transition-discrete flex-col gap-4 items-center justify-center transition-all duration-300 hidden tra",
                        success && !error
                            ? "opacity-100 translate-x-0 flex"
                            : "opacity-0 translate-x-12"
                    )}
                >
                    <CheckCircleIcon className="w-10 h-10 text-forest-500" />
                    <h4 className="text-2xl font-semibold text-white">
                        Success!
                    </h4>
                    <p className="text-center text-gray-300 max-w-sm">
                        Thank you for your interest in my services! I'll get
                        back to you soon.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className={cn(
                        "space-y-4 transition-all duration-300",
                        success || error
                            ? "opacity-0 translate-x-12 hidden"
                            : "opacity-100 translate-x-0"
                    )}
                >
                    <h3 className="text-xl font-medium text-white">
                        Contact Information
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Name *
                            </label>
                            <input
                                type="text"
                                {...register("name")}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-forest-500 focus:outline-none"
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                {...register("email")}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-forest-500 focus:outline-none"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Company
                            </label>
                            <input
                                type="text"
                                {...register("company")}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-forest-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Phone
                            </label>
                            <input
                                type="tel"
                                {...register("phone")}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-forest-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Preferred Timeline
                        </label>
                        <input
                            type="text"
                            {...register("timeline")}
                            placeholder="e.g., 2-3 months, ASAP, flexible"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-forest-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Project Description
                        </label>
                        <textarea
                            rows={4}
                            {...register("projectDescription")}
                            placeholder="Tell me more about your project requirements..."
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-forest-500 focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className={`w-full bg-forest-500 hover:bg-forest-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div role="status">
                                <svg
                                    aria-hidden="true"
                                    className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-white"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                        fill="currentFill"
                                    />
                                </svg>
                                <span className="sr-only">Loading...</span>
                            </div>
                        ) : (
                            "Submit Quote Request"
                        )}
                    </button>
                </form>
            </div>
        </section>
    );
}
