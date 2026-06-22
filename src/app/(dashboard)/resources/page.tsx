import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function ResourcesPage() {
  const resources = [
    { title: "Interview Preparation Guide", description: "A comprehensive guide on how to ace your technical and behavioral interviews.", link: "#" },
    { title: "Resume Formatting Tips", description: "Learn how to format your resume to pass ATS systems effectively.", link: "#" },
    { title: "Top Open Source Projects to Contribute", description: "Enhance your portfolio by contributing to these beginner-friendly projects.", link: "#" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground mt-2">Curated materials to boost your career growth.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((resource, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{resource.title}</CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={resource.link} className="text-sm font-medium text-primary hover:underline">
                Read more →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
