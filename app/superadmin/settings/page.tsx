"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
    Settings as SettingsIcon,
    Bell,
    Shield,
    Key,
    Mail,
    Smartphone,
    Building,
    Save,
    AlertTriangle
} from "lucide-react"

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [smsNotifications, setSmsNotifications] = useState(false)
    const [maintenanceMode, setMaintenanceMode] = useState(false)

    const handleSaveSettings = async () => {
        setLoading(true)
        try {
            // Add your settings save logic here
            await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated delay
            toast.success("Settings saved successfully")
        } catch (error) {
            toast.error("Failed to save settings")
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="container mx-auto p-6 space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your system preferences and configurations</p>
                </div>
                <Button
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="bg-[#832131] hover:bg-[#832131]/90"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="bg-white border">
                    <TabsTrigger value="general" className="data-[state=active]:bg-[#832131] data-[state=active]:text-white">
                        General
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-[#832131] data-[state=active]:text-white">
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-[#832131] data-[state=active]:text-white">
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="system" className="data-[state=active]:bg-[#832131] data-[state=active]:text-white">
                        System
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Estate Information</CardTitle>
                            <CardDescription>Update your estate&apos;s basic information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Estate Name</Label>
                                    <Input defaultValue="LKJ Gardens" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Email</Label>
                                    <Input defaultValue="info@lkjgardens.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input defaultValue="+234 800 123 4567" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input defaultValue="123 Estate Road" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Configure how you receive notifications</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>Email Notifications</Label>
                                    <p className="text-sm text-gray-500">Receive updates via email</p>
                                </div>
                                <Switch
                                    checked={emailNotifications}
                                    onCheckedChange={setEmailNotifications}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>SMS Notifications</Label>
                                    <p className="text-sm text-gray-500">Receive updates via SMS</p>
                                </div>
                                <Switch
                                    checked={smsNotifications}
                                    onCheckedChange={setSmsNotifications}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Manage your security preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Two-Factor Authentication</Label>
                                <div className="flex items-center space-x-2">
                                    <Switch defaultChecked />
                                    <span className="text-sm text-gray-500">Enable 2FA for added security</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Session Timeout (minutes)</Label>
                                <Input type="number" defaultValue="30" min="5" max="120" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="system" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Configuration</CardTitle>
                            <CardDescription>Manage system-wide settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>Maintenance Mode</Label>
                                    <p className="text-sm text-gray-500">
                                        Enable maintenance mode to restrict access
                                    </p>
                                </div>
                                <Switch
                                    checked={maintenanceMode}
                                    onCheckedChange={setMaintenanceMode}
                                />
                            </div>
                            {maintenanceMode && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    <p className="text-sm text-yellow-700">
                                        Maintenance mode will restrict access to all users except super admins.
                                        Make sure to communicate this to your users.
                                    </p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>System Backup Frequency (days)</Label>
                                <Input type="number" defaultValue="7" min="1" max="30" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    )
} 