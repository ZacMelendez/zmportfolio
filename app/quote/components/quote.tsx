"use client";

import { cn } from "@/app/utils";
import { useBorderEffect } from "@/app/utils/useBorderEffect";
import {
    ArrowRight,
    Calculator,
    Check,
    ChevronDown,
    Code,
    Database,
    Globe,
    Smartphone,
    Wrench,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import "./index.css";
import { Range } from "react-range";
import React from "react";
import { Link } from "next-view-transitions";
import { useAtom, useAtomValue } from "jotai";
import { quoteAtom } from "../atoms/quoteAtom";

interface ServiceOption {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    icon: React.ReactNode;
    tiers: {
        name: string;
        multiplier: number;
        features: string[];
    }[];
}

interface AddOnService {
    id: string;
    name: string;
    description: string;
    price: number;
}

export const services: ServiceOption[] = [
    {
        id: "web-development",
        name: "Web Development",
        description: "Custom websites and web applications",
        basePrice: 1000, // ~13 hours
        icon: <Globe className="w-6 h-6" />,
        tiers: [
            {
                name: "Landing Page",
                multiplier: 1, // $1000, ~13 hours
                features: [
                    "Responsive design",
                    "SEO optimization",
                    "Contact form",
                    "Analytics setup",
                ],
            },
            {
                name: "Business Website",
                multiplier: 2.5, // $2500, ~33 hours
                features: [
                    "Multi-page site",
                    "CMS integration",
                    "SEO optimization",
                    "Analytics",
                    "Contact forms",
                ],
            },
            {
                name: "Web Application",
                multiplier: 6.25, // $6250, ~83 hours
                features: [
                    "Custom functionality",
                    "User authentication",
                    "Database integration",
                    "Admin panel",
                    "API integration",
                ],
            },
        ],
    },
    {
        id: "api-development",
        name: "API Development",
        description: "RESTful APIs and backend services",
        basePrice: 1000, // ~13 hours
        icon: <Database className="w-6 h-6" />,
        tiers: [
            {
                name: "Simple API",
                multiplier: 1, // $1000, ~13 hours
                features: [
                    "Basic CRUD operations",
                    "Authentication",
                    "Documentation",
                    "Basic testing",
                ],
            },
            {
                name: "Complex API",
                multiplier: 2, // $2000, ~27 hours
                features: [
                    "Advanced endpoints",
                    "Third-party integrations",
                    "Comprehensive testing",
                    "Rate limiting",
                ],
            },
            {
                name: "Enterprise API",
                multiplier: 4, // $4000, ~53 hours
                features: [
                    "Microservices architecture",
                    "Advanced security",
                    "Monitoring",
                    "Scalability optimization",
                ],
            },
        ],
    },
    {
        id: "cloud-devops",
        name: "Cloud & DevOps",
        description: "AWS deployment and CI/CD setup",
        basePrice: 900, // ~12 hours
        icon: <Wrench className="w-6 h-6" />,
        tiers: [
            {
                name: "Basic Setup",
                multiplier: 1, // $900, ~12 hours
                features: [
                    "Single environment",
                    "Basic CI/CD",
                    "Monitoring setup",
                    "Documentation",
                ],
            },
            {
                name: "Production Ready",
                multiplier: 1.67, // $1500, ~20 hours
                features: [
                    "Multi-environment",
                    "Advanced CI/CD",
                    "Monitoring & alerts",
                    "Backup strategy",
                ],
            },
            {
                name: "Enterprise",
                multiplier: 3.33, // $3000, ~40 hours
                features: [
                    "Auto-scaling",
                    "Advanced monitoring",
                    "Disaster recovery",
                    "Security compliance",
                ],
            },
        ],
    },
    {
        id: "consulting",
        name: "Consulting & Code Review",
        description: "Technical consulting and code audits",
        basePrice: 75, // $75/hr
        icon: <Code className="w-6 h-6" />,
        tiers: [
            {
                name: "Hourly Rate",
                multiplier: 1,
                features: [
                    "Technical consultation",
                    "Code review",
                    "Architecture advice",
                    "Best practices",
                ],
            },
        ],
    },
];

export const addOnServices: AddOnService[] = [
    // Maintenance and Support
    {
        id: "maintenance",
        name: "6 Months Maintenance",
        description: "Bug fixes and updates",
        price: 800, // ~10.5 hours
    },
    {
        id: "ongoing-maintenance",
        name: "Ongoing Maintenance Plan",
        description:
            "Ongoing support and updates (from $100/mo, details to be discussed).",
        price: 100, // 1.3 hours/mo
    },
    // Training and Consulting
    {
        id: "training",
        name: "Team Training",
        description: "Training session for your team",
        price: 500, // ~6.5 hours
    },
    // SEO and Analytics
    {
        id: "seo-optimization",
        name: "Advanced SEO",
        description: "Comprehensive SEO optimization",
        price: 600, // 8 hours
    },
    {
        id: "seo-package",
        name: "SEO Package",
        description: "Standard SEO optimization package.",
        price: 350, // 4.6 hours
    },
    {
        id: "analytics-setup",
        name: "Analytics Dashboard",
        description: "Custom analytics setup",
        price: 400, // 5.3 hours
    },
    // Web and E-commerce
    {
        id: "blog-setup",
        name: "Blog Setup (w/ CMS)",
        description:
            "Add a blog to your site with content management system integration.",
        price: 300, // 4 hours
    },
    {
        id: "ecommerce-store",
        name: "E-commerce Store (Up to 20 products)",
        description: "Basic online store setup for up to 20 products.",
        price: 800, // 10.5 hours
    },
    {
        id: "additional-products",
        name: "Additional Products (per 50 items)",
        description: "Expand your store with 50 more products (price per 50).",
        price: 200, // 2.6 hours
    },
    {
        id: "custom-cms",
        name: "Custom CMS Integration",
        description:
            "Custom content management system integration (starting at $1000, may vary by requirements).",
        price: 1000, // 13.3 hours
    },
    // Functionality and Systems
    {
        id: "booking-system",
        name: "Booking / Scheduling System",
        description: "Online booking or scheduling functionality.",
        price: 400, // 5.3 hours
    },
    {
        id: "user-auth",
        name: "User Authentication & Accounts",
        description:
            "User login, registration, and account management (starting at $700, may vary by requirements).",
        price: 700, // 9.3 hours
    },
    {
        id: "hosting-domain",
        name: "Hosting & Domain Setup",
        description: "Setup of hosting and domain for your project.",
        price: 100, // 1.3 hours
    },
];

function QuoteCalculator() {
    const [quote, setQuote] = useAtom(quoteAtom);

    const toggleService = (serviceId: string) => {
        setQuote((prev) => {
            const newServices = { ...prev.services };
            if (newServices[serviceId]) {
                delete newServices[serviceId];
            } else {
                newServices[serviceId] = {
                    tier: 0,
                    quantity: 1,
                };
            }
            return {
                ...prev,
                services: newServices,
            };
        });
    };

    const updateServiceTier = (serviceId: string, tier: number) => {
        setQuote((prev) => ({
            ...prev,
            services: {
                ...prev.services,
                [serviceId]: { ...prev.services[serviceId], tier },
            },
        }));
    };

    const updateServiceQuantity = (serviceId: string, quantity: number) => {
        setQuote((prev) => ({
            ...prev,
            services: {
                ...prev.services,
                [serviceId]: {
                    ...prev.services[serviceId],
                    quantity: Math.max(1, quantity),
                },
            },
        }));
    };

    const toggleAddOn = (addOnId: string) => {
        setQuote((prev) =>
            prev.addOns.includes(addOnId)
                ? {
                      ...prev,
                      addOns: prev.addOns.filter((id) => id !== addOnId),
                  }
                : {
                      ...prev,
                      addOns: [...prev.addOns, addOnId],
                  }
        );
    };

    const setComplexity = (complexity: number) => {
        setQuote((prev) => ({
            ...prev,
            complexity,
        }));
    };

    const setTimeline = (timeline: number) => {
        setQuote((prev) => ({
            ...prev,
            timeline,
        }));
    };

    useEffect(() => {
        let total = 0;

        // Calculate service costs
        Object.entries(quote.services).forEach(
            ([serviceId, { tier, quantity }]) => {
                const service = services.find((s) => s.id === serviceId);
                if (service) {
                    const tierMultiplier = service.tiers[tier]?.multiplier || 1;
                    const serviceTotal =
                        service.basePrice *
                        tierMultiplier *
                        quantity *
                        quote.complexity;
                    total += serviceTotal;
                }
            }
        );

        // Timeline adjustments
        if (quote.timeline < 1) {
            total *= 1.5; // Rush job
        } else if (quote.timeline > 1.5) {
            total *= 0.9; // Flexible timeline discount
        }

        // Add-on services
        quote.addOns.forEach((addOnId) => {
            const addOn = addOnServices.find((a) => a.id === addOnId);
            if (addOn) {
                total += addOn.price;
            }
        });

        setQuote((prev) => ({
            ...prev,
            total,
        }));
    }, [quote.services, quote.complexity, quote.timeline, quote.addOns]);

    return (
        <div className="space-y-8">
            {/* Service Selection */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">
                    Select Services
                </h3>
                <div className="grid gap-4">
                    {services.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            selected={!!quote.services[service.id]}
                            selectedTier={quote.services[service.id]?.tier || 0}
                            quantity={quote.services[service.id]?.quantity || 1}
                            onToggle={() => toggleService(service.id)}
                            onTierChange={(tier) =>
                                updateServiceTier(service.id, tier)
                            }
                            onQuantityChange={(quantity) =>
                                updateServiceQuantity(service.id, quantity)
                            }
                        />
                    ))}
                </div>
            </div>

            {/* Complexity & Timeline */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">
                        Project Complexity
                    </h3>
                    <div className="space-y-2">
                        <Range
                            step={0.1}
                            min={0.5}
                            max={2}
                            values={[quote.complexity]}
                            onChange={([val]) => setComplexity(val)}
                            renderTrack={({ props, children }) => (
                                <div
                                    {...props}
                                    className="w-full h-2 rounded bg-gray-700"
                                    style={{ ...props.style }}
                                >
                                    {children}
                                </div>
                            )}
                            renderThumb={({
                                props: { key, style, ...rest },
                                isDragged,
                            }) => (
                                <div
                                    {...rest}
                                    key={key}
                                    className={
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center focus:outline-none transition-colors " +
                                        (isDragged
                                            ? "bg-forest-500 border-forest-400"
                                            : "bg-forest-500/80 border-forest-400/60")
                                    }
                                    style={{ ...style }}
                                >
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                            )}
                        />
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Simple</span>
                            <span>Complex</span>
                        </div>
                        <p className="text-sm text-gray-300">
                            Multiplier: {quote.complexity.toFixed(1)}x
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">
                        Timeline Preference
                    </h3>
                    <div className="space-y-2">
                        <Range
                            step={0.1}
                            min={0.5}
                            max={2}
                            values={[quote.timeline]}
                            onChange={([val]) => setTimeline(val)}
                            renderTrack={({ props, children }) => (
                                <div
                                    {...props}
                                    className="w-full h-2 rounded bg-gray-700"
                                    style={{ ...props.style }}
                                >
                                    {children}
                                </div>
                            )}
                            renderThumb={({
                                props: { key, style, ...rest },
                                isDragged,
                            }) => (
                                <div
                                    {...rest}
                                    key={key}
                                    className={
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center focus:outline-none transition-colors " +
                                        (isDragged
                                            ? "bg-forest-500 border-forest-400"
                                            : "bg-forest-500/80 border-forest-400/60")
                                    }
                                    style={{ ...style }}
                                >
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                            )}
                        />
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>ASAP</span>
                            <span>Flexible</span>
                        </div>
                        <p className="text-sm text-gray-300">
                            {quote.timeline < 1
                                ? "Rush (+50%)"
                                : quote.timeline > 1.5
                                ? "Flexible (-10%)"
                                : "Standard"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Add-on Services */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">
                    Add-on Services
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                    {addOnServices.map((addOn) => (
                        <label
                            key={addOn.id}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                                quote.addOns.includes(addOn.id)
                                    ? "border-forest-500 bg-forest-500/10"
                                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                            )}
                        >
                            <input
                                type="checkbox"
                                checked={quote.addOns.includes(addOn.id)}
                                onChange={() => toggleAddOn(addOn.id)}
                                className="hidden"
                            />
                            <div
                                className={cn(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center",
                                    quote.addOns.includes(addOn.id)
                                        ? "border-forest-500 bg-forest-500"
                                        : "border-gray-500"
                                )}
                            >
                                {quote.addOns.includes(addOn.id) && (
                                    <Check className="w-3 h-3 text-white" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-200">
                                    {addOn.name}
                                </div>
                                <div className="text-sm text-gray-400">
                                    {addOn.description}
                                </div>
                            </div>
                            <div className="font-medium text-forest-400">
                                ${addOn.price.toLocaleString()}
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Total */}
            <div className="bg-forest-500/10 border border-forest-500/20 rounded-lg p-6 bottom-button">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-forest-400" />
                        <span className="text-lg font-medium text-white">
                            Estimated Total
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-forest-400">
                        ${quote.total.toLocaleString()}
                    </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                    This is an estimate. Final pricing may vary based on
                    specific requirements.
                </p>
            </div>
        </div>
    );
}

interface ServiceCardProps {
    service: ServiceOption;
    selected: boolean;
    selectedTier: number;
    quantity: number;
    onToggle: () => void;
    onTierChange: (tier: number) => void;
    onQuantityChange: (quantity: number) => void;
}

function ServiceCard({
    service,
    selected,
    selectedTier,
    quantity,
    onToggle,
    onTierChange,
    onQuantityChange,
}: ServiceCardProps) {
    const sourceRef = useRef<HTMLDivElement>(null);
    const {
        handleBlur,
        handleFocus,
        handleMouseMove,
        opacity,
        position,
        divRef,
    } = useBorderEffect();

    return (
        <div
            ref={sourceRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
                "relative p-4 rounded-lg border transition-all cursor-pointer",
                selected
                    ? "border-forest-500 bg-forest-500/5"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
            )}
            onClick={onToggle}
        >
            <div
                ref={divRef}
                aria-hidden="true"
                style={{
                    opacity,
                    WebkitMaskImage: `radial-gradient(30% 100px at ${position.x}px ${position.y}px, #7f886a 85%, transparent)`,
                    height: (sourceRef.current?.clientHeight || 0) + 2,
                    width: (sourceRef.current?.clientWidth || 0) + 2,
                }}
                className="border-forest-500 pointer-events-none absolute -left-[1px] -top-[1px] h-12 w-full cursor-default rounded-lg border-2 bg-none p-3.5 opacity-0 transition-opacity duration-500"
            />

            <div className="flex items-start gap-4">
                <div
                    className={cn(
                        "p-2 rounded-lg",
                        selected
                            ? "bg-forest-500/20 text-forest-400"
                            : "bg-gray-700 text-gray-400"
                    )}
                >
                    {service.icon}
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-white">{service.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">
                        {service.description}
                    </p>
                    <p className="text-sm text-forest-400 mt-2">
                        Starting at ${service.basePrice.toLocaleString()}
                    </p>
                </div>
                <div
                    className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                        selected
                            ? "border-forest-500 bg-forest-500"
                            : "border-gray-500"
                    )}
                >
                    {selected && <Check className="w-4 h-4 text-white" />}
                </div>
            </div>

            {selected && (
                <div
                    className="mt-4 space-y-4 border-t border-gray-700 pt-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Service Tiers */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                            Service Tier
                        </label>
                        <div className="grid gap-2">
                            {service.tiers.map((tier, index) => (
                                <label
                                    key={index}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <input
                                        type="radio"
                                        name={`tier-${service.id}`}
                                        checked={selectedTier === index}
                                        onChange={() => onTierChange(index)}
                                        className="text-forest-500"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-200">
                                                {tier.name}
                                            </span>
                                            <span className="text-sm text-forest-400">
                                                $
                                                {(
                                                    service.basePrice *
                                                    tier.multiplier
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {tier.features.join(" • ")}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Quantity (only show if not consulting) */}
                    {service.id !== "consulting" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">
                                Quantity
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        onQuantityChange(quantity - 1)
                                    }
                                    className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white"
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="w-12 text-center text-white">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() =>
                                        onQuantityChange(quantity + 1)
                                    }
                                    className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function Quote() {
    const quote = useAtomValue(quoteAtom);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const anchorRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (anchorRef.current) {
                const rect = anchorRef.current.getBoundingClientRect();
                setShowScrollButton(
                    quote.total > 0 && rect.top > window.innerHeight
                );
            } else {
                setShowScrollButton(false);
            }
        };

        handleScroll();

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [quote.total, anchorRef.current]);

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
        });
    };

    return (
        <section className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-6 lg:space-y-8 pb-20 md:pb-10">
            <div className="space-y-4">
                <h2 className="text-3xl font-semibold text-white tracking-tight">
                    Get a Quote
                </h2>
                <p className="text-gray-300 lg:w-3/4">
                    Configure your project requirements below to get an instant
                    estimate. All quotes are customized based on your specific
                    needs and timeline.
                </p>
            </div>

            <QuoteCalculator />

            {quote && quote.total > 0 && (
                <div className="flex justify-center">
                    <Link
                        ref={anchorRef}
                        href="/quote/contact"
                        className="bg-forest-500 hover:bg-forest-600 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        Get Detailed Quote
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}

            <button
                onClick={scrollToBottom}
                aria-label="Scroll to bottom"
                className={cn(
                    "fixed bottom-10 left-10 bg-forest-500 hover:bg-forest-600 text-white p-2 rounded-full aspect-square shadow-lg transition-all duration-300",
                    showScrollButton
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                )}
            >
                <ChevronDown className="w-6 h-6" />
            </button>

            <p className="text-xs text-gray-500 text-center mt-4 lg:hidden">
                © {new Date().getFullYear()} Zach Melendez
            </p>
        </section>
    );
}
