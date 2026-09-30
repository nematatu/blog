export function galleryUrl(href: string, photoId?: string) {
  const url = new URL(href);
  if (photoId === undefined) url.searchParams.delete("photo");
  else url.searchParams.set("photo", photoId);
  return url;
}

export function selectedPhoto(photos: readonly { id: string }[], href: string) {
  const id = new URL(href).searchParams.get("photo");
  return { id, index: photos.findIndex((photo) => photo.id === id) };
}
