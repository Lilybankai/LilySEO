import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditScoreCardProps {
  title: string;
  score: number;
  description?: string;
  showAsNumber?: boolean;
  compact?: boolean;
}

export function AuditScoreCard({
  title,
  score,
  description,
  showAsNumber = false,
  compact = false,
}: AuditScoreCardProps) {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (showAsNumber) return "text-primary";
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };
  
  // Determine background color for progress ring
  const getScoreRingColor = (score: number) => {
    if (showAsNumber) return "stroke-primary";
    if (score >= 90) return "stroke-green-500";
    if (score >= 70) return "stroke-yellow-500";
    if (score >= 50) return "stroke-orange-500";
    return "stroke-red-500";
  };
  
  // Calculate circumference and offset for SVG circle
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = showAsNumber ? 0 : circumference - (score / 100) * circumference;
  
  if (compact) {
    return (
      <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {showAsNumber ? score : `${score}/100`}
        </span>
        <span className="text-sm text-muted-foreground text-center">{title}</span>
        {description && (
          <span className="text-xs text-muted-foreground text-center mt-1">{description}</span>
        )}
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className="stroke-muted-foreground/20"
              strokeWidth="8"
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
            />
            {/* Progress circle */}
            <circle
              className={getScoreRingColor(score)}
              strokeWidth="8"
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {showAsNumber ? score : score}
            </span>
          </div>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground text-center mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
} 