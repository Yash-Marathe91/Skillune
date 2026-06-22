import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FeedbackPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground mt-2">We value your input. Help us improve Skillune.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>Tell us what you love or what we could do better.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                <option>Bug Report</option>
                <option>Feature Request</option>
                <option>General Feedback</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments</label>
              <textarea className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Your thoughts..."></textarea>
            </div>
            <Button type="button" onClick={() => alert("Feedback submitted! (Mock)")}>Submit Feedback</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
