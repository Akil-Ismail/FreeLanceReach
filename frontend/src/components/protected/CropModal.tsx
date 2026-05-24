"use client";

import { useCallback, useRef, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, Check } from "lucide-react";

const OUTPUT_PX = 400;

interface CropModalProps {
  src: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

export default function CropModal({ src, onConfirm, onCancel }: CropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();

  // Use rendered (px) dimensions so the initial square matches what the user sees
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width: w, height: h } = e.currentTarget;
    const side = Math.min(w, h) * 0.85;
    setCrop({
      unit: "px",
      x: (w - side) / 2,
      y: (h - side) / 2,
      width: side,
      height: side,
    });
  }, []);

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    // Fall back to a centered square of the full image if no crop is set
    let srcX: number, srcY: number, srcW: number, srcH: number;
    if (crop && crop.width > 0 && crop.height > 0) {
      const c = crop.unit === "%"
        ? {
            x: (crop.x / 100) * img.width,
            y: (crop.y / 100) * img.height,
            width: (crop.width / 100) * img.width,
            height: (crop.height / 100) * img.height,
          }
        : crop;
      srcX = c.x * scaleX;
      srcY = c.y * scaleY;
      srcW = c.width * scaleX;
      srcH = c.height * scaleY;
    } else {
      const minSide = Math.min(img.naturalWidth, img.naturalHeight);
      srcX = (img.naturalWidth - minSide) / 2;
      srcY = (img.naturalHeight - minSide) / 2;
      srcW = minSide;
      srcH = minSide;
    }

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_PX;
    canvas.height = OUTPUT_PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_PX, OUTPUT_PX);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onConfirm(new File([blob], "profile-picture.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Crop Profile Picture</h2>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="p-4 flex justify-center bg-gray-50">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={1}
            keepSelection
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{ maxWidth: "100%", maxHeight: "320px", display: "block" }}
            />
          </ReactCrop>
        </div>

        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Drag the handles to frame your photo. Result will be a square at 400 × 400 px.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5 pt-2">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1 flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn flex-1 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
