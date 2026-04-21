import InfiniteProductList from "@/components/search/InfiniteProductList";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const rawQ = resolvedParams.q;
  const q = Array.isArray(rawQ) ? rawQ[0] : rawQ || "";

  return (
    <div className="search-layout grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
      {/* Left Sidebar Filters */}
      <aside className="glass-box h-fit">
        <div className="mb-5">
          <div className="font-bold mb-3 pb-2 border-b border-dashed border-black/10">
            🏷️ Danh mục
          </div>
          <label className="flex items-center gap-2 mb-2 cursor-pointer text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              className="accent-[#84cc16] scale-110"
              defaultChecked
            />{" "}
            Trái cây tươi (124)
          </label>
          <label className="flex items-center gap-2 mb-2 cursor-pointer text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <input type="checkbox" className="accent-[#84cc16] scale-110" /> Rau
            củ sạch (89)
          </label>
        </div>

        <button className="btn-glass w-full mt-4"> Lọc kết quả </button>
      </aside>

      {/* Main Content */}
      <div>
        <div className="mb-4">
          <input
            type="text"
            defaultValue={q}
            placeholder="Tìm kiếm bằng Elasticsearch..."
            className="w-full p-4 text-lg border border-white/70 bg-white/40 shadow-sm backdrop-blur-md rounded-full outline-none focus:bg-white transition-all"
          />
        </div>

        {/* Client Component: Hiển thị kết quả & Infinite Scroll */}
        <InfiniteProductList initialQuery={q} />
      </div>
    </div>
  );
}
