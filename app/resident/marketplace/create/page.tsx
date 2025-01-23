"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ImagePlus, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from "sonner"

const categories = [
    {
        id: "food", name: "Food & Beverages", subcategories: [
            "Home Cooked Meals",
            "Baked Goods",
            "Snacks",
            "Drinks",
            "Catering"
        ]
    },
    {
        id: "furniture", name: "Furniture", subcategories: [
            "Tables",
            "Chairs",
            "Storage",
            "Beds",
            "Others"
        ]
    },
    {
        id: "electronics", name: "Electronics", subcategories: [
            "Phones",
            "Computers",
            "Appliances",
            "Gadgets",
            "Others"
        ]
    },
    {
        id: "daily", name: "Daily Essentials", subcategories: [
            "Groceries",
            "Household Items",
            "Personal Care",
            "Others"
        ]
    },
    {
        id: "services", name: "Services", subcategories: [
            "Cleaning",
            "Repairs",
            "Tutoring",
            "Beauty",
            "Others"
        ]
    }
]

const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.string(),
    subcategory: z.string(),
    price: z.string().refine((val) => !isNaN(Number(val)), "Must be a valid number"),
    condition: z.string().optional(),
    availability: z.string(),
    delivery: z.string(),
    images: z.array(z.string()).optional(),
})

export default function CreateListingPage() {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [selectedCategory, setSelectedCategory] = useState("")
    const [uploading, setUploading] = useState(false)
    const [images, setImages] = useState<string[]>([])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            category: "",
            subcategory: "",
            price: "",
            condition: "New",
            availability: "In Stock",
            delivery: "Pickup",
            images: [],
        },
    })

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            const files = e.target.files
            if (!files || files.length === 0) return

            const newImages: string[] = []
            for (const file of files) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `marketplace/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('listings')
                    .upload(filePath, file)

                if (uploadError) {
                    throw uploadError
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('listings')
                    .getPublicUrl(filePath)

                newImages.push(publicUrl)
            }

            setImages([...images, ...newImages])
            form.setValue('images', [...images, ...newImages])
            toast.success('Images uploaded successfully')
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Failed to upload images')
        } finally {
            setUploading(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // Get authenticated user
            const { data: authData, error: userError } = await supabase.auth.getUser()
            if (userError || !authData.user) {
                toast.error('Please login to create a listing')
                return
            }

            const user = authData.user

            // Check if user exists in users table
            const { data: userData, error: userDataError } = await supabase
                .from('users')
                .select('id, profile_completed')
                .eq('id', user.id)
                .single()

            if (userDataError || !userData) {
                toast.error('Please complete your profile before creating a listing')
                router.push('/resident/profile') // Redirect to profile page
                return
            }

            if (!userData.profile_completed) {
                toast.error('Please complete your profile before creating a listing')
                router.push('/resident/profile')
                return
            }

            // Create the listing
            const { error: listingError } = await supabase
                .from('marketplace_listings')
                .insert({
                    title: values.title,
                    description: values.description,
                    price: parseFloat(values.price),
                    category: values.category,
                    subcategory: values.subcategory,
                    availability: values.availability,
                    delivery: values.delivery,
                    images: values.images,
                    user_id: user.id,
                    condition: values.condition
                })

            if (listingError) throw listingError

            toast.success('Listing created successfully')
            router.push('/resident/marketplace')
        } catch (error) {
            console.error('Error creating listing:', error)
            toast.error('Failed to create listing')
        }
    }

    return (
        <div className="min-h-screen bg-white p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Create New Listing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter listing title" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value)
                                                    setSelectedCategory(value)
                                                }}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem
                                                            key={category.id}
                                                            value={category.id}
                                                        >
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {selectedCategory && (
                                    <FormField
                                        control={form.control}
                                        name="subcategory"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Subcategory</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a subcategory" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories
                                                            .find(cat => cat.id === selectedCategory)
                                                            ?.subcategories.map((sub) => (
                                                                <SelectItem
                                                                    key={sub}
                                                                    value={sub}
                                                                >
                                                                    {sub}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe your item or service"
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price (₦)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter price"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="availability"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Availability</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select availability" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="In Stock">In Stock</SelectItem>
                                                    <SelectItem value="Made to Order">Made to Order</SelectItem>
                                                    <SelectItem value="Pre-Order">Pre-Order</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="delivery"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Delivery Option</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select delivery option" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Pickup">Pickup</SelectItem>
                                                    <SelectItem value="Delivery">Delivery</SelectItem>
                                                    <SelectItem value="Both">Both</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div>
                                    <FormLabel>Images</FormLabel>
                                    <div className="mt-2">
                                        <div className="flex items-center gap-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById('image-upload')?.click()}
                                                disabled={uploading}
                                            >
                                                <ImagePlus className="h-4 w-4 mr-2" />
                                                {uploading ? 'Uploading...' : 'Add Images'}
                                            </Button>
                                            <input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleImageUpload}
                                            />
                                        </div>
                                        {images.length > 0 && (
                                            <div className="grid grid-cols-3 gap-4 mt-4">
                                                {images.map((url, index) => (
                                                    <img
                                                        key={index}
                                                        src={url}
                                                        alt={`Listing image ${index + 1}`}
                                                        className="w-full h-32 object-cover rounded-lg"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-[#8B0000] hover:bg-[#8B0000]/90"
                                    disabled={uploading}
                                >
                                    Create Listing
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
} 