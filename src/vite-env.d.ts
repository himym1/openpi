/// <reference types="vite/client" />

import type { OpenPiApi } from '../electron/preload'

declare global {
  interface Window {
    openPi: OpenPiApi
  }
}
