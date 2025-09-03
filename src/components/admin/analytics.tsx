'use client'

import React, { useState, useEffect } from 'react'
import { 
  getUserResearchInterests, 
  getEventEngagementStats, 
  getTopEvents, 
  getUserEngagementSummary,
  UserResearchInterests,
  EventEngagementStats
} from '@/lib/event-tracking'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Users, Eye, MousePointer, TrendingUp, Calendar } from 'lucide-react'

interface UserEngagementSummary {
  user_identifier: string
  user_id: string | null
  email: string | null
  total_interactions: number
  unique_events: number
  total_views: number
  total_clicks: number
  last_activity: string
  first_activity: string
}

interface EventPopularity {
  id: string
  title: string
  ai_interest_areas: string[]
  total_interactions: number
  unique_engagers: number
  total_views: number
  total_clicks: number
  click_through_rate: number
}

// Colors for research area charts
const RESEARCH_AREA_COLORS = [
  '#AE3813', '#D45E3C', '#FF6B6B', '#FF8E53', '#FFD93D', 
  '#6BCF7F', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8E8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

export function AdminAnalytics() {
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('')
  const [userResearchInterests, setUserResearchInterests] = useState<UserResearchInterests[]>([])
  const [userEngagementData, setUserEngagementData] = useState<UserEngagementSummary[]>([])
  const [topEvents, setTopEvents] = useState<EventPopularity[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [eventStats, setEventStats] = useState<EventEngagementStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Load initial data
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [engagementData, eventsData] = await Promise.all([
        getUserEngagementSummary(50),
        getTopEvents(20)
      ])
      
      setUserEngagementData(engagementData)
      setTopEvents(eventsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserSearch = async () => {
    if (!userSearchQuery.trim()) return

    setLoading(true)
    try {
      // Find user from engagement data
      const user = userEngagementData.find(u => 
        u.user_identifier.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
      )

      if (user) {
        setSelectedUserId(user.user_id || '')
        setSelectedUserEmail(user.email || '')

        // Get their research interests
        const interests = await getUserResearchInterests(
          user.user_id || undefined,
          user.email || undefined
        )
        setUserResearchInterests(interests)
      }
    } catch (error) {
      console.error('Error searching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEventSelect = async (eventId: string) => {
    setSelectedEventId(eventId)
    setLoading(true)
    try {
      const stats = await getEventEngagementStats(eventId)
      setEventStats(stats)
    } catch (error) {
      console.error('Error loading event stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search
  const filteredUsers = userEngagementData.filter(user =>
    user.user_identifier.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  )

  // Prepare research interests chart data
  const researchInterestsChartData = userResearchInterests.map((interest, index) => ({
    name: interest.research_area.length > 20 
      ? interest.research_area.substring(0, 20) + '...' 
      : interest.research_area,
    fullName: interest.research_area,
    percentage: interest.percentage,
    count: interest.interaction_count,
    fill: RESEARCH_AREA_COLORS[index % RESEARCH_AREA_COLORS.length]
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Event Analytics Dashboard</h1>
        <Button onClick={loadDashboardData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Profiles</TabsTrigger>
          <TabsTrigger value="events">Event Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userEngagementData.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active users tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userEngagementData.reduce((sum, user) => sum + user.total_views, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Event views tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userEngagementData.reduce((sum, user) => sum + user.total_clicks, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  External clicks tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Events</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{topEvents.length}</div>
                <p className="text-xs text-muted-foreground">
                  Events with engagement
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Most Popular Events</CardTitle>
              <CardDescription>Events ranked by total user interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topEvents.slice(0, 10).map((event, index) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.ai_interest_areas?.join(', ') || 'No research areas'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{event.total_interactions} interactions</div>
                      <div className="text-sm text-muted-foreground">
                        {event.unique_engagers} unique users • {event.click_through_rate}% CTR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Search</CardTitle>
              <CardDescription>Search for users by name or email to view their research interests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Search users by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                />
                <Button onClick={handleUserSearch} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {userSearchQuery && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div 
                      key={user.user_id || user.email} 
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={async () => {
                        setSelectedUserId(user.user_id || '')
                        setSelectedUserEmail(user.email || '')
                        
                        const interests = await getUserResearchInterests(
                          user.user_id || undefined,
                          user.email || undefined
                        )
                        setUserResearchInterests(interests)
                      }}
                    >
                      <div className="font-medium">{user.user_identifier}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.total_interactions} interactions • {user.unique_events} events • 
                        Last active: {new Date(user.last_activity).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {userResearchInterests.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Research Area Interests</CardTitle>
                  <CardDescription>
                    Based on {userResearchInterests.reduce((sum, interest) => sum + interest.interaction_count, 0)} total interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={researchInterestsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: any, props: any) => [
                          `${value}% (${props.payload.count} interactions)`,
                          props.payload.fullName
                        ]}
                        labelFormatter={() => 'Research Area'}
                      />
                      <Bar dataKey="percentage" fill="#AE3813" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interest Distribution</CardTitle>
                  <CardDescription>Proportional view of research interests</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={researchInterestsChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {researchInterestsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Performance</CardTitle>
              <CardDescription>Click on an event to view detailed analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {topEvents.map((event) => (
                  <div 
                    key={event.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedEventId === event.id ? 'border-[#AE3813] bg-[#AE3813]/5' : ''
                    }`}
                    onClick={() => handleEventSelect(event.id)}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {event.ai_interest_areas?.join(', ') || 'No research areas'}
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span>{event.total_views} views</span>
                      <span>{event.total_clicks} clicks</span>
                      <span>{event.click_through_rate}% CTR</span>
                      <span>{event.unique_engagers} users</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {eventStats && (
            <Card>
              <CardHeader>
                <CardTitle>Event Statistics</CardTitle>
                <CardDescription>Detailed analytics for selected event</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{eventStats.total_views}</div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{eventStats.total_clicks}</div>
                    <div className="text-sm text-muted-foreground">Total Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{eventStats.unique_users}</div>
                    <div className="text-sm text-muted-foreground">Unique Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{eventStats.unique_emails}</div>
                    <div className="text-sm text-muted-foreground">Email Subscribers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{eventStats.click_through_rate}%</div>
                    <div className="text-sm text-muted-foreground">Click-through Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
