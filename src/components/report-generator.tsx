"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { CalendarIcon, Download, FileText, Lock, CheckCircle2, AlertTriangle } from "lucide-react";

// Define report template types
interface ReportSection {
  id: string;
  title: string;
  description: string;
  isPremium: boolean;
  isIncluded: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  sections: ReportSection[];
}

interface ScheduledReport {
  id: string;
  name: string;
  templateId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRun: Date;
  recipients: string[];
}

interface ReportGeneratorProps {
  projectId: string;
  userTier: 'free' | 'pro' | 'enterprise';
}

export function ReportGenerator({ projectId, userTier }: ReportGeneratorProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [reportName, setReportName] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Mock data - in a real implementation, this would come from an API
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'overview',
      name: 'Competitor Overview',
      description: 'A high-level overview of your competitors with key metrics',
      isPremium: false,
      sections: [
        { id: 'summary', title: 'Executive Summary', description: 'High-level overview of competitor landscape', isPremium: false, isIncluded: true },
        { id: 'rankings', title: 'Keyword Rankings', description: 'Comparison of keyword positions', isPremium: false, isIncluded: true },
        { id: 'traffic', title: 'Traffic Analysis', description: 'Estimated traffic comparison', isPremium: true, isIncluded: false },
      ]
    },
    {
      id: 'detailed',
      name: 'Detailed Competitive Analysis',
      description: 'In-depth analysis of your competitors with comprehensive metrics',
      isPremium: true,
      sections: [
        { id: 'summary', title: 'Executive Summary', description: 'High-level overview of competitor landscape', isPremium: false, isIncluded: true },
        { id: 'keywords', title: 'Keyword Analysis', description: 'Detailed keyword performance and gap analysis', isPremium: true, isIncluded: true },
        { id: 'content', title: 'Content Strategy', description: 'Content quality and topic analysis', isPremium: true, isIncluded: true },
        { id: 'backlinks', title: 'Backlink Analysis', description: 'Backlink profile comparison and opportunities', isPremium: true, isIncluded: true },
        { id: 'recommendations', title: 'Strategic Recommendations', description: 'Actionable insights based on competitive analysis', isPremium: true, isIncluded: true },
      ]
    },
    {
      id: 'executive',
      name: 'Executive Dashboard',
      description: 'A concise report designed for executive audiences with high-level metrics and strategic insights',
      isPremium: true,
      sections: [
        { id: 'summary', title: 'Market Position', description: 'Your position in the competitive landscape', isPremium: true, isIncluded: true },
        { id: 'swot', title: 'SWOT Analysis', description: 'Strengths, weaknesses, opportunities, and threats', isPremium: true, isIncluded: true },
        { id: 'trends', title: 'Market Trends', description: 'Emerging patterns and opportunities', isPremium: true, isIncluded: true },
        { id: 'recommendations', title: 'Strategic Recommendations', description: 'High-impact actions to improve market position', isPremium: true, isIncluded: true },
      ]
    }
  ];
  
  const scheduledReports: ScheduledReport[] = [
    {
      id: 'report1',
      name: 'Weekly Competitor Overview',
      templateId: 'overview',
      frequency: 'weekly',
      nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      recipients: ['team@example.com']
    },
    {
      id: 'report2',
      name: 'Monthly Executive Report',
      templateId: 'executive',
      frequency: 'monthly',
      nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      recipients: ['ceo@example.com', 'marketing@example.com']
    }
  ];
  
  const historicalReports = [
    {
      id: 'hist1',
      name: 'Competitor Overview',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      templateId: 'overview',
      downloadUrl: '#'
    },
    {
      id: 'hist2',
      name: 'Detailed Competitive Analysis',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      templateId: 'detailed',
      downloadUrl: '#'
    }
  ];
  
  const handleGenerateReport = () => {
    if (!selectedTemplateId || !reportName) {
      setErrorMessage('Please select a template and provide a report name');
      return;
    }
    
    setGeneratingReport(true);
    setErrorMessage(null);
    
    // Simulate API call to generate report
    setTimeout(() => {
      setGeneratingReport(false);
      setIsSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setSelectedTemplateId(null);
        setReportName('');
        setSelectedSections([]);
        setFrequency('once');
        setScheduledDate(new Date());
        setRecipients(['']);
      }, 3000);
    }, 2000);
  };
  
  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };
  
  const removeRecipient = (index: number) => {
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
  };
  
  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    const template = reportTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedSections(
        template.sections
          .filter(section => section.isIncluded && (!section.isPremium || userTier !== 'free'))
          .map(section => section.id)
      );
      setReportName(`${template.name} - ${format(new Date(), 'MMM dd, yyyy')}`);
    }
  };
  
  const toggleSection = (sectionId: string) => {
    if (selectedSections.includes(sectionId)) {
      setSelectedSections(selectedSections.filter(id => id !== sectionId));
    } else {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };
  
  const getTemplateById = (id: string) => {
    return reportTemplates.find(template => template.id === id);
  };
  
  const isPremiumUser = userTier === 'pro' || userTier === 'enterprise';
  const canScheduleReports = userTier === 'enterprise';
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportTemplates.map(template => (
              <Card 
                key={template.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''} ${template.isPremium && !isPremiumUser ? 'opacity-60' : ''}`}
                onClick={() => isPremiumUser || !template.isPremium ? handleTemplateSelect(template.id) : null}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isPremium && (
                      <Badge variant={isPremiumUser ? "secondary" : "outline"} className="ml-2">
                        {isPremiumUser ? 'Premium' : <><Lock className="h-3 w-3 mr-1" /> Premium</>}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="font-medium mb-2">Includes:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {template.sections.slice(0, 3).map(section => (
                      <li key={section.id} className={section.isPremium && !isPremiumUser ? "text-muted-foreground" : ""}>
                        {section.title}
                        {section.isPremium && !isPremiumUser && <Lock className="h-3 w-3 inline ml-1" />}
                      </li>
                    ))}
                    {template.sections.length > 3 && <li>+ {template.sections.length - 3} more sections</li>}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={selectedTemplateId === template.id ? "default" : "outline"} 
                    className="w-full"
                    disabled={template.isPremium && !isPremiumUser}
                  >
                    {selectedTemplateId === template.id ? 'Selected' : 'Select Template'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {selectedTemplateId && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Configure Report</CardTitle>
                <CardDescription>Customize your report settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-name">Report Name</Label>
                      <Input 
                        id="report-name" 
                        value={reportName} 
                        onChange={(e) => setReportName(e.target.value)} 
                        placeholder="Enter report name"
                      />
                    </div>
                    
                    {canScheduleReports && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Report Scheduling</Label>
                          <RadioGroup value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="once" id="once" />
                              <Label htmlFor="once">Generate once</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="daily" id="daily" />
                              <Label htmlFor="daily">Daily</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="weekly" id="weekly" />
                              <Label htmlFor="weekly">Weekly</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="monthly" id="monthly" />
                              <Label htmlFor="monthly">Monthly</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        {frequency !== 'once' && (
                          <div className="space-y-2">
                            <Label>Recipients</Label>
                            {recipients.map((recipient, index) => (
                              <div key={index} className="flex space-x-2">
                                <Input
                                  value={recipient}
                                  onChange={(e) => updateRecipient(index, e.target.value)}
                                  placeholder="Email address"
                                  className="flex-1"
                                />
                                {recipients.length > 1 && (
                                  <Button 
                                    variant="outline" 
                                    onClick={() => removeRecipient(index)}
                                    type="button"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button 
                              variant="outline" 
                              onClick={addRecipient}
                              type="button"
                              className="mt-2"
                            >
                              Add Recipient
                            </Button>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {scheduledDate ? format(scheduledDate, 'PPP') : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={scheduledDate}
                                onSelect={setScheduledDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Report Sections</Label>
                      <div className="border rounded-md p-4 space-y-3">
                        {getTemplateById(selectedTemplateId)?.sections.map(section => (
                          <div key={section.id} className="flex items-start space-x-2">
                            <Checkbox 
                              id={`section-${section.id}`} 
                              checked={selectedSections.includes(section.id)}
                              onCheckedChange={() => toggleSection(section.id)}
                              disabled={section.isPremium && !isPremiumUser}
                            />
                            <div className="space-y-1">
                              <Label 
                                htmlFor={`section-${section.id}`}
                                className={`font-medium ${section.isPremium && !isPremiumUser ? 'text-muted-foreground flex items-center' : ''}`}
                              >
                                {section.title}
                                {section.isPremium && !isPremiumUser && <Lock className="h-3 w-3 ml-1" />}
                              </Label>
                              <p className="text-sm text-muted-foreground">{section.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                
                {isSubmitted && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                      {frequency === 'once' 
                        ? 'Your report has been generated and is now available in the Report History tab.' 
                        : 'Your report has been scheduled and will be delivered according to your settings.'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => {
                    setSelectedTemplateId(null);
                    setReportName('');
                    setSelectedSections([]);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateReport}
                  disabled={generatingReport || !reportName || selectedSections.length === 0}
                >
                  {generatingReport ? 'Generating...' : (frequency === 'once' ? 'Generate Report' : 'Schedule Report')}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="scheduled" className="space-y-6">
          {userTier !== 'enterprise' ? (
            <Card>
              <CardHeader>
                <CardTitle>Enterprise Feature</CardTitle>
                <CardDescription>Report scheduling is available for Enterprise tier users only</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Unlock Report Scheduling</h3>
                  <p className="text-muted-foreground mb-4">
                    Upgrade to our Enterprise plan to automate your competitive intelligence reporting.
                  </p>
                  <Button>Upgrade Now</Button>
                </div>
              </CardContent>
            </Card>
          ) : scheduledReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No scheduled reports</h3>
              <p className="text-muted-foreground mb-4">
                You haven't scheduled any reports yet. Create a new report from the templates tab.
              </p>
              <Button onClick={() => setActiveTab('templates')}>Create Schedule</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledReports.map(report => (
                <Card key={report.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>{report.name}</CardTitle>
                      <Badge>{report.frequency}</Badge>
                    </div>
                    <CardDescription>
                      Template: {getTemplateById(report.templateId)?.name || 'Unknown'} • 
                      Next run: {format(report.nextRun, 'MMM dd, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Recipients:</div>
                      <div className="flex flex-wrap gap-2">
                        {report.recipients.map((email, i) => (
                          <Badge key={i} variant="outline">{email}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          {historicalReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No report history</h3>
              <p className="text-muted-foreground mb-4">
                You haven't generated any reports yet. Create a new report from the templates tab.
              </p>
              <Button onClick={() => setActiveTab('templates')}>Create Report</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {historicalReports.map(report => (
                <Card key={report.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>{report.name}</CardTitle>
                    <CardDescription>
                      Generated on {format(report.date, 'MMM dd, yyyy')} • 
                      Template: {getTemplateById(report.templateId)?.name || 'Unknown'}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-end">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 