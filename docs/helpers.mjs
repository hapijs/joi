export function getErrors(array) {
  return array
    .filter((item) => item.tags.category === "errors")
    .sort((a, b) => a.property.localeCompare(b.property));
}

export function trim(value) {
  return value?.trim();
}
