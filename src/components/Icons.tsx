/* eslint-disable react/only-export-components -- this module intentionally exports a complete icon component library */
import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }
type Path = readonly [tag: 'path' | 'line' | 'polyline' | 'polygon' | 'rect' | 'circle', props: Record<string, string | number>]

const icon = (paths: readonly Path[]) => function Icon({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths.map(([Tag, attributes], index) => <Tag key={index} {...attributes} />)}</svg>
}

export const IconHome = icon([['path',{d:'M3 11.5 12 4l9 7.5'}],['path',{d:'M5 10v10h14V10'}],['path',{d:'M9 20v-6h6v6'}]])
export const IconGrid = icon([['rect',{x:3,y:3,width:7,height:7,rx:2}],['rect',{x:14,y:3,width:7,height:7,rx:2}],['rect',{x:3,y:14,width:7,height:7,rx:2}],['rect',{x:14,y:14,width:7,height:7,rx:2}]])
export const IconSchedule = IconGrid
export const IconTasks = icon([['rect',{x:4,y:3,width:16,height:18,rx:3}],['path',{d:'m8 10 2 2 4-4'}],['line',{x1:8,y1:16,x2:16,y2:16}]])
export const IconBook = icon([['path',{d:'M3 5.5A3.5 3.5 0 0 1 6.5 2H11v18H6.5A3.5 3.5 0 0 0 3 23z'}],['path',{d:'M21 5.5A3.5 3.5 0 0 0 17.5 2H13v18h4.5A3.5 3.5 0 0 1 21 23z'}]])
export const IconMaterials = IconBook
export const IconCompass = icon([['circle',{cx:12,cy:12,r:9}],['polygon',{points:'15 9 13 13 9 15 11 11'}]])
export const IconReferences = IconCompass
export const IconCalendar = icon([['rect',{x:3,y:5,width:18,height:16,rx:3}],['line',{x1:8,y1:3,x2:8,y2:7}],['line',{x1:16,y1:3,x2:16,y2:7}],['line',{x1:3,y1:10,x2:21,y2:10}],['path',{d:'m9 15 2 2 4-4'}]])
export const IconSettings = icon([['circle',{cx:12,cy:12,r:3}],['path',{d:'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1H9.5V21a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4 15a1.7 1.7 0 0 0-1.6-1H2.3V10h.1A1.7 1.7 0 0 0 4 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.46 4.2l.06.06A1.7 1.7 0 0 0 8.4 4 1.7 1.7 0 0 0 9.5 2.4v-.1h4.1v.1A1.7 1.7 0 0 0 15 4a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1z'}]])
export const IconSparkles = icon([['path',{d:'m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2z'}],['path',{d:'m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8z'}],['path',{d:'m5 14 .6 1.4L7 16l-1.4.6L5 18l-.6-1.4L3 16l1.4-.6z'}]])
export const IconBell = icon([['path',{d:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9'}],['path',{d:'M10 21h4'}]])
export const IconSearch = icon([['circle',{cx:11,cy:11,r:7}],['line',{x1:16,y1:16,x2:21,y2:21}]])
export const IconPlus = icon([['rect',{x:3,y:3,width:18,height:18,rx:5}],['line',{x1:12,y1:8,x2:12,y2:16}],['line',{x1:8,y1:12,x2:16,y2:12}]])
export const IconPencil = icon([['path',{d:'m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z'}],['line',{x1:13.5,y1:8,x2:16.5,y2:11}]])
export const IconTrash = icon([['path',{d:'M4 7h16'}],['path',{d:'m9 3h6l1 4H8z'}],['path',{d:'m6 7 1 14h10l1-14'}],['line',{x1:10,y1:11,x2:10,y2:17}],['line',{x1:14,y1:11,x2:14,y2:17}]])
export const IconCheck = icon([['polyline',{points:'5 12 10 17 20 7'}]])
export const IconClock = icon([['circle',{cx:12,cy:12,r:9}],['polyline',{points:'12 7 12 12 16 14'}]])
export const IconMapPin = icon([['path',{d:'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0'}],['circle',{cx:12,cy:10,r:2.5}]])
export const IconSend = icon([['path',{d:'m3 11 18-8-8 18-2-8z'}],['line',{x1:11,y1:13,x2:21,y2:3}]])
export const IconLock = icon([['rect',{x:4,y:10,width:16,height:11,rx:3}],['path',{d:'M8 10V7a4 4 0 0 1 8 0v3'}]])
export const IconUnlock = icon([['rect',{x:4,y:10,width:16,height:11,rx:3}],['path',{d:'M8 10V7a4 4 0 0 1 7.5-2'}]])
export const IconSun = icon([['circle',{cx:12,cy:12,r:4}],['path',{d:'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'}]])
export const IconMoon = icon([['path',{d:'M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5a8.5 8.5 0 1 0 12 12z'}]])
export const IconClose = icon([['line',{x1:5,y1:5,x2:19,y2:19}],['line',{x1:19,y1:5,x2:5,y2:19}]])
export const IconMenu = icon([['line',{x1:4,y1:7,x2:20,y2:7}],['line',{x1:4,y1:12,x2:20,y2:12}],['line',{x1:4,y1:17,x2:20,y2:17}]])
export const IconChevronLeft = icon([['polyline',{points:'15 18 9 12 15 6'}]])
export const IconChevronRight = icon([['polyline',{points:'9 18 15 12 9 6'}]])
export const IconDownload = icon([['path',{d:'M12 3v12'}],['polyline',{points:'7 10 12 15 17 10'}],['path',{d:'M4 20h16'}]])
export const IconUpload = icon([['path',{d:'M12 16V4'}],['polyline',{points:'7 9 12 4 17 9'}],['path',{d:'M4 20h16'}]])
export const IconExternalLink = icon([['path',{d:'M14 4h6v6'}],['path',{d:'m20 4-9 9'}],['path',{d:'M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6'}]])
export const IconCopy = icon([['rect',{x:8,y:8,width:12,height:12,rx:2}],['path',{d:'M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3'}]])
export const IconBot = icon([['rect',{x:4,y:7,width:16,height:13,rx:3}],['path',{d:'M12 3v4'}],['circle',{cx:9,cy:13,r:1}],['circle',{cx:15,cy:13,r:1}],['path',{d:'M9 17h6'}]])
export const IconGraduation = icon([['polygon',{points:'2 9 12 4 22 9 12 14'}],['path',{d:'M6 11v5c3 3 9 3 12 0v-5'}]])
export const IconCloud = icon([['path',{d:'M17.5 19H6a4 4 0 0 1-.5-8A7 7 0 0 1 19 9a5 5 0 0 1-1.5 10z'}]])
export const IconRefresh = icon([['path',{d:'M20 7v5h-5'}],['path',{d:'M4 17v-5h5'}],['path',{d:'M6.1 8a7 7 0 0 1 11.4-2L20 8'}],['path',{d:'m4 16 2.5 2a7 7 0 0 0 11.4-2'}]])

// Compatibility aliases keep call sites concise while the app remains dependency-free.
export const Home=IconHome, CalendarDays=IconCalendar, CheckSquare=IconTasks, BookOpen=IconBook, Library=IconReferences, Settings=IconSettings, Sparkles=IconSparkles, Bell=IconBell, Search=IconSearch, Plus=IconPlus, Pencil=IconPencil, Trash2=IconTrash, Check=IconCheck, Clock=IconClock, MapPin=IconMapPin, Send=IconSend, Lock=IconLock, Unlock=IconUnlock, Sun=IconSun, Moon=IconMoon, X=IconClose, Menu=IconMenu, ChevronLeft=IconChevronLeft, ChevronRight=IconChevronRight, Download=IconDownload, Upload=IconUpload, ExternalLink=IconExternalLink, Copy=IconCopy, Bot=IconBot, GraduationCap=IconGraduation, Cloud=IconCloud, RefreshCw=IconRefresh
