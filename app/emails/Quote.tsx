import {
    Html,
    Head,
    Preview,
    Body,
    Container,
    Section,
    Text,
} from "@react-email/components";
import { QuoteData } from "../quote/atoms/quoteAtom";
import { FormType } from "../quote/components/contact-form";

const defaultquote: QuoteData = {
    services: { "Service A": { tier: 1, quantity: 2 } },
    complexity: 3,
    timeline: 4,
    addOns: ["Add-On 1"],
    total: 1000,
};

const defaultFormData: FormType = {
    name: "John Doe",
    email: "john.doe@example.com",
    company: "Example Corp",
    phone: "123-456-7890",
    projectDescription: "A sample project description.",
    timeline: "4 weeks",
};

const QuoteEmail = ({
    quote = defaultquote,
    formData = defaultFormData,
}: {
    quote: QuoteData;
    formData: FormType;
}) => {
    return (
        <Html>
            <Head />
            <Preview>Your Detailed Quote and Project Overview</Preview>
            <Body
                style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.6" }}
            >
                <Container>
                    <Section>
                        <Text
                            style={{
                                fontSize: "24px",
                                fontWeight: "bold",
                                marginBottom: "20px",
                            }}
                        >
                            Quote Summary
                        </Text>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                            }}
                        >
                            <tbody>
                                <tr>
                                    <td
                                        style={{
                                            border: "1px solid #ddd",
                                            padding: "8px",
                                        }}
                                    >
                                        Name
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ddd",
                                            padding: "8px",
                                        }}
                                    >
                                        {formData.name}
                                    </td>
                                </tr>
                                <tr>
                                    <td
                                        style={{
                                            border: "1px solid #ddd",
                                            padding: "8px",
                                        }}
                                    >
                                        Email
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ddd",
                                            padding: "8px",
                                        }}
                                    >
                                        {formData.email}
                                    </td>
                                </tr>
                                {formData.company && (
                                    <tr>
                                        <td
                                            style={{
                                                border: "1px solid #ddd",
                                                padding: "8px",
                                            }}
                                        >
                                            Company
                                        </td>
                                        <td
                                            style={{
                                                border: "1px solid #ddd",
                                                padding: "8px",
                                            }}
                                        >
                                            {formData.company}
                                        </td>
                                    </tr>
                                )}
                                {formData.phone && (
                                    <tr>
                                        <td
                                            style={{
                                                border: "1px solid #ddd",
                                                padding: "8px",
                                            }}
                                        >
                                            Phone
                                        </td>
                                        <td
                                            style={{
                                                border: "1px solid #ddd",
                                                padding: "8px",
                                            }}
                                        >
                                            {formData.phone}
                                        </td>
                                    </tr>
                                )}
                                {formData.projectDescription && (
                                    <tr>
                                        <td
                                            style={{
                                                border: "1px solid #ddd",
                                                padding: "8px",
                                            }}
                                        >
                                            Project Description
                                        </td>
                                        <td
                                            style={{
                                                border: "1px solid #ddd",
                                                padding: "8px",
                                            }}
                                        >
                                            {formData.projectDescription}
                                        </td>
                                    </tr>
                                )}
                                {formData.timeline && (
                                    <tr>
                                        <td
                                            style={{
                                                border: "1px solid #ddd",
                                                padding: "8px",
                                            }}
                                        >
                                            Timeline
                                        </td>
                                        <td
                                            style={{
                                                border: "1px solid #ddd",
                                                padding: "8px",
                                            }}
                                        >
                                            {formData.timeline}
                                        </td>
                                    </tr>
                                )}
                                <tr>
                                    <td
                                        style={{
                                            border: "1px solid #ddd",
                                            padding: "8px",
                                        }}
                                    >
                                        Complexity
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ddd",
                                            padding: "8px",
                                        }}
                                    >
                                        {quote.complexity}
                                    </td>
                                </tr>
                                <tr>
                                    <td
                                        style={{
                                            border: "1px solid #ddd",
                                            padding: "8px",
                                        }}
                                    >
                                        Timeline
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ddd",
                                            padding: "8px",
                                        }}
                                    >
                                        {quote.timeline} weeks
                                    </td>
                                </tr>
                                <tr>
                                    <td
                                        style={{
                                            border: "1px solid #ddd",
                                            padding: "8px",
                                        }}
                                    >
                                        Total
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ddd",
                                            padding: "8px",
                                        }}
                                    >
                                        ${quote.total}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <Text
                            style={{
                                fontSize: "20px",
                                fontWeight: "bold",
                                marginTop: "20px",
                            }}
                        >
                            Services
                        </Text>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                            }}
                        >
                            <tbody>
                                {Object.entries(quote.services).map(
                                    ([service, details]: [
                                        string,
                                        { tier: number; quantity: number }
                                    ]) => (
                                        <tr key={service}>
                                            <td
                                                style={{
                                                    border: "1px solid #ddd",
                                                    padding: "8px",
                                                }}
                                            >
                                                {service}
                                            </td>
                                            <td
                                                style={{
                                                    border: "1px solid #ddd",
                                                    padding: "8px",
                                                }}
                                            >
                                                Tier {details.tier}, Quantity:{" "}
                                                {details.quantity}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                        <Text
                            style={{
                                fontSize: "20px",
                                fontWeight: "bold",
                                marginTop: "20px",
                            }}
                        >
                            Add-Ons
                        </Text>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                            }}
                        >
                            <tbody>
                                {quote.addOns.map(
                                    (addOn: string, index: number) => (
                                        <tr key={index}>
                                            <td
                                                style={{
                                                    border: "1px solid #ddd",
                                                    padding: "8px",
                                                }}
                                            >
                                                {addOn}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default QuoteEmail;
