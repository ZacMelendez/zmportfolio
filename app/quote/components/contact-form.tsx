import React, { useState } from "react";
import { Link } from "next-view-transitions";
import { quoteAtom } from "../atoms/quoteAtom";
import { useAtomValue } from "jotai";
import { addOnServices, services } from "./quote";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QuoteSummary } from "./quote-summary";

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

export function ContactForm() {
    const quote = useAtomValue(quoteAtom);
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

    const onSubmit = async (formData: any) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                "https://formsubmit.co/ajax/zacmelendez@gmail.com",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ quote, formData }),
                }
            );
            if (!response.ok) {
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

            <div className="grid lg:grid-cols-2 gap-8">
                <QuoteSummary
                    selectedServices={selectedServices}
                    addOns={addOns}
                    total={quote?.total || 0}
                />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                        className={`w-full bg-forest-500 hover:bg-forest-600 text-white py-3 rounded-lg font-medium transition-colors ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={isLoading}
                    >
                        {isLoading ? "Submitting..." : "Submit Quote Request"}
                    </button>

                    {error && (
                        <div className="text-red-500 text-center mt-4 transition-opacity duration-500 ease-in-out opacity-100">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-green-500 text-center mt-4 transition-opacity duration-500 ease-in-out opacity-100">
                            {success}
                        </div>
                    )}
                </form>
            </div>
        </section>
    );
}
