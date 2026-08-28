"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/shared/video-player"

interface VideoDialogProps {
  url: string
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VideoDialog({
  url,
  title,
  open,
  onOpenChange,
}: VideoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 sm:p-0">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4 sm:p-6 sm:pt-2">
          {open && <VideoPlayer url={url} title={title} autoPlay />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
