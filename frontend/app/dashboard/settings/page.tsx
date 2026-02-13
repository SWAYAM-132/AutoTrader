"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>
            <div className="h-[1px] w-full bg-border my-6" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>
                            Manage your account settings and preferences.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="Test User" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" placeholder="test@example.com" disabled />
                        </div>
                        <Button className="mt-4">Save Changes</Button>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>
                            Configure how you receive alerts and updates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                                <span>Email Notifications</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Receive market alerts via email.
                                </span>
                            </Label>
                            <input type="checkbox" id="email-notifications" defaultChecked className="h-4 w-4" />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                                <span>Push Notifications</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Receive alerts on your device.
                                </span>
                            </Label>
                            <input type="checkbox" id="push-notifications" className="h-4 w-4" />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="ai-advisor" className="flex flex-col space-y-1">
                                <span>AI Insights</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Allow AI advisor to send proactive insights.
                                </span>
                            </Label>
                            <input type="checkbox" id="ai-advisor" defaultChecked className="h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
