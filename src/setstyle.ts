'use strict'

import {VisualSettings} from "./settings"

export function setStyle(settings: VisualSettings):void {
    const style = document.documentElement.style

    style.setProperty('--default-color', settings.lollipopSettings.defaultColor.value.value)
    style.setProperty('--line-width', `${settings.lollipopSettings.lineWidth.value}`)
    style.setProperty('--font-family', settings.lollipopSettings.font.fontFamily.value)
    style.setProperty('--font-size', `${settings.lollipopSettings.fontSize.value}pt`)
}