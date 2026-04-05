export function mimeToMediaType(mime) {
    const m = mime.toLowerCase();
    if (m === "image/gif")
        return "GIF";
    if (m.startsWith("video/"))
        return "VIDEO";
    if (m.startsWith("image/"))
        return "IMAGE";
    return null;
}
