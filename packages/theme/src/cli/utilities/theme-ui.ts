import {Theme} from '../models/theme.js'

export function themeComponent(theme: Theme) {
  return [
    theme.name,
    {
      subdued: `(#${theme.id})`,
    },
  ]
}

export function themesComponent(themes: Theme[]) {
  const items = themes.map(themeComponent)

  return {list: {items}}
}
