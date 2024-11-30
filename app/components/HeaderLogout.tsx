import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";

export function HeaderLogout() {
  const { signOut } = useClerk();
  const router = useRouter();
  const { user } = useUser();

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/sign-in");
  };

  return (
    <div className="flex items-center space-x-4">
      <Button variant="ghost" size="icon" className="text-gray-600 hover:text-[#FFC145] transition-colors">
        <Bell className="h-5 w-5" />
      </Button>
      <Button 
        variant="ghost" 
        onClick={handleLogout}
        className="text-gray-600 hover:text-[#FFC145] transition-colors"
      >
        Logout
      </Button>
      <Avatar className="h-10 w-10 border-2 border-[#FFC145]">
        <AvatarImage src={user?.imageUrl || undefined} alt={user?.firstName || undefined} />
        <AvatarFallback className="bg-[#FFC145] text-white">
          {user?.firstName?.[0]}
        </AvatarFallback>
      </Avatar>
    </div> 
  )
}
