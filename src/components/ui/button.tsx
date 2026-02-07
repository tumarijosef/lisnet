
import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    variant === 'default' && "bg-tg-button text-tg-button-text hover:bg-tg-button/90",
                    variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    variant === 'outline' && "border border-input bg-tg-bg hover:bg-tg-secondary-bg hover:text-tg-button-text",
                    variant === 'ghost' && "hover:bg-tg-secondary-bg hover:text-tg-text",
                    variant === 'secondary' && "bg-tg-secondary-bg text-tg-text hover:bg-tg-secondary-bg/80",
                    size === 'default' && "h-10 px-4 py-2",
                    size === 'sm' && "h-9 rounded-md px-3",
                    size === 'lg' && "h-11 rounded-md px-8",
                    size === 'icon' && "h-10 w-10",
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
