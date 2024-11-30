export default function Footer() {
    return (
        <footer className="py-4 border-t border-[#E0E0E0]">
            <div className="container flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
                <p>© 2024 UVISE. All rights reserved.</p>
                <div className="flex space-x-4 mt-2 sm:mt-0">
                    <a href="#" className="hover:text-[#832131]">Privacy Policy</a>
                    <a href="#" className="hover:text-[#832131]">Terms of Service</a>
                    <a href="#" className="hover:text-[#832131]">Contact</a>
                </div>
            </div>
        </footer>
    )
}