"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Trash2, 
  FileDown, 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PdfGenerationJob } from '@/services/pdf-job';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface PdfJobsDashboardProps {
  // Optional props if needed
}

export default function PdfJobsDashboard() {
  const [jobs, setJobs] = useState<PdfGenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setIsRefreshing(true);
      const supabase = createClient();
      
      // Build query
      let query = supabase
        .from('pdf_generation_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply status filter if selected
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Apply search filter client-side if needed
      let filteredData = data || [];
      if (searchQuery.trim()) {
        filteredData = filteredData.filter(job => 
          job.audit_id.includes(searchQuery) || 
          job.user_id.includes(searchQuery)
        );
      }
      
      setJobs(filteredData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching PDF jobs:', err);
      setError(err.message || 'An error occurred while fetching jobs');
      toast({
        title: 'Error fetching jobs',
        description: err.message || 'Failed to load PDF generation jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load jobs on mount
  useEffect(() => {
    fetchJobs();
  }, [statusFilter]); // Refetch when status filter changes

  // Delete a job
  const deleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/pdf/job/${jobId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete job');
      }
      
      toast({
        title: 'Job deleted',
        description: 'PDF generation job has been deleted successfully',
      });
      
      // Refresh the job list
      fetchJobs();
    } catch (err: any) {
      console.error('Error deleting job:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete job',
        variant: 'destructive',
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing
        </Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
        </Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" /> Failed
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>PDF Generation Jobs</span>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchJobs}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Monitor and manage PDF generation jobs in the system
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button 
              variant={statusFilter === null ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              All
            </Button>
            <Button 
              variant={statusFilter === 'pending' ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter('pending')}
              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900"
            >
              Pending
            </Button>
            <Button 
              variant={statusFilter === 'processing' ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter('processing')}
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900"
            >
              Processing
            </Button>
            <Button 
              variant={statusFilter === 'completed' ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter('completed')}
              className="bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900"
            >
              Completed
            </Button>
            <Button 
              variant={statusFilter === 'failed' ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter('failed')}
              className="bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900"
            >
              Failed
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by job ID or user ID..."
              className="pl-8 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchJobs();
              }}
            />
          </div>
        </div>
        
        {/* Jobs table */}
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No PDF generation jobs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>A list of recent PDF generation jobs</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Audit ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">{job.id.substring(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-xs">{job.audit_id.substring(0, 8)}...</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>
                      <div className="w-full max-w-xs">
                        <Progress value={job.progress} className="h-2" />
                        <span className="text-xs text-muted-foreground">{job.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(job.created_at)}</TableCell>
                    <TableCell className="text-xs">{formatDate(job.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {job.status === 'completed' && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Download PDF">
                            <FileDown className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this job?')) {
                              deleteJob(job.id);
                            }
                          }}
                          title="Delete job"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {jobs.length} jobs
        </div>
        <div className="text-sm">
          Jobs are automatically cleaned up after 24 hours
        </div>
      </CardFooter>
    </Card>
  );
} 