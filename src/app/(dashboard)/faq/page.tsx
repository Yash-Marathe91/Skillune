import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FAQPage() {
  const faqs = [
    { question: "How does the ATS Resume Analyzer work?", answer: "It uses AI to compare your resume against a job description, identifying missing keywords and formatting issues." },
    { question: "Are my documents secure?", answer: "Yes, all your documents and data are securely stored in our encrypted database." },
    { question: "Can I use the platform for free?", answer: "Absolutely! Skillune is an open-source project designed to be accessible without expensive subscriptions." }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mt-2">Find answers to common questions about Skillune.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{faq.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
