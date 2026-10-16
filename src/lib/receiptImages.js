// Only browser-local photos are accepted by this demo.
export async function resolveReceiptUrl(image) {
    return image?.url?.startsWith('data:image/') ? image.url : '';
}
