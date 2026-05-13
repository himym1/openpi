import type { JSX } from 'solid-js'

export function Badge(props: { children: JSX.Element }) {
  return <span class="badge">{props.children}</span>
}
