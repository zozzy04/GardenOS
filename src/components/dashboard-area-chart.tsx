"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const chartConfig = {
  desktop: {
    label: "Lavori",
    color: "var(--primary)",
  },
  mobile: {
    label: "Ore",
    color: "var(--primary)",
  },
} satisfies ChartConfig

type Point = { date: string; desktop: number; mobile: number }

export function DashboardAreaChart({ data }: { data: Point[] }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    if (!data.length) return []
    const referenceDate = new Date()
    referenceDate.setHours(23, 59, 59, 999)
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    startDate.setHours(0, 0, 0, 0)
    return data.filter((item) => {
      const date = new Date(item.date)
      return date >= startDate && date <= referenceDate
    })
  }, [data, timeRange])

  return (
    <Card className="@container/card w-full min-w-0 max-w-full py-5 shadow-sm">
      <CardHeader className="shrink-0 gap-2 pb-3 md:gap-2 md:pb-4">
        <CardTitle className="font-sans text-base font-semibold md:text-[1.05rem]">
          Attività giornaliere
        </CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Lavori e ore nel periodo selezionato
          </span>
          <span className="@[540px]/card:hidden">Ultimi mesi</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">90 giorni</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 giorni</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 giorni</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Intervallo"
            >
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                90 giorni
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 giorni
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 giorni
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-4 pt-3 sm:px-5 sm:pt-4 md:px-6 md:pt-5">
        {filteredData.length === 0 ? (
          <div className="flex aspect-auto h-[min(15rem,42vh)] min-h-[180px] w-full items-center justify-center px-2 text-[13px] text-muted-foreground">
            Nessun dato nel periodo
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[min(15rem,38vh)] min-h-[200px] w-full sm:h-[15rem] md:h-[240px]"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-desktop)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-desktop)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-mobile)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-mobile)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("it-IT", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("it-IT", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="mobile"
                type="natural"
                fill="url(#fillMobile)"
                stroke="var(--color-mobile)"
                stackId="a"
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill="url(#fillDesktop)"
                stroke="var(--color-desktop)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
