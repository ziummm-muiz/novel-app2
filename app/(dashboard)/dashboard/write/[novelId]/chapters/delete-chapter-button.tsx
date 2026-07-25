"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react"
import { softDeleteChapter } from "@/app/(dashboard)/dashboard/actions"

interface DeleteChapterButtonProps {
    novelId: string
    chapterId: string
    chapterTitle: string
    chapterNumber: number
    variant?: "destructive-outline" | "ghost"
}

export function DeleteChapterButton({ novelId, chapterId, chapterTitle, chapterNumber, variant = "destructive-outline" }: DeleteChapterButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await softDeleteChapter(novelId, chapterId)
            // softDeleteChapter redirects — if it doesn't, refresh
            router.refresh()
        } catch (err: any) {
            alert(err.message || "Failed to delete chapter")
            setIsDeleting(false)
        }
    }

    return (
        <>
            {/* Trigger */}
            <Button
                variant={variant === "ghost" ? "ghost" : "outline"}
                size="sm"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setIsOpen(true)}
            >
                <Trash2 className="size-3.5" />
                Delete
            </Button>

            {/* Confirmation Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-chapter-modal-title"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !isDeleting && setIsOpen(false)}
                    />

                    {/* Dialog */}
                    <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 duration-200 whitespace-normal text-left">
                        {/* Close */}
                        <button
                            className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                            onClick={() => setIsOpen(false)}
                            disabled={isDeleting}
                            aria-label="Close"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
                            <AlertTriangle className="size-6 text-destructive" />
                        </div>

                        <h2 id="delete-chapter-modal-title" className="text-xl font-bold mb-2">
                            Delete Chapter?
                        </h2>
                        <p className="text-muted-foreground text-sm mb-1">You are about to remove:</p>
                        <p className="font-semibold mb-4 truncate">
                            Chapter {chapterNumber}: &ldquo;{chapterTitle}&rdquo;
                        </p>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            This chapter will be hidden from all readers immediately. 
                            The data is preserved and can be restored by an administrator.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin mr-2" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="size-4 mr-2" />
                                        Yes, Delete
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
