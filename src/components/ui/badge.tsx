
import * as React from "react"
import { cn } from "./button"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                variant === "default" &&
                "border-transparent bg-tg-button text-tg-button-text hover:bg-tg-button/80",
                variant === "secondary" &&
                "border-transparent bg-tg-secondary-bg text-tg-text hover:bg-tg-secondary-bg/80",
                variant === "destructive" &&
                "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                variant === "outline" && "text-foreground",
                className
            )}
            {...props}
        />
    )
}

export { Badge }
