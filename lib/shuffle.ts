/** Every cycle contains every item; only its first item is constrained. */
export function shuffleCycle(length: number, previous = -1, random = Math.random): number[] {
  const order = Array.from({ length }, (_, index) => index)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  if (length > 1 && order[0] === previous) {
    const j = 1 + Math.floor(random() * (length - 1))
    ;[order[0], order[j]] = [order[j], order[0]]
  }
  return order
}
