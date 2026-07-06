"use client";

import Link from "next/link";
import { ArrowLeft, Home, Compass, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Decorative background grid and glow effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Main Animated Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full space-y-8 z-10"
      >
        {/* Modern Interactive SVG Illustration */}
        <div className="relative flex justify-center items-center h-48">
          {/* Outer rotating dash ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute w-40 h-40 border-2 border-dashed border-primary/20 rounded-full"
          />

          {/* Inner pulsating ring */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-32 h-32 bg-primary/5 border border-primary/10 rounded-full"
          />

          {/* Compass Icon Wrapper */}
          <motion.div
            animate={{
              y: [0, -8, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            }}
            className="relative flex items-center justify-center w-20 h-20 bg-background border border-border shadow-lg rounded-2xl"
          >
            <Compass className="h-10 w-10 text-primary" />
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </motion.span>
          </motion.div>

          {/* Error code badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute bottom-2 bg-muted text-foreground/80 px-3 py-1 rounded-full text-xs font-semibold font-mono border border-border shadow-xs"
          >
            ERROR 404
          </motion.div>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-heading font-extrabold tracking-tight text-foreground"
          >
            Page introuvable
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed"
          >
            Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée. Veuillez vérifier l&apos;adresse ou retourner au tableau de bord.
          </motion.p>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
        >
          <Button
            render={<Link href="/" />}
            className="w-full sm:w-auto font-heading gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <Home className="h-4 w-4" />
            Retour au tableau de bord
          </Button>

          <Button
            variant="outline"
            className="w-full sm:w-auto font-heading gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Page précédente
          </Button>
        </motion.div>

        {/* Support note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-muted-foreground/80 flex items-center justify-center gap-1.5 pt-4"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Un problème persistant ? Contactez votre administrateur.
        </motion.p>
      </motion.div>
    </div>
  );
}
