import React from 'react'

export function Checkbox({ checked, onCheckedChange, className = '', style, ...rest }) {
  return (
    <input type="checkbox" className={`ui-checkbox ${className}`} style={style} checked={!!checked} onChange={e => onCheckedChange ? onCheckedChange(e.target.checked) : undefined} {...rest} />
  )
}

