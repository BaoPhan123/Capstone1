import * as React from "react"
import { cn } from "@/lib/utils"

// Chart Container
const ChartContainer = React.forwardRef(({ className, config, children, ...props }, ref) => {
    // Generate CSS variables from config
    const cssVars = React.useMemo(() => {
        if (!config) return {}
        return Object.entries(config).reduce((acc, [key, value]) => {
            if (value.color) {
                acc[`--color-${key}`] = value.color
            }
            return acc
        }, {})
    }, [config])

    return (
        <div
            ref={ref}
            className={cn("flex aspect-video justify-center text-xs", className)}
            style={cssVars}
            {...props}
        >
            {children}
        </div>
    )
})
ChartContainer.displayName = "ChartContainer"

// Chart Tooltip Content
const ChartTooltipContent = React.forwardRef(({
    active,
    payload,
    label,
    className,
    indicator = "dot",
    hideLabel = false,
    hideIndicator = false,
    labelFormatter,
    labelClassName,
    formatter,
    color,
    nameKey,
    labelKey,
    ...props
}, ref) => {
    if (!active || !payload?.length) {
        return null
    }

    const tooltipLabel = hideLabel ? null : (
        <div className={cn("font-medium", labelClassName)}>
            {labelFormatter ? labelFormatter(label, payload) : label}
        </div>
    )

    return (
        <div
            ref={ref}
            className={cn(
                "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-xl",
                className
            )}
            {...props}
        >
            {tooltipLabel}
            <div className="grid gap-1.5">
                {payload.map((item, index) => {
                    const indicatorColor = color || item.payload?.fill || item.color
                    const itemName = nameKey ? item.payload?.[nameKey] : item.name
                    const itemValue = formatter ? formatter(item.value, item.name, item, index, payload) : item.value

                    return (
                        <div
                            key={item.dataKey || index}
                            className="flex w-full flex-wrap items-center gap-2"
                        >
                            {!hideIndicator && (
                                <div
                                    className={cn(
                                        "shrink-0 rounded-[2px]",
                                        indicator === "dot" && "h-2.5 w-2.5 rounded-full",
                                        indicator === "line" && "w-1 h-4",
                                        indicator === "dashed" && "w-0 border-[1.5px] border-dashed h-4"
                                    )}
                                    style={{
                                        backgroundColor: indicator === "dashed" ? undefined : indicatorColor,
                                        borderColor: indicator === "dashed" ? indicatorColor : undefined,
                                    }}
                                />
                            )}
                            <div className="flex flex-1 justify-between items-center gap-2">
                                <span className="text-gray-500">{itemName}</span>
                                <span className="font-mono font-medium tabular-nums">
                                    {itemValue}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

// Chart Legend Content
const ChartLegendContent = React.forwardRef(({
    className,
    payload,
    verticalAlign = "bottom",
    nameKey,
    hideIcon = false,
    ...props
}, ref) => {
    if (!payload?.length) {
        return null
    }

    return (
        <div
            ref={ref}
            className={cn(
                "flex items-center justify-center gap-4 flex-wrap",
                verticalAlign === "top" ? "pb-3" : "pt-3",
                className
            )}
            {...props}
        >
            {payload.map((item, index) => (
                <div
                    key={item.value || index}
                    className="flex items-center gap-1.5"
                >
                    {!hideIcon && (
                        <div
                            className="h-2 w-2 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: item.color }}
                        />
                    )}
                    <span className="text-sm text-gray-600">
                        {nameKey ? item.payload?.[nameKey] : item.value}
                    </span>
                </div>
            ))}
        </div>
    )
})
ChartLegendContent.displayName = "ChartLegendContent"

export {
    ChartContainer,
    ChartTooltipContent,
    ChartLegendContent
}
