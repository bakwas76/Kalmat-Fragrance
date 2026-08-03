import { useEffect, useState } from 'react';
import { AlertTriangle, Package, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, ProductVariant } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import ImagePlaceholder from '@/components/ImagePlaceholder';

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export default function AdminInventory() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: prods } = await supabase.from('products').select('*').order('name', { ascending: true });
    const productList = (prods as Product[]) || [];
    if (productList.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productList.map((p) => p.id))
      .order('sort_order', { ascending: true });
    const vList = (variants as ProductVariant[]) || [];
    setProducts(
      productList.map((p) => ({
        ...p,
        variants: vList.filter((v) => v.product_id === p.id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStock = async (variantId: string) => {
    const newStock = editing[variantId];
    if (newStock === undefined || newStock < 0) return;
    setSaving(variantId);
    const { error } = await supabase.from('product_variants').update({ stock: newStock }).eq('id', variantId);
    setSaving(null);
    if (error) { toast(error.message, 'error'); return; }
    toast('Variant stock updated');
    setEditing((prev) => { const next = { ...prev }; delete next[variantId]; return next; });
    load();
  };

  const allVariants = products.flatMap((p) => p.variants.map((v) => ({ product: p, variant: v })));
  const lowStock = allVariants.filter((x) => x.variant.stock > 0 && x.variant.stock <= 10);
  const outOfStock = allVariants.filter((x) => x.variant.stock === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-white">Inventory</h1>
        <p className="mt-1 text-sm text-ink-400">{allVariants.length} variants · {lowStock.length} low stock · {outOfStock.length} out of stock</p>
      </div>

      {/* Alerts */}
      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {outOfStock.length > 0 && (
            <div className="flex items-center gap-4 border border-rose-500/30 bg-rose-500/5 p-5">
              <AlertTriangle className="h-8 w-8 text-rose-400" />
              <div>
                <p className="text-sm font-medium text-white">{outOfStock.length} out of stock</p>
                <p className="text-xs text-ink-400">Restock immediately to avoid lost sales</p>
              </div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="flex items-center gap-4 border border-amber-500/30 bg-amber-500/5 p-5">
              <Package className="h-8 w-8 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-white">{lowStock.length} low stock</p>
                <p className="text-xs text-ink-400">Running low — plan restocking</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto border border-ink-800 bg-black-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-800 text-left text-xs uppercase tracking-wide-sm text-ink-500">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Size</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Current</th>
              <th className="p-4">Update</th>
              <th className="p-4 text-right">Save</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-ink-500">Loading...</td></tr>
            ) : allVariants.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-ink-500">No variants found</td></tr>
            ) : (
              allVariants.map(({ product: p, variant: v }) => {
                const stockLevel = editing[v.id] !== undefined ? editing[v.id] : v.stock;
                return (
                  <tr key={v.id} className="border-b border-ink-800/60 last:border-0 hover:bg-black-soft">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-8 shrink-0 overflow-hidden">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImagePlaceholder iconSize={14} rounded="rounded-none" showLabel={false} />
                          )}
                        </div>
                        <div>
                          <span className="text-white">{p.name}</span>
                          {v.is_default && <span className="ml-2 text-[10px] uppercase text-gold">Default</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-ink-300">{v.size_label}</td>
                    <td className="p-4 text-ink-400">{v.sku || '—'}</td>
                    <td className="p-4">
                      <span className={v.stock === 0 ? 'text-rose-400' : v.stock <= 10 ? 'text-amber-400' : 'text-ink-200'}>
                        {v.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        min={0}
                        value={stockLevel}
                        onChange={(e) => setEditing({ ...editing, [v.id]: parseInt(e.target.value, 10) || 0 })}
                        className="w-24 border border-ink-700 bg-black-soft px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                      />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => updateStock(v.id)}
                        disabled={editing[v.id] === undefined || saving === v.id}
                        className="inline-flex items-center gap-1.5 border border-ink-700 px-3 py-2 text-xs uppercase tracking-wide-sm text-ink-200 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
                      >
                        <Save size={12} />
                        {saving === v.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
