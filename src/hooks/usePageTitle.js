// usePageTitle.js
// Sets document.title for the current page (each page gets a distinct tab /
// share title instead of the generic one).

import { useEffect } from 'react'

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title
  }, [title])
}
