/**
 * button.tsx — reusable Button primitive built on @kobalte/core Button.
 *
 * SolidJS: no forwardRef, no React.ButtonHTMLAttributes.
 * Props are typed via JSX.IntrinsicElements + cva variants.
 */

import { Button as KButton } from '@kobalte/core/button'
import { cva, type VariantProps } from 'class-variance-authority'
import type { Component, JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-sky-500 px-4 py-2 text-slate-950 hover:bg-sky-400',
        outline: 'border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 hover:bg-slate-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export const Button: Component<ButtonProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'variant'])
  return <KButton class={cn(buttonVariants({ variant: local.variant }), local.class)} {...others} />
}

export { buttonVariants }
