"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Bell, Calendar, Filter } from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Update the interface to match Supabase schema
interface Update {
  id: string
  title: string
  description: string
  created_at: string
  category: string
  priority: "high" | "medium" | "low"
  image_url?: string
}

export default function UpdatesPage() {
  const [filter, setFilter] = useState("all")
  const [updates, setUpdates] = useState<Update[]>([])
  const [allUpdates, setAllUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const { data, error } = await supabase
          .from('updates')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setUpdates(data || [])
        setAllUpdates(data || [])
      } catch (error: any) {
        console.error('Error fetching updates:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUpdates()
  }, [supabase])

  const filterUpdates = (category: string) => {
    setFilter(category)
    if (category === "all") {
      setUpdates(allUpdates)
    } else {
      setUpdates(allUpdates.filter(update => update.category.toLowerCase() === category.toLowerCase()))
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-[#FCE8EB] py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/resident/dashboard">
            <Button variant="ghost" className="text-[#832131]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Select value={filter} onValueChange={filterUpdates}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Updates</SelectItem>
              <SelectItem value="facility">Facility</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="rules">Rules</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8 bg-white">
            <CardHeader className="bg-[#832131] text-white">
              <CardTitle className="text-2xl font-semibold flex items-center">
                <Bell className="mr-3 h-6 w-6" />
                Community Updates
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {updates.map((update) => (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {update.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            {new Date(update.created_at).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(update.priority)}`}>
                            {update.priority.charAt(0).toUpperCase() + update.priority.slice(1)} Priority
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-[#FCE8EB] text-[#832131] rounded-full text-sm">
                        {update.category}
                      </span>
                    </div>
                    {update.image_url && (
                      <div className="mb-4">
                        <img
                          src={update.image_url}
                          alt={update.title}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <p className="text-gray-600">{update.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
} 