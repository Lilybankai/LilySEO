import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LegacySeoReport } from "@/services/seo-analysis";
import { Badge } from "@/components/ui/badge";

interface AuditKeywordsProps {
  report: LegacySeoReport;
}

export function AuditKeywords({ report }: AuditKeywordsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Analysis</CardTitle>
        <CardDescription>
          Keywords found on the page and suggested keywords
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Found Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {report.keywords.found.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Suggested Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {report.keywords.suggested.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 