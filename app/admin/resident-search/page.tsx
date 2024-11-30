"use client"

import { useState, useEffect } from "react"
import { Search, User, Home, Phone, Mail, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type UnifiedResident = {
    id: string;
    name: string | null;
    block_number: string | null;
    flat_number: string | null;
    email: string | null;
    phone_number: string | null;
    is_primary_resident: boolean;
    avatar_url?: string | null;
}

export default function ResidentSearch() {
    const [searchQuery, setSearchQuery] = useState("")
    const [allResidents, setAllResidents] = useState<UnifiedResident[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        fetchAllResidents()
    }, [])

    const fetchAllResidents = async () => {
        try {
            setIsLoading(true);
            console.log('Starting fetch...');
            const response = await fetch('/api/residents/all');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Server error: ${errorData.error}`);
            }

            const data = await response.json();
            console.log('Received data:', data);
            setAllResidents(data);
        } catch (error) {
            console.error('Error fetching residents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredResidents = searchQuery.trim() === ""
        ? allResidents
        : allResidents.filter(resident =>
            (resident.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (resident.block_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (resident.flat_number?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        )

    return (
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-center text-[#832131]">Resident Search</h1>
            <div className="flex gap-2 mb-8 max-w-2xl mx-auto">
                <Input
                    type="text"
                    placeholder="Search by Name, Block, or Flat Number"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow"
                />
            </div>

            {isLoading ? (
                <p className="text-center text-gray-500">Loading residents...</p>
            ) : filteredResidents.length === 0 ? (
                <p className="text-center text-gray-500">No residents found.</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResidents.map((resident, index) => (
                        <Card key={`${resident.id}-${index}`} className="overflow-hidden transition-shadow hover:shadow-lg">
                            <CardHeader className="p-0">
                                <div className="bg-gradient-to-r from-[#832131] to-[#932131] p-4">
                                    <div className="relative">
                                        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white">
                                            {resident.avatar_url ? (
                                                <AvatarImage
                                                    src={resident.avatar_url}
                                                    alt={resident.name || 'Resident'}
                                                    className="object-cover w-full h-full rounded-full"
                                                    width={96}
                                                    height={96}
                                                    loading="eager"
                                                    style={{
                                                        imageRendering: 'crisp-edges',
                                                        ['WebkitImageRendering' as any]: 'crisp-edges'
                                                    }}
                                                />
                                            ) : (
                                                <AvatarFallback className="bg-gray-200 text-gray-600 text-xl">
                                                    {resident.name ? resident.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'N/A'}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        {resident.is_primary_resident && (
                                            <span className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="text-center text-white">
                                        {resident.name || 'No Name'}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Home className="h-4 w-4 text-[#832131]" />
                                        <span>
                                            Block {resident.block_number || 'N/A'},
                                            Flat {resident.flat_number || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}