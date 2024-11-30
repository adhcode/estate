"use client"

import React from "react"
import { motion } from "framer-motion"

// Change to default export
export default function Header() {
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center bg-white shadow-md sticky top-0 z-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center space-x-2"
      >
        <h1 className="text-2xl font-bold text-[#832131]">LKJ Estate</h1>
      </motion.div>
    </header>
  )
}