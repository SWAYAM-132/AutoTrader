"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useState } from "react"
import { Loader2, UserPlus, Mail, Lock } from "lucide-react"
import { motion } from "framer-motion"

const formSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function SignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)
        try {
            await api.post('/auth/signup', values)
            router.push('/login')
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.detail || "Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-[400px] glass-card border-white/10 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-gradient" />
                    <CardHeader className="text-center pt-8">
                        <motion.div
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-4"
                        >
                            <UserPlus className="h-8 w-8 text-primary" />
                        </motion.div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Create Account
                        </CardTitle>
                        <CardDescription className="text-muted-foreground mt-2">
                            Join AutoTraderX to maximize your returns
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold uppercase tracking-wider opacity-70">Full Name</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input className="bg-background/20 border-white/10 rounded-xl pl-10 h-11 focus:ring-primary/50 transition-all" placeholder="John Doe" {...field} />
                                                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold uppercase tracking-wider opacity-70">Email</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input className="bg-background/20 border-white/10 rounded-xl pl-10 h-11 focus:ring-primary/50 transition-all" placeholder="name@example.com" {...field} />
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold uppercase tracking-wider opacity-70">Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="password" className="bg-background/20 border-white/10 rounded-xl pl-10 h-11 focus:ring-primary/50 transition-all" {...field} />
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                                <Button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/20 font-bold" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
                                </Button>
                            </form>
                        </Form>
                        <div className="mt-8 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary font-semibold hover:underline decoration-2 underline-offset-4">
                                Login here
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
