"use client";

import { useState } from "react";
import { PlusCircle, Trash2, Box } from "lucide-react"; // Giả định dùng lucide-react (có sẵn phổ biến)
import { fetchApi } from "@/lib/api";
import { useSession } from "next-auth/react";

interface AttributeValue {
  value: string;
}

interface Attribute {
  name: string;
  values: AttributeValue[];
}

interface MatrixPreviewItem {
  sku: string;
  attributes: { attributeName: string; value: string }[];
  recommendedPrice: number;
  stockQuantity: number;
}

export default function ProductMatrixBuilder() {
  const [baseSku, setBaseSku] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([
    { name: "Color", values: [{ value: "Red" }, { value: "Blue" }] },
    { name: "Size", values: [{ value: "M" }, { value: "L" }] },
  ]);

  // Trạng thái giữ lưới Ma trận Render
  const [matrixPreview, setMatrixPreview] = useState<MatrixPreviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: session } = useSession();

  // Gọi thử logic local để render trước (Ở thực tế sẽ fetch qua NestJS `/catalog/matrix/preview`)
  const handleGenerateMatrix = async () => {
    setIsLoading(true);
    try {
      const token = (session as { accessToken?: string })?.accessToken;
      // Stubbing: Thay vì gọi API, ta minh họa trực tiếp logic chập để Frontend UX mượt
      // Gọi fetch API Server ở Production
      const previewData = await fetchApi<MatrixPreviewItem[]>(
        `/catalog/matrix/preview`,
        {
          method: "POST",
          token,
          body: JSON.stringify({ baseSku, attributes }),
        },
      );

      setMatrixPreview(previewData);
    } catch (e: unknown) {
      console.error(e);
      alert(
        (e as Error).message ||
          "API Gateway đang tắt, render fallback mô phỏng O(n)",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addAttribute = () =>
    setAttributes([...attributes, { name: "", values: [] }]);
  const removeAttribute = (index: number) =>
    setAttributes(attributes.filter((_, i) => i !== index));

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white/70 backdrop-blur-md shadow-xl rounded-2xl border border-white/40">
      <div className="flex items-center gap-3 mb-6">
        <Box className="text-indigo-600 w-8 h-8" />
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          Product Matrix Builder
        </h2>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">
            Base SKU (Mã gốc Sản phẩm)
          </label>
          <input
            value={baseSku}
            onChange={(e) => setBaseSku(e.target.value)}
            placeholder="Ví dụ: TSHIRT-01"
            className="w-full sm:w-1/2 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all"
          />
        </div>

        {attributes.map((attr, index) => (
          <div
            key={index}
            className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative"
          >
            <button
              onClick={() => removeAttribute(index)}
              className="absolute top-4 right-4 text-red-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <input
              value={attr.name}
              onChange={(e) => {
                const newAttrs = [...attributes];
                newAttrs[index].name = e.target.value;
                setAttributes(newAttrs);
              }}
              placeholder="Loại thuộc tính (Color, Size...)"
              className="font-bold text-slate-700 bg-transparent border-b border-slate-300 focus:border-indigo-500 focus:outline-none mb-3"
            />
            {/* Vùng Map các Option (Ví dụ: Red, L) */}
            <div className="flex flex-wrap gap-2 text-sm">
              {attr.values.map((v, vIndex) => (
                <span
                  key={vIndex}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium shadow-sm"
                >
                  {v.value}
                </span>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={addAttribute}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add Variation Dimension
        </button>
      </div>

      <div className="flex justify-end mb-8">
        <button
          onClick={handleGenerateMatrix}
          disabled={isLoading || !baseSku}
          className="bg-indigo-600 hover:bg-slate-800 text-white font-medium py-2.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Generating..." : "Generate Matrix SKUs"}
        </button>
      </div>

      {matrixPreview.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-lg font-bold text-slate-700 mb-4">
            Preview ({matrixPreview.length} SKUs)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">SKU</th>
                  <th className="px-4 py-3">Thuộc tính</th>
                  <th className="px-4 py-3">Giá đề xuất</th>
                  <th className="px-4 py-3 rounded-tr-lg">Tồn kho ban đầu</th>
                </tr>
              </thead>
              <tbody>
                {matrixPreview.map((item) => (
                  <tr
                    key={item.sku}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-indigo-700 font-medium">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3">
                      {item.attributes.map((attr, idx) => (
                        <span
                          key={idx}
                          className="mr-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                        >
                          {attr.value}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        defaultValue={item.recommendedPrice}
                        className="w-24 p-1 border rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        defaultValue={item.stockQuantity}
                        className="w-20 p-1 border rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
