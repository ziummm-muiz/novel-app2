"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react"
import { softDeleteNovel } from "./actions"

interface DeleteNovelButtonProps {
    novelId: string
    novelTitle: string
    iconOnly?: boolean
}

export function DeleteNovelButton({ novelId, novelTitle, iconOnly }: DeleteNovelButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await softDeleteNovel(novelId)
            setIsOpen(false)
            router.refresh()
        } catch (err: any) {
            alert(err.message || "Failed to delete novel")
            setIsDeleting(false)
        }
    }

    return (
        <>
            {/* Trigger Button */}
            <Button
                variant="ghost"
                size="sm"
                className={`gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 ${iconOnly ? "" : "w-full justify-start"}`}
                onClick={() => setIsOpen(true)}
            >
                <Trash2 className="size-3.5" />
                {!iconOnly && "Delete"}
            </Button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-modal-title"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !isDeleting && setIsOpen(false)}
                    />

                    {/* Dialog */}
                    <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 duration-200 whitespace-normal text-left">
                        {/* Close button */}
                        <button
                            className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                            onClick={() => setIsOpen(false)}
                            disabled={isDeleting}
                            aria-label="Close dialog"
                        >
                            <X className="size-4" />
                        </button>

                        {/* Icon */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
                            <AlertTriangle className="size-6 text-destructive" />
                        </div>

                        {/* Content */}
                        <h2 id="delete-modal-title" className="text-xl font-bold mb-2">
                            Delete Novel?
                        </h2>
                        <p className="text-muted-foreground text-sm mb-1">
                            You are about to delete:
                        </p>
                        <p className="font-semibold mb-4 text-foreground truncate">
                            &ldquo;{novelTitle}&rdquo;
                        </p>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            This novel will be hidden from all readers and removed from the platform. 
                            The data is preserved and can be restored by an administrator.
                        </p>

                        {/* Actions */}
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
