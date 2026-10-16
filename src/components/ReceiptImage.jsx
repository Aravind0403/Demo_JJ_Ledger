export default function ReceiptImage({ image, alt = 'Property photo', style, onClick }) {
    const url = image?.url?.startsWith('data:image/') ? image.url : '';
    if (!url) return <span>Photo unavailable on this device</span>;
    return <img src={url} alt={alt} style={style} onClick={onClick} />;
}
