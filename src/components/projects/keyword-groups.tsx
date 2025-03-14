"use client"

import { useState } from "react"
import { X, Plus, Tag, Edit2, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export interface KeywordGroup {
  id: string
  name: string
  keywords: string[]
}

interface KeywordGroupsProps {
  groups: KeywordGroup[]
  onChange: (groups: KeywordGroup[]) => void
  disabled?: boolean
}

export function KeywordGroups({ groups, onChange, disabled = false }: KeywordGroupsProps) {
  const [error, setError] = useState<string | null>(null)
  const [newGroup, setNewGroup] = useState<{
    name: string
    keywords: string
  }>({
    name: "",
    keywords: "",
  })
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>("")

  const addGroup = () => {
    setError(null)
    
    // Validate group name
    if (!newGroup.name.trim()) {
      setError("Group name is required")
      return
    }
    
    // Validate keywords
    if (!newGroup.keywords.trim()) {
      setError("At least one keyword is required")
      return
    }
    
    // Check for duplicate group names
    if (groups.some(g => g.name.toLowerCase() === newGroup.name.toLowerCase().trim())) {
      setError("A group with this name already exists")
      return
    }
    
    // Process keywords
    const keywordsArray = newGroup.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
    
    if (keywordsArray.length === 0) {
      setError("At least one valid keyword is required")
      return
    }
    
    // Add new group
    onChange([
      ...groups,
      {
        id: crypto.randomUUID(),
        name: newGroup.name.trim(),
        keywords: keywordsArray,
      },
    ])
    
    // Reset form
    setNewGroup({
      name: "",
      keywords: "",
    })
  }

  const removeGroup = (id: string) => {
    onChange(groups.filter(g => g.id !== id))
  }

  const startEditing = (group: KeywordGroup) => {
    setEditingGroup(group.id)
    setEditValue(group.keywords.join(', '))
  }

  const saveEditing = (groupId: string) => {
    const keywordsArray = editValue
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
    
    if (keywordsArray.length === 0) {
      setError("At least one valid keyword is required")
      return
    }
    
    onChange(
      groups.map(g => 
        g.id === groupId 
          ? { ...g, keywords: keywordsArray } 
          : g
      )
    )
    
    setEditingGroup(null)
    setEditValue("")
    setError(null)
  }

  const cancelEditing = () => {
    setEditingGroup(null)
    setEditValue("")
    setError(null)
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="border border-border rounded-md bg-card overflow-hidden"
            >
              <div className="p-3 flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">{group.name}</h4>
                  <Badge variant="outline" className="ml-1">
                    {group.keywords.length} {group.keywords.length === 1 ? 'keyword' : 'keywords'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(group)}
                    disabled={disabled || editingGroup !== null}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGroup(group.id)}
                    disabled={disabled}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </div>
              
              <div className="p-3">
                {editingGroup === group.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                      className="resize-none"
                      disabled={disabled}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                        disabled={disabled}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => saveEditing(group.id)}
                        disabled={disabled || !editValue.trim()}
                        className="flex items-center gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {group.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="border border-border rounded-md p-4 space-y-4">
        <h4 className="font-medium">Add New Keyword Group</h4>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Product Keywords"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              disabled={disabled}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="group-keywords">Keywords</Label>
            <Textarea
              id="group-keywords"
              placeholder="keyword1, keyword2, keyword3"
              value={newGroup.keywords}
              onChange={(e) => setNewGroup({ ...newGroup, keywords: e.target.value })}
              disabled={disabled}
              className="resize-none mt-1"
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGroup}
            disabled={disabled || !newGroup.name || !newGroup.keywords}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Group
          </Button>
        </div>
      </div>
      
      {groups.length === 0 && (
        <div className="text-center py-2 text-muted-foreground">
          <p>No keyword groups added yet. Group related keywords together for better organization.</p>
        </div>
      )}
    </div>
  )
} 