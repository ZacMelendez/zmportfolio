import React from "react";

interface SelectedService {
    name: string;
    tier: string;
    quantity: number;
    price: number;
}

interface QuoteSummaryProps {
    selectedServices: SelectedService[];
    addOns: { id: string; name: string; price: number }[];
    total: number;
}

export function QuoteSummary({
    selectedServices,
    addOns,
    total,
}: QuoteSummaryProps) {
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-medium text-white">
                    Selected Services
                </h3>
                {selectedServices.map((service, index) => (
                    <div
                        key={index}
                        className="flex justify-between items-center"
                    >
                        <div>
                            <div className="font-medium text-gray-200">
                                {service.name}
                            </div>
                            <div className="text-sm text-gray-400">
                                {service.tier}{" "}
                                {service.quantity > 1 &&
                                    `× ${service.quantity}`}
                            </div>
                        </div>
                        <div className="text-forest-400 font-medium">
                            ${service.price.toLocaleString()}
                        </div>
                    </div>
                ))}

                {addOns.length > 0 && (
                    <>
                        <hr className="border-gray-700" />
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-300">
                                Add-ons
                            </h4>
                            {addOns.map((addOn) => (
                                <div
                                    key={addOn.id}
                                    className="flex justify-between items-center"
                                >
                                    <div className="text-gray-300">
                                        {addOn.name}
                                    </div>
                                    <div className="text-forest-400">
                                        ${addOn.price.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <hr className="border-gray-700" />
                <div className="flex justify-between items-center text-lg">
                    <div className="font-medium text-white">Total Estimate</div>
                    <div className="text-2xl font-bold text-forest-400">
                        ${total.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
