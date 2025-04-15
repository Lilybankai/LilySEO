"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getUserLeads, updateLead, deleteLead } from "@/services/lead-finder"
import { Edit, Trash2, Phone, Globe, MapPin, FileEdit } from "lucide-react"
import type { Lead } from "@/services/lead-finder"

export default function LeadsList() {
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const leadsData = await getUserLeads()
        setLeads(leadsData)
      } catch (error) {
        console.error("Error fetching leads:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchLeads()
  }, [])
  
  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updated = await updateLead(id, { status })
      if (updated) {
        setLeads(leads.map(lead => lead.id === id ? { ...lead, status } : lead))
        toast({
          title: "Status updated",
          description: "Lead status has been updated successfully."
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "There was an error updating the lead status."
      })
    }
  }
  
  const handleDeleteLead = async (id: string) => {
    try {
      const success = await deleteLead(id)
      if (success) {
        setLeads(leads.filter(lead => lead.id !== id))
        toast({
          title: "Lead deleted",
          description: "Lead has been deleted successfully."
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting lead",
        description: "There was an error deleting the lead."
      })
    }
  }
  
  const handleContactedToggle = async (id: string, contacted: boolean) => {
    try {
      const updated = await updateLead(id, { 
        contacted, 
        contacted_date: contacted ? new Date().toISOString() : null 
      })
      
      if (updated) {
        setLeads(leads.map(lead => lead.id === id ? { 
          ...lead, 
          contacted, 
          contacted_date: contacted ? new Date().toISOString() : null 
        } : lead))
        
        toast({
          title: contacted ? "Marked as contacted" : "Marked as not contacted",
          description: `Lead has been marked as ${contacted ? "contacted" : "not contacted"}.`
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating contact status",
        description: "There was an error updating the contact status."
      })
    }
  }
  
  const handleUpdateLead = async () => {
    if (!editingLead) return
    
    try {
      const { id, business_name, address, phone, website, notes, status } = editingLead
      
      const updated = await updateLead(id, {
        business_name,
        address,
        phone,
        website,
        notes,
        status
      })
      
      if (updated) {
        setLeads(leads.map(lead => lead.id === id ? editingLead : lead))
        setEditingLead(null)
        
        toast({
          title: "Lead updated",
          description: "Lead information has been updated successfully."
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating lead",
        description: "There was an error updating the lead information."
      })
    }
  }
  
  // Filter leads based on search term and status filter
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm ? 
      lead.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.address && lead.address.toLowerCase().includes(searchTerm.toLowerCase())) :
      true
      
    const matchesStatus = statusFilter ? lead.status === statusFilter : true
    
    return matchesSearch && matchesStatus
  })
  
  // Get unique statuses for filter
  const uniqueStatuses = Array.from(new Set(leads.map(lead => lead.status))).filter(Boolean) as string[]
  
  if (isLoading) {
    return <div className="py-10 text-center">Loading leads...</div>
  }
  
  if (leads.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground mb-4">You haven't saved any leads yet</p>
        <Button variant="outline" onClick={() => window.location.href = "/lead-finder"}>
          Search for leads
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 sm:max-w-xs">
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="whitespace-nowrap">Filter by Status:</Label>
          <Select 
            value={statusFilter || ""} 
            onValueChange={(value) => setStatusFilter(value || null)}
          >
            <SelectTrigger id="status-filter" className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredLeads.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Contacted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.business_name}</TableCell>
                  <TableCell>
                    <Select 
                      value={lead.status || "New"} 
                      onValueChange={(value) => handleStatusChange(lead.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Qualified">Qualified</SelectItem>
                        <SelectItem value="Negotiating">Negotiating</SelectItem>
                        <SelectItem value="Won">Won</SelectItem>
                        <SelectItem value="Lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {lead.rating ? (
                      <Badge variant="outline" className="bg-yellow-50">
                        {lead.rating} ★
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant={lead.contacted ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleContactedToggle(lead.id, !lead.contacted)}
                    >
                      {lead.contacted ? "Yes" : "No"}
                    </Button>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setEditingLead(lead)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Lead Details</DialogTitle>
                        </DialogHeader>
                        {editingLead && (
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Business Name</Label>
                              <Input 
                                value={editingLead.business_name} 
                                onChange={(e) => setEditingLead({...editingLead, business_name: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Address</Label>
                              <Input 
                                value={editingLead.address || ""} 
                                onChange={(e) => setEditingLead({...editingLead, address: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input 
                                  value={editingLead.phone || ""} 
                                  onChange={(e) => setEditingLead({...editingLead, phone: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select 
                                  value={editingLead.status || "New"} 
                                  onValueChange={(value) => setEditingLead({...editingLead, status: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="New">New</SelectItem>
                                    <SelectItem value="Contacted">Contacted</SelectItem>
                                    <SelectItem value="Qualified">Qualified</SelectItem>
                                    <SelectItem value="Negotiating">Negotiating</SelectItem>
                                    <SelectItem value="Won">Won</SelectItem>
                                    <SelectItem value="Lost">Lost</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Website</Label>
                              <Input 
                                value={editingLead.website || ""} 
                                onChange={(e) => setEditingLead({...editingLead, website: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Notes</Label>
                              <Textarea 
                                value={editingLead.notes || ""} 
                                onChange={(e) => setEditingLead({...editingLead, notes: e.target.value})}
                                rows={4}
                              />
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingLead(null)}>Cancel</Button>
                          <Button onClick={handleUpdateLead}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteLead(lead.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    {lead.website && (
                      <Button 
                        variant="outline" 
                        size="icon"
                        asChild
                      >
                        <a href={lead.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No leads match your filters</p>
        </div>
      )}
    </div>
  )
} 