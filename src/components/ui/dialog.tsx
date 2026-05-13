/**
 * dialog.tsx — thin re-exports from @kobalte/core Dialog.
 * Drop-in replacement for the former @radix-ui/react-dialog barrel.
 *
 * Usage is identical to Radix except you use `class` instead of `className`
 * in SolidJS JSX.
 */
import { Dialog } from '@kobalte/core'

export const DialogRoot = Dialog.Root
export const DialogTrigger = Dialog.Trigger
export const DialogPortal = Dialog.Portal
export const DialogCloseButton = Dialog.CloseButton
export const DialogTitle = Dialog.Title
export const DialogDescription = Dialog.Description
export const DialogContent = Dialog.Content
export const DialogOverlay = Dialog.Overlay
