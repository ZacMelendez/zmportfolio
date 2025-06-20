"use server";

import { Resend } from "resend";
import QuoteEmail from "@/app/emails/Quote";
import { QuoteData } from "../../atoms/quoteAtom";
import { FormType } from "../contact-form";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function sendEmail(content: string) {
    const { quote, formData } = JSON.parse(content) as {
        quote: QuoteData;
        formData: FormType;
    };
    return await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "zacmelendez@gmail.com",
        subject: "New Quote Request",
        react: QuoteEmail({ quote, formData }),
    });
}
